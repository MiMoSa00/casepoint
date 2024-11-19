import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { Order } from "@prisma/client";
import { adminAuth } from '@/firebase/firebaseAdmin';

const BASE_PRICE = 2000; // Base price in cents
const PRODUCT_PRICES = {
    finish: {
        textured: 500,
    },
    material: {
        polycarbonate: 1000,
    },
};

export const createCheckoutSession = async ({
    configId,
    uid,
}: {
    configId: string;
    uid: string;
}) => {
    try {
        // First verify the Firebase user
        const userRecord = await adminAuth.getUser(uid);
        if (!userRecord.email) {
            throw new Error('Invalid user data: Email is required');
        }

        // Get the configuration
        const configuration = await db.configuration.findUnique({
            where: { id: configId },
        });

        if (!configuration) {
            throw new Error("Configuration not found");
        }

        // Get or create Prisma user with correct firebaseUid field
        const user = await db.user.upsert({
            where: { firebaseUid: uid }, // Changed from firebaseId to firebaseUid
            update: {
                email: userRecord.email,
                name: userRecord.displayName || undefined,
            },
            create: {
                firebaseUid: uid, // Changed from firebaseId to firebaseUid
                email: userRecord.email,
                name: userRecord.displayName || undefined,
            },
        });

        // Rest of the code remains the same
        const { finish, material } = configuration;
        let price = BASE_PRICE;

        if (finish === "textured") price += PRODUCT_PRICES.finish.textured;
        if (material === "polycarbonate") price += PRODUCT_PRICES.material.polycarbonate;

        let order: Order | undefined = undefined;

        const existingOrder = await db.order.findFirst({
            where: {
                userId: user.id,
                configurationId: configuration.id,
                isPaid: false,
            },
        });

        if (existingOrder) {
            order = existingOrder;
        } else {
            order = await db.order.create({
                data: {
                    amount: price / 100,
                    userId: user.id,
                    configurationId: configuration.id,
                    isPaid: false,
                    status: 'awaiting_shipment',
                    shippingAddressId: null,
                    billingAddressId: null,
                    createdAt: new Date(),
                    updated: new Date(),
                },
            });
        }

        const product = await stripe.products.create({
            name: `Phone Case - ${configuration.model}`,
            images: configuration.imageUrl ? [configuration.imageUrl] : undefined,
            default_price_data: {
                currency: "USD",
                unit_amount: price,
            },
        });

        if (!product.default_price) {
            throw new Error('Failed to create product price');
        }

        const stripeSession = await stripe.checkout.sessions.create({
            success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/thank-you?orderId=${order.id}`,
            cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/configure/preview?id=${configuration.id}`,
            payment_method_types: ["card", "paypal"],
            mode: "payment",
            shipping_address_collection: { 
                allowed_countries: ["DE", "US", "NG"] 
            },
            customer_email: userRecord.email,
            metadata: {
                userId: user.id,
                orderId: order.id,
                configurationId: configuration.id,
            },
            line_items: [
                { 
                    price: product.default_price as string, 
                    quantity: 1 
                }
            ],
        });

        await db.order.update({
            where: { id: order.id },
            data: {
                stripeSessionId: stripeSession.id,
                updated: new Date(),
            },
        });

        return { url: stripeSession.url };
    } catch (error) {
        console.error('Error in createCheckoutSession:', error);
        throw error;
    }
};
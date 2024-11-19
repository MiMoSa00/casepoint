import { BASE_PRICE, PRODUCT_PRICES } from '@/config/product';
import { db } from '@/db';
import Stripe from 'stripe';
import { verifyFirebaseTokenWithUid } from '../../actions/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-09-30.acacia',
});

interface CheckoutSessionParams {
  configId: string;
  uid: string;
  token: string;
}

interface CheckoutSessionResponse {
  url: string | null;
  success: boolean;
  error?: string;
}

export const createCheckoutSession = async ({
  configId,
  uid,
  token,
}: CheckoutSessionParams): Promise<CheckoutSessionResponse> => {
  try {
    // Verify token with UID
    const authResult = await verifyFirebaseTokenWithUid(token, uid);
    if (!authResult.success || !authResult.decodedToken) {
      return {
        success: false,
        error: 'Authentication failed',
        url: null,
      };
    }

    // Retrieve configuration details
    const configuration = await db.configuration.findUnique({
      where: { id: configId },
    });
    if (!configuration) {
      return {
        success: false,
        error: 'Configuration not found',
        url: null,
      };
    }

    // Ensure user exists or create them
    const dbUser = await db.user.upsert({
      where: { firebaseUid: uid },
      update: {},
      create: {
        firebaseUid: uid,
        email: authResult.decodedToken.email || '',
        name: authResult.decodedToken.name || null,
      },
    });

    // Calculate price based on configuration
    const { finish, material, model } = configuration;
    let totalPrice = BASE_PRICE;
    if (finish === 'textured') totalPrice += PRODUCT_PRICES.finish.textured;
    if (material === 'polycarbonate') totalPrice += PRODUCT_PRICES.material.polycarbonate;

    // Create order in database
    const order = await db.order.create({
      data: {
        amount: totalPrice / 100,
        userId: dbUser.id,
        configurationId: configId,
        status: 'awaiting_shipment',
      },
    });

    // Create Stripe checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/thank-you?orderId=${order.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/configure/preview?id=${configId}`,
      mode: 'payment',
      payment_method_types: ['card'],
      metadata: {
        orderId: order.id,
        userId: dbUser.id,
        configurationId: configId,
      },
      customer_email: authResult.decodedToken.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Custom ${model} Case`,
              images: [configuration.imageUrl],
            },
            unit_amount: totalPrice,
          },
          quantity: 1,
        },
      ],
    });

    // Update order with Stripe session ID
    await db.order.update({
      where: { id: order.id },
      data: { stripeSessionId: stripeSession.id },
    });

    return {
      success: true,
      url: stripeSession.url || null,
    };
  } catch (error) {
    console.error('[Checkout] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      url: null,
    };
  }
};

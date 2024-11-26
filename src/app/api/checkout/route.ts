import { stripe } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { configurationId } = body;

    if (!configurationId) {
      return NextResponse.json(
        { error: 'Missing required configurationId in request body.' },
        { status: 400 }
      );
    }

    const { finish, material, model, imageUrl, unitAmount } = configurationId;

    if (!finish || !material || !model || !imageUrl || !unitAmount) {
      return NextResponse.json(
        { error: 'Invalid or incomplete configuration details.' },
        { status: 400 }
      );
    }

    // Use the NEXT_PUBLIC_URL to construct valid URLs
    const baseUrl = process.env.NEXT_PUBLIC_URL;
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_URL is not defined in environment variables.');
    }

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Custom ${model} Case (${finish} - ${material})`,
              images: [imageUrl],
            },
            unit_amount: unitAmount, // The price in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`, // Include session ID for reference
      cancel_url: `${baseUrl}/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe Checkout session error:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe Checkout session.' },
      { status: 500 }
    );
  }
}

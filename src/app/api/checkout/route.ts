import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, verifyFirebaseToken } from '../../actions/auth';

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Decode the token to get the uid
    const tokenVerification = await verifyFirebaseToken(token);
 
    if (!tokenVerification.success || !tokenVerification.decodedToken) {
      return NextResponse.json(
        { error: tokenVerification.error || 'Failed to verify token' },
        { status: 401 }
      );
    }

    const uid = tokenVerification.decodedToken.uid;
    const { configurationId } = await req.json();

    // Pass `token` and `uid` to `createCheckoutSession`
    const checkoutResponse = await createCheckoutSession({
      configId: configurationId,
      uid,
      token,
    });

    if (!checkoutResponse.success) {
      return NextResponse.json(
        { error: checkoutResponse.error || 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, url: checkoutResponse.url });
  } catch (error) {
    console.error('[Checkout] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
};

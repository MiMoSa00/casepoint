// api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase/firebaseConfig'; // Adjust the path to your Firebase config

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Sign in with Firebase
    await signInWithEmailAndPassword(auth, email, password);

    // Respond with a success message
    return NextResponse.json({ message: 'Login successful!' }, { status: 200 });
  } catch (error) {
    console.log(error)
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Failed to log in. Please check your credentials.' }, { status: 401 });
  }
}

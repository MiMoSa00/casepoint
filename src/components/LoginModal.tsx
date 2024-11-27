import { Dispatch, SetStateAction, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import Image from 'next/image';
import { auth } from '@/firebase/firebaseConfig'; // Make sure to import your Firebase configuration
import { signInWithEmailAndPassword } from 'firebase/auth'; // Import Firebase auth function
import { buttonVariants } from './ui/button';
import Link from 'next/link';

const LoginModal = ({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setIsOpen(false); // Close modal on successful login
      setError(null); // Reset error state
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogContent className='absolute z-[9999999]'>
        <DialogHeader>
          <div className='relative mx-auto w-24 h-24 mb-2'>
            <Image
              src='/snake-1.png'
              alt='snake image'
              className='object-contain'
              fill
            />
          </div>
          <DialogTitle className='text-3xl text-center font-bold tracking-tight text-gray-900'>
            Log in to continue
          </DialogTitle>
          <DialogDescription className='text-base text-center py-2'>
            <span className='font-medium text-zinc-900'>
              Your configuration was saved!
            </span>{' '}
            Please login or create an account to complete your purchase.
          </DialogDescription>
        </DialogHeader>

        {error && <p className='text-red-500 text-center'>{error}</p>}

        <div className='flex flex-col items-center'>
          <input
            type='email'
            placeholder='Email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='mb-4 p-2 border border-gray-300 rounded w-full'
          />
          <input
            type='password'
            placeholder='Password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='mb-4 p-2 border border-gray-300 rounded w-full'
          />
          <div className='flex gap-32'>
          <button
            onClick={handleLogin}
            className={buttonVariants({ variant: 'default' })}
          >
            Login
          </button>
         <Link href='/api/auth/register' onClick={handleLogin}
            className={buttonVariants({ variant: 'default' })}>Sign up</Link>
          </div>
         
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;

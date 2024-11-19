'use client'

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import MaxWidthWrapper from './MaxWidthWrapper';
import { buttonVariants } from './ui/button';

const Navbar = () => {
  const { user, setUser, logout } = useAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Now TypeScript knows that firebaseUser is of type FirebaseUser | null
      setUser(firebaseUser);
    });

    return () => unsubscribe();
  }, [setUser]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className='sticky z-[100] h-14 inset-x-0 top-0 w-full border-b border-gray-200 bg-white/75 backdrop-blur-lg transition-all'>
      <MaxWidthWrapper>
        <div className='flex h-14 items-center justify-between border-b border-zinc-200'>
          <Link href='/' className='flex z-40 font-semibold'>
            case<span className='text-green-600'>cobra</span>
          </Link>

          <div className='h-full flex items-center space-x-4'>
            {user ? (
              <>
                <Link href='/'
                  onClick={handleLogout}
                  className={buttonVariants({
                    size: 'sm',
                    variant: 'ghost',
                  })}
                >
                  Sign out
                </Link>

                <Link 
                  href='/dashboard' 
                  className={buttonVariants({ size: 'sm', variant: 'ghost' })}
                >
                  Dashboard ✨
                </Link>

                <Link 
                  href='/configure/upload' 
                  className={buttonVariants({ 
                    size: 'sm', 
                    className: 'hidden sm:flex items-center gap-1' 
                  })}
                >
                  Create case
                  <ArrowRight className='ml-1.5 h-5 w-5' />
                </Link>
              </>
            ) : (
              <>
                <Link 
                  href='/login' 
                  className={buttonVariants({ size: 'sm', variant: 'ghost' })}
                >
                  Login
                </Link>
                <Link 
                  href='/api/auth/register' 
                  className={buttonVariants({ size: 'sm', variant: 'ghost' })}
                >
                  Sign up
                </Link>
                <div className='h-8 w-px bg-zinc-200 hidden sm:block' />
                <Link 
                  href='/configure/upload' 
                  className={buttonVariants({ 
                    size: 'sm', 
                    className: 'hidden sm:flex items-center gap-1' 
                  })}
                >
                  Create case
                  <ArrowRight className='ml-1.5 h-5 w-5' />
                </Link>
              </>
            )}
          </div>
        </div>
      </MaxWidthWrapper>
    </nav>
  );
};

export default Navbar;
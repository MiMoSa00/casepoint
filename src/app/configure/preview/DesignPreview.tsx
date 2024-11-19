"use client";

import Phone from '@/components/Phone';
import { Button } from '@/components/ui/button';
import { BASE_PRICE, PRODUCT_PRICES } from '@/config/product';
import { cn, formatPrice } from '@/lib/utils';
import { COLORS, MODELS } from '@/validators/option-validator';
import { Configuration } from '@prisma/client';
import { useEffect, useState } from 'react';
import Confetti from 'react-dom-confetti';
import { useToast } from '@/components/ui/use-toast';
import LoginModal from '@/components/LoginModal';
import { auth } from '@/firebase/firebaseConfig';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { useElements, useStripe } from '@stripe/react-stripe-js';

interface DesignPreviewProps {
  configuration: Configuration;
}

const DesignPreview: React.FC<DesignPreviewProps> = ({ configuration }) => {
  const { toast } = useToast();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    setShowConfetti(true);
  }, []);

  if (!configuration?.id || !configuration?.croppedImageUrl) {
    toast({
      title: 'Configuration Error',
      description: 'Invalid configuration data.',
      variant: 'destructive',
    });
    return null;
  }

  const color = configuration.color || 'defaultColor';
  const model = configuration.model || 'defaultModel';
  const finish = configuration.finish || 'defaultFinish';
  const material = configuration.material || 'defaultMaterial';

  const colorConfig = COLORS.find((c) => c.value === color) || COLORS[0];
  const modelConfig = MODELS.options.find((m) => m.value === model);

  const tw = colorConfig?.tw || 'gray-200';
  const modelLabel = modelConfig?.label || 'Phone';

  let totalPrice = BASE_PRICE;
  if (material === 'polycarbonate') totalPrice += PRODUCT_PRICES.material.polycarbonate;
  if (finish === 'textured') totalPrice += PRODUCT_PRICES.finish.textured;

  const handleCheckout = async (): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setIsLoginModalOpen(true);
        return;
      }

      setIsProcessing(true);

      const token = await user.getIdToken(true);
      
      const userToken = await user.getIdTokenResult()
      const tokenExpirationTime = new Date(userToken.expirationTime).toLocaleString("en-US", { timeZone: "Africa/Lagos" });
      console.log("Token expires at:", tokenExpirationTime);
      console.log(userToken, token)
      
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ configurationId: configuration.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const data = await response.json();
      if (!data.url) {
        throw new Error('Invalid response format, expected "url" field.');
      }

      window.location.href = data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Checkout Error',
        description: 'An unexpected error occurred during checkout.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-0 overflow-hidden flex justify-center"
      >
        <Confetti active={showConfetti} config={{ elementCount: 200, spread: 90 }} />
      </div>

      <LoginModal isOpen={isLoginModalOpen} setIsOpen={setIsLoginModalOpen} />

      <div className="mt-20 flex flex-col items-center md:grid text-sm sm:grid-cols-12 sm:gap-x-6 md:gap-x-8 lg:gap-x-12">
        <div className="md:col-span-4 lg:col-span-3 md:row-span-2 md:row-end-2">
          <Phone 
            className={cn(tw ? `bg-${tw}` : 'bg-gray-200', 'max-w-[150px] md:max-w-full')} 
            imgSrc={configuration.croppedImageUrl!} 
          />
        </div>

        <div className="mt-6 sm:col-span-9 md:row-end-1">
          <h3 className="text-3xl font-bold tracking-tight text-gray-900">Your {modelLabel} Case</h3>
          <div className="mt-3 flex items-center gap-1.5 text-base">
            <Check className="h-4 w-4 text-green-500" />
            In stock and ready to ship
          </div>
        </div>

        <div className="sm:col-span-12 md:col-span-9 text-base">
          <div className="mt-8">
            <div className="bg-gray-50 p-6 sm:rounded-lg sm:p-8">
              <div className="flow-root text-sm">
                <div className="flex items-center justify-between py-1 mt-2">
                  <p className="text-gray-600">Base price</p>
                  <p className="font-medium text-gray-900">{formatPrice(BASE_PRICE / 100)}</p>
                </div>

                {finish === 'textured' && (
                  <div className="flex items-center justify-between py-1 mt-2">
                    <p className="text-gray-600">Textured finish</p>
                    <p className="font-medium text-gray-900">
                      {formatPrice(PRODUCT_PRICES.finish.textured / 100)}
                    </p>
                  </div>
                )}

                {material === 'polycarbonate' && (
                  <div className="flex items-center justify-between py-1 mt-2">
                    <p className="text-gray-600">Soft polycarbonate material</p>
                    <p className="font-medium text-gray-900">
                      {formatPrice(PRODUCT_PRICES.material.polycarbonate / 100)}
                    </p>
                  </div>
                )}

                <div className="my-2 h-px bg-gray-200" />

                <div className="flex items-center justify-between py-2">
                  <p className="font-semibold text-gray-900">Order total</p>
                  <p className="font-semibold text-gray-900">{formatPrice(totalPrice / 100)}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end pb-12">
              <Button
                onClick={handleCheckout}
                disabled={isProcessing || !stripe || !elements}
                className="px-4 sm:px-6 lg:px-8"
              >
                {isProcessing ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Check out <ArrowRight className="ml-1.5 h-4 w-4" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DesignPreview;
'use client'

import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
// Update this import to match your actual file structure
import { createCheckoutSession } from '@/app/configure/preview/actions'

interface CheckoutButtonProps {
  configId: string
  userId: string
  className?: string
}

const CheckoutButton = ({ configId, userId, className }: CheckoutButtonProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleCheckout = async () => {
    try {
      setIsLoading(true)
      const session = await createCheckoutSession({ configId, uid: userId })

      if (session?.url) {
        window.location.href = session.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      toast({
        title: 'Checkout Error',
        description: error instanceof Error ? error.message : 'Failed to start checkout process',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        'Processing...'
      ) : (
        <>
          Checkout <ArrowRight className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  )
}

export default CheckoutButton
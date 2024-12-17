"use client"
import { useQuery } from "@tanstack/react-query"
import { getPaymentStatus } from "./actions"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

const ThankYou = () => {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId") || ''
  
  const { data } = useQuery({
    queryKey: ["get-payment-status"], // Corrected typo in queryKey
    queryFn: async () => await getPaymentStatus({ orderId }),
    retry: true,
    retryDelay: 500,
  })

  if (data === undefined) {
    return (
      <div className="w-full mt-24 flex justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500"/>
          <h3 className="font-semibold text-xl "> Loading your order...</h3>
          <p>This wont take long.</p>
        </div>
      </div>
    )
  }

  if (data === false) {
    return (
      <div className="w-full mt-24 flex justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500"/>
          <h3 className="font-semibold text-xl ">Verifying your payment...</h3>
          <p>This might take a moment.</p>
        </div>
      </div>
    )
  }

  const { configuration, billingAddress, shippingAddress, amount } = data
  
  // Add a null check before destructuring color
  const color = configuration?.color ?? null


  return (
    <div className="bg-white ">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="max-w-xl">
    <p className="text-base font-medium text-primary">Thank you!</p>
    <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Your case is on the way! </h1>
        </div>
      </div>
    </div>
  )
}

export default ThankYou
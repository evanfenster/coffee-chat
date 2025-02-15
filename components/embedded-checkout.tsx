'use client'

import { useEffect, useState } from 'react'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error(
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set. ' +
    'Please add it to your .env.local file. ' +
    'You can get your publishable key from https://dashboard.stripe.com/apikeys'
  )
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

interface EmbeddedCheckoutProps {
  product: {
    name: string
    price: string
    imageUrl?: string
  }
  onClose: () => void
}

export function EmbeddedCheckoutDialog({ product, onClose }: EmbeddedCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'initial' | 'processing' | 'complete' | 'error'>('initial')

  useEffect(() => {
    const fetchClientSecret = async () => {
      try {
        const response = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(product),
        })

        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create checkout session')
        }

        setClientSecret(data.clientSecret)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create checkout session'
        console.error('Checkout error:', message)
        setError(message)
        setStatus('error')
      }
    }

    fetchClientSecret()
  }, [product])

  if (error) {
    return (
      <div className="rounded-lg p-4 bg-red-50">
        <p className="text-sm text-red-500">Could not load checkout. Please try again.</p>
      </div>
    )
  }

  if (status === 'complete') {
    return (
      <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-md border border-emerald-100">
        <div className="flex flex-col items-center text-center">
          <div className="size-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="size-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-green-800 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. We&apos;ll send your coffee details and confirmation to your email shortly.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white text-green-700 rounded-full hover:bg-green-50 
                     border border-green-200 transition-colors duration-200 
                     font-medium shadow-sm hover:shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
          </div>
          <div className="h-10 bg-slate-200 rounded w-1/4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{
          clientSecret,
          onComplete: () => {
            setStatus('complete')
          },
        }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
} 
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
      <div className="bg-white rounded-xl p-6 border border-red-100">
        <div className="flex items-center gap-3 text-red-600 mb-2">
          <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-medium">Checkout Error</h3>
        </div>
        <p className="text-sm text-red-600">Could not load checkout. Please try again.</p>
      </div>
    )
  }

  if (status === 'complete') {
    return (
      <div className="bg-white rounded-xl p-8 border border-emerald-100">
        <div className="flex flex-col items-center text-center">
          <div className="size-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <svg className="size-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-emerald-800 mb-2">Payment Successful!</h2>
          <p className="text-stone-600 mb-6">
            Thank you for your purchase. We&apos;ll send your coffee details and confirmation to your email shortly.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-emerald-50 text-emerald-700 rounded-full hover:bg-emerald-100 
                     transition-colors duration-200 font-medium"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="bg-white rounded-xl p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-4 bg-stone-100 rounded w-3/4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-stone-100 rounded"></div>
            <div className="h-4 bg-stone-100 rounded w-5/6"></div>
          </div>
          <div className="h-10 bg-stone-100 rounded w-1/4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden">
      <div className="border-b border-stone-200 p-4">
        <h3 className="font-medium text-stone-900">Complete Purchase</h3>
      </div>
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{
          clientSecret,
          onComplete: async () => {
            try {
              const sessionId = clientSecret.split('_secret_')[0]
              
              // Create cardholder first
              const cardholderResponse = await fetch('/api/stripe/create-cardholder', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sessionId }),
              })

              if (!cardholderResponse.ok) {
                const errorData = await cardholderResponse.json()
                console.error('Failed to create cardholder:', errorData.error)
                setStatus('complete')
                return
              }

              // Then create virtual card
              const cardResponse = await fetch('/api/stripe/create-virtual-card', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sessionId }),
              })

              if (!cardResponse.ok) {
                const errorData = await cardResponse.json()
                console.error('Failed to create virtual card:', errorData.error)
                setStatus('complete')
                return
              }

              const { cardId } = await cardResponse.json()
              console.log('Virtual card created:', cardId)
            } catch (error) {
              console.error('Error in checkout completion:', error)
            }
            setStatus('complete')
          },
        }}
      >
        <div className="p-4">
          <EmbeddedCheckout />
        </div>
      </EmbeddedCheckoutProvider>
    </div>
  )
} 
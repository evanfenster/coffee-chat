'use client'

import { useEffect, useState } from 'react'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Coffee, X } from 'lucide-react'
import { calculateFinalPrice } from '@/lib/utils/pricing'
import { processOrderWithStoa } from '@/app/actions/stoa'

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
    handle: string
  }
  onClose: () => void
}

export function EmbeddedCheckoutDialog({ product, onClose }: EmbeddedCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'initial' | 'processing' | 'complete' | 'error' | 'success'>('initial')

  useEffect(() => {
    const fetchClientSecret = async () => {
      try {
        const response = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...product,
            price: calculateFinalPrice(parseFloat(product.price)).toString()
          }),
        })

        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create checkout session')
        }

        setClientSecret(data.clientSecret)
        setUserId(data.userId)
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
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
        <div className="fixed right-0 top-0 size-full max-w-[500px] animate-slide-in">
          <div className="h-full bg-sidebar">
            <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
              <div className="flex items-center gap-2">
                <Coffee className="size-5 text-sidebar-foreground/70" />
                <span className="text-sm font-medium text-sidebar-foreground/70">Checkout Error</span>
              </div>
              <button onClick={onClose} className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
                <X className="size-5" />
              </button>
            </div>
            
            <div className="flex flex-col items-center justify-center px-6 py-12">
              <div className="size-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
                <svg 
                  className="size-8 text-destructive" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-semibold text-sidebar-foreground mb-2">
                Checkout Error
              </h2>
              
              <p className="text-sidebar-foreground/70 text-center mb-8 max-w-sm">
                Could not load checkout. Please try again or contact support if the problem persists.
              </p>

              <div className="w-full max-w-sm p-4 bg-sidebar-accent/10 rounded-lg mb-8 border border-sidebar-border">
                <div className="flex items-center gap-4">
                  <div className="size-12 bg-sidebar-accent/20 rounded-md flex items-center justify-center">
                    <Coffee className="size-6 text-sidebar-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sidebar-foreground">{product.name}</h3>
                    <p className="text-sm text-sidebar-foreground/70">${calculateFinalPrice(parseFloat(product.price))}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="px-8 py-2.5 bg-sidebar-primary text-sidebar-primary-foreground rounded-full 
                         hover:opacity-90 transition-opacity font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'complete') {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
        <div className="fixed right-0 top-0 size-full max-w-[500px] animate-slide-in">
          <div className="h-full bg-sidebar">
            <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
              <div className="flex items-center gap-2">
                <Coffee className="size-5 text-sidebar-foreground/70" />
                <span className="text-sm font-medium text-sidebar-foreground/70">Payment Successful</span>
              </div>
              <button onClick={onClose} className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
                <X className="size-5" />
              </button>
            </div>
            
            <div className="flex flex-col items-center justify-center px-6 py-12">
              <div className="size-16 bg-sidebar-primary/20 rounded-full flex items-center justify-center mb-6">
                <svg 
                  className="size-8 text-sidebar-primary" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-semibold text-sidebar-foreground mb-2">
                Payment Successful
              </h2>
              
              <p className="text-sidebar-foreground/70 text-center mb-8 max-w-sm">
                Our automated agent is now placing your order. You&apos;ll receive a notification when your order is complete.
              </p>

              <div className="w-full max-w-sm p-4 bg-sidebar-accent/10 rounded-lg mb-8 border border-sidebar-border">
                <div className="flex items-center gap-4">
                  <div className="size-12 bg-sidebar-accent/20 rounded-md flex items-center justify-center">
                    <Coffee className="size-6 text-sidebar-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sidebar-foreground">{product.name}</h3>
                    <p className="text-sm text-sidebar-foreground/70">${calculateFinalPrice(parseFloat(product.price))}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="px-8 py-2.5 bg-sidebar-primary text-sidebar-primary-foreground rounded-full 
                         hover:opacity-90 transition-opacity font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
        <div className="fixed right-0 top-0 size-full max-w-[500px] animate-slide-in">
          <div className="h-full bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Coffee className="size-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Loading Checkout...</span>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>
            <div className="animate-pulse space-y-6">
              <div className="h-4 bg-stone-100 rounded w-3/4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-stone-100 rounded"></div>
                <div className="h-4 bg-stone-100 rounded w-5/6"></div>
              </div>
              <div className="h-10 bg-stone-100 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="fixed right-0 top-0 size-full max-w-[500px] animate-slide-in">
        <div className="h-full bg-white">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Coffee className="size-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Secure Checkout</span>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="size-5" />
            </button>
          </div>
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{
              clientSecret,
              onComplete: async () => {
                const sessionId = clientSecret.split('_secret_')[0]
                setStatus('complete')
                console.log('Stripe checkout completed, sessionId:', sessionId);

                try {
                  if (!userId) {
                    throw new Error('User ID is not available');
                  }
                  const result = await processOrderWithStoa(userId, {
                    handle: product.handle,
                    name: product.name,
                    price: calculateFinalPrice(parseFloat(product.price)).toString()
                  },
                  sessionId,
                  undefined // webhookUrl is optional
                );
                  
                  console.log('Order processing result:', result);
                  
                  if (!result.success) {
                    throw new Error(`Order processing error: ${result.error}`);
                  }
                  
                  // Set success status without toast notification
                  setStatus('success');
                  
                } catch (error) {
                  console.error('Error processing order:', error);
                  // Set error status without toast notification
                  setStatus('error');
                } finally {
                  // Close the checkout dialog after processing is complete
                  setTimeout(() => {
                    onClose();
                  }, 100);
                }
              },
            }}
          >
            <div className="p-4">
              <EmbeddedCheckout />
            </div>
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  )
} 
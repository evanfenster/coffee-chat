"use client"

import React, { useState } from "react"
import { Coffee } from "lucide-react"
import cx from "classnames"

interface CoffeeProduct {
  name: string
  vendor: string
  handle: string
  roastLevel?: string
  type?: string
  tasteType?: string
  process?: string
  origin?: string
  region?: string
  certifications?: string[]
  tastingNotes?: string[]
  price: string
  available: boolean
  imageUrl?: string
}

interface CoffeeOptionsResult {
  products: CoffeeProduct[]
  appliedFilters: Record<string, unknown>
  error?: string
}

function formatArrayString(value: string | string[]): string[] {
  if (Array.isArray(value)) {
    return value
  }
  return value
    .replace(/[[\]"]/g, "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

export function CoffeeCard({
  result,
  className,
}: {
  result: CoffeeOptionsResult
  className?: string
}) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  if (!result.products || result.products.length === 0) {
    return <div className="p-4 text-neutral-600 text-center">
      {result.error || "No coffee options found with the specified criteria."}
    </div>
  }

  const product = result.products[0]

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  const handleImageError = () => {
    setImageLoading(false)
    setImageError(true)
  }

  const handleBuyNow = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${data.error || 'Unknown error'}`)
      }
      
      if (data.error) {
        throw new Error(data.error)
      }

      if (!data.url) {
        throw new Error('No checkout URL received from Stripe')
      }

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank')
    } catch (error) {
      console.error('Error creating checkout session:', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <article 
      className={cx(
        "bg-white rounded-md shadow-sm overflow-hidden transition-transform hover:shadow-md w-full max-w-2xl",
        className
      )}
      aria-labelledby="coffee-name"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image Container */}
        <div className="relative w-full sm:w-48 aspect-[4/3] sm:aspect-square overflow-hidden bg-stone-50 flex-shrink-0">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-50">
              <div className="animate-pulse w-8 h-8 bg-stone-200 rounded-full" />
            </div>
          )}
          
          {imageError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400">
              <Coffee className="w-8 h-8 mb-1" />
              <span className="text-xs">Image unavailable</span>
            </div>
          ) : product.imageUrl && (
            <img
              src={product.imageUrl}
              alt={`${product.name} coffee`}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
        </div>

        {/* Content Container */}
        <div className="flex flex-col flex-grow">
          <div className="p-3">
            {/* Vendor */}
            <div className="text-xs font-medium text-amber-700 mb-1">
              {product.vendor}
            </div>

            {/* Title and Type */}
            <h2 
              id="coffee-name"
              className="text-lg font-bold text-stone-900 mb-1"
            >
              {product.name}
            </h2>
            
            {product.type && (
              <div className="text-sm text-stone-600 mb-2">
                {product.type}
              </div>
            )}

            {/* Tags Section */}
            <div className="flex flex-wrap gap-1 mb-2">
              {product.roastLevel && formatArrayString(product.roastLevel).map((level, index) => (
                <span 
                  key={index}
                  className="px-2 py-0.5 bg-amber-50 text-amber-800 text-xs font-medium rounded-full"
                >
                  {level} Roast
                </span>
              ))}
              {product.tasteType && formatArrayString(product.tasteType).map((type, index) => (
                <span 
                  key={index}
                  className="px-2 py-0.5 bg-amber-50 text-amber-800 text-xs font-medium rounded-full"
                >
                  {type}
                </span>
              ))}
              {product.process && formatArrayString(product.process).map((proc, index) => (
                <span 
                  key={index}
                  className="px-2 py-0.5 bg-amber-50 text-amber-800 text-xs font-medium rounded-full"
                >
                  {proc}
                </span>
              ))}
            </div>

            {/* Origin & Region */}
            {(product.origin || product.region) && (
              <div className="mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-stone-500 mb-1 block">
                  Origin
                </span>
                <div className="flex flex-wrap gap-1">
                  {product.origin && formatArrayString(product.origin).map((orig, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-orange-50 text-orange-900 text-xs font-medium rounded-md border border-orange-100"
                    >
                      {orig}
                    </span>
                  ))}
                  {product.region && formatArrayString(product.region).map((reg, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-emerald-50 text-emerald-900 text-xs font-medium rounded-md border border-emerald-100"
                    >
                      {reg}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tasting Notes */}
            {product.tastingNotes && product.tastingNotes.length > 0 && (
              <div className="mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-stone-500 mb-1 block">
                  Tasting Notes
                </span>
                <div className="flex flex-wrap gap-1">
                  {product.tastingNotes.map((note, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-amber-50 text-amber-800 text-xs font-medium rounded-md border border-amber-200"
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {product.certifications && product.certifications.length > 0 && (
              <div className="mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-stone-500 mb-1 block">
                  Certifications
                </span>
                <div className="flex flex-wrap gap-1">
                  {product.certifications.map((cert, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 text-blue-800 text-xs font-medium rounded-md border border-blue-200"
                    >
                      {formatArrayString(cert)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Checkout Section - Now full width at bottom */}
          <div className="flex items-center justify-between p-3 mt-auto border-t border-stone-100">
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-bold text-stone-900">
                ${Number(product.price).toFixed(2)}
              </span>
              <span className="text-xs text-stone-500">USD</span>
            </div>

            <button
              disabled={!product.available || isLoading}
              onClick={handleBuyNow}
              className={`
                px-3 py-1 rounded-md text-sm font-medium transition-all
                focus:outline-none focus:ring-2 focus:ring-offset-1
                ${product.available && !isLoading
                  ? 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500'
                  : 'bg-stone-200 text-stone-500 cursor-not-allowed'
                }
              `}
              aria-disabled={!product.available || isLoading}
            >
              {isLoading ? 'Loading...' : product.available ? 'Buy Now' : 'Sold Out'}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}


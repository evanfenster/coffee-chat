"use client"

import React, { useState } from "react"
import { Coffee } from "lucide-react"
import cx from "classnames"
import Image from 'next/image'
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import ShippingAddress from "./shipping-address"
import { toast } from "sonner"

interface Product {
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

interface ProductOptionsResult {
  products: Product[]
  appliedFilters: Record<string, unknown>
  description?: string
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

export function ProductCard({
  result,
  className,
  onBuyClick,
}: {
  result: ProductOptionsResult
  className?: string
  onBuyClick?: () => void
}) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false)
  const [isCheckingAddress, setIsCheckingAddress] = useState(false)

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  const handleImageError = () => {
    setImageLoading(false)
    setImageError(true)
  }

  const handleBuyClick = async () => {
    setIsCheckingAddress(true)
    try {
      // Check if user has a shipping address
      const response = await fetch('/api/shipping-address')
      const data = await response.json()
      
      // If we get a 404 or the address is incomplete, show the shipping modal
      if (response.status === 404 || !data.addressLine1) {
        setIsShippingModalOpen(true)
      } else {
        // Address exists, proceed with checkout
        onBuyClick?.()
      }
    } catch (error) {
      console.error('Error checking shipping address:', error)
      toast.error('Failed to verify shipping information', {
        description: 'Please try again or contact support if the problem persists.'
      })
    } finally {
      setIsCheckingAddress(false)
    }
  }

  const handleShippingComplete = () => {
    setIsShippingModalOpen(false)
    // Proceed with checkout after address is saved
    onBuyClick?.()
  }

  if (!result?.products?.length) {
    return <div className="p-4 text-muted-foreground text-center">
      {result?.error || "No options found with the specified criteria."}
    </div>
  }

  const product = result.products[0]

  return (
    <>
      <div className={cx("w-full", className)}>
        <div className="grid grid-cols-1 md:grid-cols-[2fr,3fr]">
          {/* Image Section */}
          <div className="relative aspect-square md:aspect-auto md:h-[600px] overflow-hidden">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="animate-pulse size-8 bg-[hsl(var(--brand-loading))] rounded-full opacity-30" />
                  <Coffee className="absolute inset-0 m-auto size-4 text-[hsl(var(--brand-accent))] opacity-50" />
                </div>
              </div>
            )}
            
            {imageError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <Coffee className="size-12 mb-2 opacity-50" />
                <span className="text-sm font-medium">Image unavailable</span>
              </div>
            ) : product.imageUrl && (
              <Image
                src={product.imageUrl}
                alt={`${product.name}`}
                className={`size-full object-cover transition-all duration-500 ${
                  imageLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            )}
          </div>

          {/* Content Section */}
          <div className="relative p-8 md:p-10 lg:p-12">
            {/* Enhanced Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-primary">
                  {product.vendor}
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-lg font-semibold text-primary">
                    {product.price}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    per bag
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">
                {product.name}
              </h2>
              {product.type && (
                <div className="text-muted-foreground font-medium">
                  {product.type}
                </div>
              )}
              {result.description && (
                <>
                  <div className="mt-4 flex items-center gap-2 text-xs font-medium">
                    <div className="px-3 py-1.5 rounded-full bg-[hsl(var(--badge-background))] text-[hsl(var(--badge-foreground))] border border-[hsl(var(--badge-border))]">
                      ✨ Personalized Recommendation
                    </div>
                  </div>
                  <div className="mt-2 text-foreground/90 leading-relaxed">
                    {result.description}
                  </div>
                </>
              )}
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 auto-rows-min">
              {/* Roast Level */}
              {product.roastLevel && (
                <div className="space-y-2 mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/70 flex items-center gap-2">
                    Roast Level
                    <span className="h-px flex-1 bg-border" aria-hidden="true" />
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {formatArrayString(product.roastLevel).map((level, index) => (
                      <span 
                        key={index}
                        className="px-2.5 py-1.5 bg-[hsl(var(--tag-primary))] text-[hsl(var(--tag-primary-foreground))] text-sm font-medium rounded-full border border-[hsl(var(--tag-primary-border))]"
                      >
                        {level} Roast
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Taste Profile */}
              {product.tasteType && (
                <div className="space-y-2 mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/70 flex items-center gap-2">
                    Taste Profile
                    <span className="h-px flex-1 bg-border" aria-hidden="true" />
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {formatArrayString(product.tasteType).map((type, index) => (
                      <span 
                        key={index}
                        className="px-2.5 py-1.5 bg-[hsl(var(--tag-primary))] text-[hsl(var(--tag-primary-foreground))] text-sm font-medium rounded-full border border-[hsl(var(--tag-primary-border))]"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Processing Method */}
              {product.process && (
                <div className="space-y-2 mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/70 flex items-center gap-2">
                    Processing Method
                    <span className="h-px flex-1 bg-border" aria-hidden="true" />
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {formatArrayString(product.process).map((proc, index) => (
                      <span 
                        key={index}
                        className="px-2.5 py-1.5 bg-[hsl(var(--tag-primary))] text-[hsl(var(--tag-primary-foreground))] text-sm font-medium rounded-full border border-[hsl(var(--tag-primary-border))]"
                      >
                        {proc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Origin */}
              {product.origin && (
                <div className="space-y-2 mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/70 flex items-center gap-2">
                    Origin
                    <span className="h-px flex-1 bg-border" aria-hidden="true" />
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {formatArrayString(product.origin).map((orig, index) => (
                      <span 
                        key={index}
                        className="px-2.5 py-1.5 bg-[hsl(var(--tag-accent))] text-[hsl(var(--tag-accent-foreground))] text-sm font-medium rounded-full border border-[hsl(var(--tag-accent-border))]"
                      >
                        {orig}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Growing Region */}
              {product.region && (
                <div className="space-y-2 mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/70 flex items-center gap-2">
                    Growing Region
                    <span className="h-px flex-1 bg-border" aria-hidden="true" />
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {formatArrayString(product.region).map((reg, index) => (
                      <span 
                        key={index}
                        className="px-2.5 py-1.5 bg-[hsl(var(--tag-accent))] text-[hsl(var(--tag-accent-foreground))] text-sm font-medium rounded-full border border-[hsl(var(--tag-accent-border))]"
                      >
                        {reg}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasting Notes */}
              {product.tastingNotes && product.tastingNotes.length > 0 && (
                <div className="space-y-2 mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/70 flex items-center gap-2">
                    Tasting Notes
                    <span className="h-px flex-1 bg-border" aria-hidden="true" />
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {product.tastingNotes.map((note, index) => (
                      <span
                        key={index}
                        className="px-2.5 py-1.5 bg-[hsl(var(--tag-primary))] text-[hsl(var(--tag-primary-foreground))] text-sm font-medium rounded-full border border-[hsl(var(--tag-primary-border))]"
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {product.certifications && product.certifications.length > 0 && (
                <div className="space-y-2 mb-4 md:col-span-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/70 flex items-center gap-2">
                    Certifications
                    <span className="h-px flex-1 bg-border" aria-hidden="true" />
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {product.certifications.map((cert, index) => (
                      <span
                        key={index}
                        className="px-2.5 py-1.5 bg-[hsl(var(--tag-accent))] text-[hsl(var(--tag-accent-foreground))] text-sm font-medium rounded-full border border-[hsl(var(--tag-accent-border))]"
                      >
                        {formatArrayString(cert)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Buy Now Button */}
            <div className="mt-6">
              <Button
                type="button"
                onClick={handleBuyClick}
                disabled={isCheckingAddress}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 dark:hover:bg-primary/80 relative z-10 h-12 text-lg font-medium"
              >
                {isCheckingAddress ? (
                  <>
                    <Coffee className="mr-2 size-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Buy Now'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Address Modal */}
      <Dialog open={isShippingModalOpen} onOpenChange={setIsShippingModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Shipping Address</DialogTitle>
            <DialogDescription>
              Please add your shipping address to continue with checkout.
            </DialogDescription>
          </DialogHeader>
          <ShippingAddress onComplete={handleShippingComplete} />
        </DialogContent>
      </Dialog>
    </>
  )
} 
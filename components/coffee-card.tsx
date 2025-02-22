"use client"

import React, { useState } from "react"
import { Coffee } from "lucide-react"
import cx from "classnames"
import Image from 'next/image'
import { Button } from "./ui/button"

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

export function CoffeeCard({
  result,
  className,
  onBuyClick,
}: {
  result: CoffeeOptionsResult
  className?: string
  onBuyClick?: () => void
}) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  const handleImageError = () => {
    setImageLoading(false)
    setImageError(true)
  }

  if (!result?.products?.length) {
    return <div className="p-4 text-muted-foreground text-center">
      {result?.error || "No coffee options found with the specified criteria."}
    </div>
  }

  const product = result.products[0]

  return (
    <div className={cx("w-full", className)}>
      <div className="grid grid-cols-1 md:grid-cols-[2fr,3fr]">
        {/* Image Section */}
        <div className="relative aspect-square md:aspect-auto md:h-[600px] overflow-hidden">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="animate-pulse size-8 bg-amber-200/30 dark:bg-amber-700/30 rounded-full" />
                <Coffee className="absolute inset-0 m-auto size-4 text-amber-500/50 dark:text-amber-400/50" />
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
              alt={`${product.name} coffee`}
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
        <div className="relative bg-card/95 backdrop-blur-sm p-8 md:p-10 lg:p-12">
          {/* Enhanced Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-amber-600 dark:text-amber-400 tracking-wide">
                {product.vendor}
              </div>
              <div className="flex flex-col items-end">
                <div className="text-lg font-semibold text-amber-600 dark:text-amber-400">
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
              <div className="mt-4 text-muted-foreground leading-relaxed">
                {result.description}
              </div>
            )}
          </div>

          {/* Coffee Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 auto-rows-min">
            {/* Roast Level */}
            {product.roastLevel && (
              <div className="space-y-2 mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  Roast Level
                  <span className="h-px flex-1 bg-border" aria-hidden="true" />
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {formatArrayString(product.roastLevel).map((level, index) => (
                    <span 
                      key={index}
                      className="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-300 text-sm font-medium rounded-full border border-amber-200/50 dark:border-amber-700/50"
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
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  Taste Profile
                  <span className="h-px flex-1 bg-border" aria-hidden="true" />
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {formatArrayString(product.tasteType).map((type, index) => (
                    <span 
                      key={index}
                      className="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-300 text-sm font-medium rounded-full border border-amber-200/50 dark:border-amber-700/50"
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
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  Processing Method
                  <span className="h-px flex-1 bg-border" aria-hidden="true" />
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {formatArrayString(product.process).map((proc, index) => (
                    <span 
                      key={index}
                      className="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-300 text-sm font-medium rounded-full border border-amber-200/50 dark:border-amber-700/50"
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
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  Origin
                  <span className="h-px flex-1 bg-border" aria-hidden="true" />
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {formatArrayString(product.origin).map((orig, index) => (
                    <span 
                      key={index}
                      className="px-2.5 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-300 text-sm font-medium rounded-md border border-orange-200/50 dark:border-orange-800/50"
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
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  Growing Region
                  <span className="h-px flex-1 bg-border" aria-hidden="true" />
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {formatArrayString(product.region).map((reg, index) => (
                    <span 
                      key={index}
                      className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-300 text-sm font-medium rounded-md border border-emerald-200/50 dark:border-emerald-800/50"
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
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  Tasting Notes
                  <span className="h-px flex-1 bg-border" aria-hidden="true" />
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {product.tastingNotes.map((note, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-300 text-sm font-medium rounded-md border border-amber-200/50 dark:border-amber-800/50"
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
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  Certifications
                  <span className="h-px flex-1 bg-border" aria-hidden="true" />
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {product.certifications.map((cert, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-300 text-sm font-medium rounded-md border border-blue-200/50 dark:border-blue-800/50"
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
              onClick={onBuyClick}
              className="w-full bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 relative z-10 h-12 text-lg font-medium"
            >
              Buy Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}


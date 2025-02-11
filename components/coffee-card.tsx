"use client"

import Image from "next/image"
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

function formatArrayString(value: string): string {
  return value
    .replace(/[[\]"]/g, "")
    .split(",")
    .map((s) => s.trim())
    .join(", ")
}

export function CoffeeCard({
  result,
  className,
}: {
  result: CoffeeOptionsResult
  className?: string
}) {
  if (!result.products || result.products.length === 0) {
    return <div className="p-4 text-neutral-600 text-center">
      {result.error || "No coffee options found with the specified criteria."}
    </div>
  }

  const product = result.products[0]

  return (
    <div
      className={cx(
        "flex flex-col rounded-3xl overflow-hidden bg-white border border-stone-200 max-w-[800px] shadow-sm",
        className,
      )}
    >
      <div className="flex flex-col md:flex-row">
        {/* Image Section - Larger and without background */}
        <div className="md:w-1/2 flex items-center justify-center">
          <div className="relative w-full aspect-square max-w-[400px]">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl || "/placeholder.svg"}
                alt={`${product.name} coffee`}
                fill
                className="object-contain transition-transform duration-300 hover:scale-105"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-stone-400">No image available</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="md:w-1/2 p-6 flex flex-col">
          {/* Vendor */}
          <div className="text-sm font-medium text-amber-700 mb-4">{product.vendor}</div>

          {/* Title and Type */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-stone-900">{product.name}</h3>
            {product.type && <div className="text-base text-stone-600 mt-1">{product.type}</div>}
          </div>

          {/* Tags Section */}
          <div className="flex flex-wrap gap-2 mb-6">
            {product.roastLevel && (
              <span className="px-3 py-1 bg-amber-50 text-amber-900 text-sm font-medium rounded-lg">
                {product.roastLevel} Roast
              </span>
            )}
            {product.process && (
              <span className="px-3 py-1 bg-amber-50 text-amber-900 text-sm font-medium rounded-lg">
                {formatArrayString(product.process)}
              </span>
            )}
            {product.tasteType && (
              <span className="px-3 py-1 bg-amber-50 text-amber-900 text-sm font-medium rounded-lg">
                {product.tasteType}
              </span>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid gap-6 mb-6">
            {/* Origin & Region */}
            {(product.origin || product.region) && (
              <div className="space-y-2">
                <span className="text-xs font-medium uppercase tracking-wider text-stone-500">Origin</span>
                <div className="flex flex-wrap gap-2">
                  {product.origin && (
                    <span className="px-3 py-1.5 bg-orange-50 text-orange-900 text-sm font-medium rounded-lg border border-orange-100">
                      {formatArrayString(product.origin)}
                    </span>
                  )}
                  {product.region && (
                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-900 text-sm font-medium rounded-lg border border-emerald-100">
                      {formatArrayString(product.region)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Tasting Notes */}
            {product.tastingNotes && product.tastingNotes.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium uppercase tracking-wider text-stone-500">Tasting Notes</span>
                <div className="flex flex-wrap gap-2">
                  {product.tastingNotes.map((note) => (
                    <span
                      key={note}
                      className="px-3 py-1.5 bg-amber-50 text-amber-800 text-sm font-medium rounded-lg border border-amber-200"
                    >
                      {formatArrayString(note)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Section */}
      <div className="relative mt-auto">
        {/* Decorative diagonal line */}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_49.5%,#2c1810_49.5%,#2c1810_50.5%,transparent_50.5%)]" />

        <div className="px-8 py-6 bg-gradient-to-br from-[#3C2A1E] to-[#2C1810] relative">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-start">
              <div className="text-sm font-medium text-stone-400 tracking-wide uppercase mb-1">Price</div>
              <div className="relative">
                <div className="text-4xl font-bold text-white tracking-tight">${Number(product.price).toFixed(2)}</div>
                <div className="absolute -right-4 -top-3 text-amber-400 text-sm font-medium">USD</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {!product.available && (
                <span className="px-4 py-2 bg-red-500/10 text-red-300 text-sm font-medium rounded-full border border-red-300/20 backdrop-blur-sm">
                  Out of Stock
                </span>
              )}
              <button
                className={cx(
                  "group relative px-8 py-3.5 rounded-2xl font-medium text-lg transition-all duration-300",
                  "before:absolute before:inset-0 before:rounded-2xl before:transition-all before:duration-300",
                  product.available
                    ? [
                        "text-white overflow-hidden",
                        "before:bg-gradient-to-r before:from-amber-500 before:to-orange-500",
                        "hover:before:scale-105 hover:before:opacity-90",
                        "active:before:scale-100 active:before:opacity-100",
                      ].join(" ")
                    : ["text-stone-400 bg-stone-800/50", "cursor-not-allowed"].join(" "),
                )}
                disabled={!product.available}
              >
                <span className="relative">{product.available ? "Add to Cart" : "Sold Out"}</span>
                {product.available && (
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                    <svg className="w-5 h-5 ml-2 -mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


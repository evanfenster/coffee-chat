'use client';

import cx from 'classnames';
import Image from 'next/image';

interface CoffeeProduct {
  name: string;
  vendor: string;
  handle: string;
  roastLevel?: string;
  type?: string;
  tasteType?: string;
  process?: string;
  origin?: string;
  region?: string;
  certifications?: string[];
  tastingNotes?: string[];
  price: string;
  available: boolean;
  imageUrl?: string;
}

interface CoffeeOptionsResult {
  totalResults: number;
  products: CoffeeProduct[];
  appliedFilters: Record<string, unknown>;
  availableOptions: {
    roastLevels: { count: number; options: string[] };
    tastingNotes: { count: number; options: string[] };
    regions: { count: number; options: string[] };
    origins: { count: number; options: string[] };
    roasters: { count: number; options: string[] };
    processes: { count: number; options: string[] };
    certifications: { count: number; options: string[] };
    tasteTypes: { count: number; options: string[] };
  };
}

function formatArrayString(value: string): string {
  // Remove quotes, brackets, and split by commas
  return value
    .replace(/[\[\]"]/g, '')
    .split(',')
    .map(s => s.trim())
    .join(', ');
}

export function CoffeeCard({
  result,
  className,
}: {
  result: CoffeeOptionsResult;
  className?: string;
}) {
  if (!result.products || result.products.length === 0) {
    return (
      <div className="p-4 text-neutral-600 text-center">
        No coffee options found with the specified criteria.
      </div>
    );
  }

  const product = result.products[0];

  return (
    <div
      className={cx(
        'flex flex-row rounded-3xl overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 border border-amber-100 max-w-[800px] shadow-sm',
        className,
      )}
    >
      {/* Image Section */}
      <div className="relative w-[400px] h-[500px] bg-neutral-100 shrink-0">
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt={`${product.name} coffee`}
            fill
            className="object-cover"
            priority
          />
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-col gap-6 p-8 flex-1 bg-[radial-gradient(circle_at_center,rgba(251,146,60,0.05)_1px,transparent_1px)] bg-[length:24px_24px]">
        {/* Header */}
        <div className="flex flex-col">
          <div className="text-sm font-medium text-amber-700 mb-1">{product.vendor}</div>
          <h3 className="text-3xl font-bold text-amber-950 mb-2">{product.name}</h3>
          {product.type && (
            <div className="text-base text-amber-800">{product.type}</div>
          )}
        </div>

        {/* Primary Characteristics */}
        <div className="grid grid-cols-2 gap-6">
          {product.roastLevel && (
            <div className="space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-amber-700/70">
                Roast Level
              </span>
              <div className="font-medium text-amber-900 bg-amber-100/50 px-3 py-1.5 rounded-lg inline-block">
                {product.roastLevel}
              </div>
            </div>
          )}
          {product.process && (
            <div className="space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-amber-700/70">
                Process
              </span>
              <div className="font-medium text-amber-900 bg-amber-100/50 px-3 py-1.5 rounded-lg inline-block">
                {formatArrayString(product.process)}
              </div>
            </div>
          )}
        </div>

        {/* Origin & Region */}
        {(product.origin || product.region) && (
          <div className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-amber-700/70">
              Origin
            </span>
            <div className="flex flex-wrap gap-2">
              {product.origin && (
                <span className="px-3 py-1.5 bg-amber-100/50 text-amber-900 text-sm font-medium rounded-lg border border-amber-200/50">
                  {formatArrayString(product.origin)}
                </span>
              )}
              {product.region && (
                <span className="px-3 py-1.5 bg-emerald-100/50 text-emerald-900 text-sm font-medium rounded-lg border border-emerald-200/50">
                  {formatArrayString(product.region)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Taste Profile */}
        {product.tasteType && (
          <div className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-amber-700/70">
              Taste Profile
            </span>
            <div className="font-medium text-amber-900 bg-rose-100/50 px-3 py-1.5 rounded-lg inline-block border border-rose-200/50">
              {product.tasteType}
            </div>
          </div>
        )}

        {/* Tasting Notes */}
        {product.tastingNotes && product.tastingNotes.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-amber-700/70">
              Tasting Notes
            </span>
            <div className="flex flex-wrap gap-2">
              {product.tastingNotes.map((note) => (
                <span
                  key={note}
                  className="px-3 py-1.5 bg-yellow-100/50 text-yellow-900 text-sm font-medium rounded-lg border border-yellow-200/50"
                >
                  {formatArrayString(note)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {product.certifications && product.certifications.length > 0 && (
          <div className="space-y-2 mt-auto pt-4 border-t border-amber-200/50">
            <span className="text-xs font-medium uppercase tracking-wider text-amber-700/70">
              Certifications
            </span>
            <div className="flex flex-wrap gap-2">
              {product.certifications.map((cert) => (
                <span
                  key={cert}
                  className="px-3 py-1.5 bg-purple-100/50 text-purple-900 text-sm font-medium rounded-lg border border-purple-200/50"
                >
                  {formatArrayString(cert)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

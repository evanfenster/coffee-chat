import { Block } from "@/components/create-block";
import { ProductCard } from "@/components/product-card";
import { Product } from "@/lib/coffee/coffee-fetcher";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import { fetcher } from '@/lib/utils';
import { CheckoutLayout } from "@/components/checkout-layout";
import { UIBlock } from "@/components/block";
import { InitializeParameters, StreamPartParameters, StreamPart } from "@/components/create-block";

interface CheckoutSuggestion {
  product: Product;
  appliedFilters: Record<string, unknown>;
  createdAt: string;
  description: string;
}

export interface CheckoutBlockMetadata {
  suggestions: {
    product: Product;
    appliedFilters: Record<string, unknown>;
    timestamp: number;
    description: string;
  }[];
  currentSuggestionIndex: number;
  error?: string;
}

// Helper function to find suggestion index by product
function findSuggestionIndex(suggestions: CheckoutBlockMetadata['suggestions'], product: Product): number {
  return suggestions.findIndex(s => 
    s.product.name === product.name && 
    s.product.vendor === product.vendor
  );
}

export const checkoutBlock = new Block<"checkout", CheckoutBlockMetadata>({
  kind: "checkout",
  description: "Interactive product suggestion and purchase interface with history navigation",
  
  initialize: async ({ documentId, setMetadata }: InitializeParameters<CheckoutBlockMetadata>) => {
    console.log('Initializing checkout block:', { documentId });
    
    // Set initial state immediately to prevent undefined errors
    setMetadata({
      suggestions: [],
      currentSuggestionIndex: -1,
      error: undefined
    });

    try {
      console.log('Fetching suggestions...');
      const suggestions = await fetcher<CheckoutSuggestion[]>(`/api/suggestions?chatId=${documentId}`);
      console.log('Fetched suggestions:', suggestions);
      
      if (suggestions?.length > 0) {
        // Sort suggestions by creation time, oldest first
        const sortedSuggestions = [...suggestions].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        console.log('Sorted suggestions:', sortedSuggestions);

        setMetadata({
          suggestions: sortedSuggestions.map(s => ({
            product: s.product,
            appliedFilters: s.appliedFilters || {},
            timestamp: new Date(s.createdAt).getTime(),
            description: s.description
          })),
          currentSuggestionIndex: sortedSuggestions.length - 1 // Start with most recent suggestion
        });
      }
    } catch (error) {
      console.error('Error initializing checkout block:', error);
      setMetadata({
        suggestions: [],
        currentSuggestionIndex: -1,
        error: error instanceof Error ? error.message : 'Failed to load suggestions'
      });
    }
  },

  onStreamPart: ({ streamPart, setBlock, setMetadata }: StreamPartParameters<CheckoutBlockMetadata>) => {
    if (streamPart.type === 'suggestion') {
      const suggestion = JSON.parse(streamPart.content);
      setMetadata((m: CheckoutBlockMetadata) => ({
        ...m,
        suggestions: [...(m?.suggestions || []), {
          product: suggestion.product,
          appliedFilters: suggestion.appliedFilters,
          timestamp: suggestion.timestamp,
          description: suggestion.description
        }],
        currentSuggestionIndex: (m?.suggestions?.length || 0)
      }));

      // Make block visible when we receive a new suggestion
      setBlock((block: UIBlock) => ({
        ...block,
        isVisible: true
      }));
    }
  },

  content: ({
    metadata,
    isLoading,
    setMetadata
  }) => {
    console.log('Checkout block render:', { metadata, isLoading });
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    if (!metadata) {
      console.log('No metadata');
      return <div className="p-4">Initializing...</div>;
    }

    if (!Array.isArray(metadata.suggestions)) {
      console.log('Suggestions not an array:', metadata.suggestions);
      return <div className="p-4">Loading suggestions...</div>;
    }

    const suggestionCount = metadata.suggestions.length;
    console.log('Suggestion count:', suggestionCount);

    if (metadata.currentSuggestionIndex < 0 || metadata.currentSuggestionIndex >= suggestionCount) {
      console.log('Invalid suggestion index:', metadata.currentSuggestionIndex);
      return <div className="p-4">No suggestions available</div>;
    }

    const currentSuggestion = metadata.suggestions[metadata.currentSuggestionIndex];
    console.log('Current suggestion:', currentSuggestion);
    
    if (isLoading) {
      return <div className="p-4">Loading suggestion...</div>;
    }

    if (!currentSuggestion?.product) {
      console.log('No current suggestion or product');
      return <div className="p-4">No suggestions yet</div>;
    }

    const handleBuyClick = () => {
      console.log('Buy button clicked');
      setIsCheckoutOpen(true);
    };

    return (
      <CheckoutLayout
        product={currentSuggestion.product}
        checkoutOpen={isCheckoutOpen}
        setCheckoutOpen={setIsCheckoutOpen}
        footer={
          suggestionCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {metadata.currentSuggestionIndex + 1} of {suggestionCount}
              </span>
              {/* Navigation dots */}
              <div className="flex gap-1.5 items-center">
                {metadata.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className={`size-1.5 rounded-full transition-colors ${
                      index === metadata.currentSuggestionIndex
                        ? 'bg-[hsl(var(--brand-accent))]'
                        : 'bg-border hover:bg-[hsl(var(--brand-accent-muted))]'
                    }`}
                    onClick={() => {
                      console.log('Changing suggestion to index:', index);
                      setMetadata(m => ({ ...m, currentSuggestionIndex: index }));
                      setIsCheckoutOpen(false);
                    }}
                    aria-label={`View suggestion ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )
        }
      >
        {/* Product Card */}
        {currentSuggestion?.product && (
          <ProductCard 
            key={`${currentSuggestion.product.name}-${currentSuggestion.product.vendor}-${metadata.currentSuggestionIndex}`}
            result={{
              products: [currentSuggestion.product],
              appliedFilters: currentSuggestion.appliedFilters || {},
              description: currentSuggestion.description
            }}
            onBuyClick={handleBuyClick}
          />
        )}
      </CheckoutLayout>
    );
  },

  actions: [
    {
      icon: "←",
      description: "Previous suggestion",
      onClick: ({ setMetadata }) => {
        setMetadata(m => ({
          ...m,
          currentSuggestionIndex: Math.max(0, m.currentSuggestionIndex - 1)
        }));
      }
    },
    {
      icon: "→",
      description: "Next suggestion",
      onClick: ({ setMetadata }) => {
        setMetadata(m => ({
          ...m,
          currentSuggestionIndex: Math.min(m.suggestions.length - 1, m.currentSuggestionIndex + 1)
        }));
      }
    }
  ],

  toolbar: [],
}); 
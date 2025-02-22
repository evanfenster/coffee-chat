import { memo, useRef, useEffect } from 'react';
import { useBlock } from '@/hooks/use-block';
import { Product } from '@/lib/coffee/coffee-fetcher';
import { FullscreenIcon } from './icons';
import { CheckoutBlockMetadata, checkoutBlock } from '@/blocks/checkout/client';
import { fetcher } from '@/lib/utils';

interface CheckoutSuggestion {
  product: Product;
  appliedFilters: Record<string, unknown>;
  createdAt: string;
}

interface CheckoutPreviewProps {
  isReadonly: boolean;
  chatId: string;
  result?: {
    products: Product[];
    appliedFilters: Record<string, unknown>;
  };
}

function PureCheckoutPreview({ isReadonly, chatId, result }: CheckoutPreviewProps) {
  const { block, setBlock, metadata, setMetadata } = useBlock();
  const hitboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const boundingBox = hitboxRef.current?.getBoundingClientRect();
    if (block.documentId && boundingBox) {
      setBlock((block) => ({
        ...block,
        boundingBox: {
          left: boundingBox.x,
          top: boundingBox.y,
          width: boundingBox.width,
          height: boundingBox.height,
        },
      }));
    }
  }, [block.documentId, setBlock]);

  if (!result || !result.products.length) {
    return (
      <div className="w-full">
        <div className="p-4 border rounded-2xl flex flex-row gap-2 items-center justify-between dark:bg-muted h-[57px] dark:border-zinc-700">
          <div className="flex flex-row items-center gap-3">
            <div className="text-muted-foreground">
              <div className="animate-pulse rounded-md size-4 bg-muted-foreground/20" />
            </div>
            <div className="animate-pulse rounded-lg h-4 bg-muted-foreground/20 w-24" />
          </div>
          <div>
            <FullscreenIcon />
          </div>
        </div>
      </div>
    );
  }

  const product = result.products[0];

  const handleClick = async (event: React.MouseEvent) => {
    const boundingBox = event.currentTarget.getBoundingClientRect();
    
    // Set initial block properties including the documentId from the chat
    setBlock(block => ({
      ...block,
      kind: "checkout",
      isVisible: false,
      documentId: chatId,
      title: "Curated Selection",
      boundingBox: {
        left: boundingBox.x,
        top: boundingBox.y,
        width: boundingBox.width,
        height: boundingBox.height,
      },
    }));

    // Initialize with the documentId
    await checkoutBlock.initialize?.({
      documentId: chatId,
      setMetadata
    });

    // Find and set the current suggestion index
    setMetadata((m: CheckoutBlockMetadata) => {
      if (!m?.suggestions) return m;
      
      const suggestionIndex = m.suggestions.findIndex(s => 
        s.product.name === product.name && 
        s.product.vendor === product.vendor
      );

      return {
        ...m,
        currentSuggestionIndex: suggestionIndex !== -1 ? suggestionIndex : m.currentSuggestionIndex
      };
    });

    // Make the block visible
    setBlock(block => ({
      ...block,
      isVisible: true
    }));
  };

  return (
    <div className="relative w-full cursor-pointer">
      <div
        className="size-full absolute top-0 left-0 rounded-xl z-10"
        ref={hitboxRef}
        onClick={handleClick}
        role="presentation"
        aria-hidden="true"
      />

      <div className="p-4 border rounded-2xl flex flex-row gap-2 items-center justify-between dark:bg-muted dark:border-zinc-700">
        <div className="flex flex-row items-center gap-3">
          <div className="text-muted-foreground">☕</div>
          <div className="font-medium">{product.name}</div>
        </div>
        <div>
          <FullscreenIcon />
        </div>
      </div>
    </div>
  );
}

export const CheckoutPreview = memo(PureCheckoutPreview, (prevProps, nextProps) => {
  if (!prevProps.result && !nextProps.result) return true;
  if (!prevProps.result || !nextProps.result) return false;
  if (prevProps.result.products.length !== nextProps.result.products.length) return false;
  if (prevProps.isReadonly !== nextProps.isReadonly) return false;
  return true;
}); 
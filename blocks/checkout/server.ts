import { createDocumentHandler } from "@/lib/blocks/server";
import { getCoffeeProducts } from '@/lib/coffee/coffee-fetcher';
import { BlockKind } from "@/components/block";
import { saveCheckoutSuggestion } from '@/lib/db/queries';

interface CheckoutContent {
  chatId: string;
  suggestions: Array<{
    product: any; // Using any for now since we don't have the CoffeeProduct type
    appliedFilters: Record<string, unknown>;
    timestamp: number;
  }>;
  currentSuggestionIndex: number;
  checkoutOpen: boolean;
}

export const checkoutDocumentHandler = createDocumentHandler<BlockKind>({
  kind: "checkout",
  onCreateDocument: async ({ id, title, dataStream, session }) => {
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Initialize empty block content
    const initialContent: CheckoutContent = {
      chatId: id,
      suggestions: [],
      currentSuggestionIndex: -1,
      checkoutOpen: false
    };

    // Get first suggestion
    const result = await getCoffeeProducts(id);
    
    if (result.products.length > 0) {
      const selectedProduct = result.products[0];
      
      // Save the suggestion
      await saveCheckoutSuggestion({
        chatId: id,
        product: selectedProduct,
        appliedFilters: result.appliedFilters,
        description: "Here's a coffee suggestion based on your preferences."
      });

      // Update initial content with the suggestion
      initialContent.suggestions = [{
        product: selectedProduct,
        appliedFilters: result.appliedFilters,
        timestamp: Date.now()
      }];
      initialContent.currentSuggestionIndex = 0;

      // Send suggestion to client
      dataStream.writeData({
        type: "suggestion",
        content: JSON.stringify({
          product: selectedProduct,
          appliedFilters: result.appliedFilters,
          timestamp: Date.now()
        })
      });

      // Make block visible
      dataStream.writeData({
        type: "block",
        content: JSON.stringify({
          isVisible: true,
          status: 'idle',
          content: JSON.stringify(initialContent)
        })
      });
    }

    // Return the content to be saved
    return JSON.stringify(initialContent);
  },

  onUpdateDocument: async ({ document, description, dataStream, session }) => {
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const currentContent: CheckoutContent = document.content ? JSON.parse(document.content) : {
      chatId: document.id,
      suggestions: [],
      currentSuggestionIndex: -1,
      checkoutOpen: false
    };

    // Get new suggestion
    const result = await getCoffeeProducts(currentContent.chatId);
    
    if (result.products.length > 0) {
      const selectedProduct = result.products[0];
      
      // Save the suggestion
      await saveCheckoutSuggestion({
        chatId: currentContent.chatId,
        product: selectedProduct,
        appliedFilters: result.appliedFilters,
        description: "Here's a coffee suggestion based on your preferences."
      });

      // Update content with new suggestion
      const updatedContent: CheckoutContent = {
        ...currentContent,
        suggestions: [...currentContent.suggestions, {
          product: selectedProduct,
          appliedFilters: result.appliedFilters,
          timestamp: Date.now()
        }],
        currentSuggestionIndex: currentContent.suggestions.length
      };

      // Send suggestion to client
      dataStream.writeData({
        type: "suggestion",
        content: JSON.stringify({
          product: selectedProduct,
          appliedFilters: result.appliedFilters,
          timestamp: Date.now()
        })
      });

      // Make block visible and update content
      dataStream.writeData({
        type: "block",
        content: JSON.stringify({
          isVisible: true,
          status: 'idle',
          content: JSON.stringify(updatedContent)
        })
      });

      return JSON.stringify(updatedContent);
    }

    // Always return a string, never null
    return JSON.stringify(currentContent);
  }
}); 
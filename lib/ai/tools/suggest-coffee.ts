import { tool } from 'ai';
import { z } from 'zod';
import { getCoffeeProducts } from '@/lib/coffee/coffee-fetcher';

// Add a small delay to ensure any pending filter changes are saved
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const createSuggestCoffeeTool = (chatId: string) => tool({
  description: 'Suggest a coffee bean that best matches the current filters set, or random if no filters are set. This tool should be called immediately after editCoffeeFilters returns shouldSuggest: true, as it will wait for filter changes to be saved before making a suggestion. OR it can be called earlier if the user wants a recommendation now.',
  parameters: z.object({}),
  execute: async () => {
    console.log('🔵 [suggestCoffee] Called with chatId:', chatId);
    
    // Add a small delay to ensure filters are saved
    await delay(500);
    
    const result = await getCoffeeProducts(chatId);
    
    if (result.error || result.products.length === 0) {
      const errorResult = {
        products: [],
        appliedFilters: {},
        error: result.error || 'No matching coffee found'
      };
      console.log('🔴 [suggestCoffee] Error:', errorResult);
      return errorResult;
    }

    // Select a coffee that matches the preferences
    const randomIndex = Math.floor(Math.random() * result.products.length);
    const successResult = {
      products: [result.products[randomIndex]],
      appliedFilters: result.appliedFilters
    };
    console.log('✅ [suggestCoffee] Success:', successResult);
    return successResult;
  },
}); 
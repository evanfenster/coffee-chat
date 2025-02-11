import { tool } from 'ai';
import { z } from 'zod';
import { clearCoffeeFilters, getCoffeeFiltersByChatId } from '@/lib/db/queries';

const filterCategories = z.enum([
  'roastLevels',
  'tastingNotes',
  'regions',
  'origins',
  'roasters',
  'processes',
  'certifications',
  'tasteTypes'
]);

export const createClearCoffeeFiltersTool = (chatId: string) => tool({
  description: 'Clear all filters or a specific filter category for the chat session.',
  parameters: z.object({
    category: filterCategories.optional(),
  }),
  execute: async ({ category }) => {
    console.log('🔵 [clearCoffeeFilters] Called with:', { chatId, category });
    try {
      await clearCoffeeFilters({ chatId, category });
      const currentFilters = await getCoffeeFiltersByChatId({ chatId }) || {};
      const successResult = {
        success: true,
        currentFilters,
        clearedCategory: category
      };
      console.log('✅ [clearCoffeeFilters] Success:', successResult);
      return successResult;
    } catch (error) {
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear coffee filters',
        currentFilters: {}
      };
      console.log('🔴 [clearCoffeeFilters] Error:', errorResult);
      return errorResult;
    }
  }
}); 
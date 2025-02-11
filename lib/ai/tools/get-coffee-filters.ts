import { tool } from 'ai';
import { z } from 'zod';
import { getCoffeeFiltersByChatId } from '@/lib/db/queries';

export const createGetCoffeeFiltersTool = (chatId: string) => tool({
  description: 'Get the current coffee filters for the chat session.',
  parameters: z.object({}),
  execute: async () => {
    console.log('🔵 [getCoffeeFilters] Called with chatId:', chatId);
    try {
      const currentFilters = await getCoffeeFiltersByChatId({ chatId }) || {};
      const successResult = {
        success: true,
        currentFilters
      };
      console.log('✅ [getCoffeeFilters] Success:', successResult);
      return successResult;
    } catch (error) {
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get coffee filters',
        currentFilters: {}
      };
      console.log('🔴 [getCoffeeFilters] Error:', errorResult);
      return errorResult;
    }
  }
}); 
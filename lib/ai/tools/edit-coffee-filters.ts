import { tool } from 'ai';
import { z } from 'zod';
import { COFFEE_OPTIONS } from '@/lib/coffee/options';
import { getCoffeeFiltersByChatId, saveCoffeeFilters } from '@/lib/db/queries';
import { getCoffeeProducts } from '@/lib/coffee/coffee-fetcher';

// Create a map of string values to their categories for efficient lookup
const valueToCategory = new Map<string, string>();
for (const [category, values] of Object.entries(COFFEE_OPTIONS)) {
  for (const value of values) {
    valueToCategory.set(value, category);
  }
}

// Create a union of all possible values for the zod schema
const allValues = [
  ...COFFEE_OPTIONS.roastLevels,
  ...COFFEE_OPTIONS.tastingNotes,
  ...COFFEE_OPTIONS.regions,
  ...COFFEE_OPTIONS.origins,
  ...COFFEE_OPTIONS.roasters,
  ...COFFEE_OPTIONS.processes,
  ...COFFEE_OPTIONS.certifications,
  ...COFFEE_OPTIONS.tasteTypes,
] as const;

// Function to find which category a value belongs to
function findCategory(value: string): string | null {
  return valueToCategory.get(value) || null;
}

// Constants for suggestion logic
const IDEAL_SUGGESTION_THRESHOLD = 10; // Suggest when we have 10 or fewer matching coffees
const MIN_FILTERS_FOR_SUGGESTION = 2; // Need at least 2 filters before making suggestions

export const createEditCoffeeFiltersTool = (chatId: string) => tool({
  description: 'Update coffee preferences by adding or removing specific filters based on user interactions and expressed preferences. When this tool returns shouldSuggest: true in its response, you should immediately follow up with a call to suggestCoffee to get a recommendation based on the updated filters.',
  parameters: z.object({
    edits: z.array(z.object({
      action: z.enum(['add', 'remove']),
      value: z.enum(allValues)
    }))
  }),
  execute: async ({ edits }) => {
    console.log('🔵 [editCoffeeFilters] Called with:', { chatId, edits });
    try {
      const currentFilters: Record<string, string[]> = await getCoffeeFiltersByChatId({ chatId }) || {};
      // Save a copy of the original filters before making changes
      const previousFilters = JSON.parse(JSON.stringify(currentFilters));
      const appliedEdits: Array<{ action: string; value: string; category: string }> = [];
      let hasChanges = false;

      // Process each edit
      for (const { action, value } of edits) {
        const category = findCategory(value);
        if (!category) {
          console.log('⚠️ [editCoffeeFilters] Skipping edit - category not found for value:', value);
          continue;
        }

        // Ensure the category exists in currentFilters
        if (!currentFilters[category]) {
          currentFilters[category] = [];
        }

        const values = new Set(currentFilters[category]);
        if (action === 'add' && !values.has(value)) {
          values.add(value);
          hasChanges = true;
          console.log('📝 [editCoffeeFilters] Added value:', { category, value });
        } else if (action === 'remove' && values.has(value)) {
          values.delete(value);
          hasChanges = true;
          console.log('📝 [editCoffeeFilters] Removed value:', { category, value });
        }

        if (values.size > 0) {
          currentFilters[category] = Array.from(values);
        } else {
          delete currentFilters[category];
        }

        appliedEdits.push({ action, value, category });
      }

      if (hasChanges) {
        await saveCoffeeFilters({ chatId, filters: currentFilters });
        let result = await getCoffeeProducts(chatId);
        
        // If we have no matches, keep the previous filters and suggest from those
        if (result.products.length === 0) {
          await saveCoffeeFilters({ chatId, filters: previousFilters });
          console.log('📝 [editCoffeeFilters] Keeping previous filters due to no matches');
          return {
            success: true,
            currentFilters: previousFilters,
            appliedEdits: [], // Clear the edits since we're ignoring them
            shouldSuggest: true
          };
        }
        
        // Normal suggestion logic - only suggest if we have enough filters and few enough matches
        const totalFilters = Object.values(currentFilters).reduce((sum, arr) => sum + arr.length, 0);
        const shouldSuggest = result.products.length <= IDEAL_SUGGESTION_THRESHOLD && 
                            totalFilters >= MIN_FILTERS_FOR_SUGGESTION;
        
        return {
          success: true,
          currentFilters,
          appliedEdits,
          shouldSuggest
        };
      }

      return {
        success: true,
        currentFilters,
        appliedEdits,
        shouldSuggest: false
      };
    } catch (error) {
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to edit coffee filters',
        currentFilters: {},
        shouldSuggest: false
      };
      console.log('🔴 [editCoffeeFilters] Error:', errorResult);
      return errorResult;
    }
  }
}); 
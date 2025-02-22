import { DataStreamWriter, tool, streamObject } from 'ai';
import { z } from 'zod';
import { getCoffeeProducts } from '@/lib/coffee/coffee-fetcher';
import { saveCheckoutSuggestion } from '@/lib/db/queries';
import { myProvider } from '../models';

// Add a small delay to ensure any pending filter changes are saved
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const descriptionExample = `Given your appreciation for bright, fruity profiles, this Ethiopian Yirgacheffe would be an excellent choice. The natural processing method beautifully accentuates its vibrant blueberry and jasmine notes, while a refined honey sweetness creates the complex, tea-like profile you enjoy.`;

async function generateDescription(product: any, context: string, appliedFilters: Record<string, unknown>) {
  const { fullStream } = streamObject({
    model: myProvider.languageModel('title-model'),
    system: `You are a coffee expert who provides personalized coffee recommendations. Your descriptions should be friendly, specific, and highlight why a coffee matches the user's preferences.`,
    prompt: `Based on the following information, generate a personalized coffee recommendation description:

Context about the user and their preferences:
${context}

Currently applied filters:
${JSON.stringify(appliedFilters, null, 2)}

Coffee details:
- Name: ${product.name}
- Origin: ${product.origin}
- Process: ${product.process}
- Roast Level: ${product.roastLevel}
- Taste Type: ${product.tasteType}
- Tasting Notes: ${product.tastingNotes?.join(', ')}

Example format: "${descriptionExample}"

Your description should:
1. Reference specific user preferences from the context and applied filters
2. Highlight relevant characteristics of this coffee
3. Explain why it's a good match
4. Be 1-2 sentences long
5. If there is no context or this is a random suggestion, still explain why this coffee is great

Generate the description now.`,
    schema: z.object({
      description: z.string().describe('A personalized 1-2 sentence description of why this coffee is a good match for the user.')
    })
  });

  let description = '';
  
  for await (const delta of fullStream) {
    if (delta.type === 'object' && delta.object.description) {
      description = delta.object.description;
    }
  }

  return description.trim() || 'This coffee offers a unique and delightful experience worth exploring.';
}

export const createSuggestCoffeeTool = (chatId: string, dataStream?: DataStreamWriter, userId?: string) => tool({
  description: 'Suggest a coffee bean that best matches the current filters set, or random if no filters are set. Include context about user preferences to generate a personalized description. This is called after we have narrowed down the options with editCoffeeFilters or the user asked for a suggestion.',
  parameters: z.object({
    context: z.string().describe('Recent conversation context and known user preferences that will help personalize the coffee description. Include any mentioned flavor preferences, brewing methods, or specific interests.')
  }),
  execute: async ({ context }) => {
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
    const selectedProduct = result.products[randomIndex];
    
    // Generate personalized description
    const description = await generateDescription(selectedProduct, context, result.appliedFilters);
    
    const successResult = {
      products: [selectedProduct],
      appliedFilters: result.appliedFilters,
      description
    };

    // Save the suggestion to the database
    await saveCheckoutSuggestion({
      chatId,
      product: selectedProduct,
      appliedFilters: result.appliedFilters,
      description
    });

    if (dataStream) {
      console.log('🔵 [suggestCoffee] Sending stream events');
      
      // Initialize block
      dataStream.writeData({ type: 'kind', content: 'checkout' });
      dataStream.writeData({ type: 'id', content: chatId });
      dataStream.writeData({ type: 'title', content: 'Coffee Suggestions' });
      dataStream.writeData({ type: 'clear', content: '' });
      
      // Send suggestion
      const suggestionData = {
        product: selectedProduct,
        appliedFilters: result.appliedFilters,
        description,
        timestamp: Date.now()
      };
      console.log('🔵 [suggestCoffee] Sending suggestion:', suggestionData);
      dataStream.writeData({
        type: 'suggestion',
        content: JSON.stringify(suggestionData)
      });
      
      // Make block visible
      const blockData = {
        isVisible: true,
        status: 'idle'
      };
      console.log('🔵 [suggestCoffee] Setting block visibility:', blockData);
      dataStream.writeData({
        type: 'block',
        content: JSON.stringify(blockData)
      });
      
      dataStream.writeData({ type: 'finish', content: '' });
      console.log('🔵 [suggestCoffee] Finished sending stream events');
    }

    // Return the result
    console.log('✅ [suggestCoffee] Success:', successResult);
    return successResult;
  },
}); 
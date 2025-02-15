import {
  type Message,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';

import { auth } from '@/app/(auth)/auth';
import { myProvider } from '@/lib/ai/models';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';

import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { createSuggestCoffeeTool } from '@/lib/ai/tools/suggest-coffee';
import { createGetCoffeeFiltersTool } from '@/lib/ai/tools/get-coffee-filters';
import { createEditCoffeeFiltersTool } from '@/lib/ai/tools/edit-coffee-filters';
import { createClearCoffeeFiltersTool } from '@/lib/ai/tools/clear-coffee-filters';
import { createGetKnowledgeTool } from '@/lib/ai/tools/get-knowledge';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    console.log('🔵 [route] Processing chat request');
    const {
      id,
      messages,
      selectedChatModel,
    }: { id: string; messages: Array<Message>; selectedChatModel: string } =
      await request.json();

    console.log('📝 [route] Request details:', { id, selectedChatModel, messageCount: messages.length });

    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      console.log('🔴 [route] Unauthorized - no valid session');
      return new Response('Unauthorized', { status: 401 });
    }

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      console.log('🔴 [route] No user message found');
      return new Response('No user message found', { status: 400 });
    }

    const chat = await getChatById({ id });

    if (!chat) {
      console.log('📝 [route] Creating new chat');
      const title = await generateTitleFromUserMessage({ message: userMessage });
      await saveChat({ id, userId: session.user.id, title });
    }

    await saveMessages({
      messages: [{ ...userMessage, createdAt: new Date(), chatId: id }],
    });

    return createDataStreamResponse({
      execute: (dataStream) => {
        console.log('📝 [route] Setting up stream with tools');
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel }),
          messages,
          maxSteps: 5,
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []
              : [
                  'createDocument',
                  'updateDocument',
                  'requestSuggestions',
                  'suggestCoffee',
                  'getCoffeeFilters',
                  'editCoffeeFilters',
                  'clearCoffeeFilters',
                  'getKnowledge',
                ],
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools: {
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
            }),
            suggestCoffee: createSuggestCoffeeTool(id),
            getCoffeeFilters: createGetCoffeeFiltersTool(id),
            editCoffeeFilters: createEditCoffeeFiltersTool(id),
            clearCoffeeFilters: createClearCoffeeFiltersTool(id),
            getKnowledge: createGetKnowledgeTool(),
          },
          onFinish: async ({ response, reasoning }) => {
            if (session.user?.id) {
              try {
                const sanitizedResponseMessages = sanitizeResponseMessages({
                  messages: response.messages,
                  reasoning,
                });

                await saveMessages({
                  messages: sanitizedResponseMessages.map((message) => {
                    return {
                      id: message.id,
                      chatId: id,
                      role: message.role,
                      content: message.content,
                      createdAt: new Date(),
                    };
                  }),
                });
              } catch (error) {
                console.error('🔴 [route] Failed to save chat:', error);
              }
            }
          },
          experimental_telemetry: {
            isEnabled: true,
            functionId: 'stream-text',
          },
        });

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: (error) => {
        console.error('🔴 [route] Error in data stream:', error);
        return 'Oops, an error occurred!';
      },
    });
  } catch (error) {
    console.error('🔴 [route] Unhandled error:', error);
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}

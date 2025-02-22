import { getCheckoutSuggestionsByChatId } from '@/lib/db/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new Response('Missing chatId', { status: 400 });
  }

  const suggestions = await getCheckoutSuggestionsByChatId({ chatId });

  return Response.json(suggestions);
}

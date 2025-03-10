import 'server-only';

import { genSaltSync, hashSync } from 'bcrypt-ts';
import { and, asc, desc, eq, gt, gte, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { APP_CONFIG } from '@/config/app.config';
import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  type Message,
  message,
  vote,
  coffeeFilters,
  checkoutSuggestion,
  type CheckoutSuggestion,
} from './schema';
import { BlockKind } from '@/components/block';
import { CoffeeFilters } from '@/lib/coffee/coffee-fetcher';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
export const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function getStoaUserId(userId: string): Promise<string> {
  try {
    const [result] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId));

    return result?.stoaId || '';
  } catch (error) {
    console.error('Failed to get stoa user id from database');
    throw error;
  }
}

export async function createUser(
  email: string, 
  password: string, 
  firstName: string, 
  lastName: string
) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  try {
    // Make API call to stoa-api to create user there first
    const { agentId } = APP_CONFIG.stoa.api;
    const stoaApiUrl = `${APP_CONFIG.stoa.api.baseUrl}/users/`;
    
    const response = await fetch(stoaApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.STOA_API_KEY}`
      },
      body: JSON.stringify({
        agentId,
        firstName,
        lastName,
        email,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create user in stoa-api:', errorText);
      throw new Error(`Failed to create user in stoa-api: ${errorText}`);
    }
    
    // Only create user in our database if stoa-api call succeeds
    const responseData = await response.json();
    
    // Handle the case where responseData is an array (from returning())
    const stoaUser = Array.isArray(responseData) ? responseData[0] : responseData;
    console.log('Stoa user:', stoaUser);
    
    return await db.insert(user).values({ 
      email, 
      password: hash, 
      stoaId: stoaUser.id, // Use stoaUser instead of responseData
      firstName,
      lastName
    });
  } catch (error) {
    console.error('Failed to create user:', error);
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));

    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({ messages }: { messages: Array<Message> }) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: BlockKind;
  content: string;
  userId: string;
}) {
  try {
    return await db.insert(document).values({
      id,
      title,
      kind,
      content,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}

export async function getCoffeeFiltersByChatId({ 
  chatId 
}: { 
  chatId: string 
}): Promise<CoffeeFilters | null> {
  try {
    const [result] = await db
      .select()
      .from(coffeeFilters)
      .where(eq(coffeeFilters.chatId, chatId));

    return result ? (result.filters as CoffeeFilters) : null;
  } catch (error) {
    console.error('Failed to get coffee filters from database');
    throw error;
  }
}

export async function saveCoffeeFilters({ 
  chatId, 
  filters 
}: { 
  chatId: string;
  filters: CoffeeFilters;
}) {
  try {
    const [existing] = await db
      .select()
      .from(coffeeFilters)
      .where(eq(coffeeFilters.chatId, chatId));

    if (existing) {
      return await db
        .update(coffeeFilters)
        .set({ 
          filters, 
          updatedAt: new Date() 
        })
        .where(eq(coffeeFilters.chatId, chatId));
    }

    return await db
      .insert(coffeeFilters)
      .values({
        chatId,
        filters,
        updatedAt: new Date(),
      });
  } catch (error) {
    console.error('Failed to save coffee filters to database');
    throw error;
  }
}

export async function clearCoffeeFilters({ 
  chatId,
  category
}: { 
  chatId: string;
  category?: keyof CoffeeFilters;
}) {
  try {
    const [existing] = await db
      .select()
      .from(coffeeFilters)
      .where(eq(coffeeFilters.chatId, chatId));

    if (!existing) {
      return;
    }

    let updatedFilters = { ...(existing.filters as CoffeeFilters) };
    
    if (category) {
      delete updatedFilters[category];
    } else {
      updatedFilters = {};
    }

    return await db
      .update(coffeeFilters)
      .set({ 
        filters: updatedFilters, 
        updatedAt: new Date() 
      })
      .where(eq(coffeeFilters.chatId, chatId));
  } catch (error) {
    console.error('Failed to clear coffee filters in database');
    throw error;
  }
}

export async function saveCheckoutSuggestion({ 
  chatId,
  product,
  appliedFilters,
  description,
}: { 
  chatId: string;
  product: unknown;
  appliedFilters: unknown;
  description: string;
}): Promise<void> {
  try {
    await db
      .insert(checkoutSuggestion)
      .values({
        chatId,
        product,
        appliedFilters,
        description,
        createdAt: new Date(),
      });
  } catch (error) {
    console.error('Failed to save checkout suggestion to database');
    throw error;
  }
}

export async function getCheckoutSuggestionsByChatId({ 
  chatId 
}: { 
  chatId: string 
}): Promise<CheckoutSuggestion[]> {
  try {
    return await db
      .select()
      .from(checkoutSuggestion)
      .where(eq(checkoutSuggestion.chatId, chatId))
      .orderBy(desc(checkoutSuggestion.createdAt));
  } catch (error) {
    console.error('Failed to get checkout suggestions from database');
    throw error;
  }
}

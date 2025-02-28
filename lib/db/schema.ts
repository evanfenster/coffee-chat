import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
  vector,
  index,
} from 'drizzle-orm/pg-core';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
  stripeCardHolderId: varchar('stripe_cardholder_id', { length: 255 }),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  addressLine1: varchar('address_line1', { length: 255 }),
  addressLine2: varchar('address_line2', { length: 255 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  country: varchar('country', { length: 100 }),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable('Message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  content: json('content').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type Message = InferSelectModel<typeof message>;

export const vote = pgTable(
  'Vote',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('text', { enum: ['text', 'checkout'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  },
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const coffeeFilters = pgTable('coffeefilters', {
  chatId: uuid('chatId')
    .notNull()
    .primaryKey()
    .references(() => chat.id),
  filters: json('filters').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
});

export type CoffeeFilters = InferSelectModel<typeof coffeeFilters>;

export const checkoutSuggestion = pgTable('CheckoutSuggestion', {
  id: uuid('id').notNull().defaultRandom().primaryKey(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  product: json('product').notNull(),
  appliedFilters: json('appliedFilters').notNull(),
  description: text('description').notNull().default(''),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type CheckoutSuggestion = InferSelectModel<typeof checkoutSuggestion>;

export const knowledgeResource = pgTable('KnowledgeResource', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  filePath: text('filePath').notNull(),
  fileHash: varchar('fileHash', { length: 64 }).notNull().unique(),
  content: text('content').notNull(),
});

export const knowledgeEmbedding = pgTable(
  'KnowledgeEmbedding',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    resourceId: uuid('resourceId')
      .notNull()
      .references(() => knowledgeResource.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }).notNull(),
  },
  (table) => ({
    embeddingIdx: index('embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops')),
  }),
);

export type KnowledgeResource = InferSelectModel<typeof knowledgeResource>;
export type KnowledgeEmbedding = InferSelectModel<typeof knowledgeEmbedding>;

export const order = pgTable('Order', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  productHandle: varchar('productHandle', { length: 255 }).notNull(),
  productName: varchar('productName', { length: 255 }).notNull(),
  price: varchar('price', { length: 50 }).notNull(),
  status: varchar('status', { 
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'] 
  }).notNull().default('pending'),
  stripeSessionId: varchar('stripeSessionId', { length: 255 }).notNull(),
  cardHolderId: varchar('cardHolderId', { length: 255 }),
  cardId: varchar('cardId', { length: 255 }),
  errorDetails: text('errorDetails'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type Order = InferSelectModel<typeof order>;

export const systemSettings = pgTable('SystemSettings', {
  key: varchar('key', { length: 255 }).primaryKey().notNull(),
  value: json('value').notNull(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type SystemSettings = InferSelectModel<typeof systemSettings>;

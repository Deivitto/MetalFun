import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  bio: text("bio"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  metalAddress: text("metal_address"),
  holdingIds: text("holding_ids").array().default([]).notNull(),
  friendIds: text("friend_ids").array().default([]).notNull(),
  likedCoinIds: text("liked_coin_ids").array().default([]).notNull(),
  likedReplyIds: text("liked_reply_ids").array().default([]).notNull(),
  coinIds: text("coin_ids").array().default([]).notNull(),
  phoneNumber: text("phone_number"),
  phoneVerified: boolean("phone_verified").default(false),
  phoneVerificationCode: text("phone_verification_code"),
  phoneVerificationExpiry: timestamp("phone_verification_expiry")
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  metalAddress: true,
  holdingIds: true,
  friendIds: true,
  likedCoinIds: true,
  likedReplyIds: true,
  coinIds: true,
  phoneVerified: true,
  phoneVerificationCode: true,
  phoneVerificationExpiry: true,
});

// Coin schema
export const coins = pgTable("coins", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull().unique(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by").notNull(),
  marketCap: integer("market_cap").default(0).notNull(),
  replyCount: integer("reply_count").default(0).notNull(),
  isMigrated: boolean("is_migrated").default(false).notNull(),
  isTrending: boolean("is_trending").default(false).notNull(),
  holderCount: integer("holder_count").default(0).notNull(),
  previousHolderCount: integer("previous_holder_count").default(0).notNull(), // 24h ago count
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  isWithdrawn: boolean("is_withdrawn").default(false),
  withdrawnAt: timestamp("withdrawn_at"),
  price: text("price").default("0.001"),
  priceChange24h: text("price_change_24h").default("0"),
  volume24h: text("volume_24h").default("0"),
  tags: text("tags").array().notNull(),
  metadata: jsonb("metadata").$type<{
    address?: string;
    name?: string;
    symbol?: string;
    merchantAddress?: string;
    totalSupply?: number;
    merchantSupply?: number;
    price?: number;
    remainingRewardSupply?: number;
    startingRewardSupply?: number;
    lpInfo?: any;
    holders?: number;
    volume24h?: number;
    canDistribute?: boolean;
    canLP?: boolean;
    status?: "pending" | "completed" | "failed";
    message?: string;
    error?: string;
  }>(), // For Metal API integration
});

export const insertCoinSchema = createInsertSchema(coins).omit({
  id: true,
  createdAt: true,
  marketCap: true,
  replyCount: true,
  holderCount: true,
  previousHolderCount: true,
  lastUpdated: true,
  isWithdrawn: true,
  withdrawnAt: true,
  price: true,
  priceChange24h: true,
  volume24h: true,
  metadata: true,
});

// Transaction schema
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  coinId: integer("coin_id").notNull(),
  amount: text("amount").notNull(),
  type: text("type").notNull(), // "buy" or "sell"
  solAmount: text("sol_amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

// Reply schema
export const replies = pgTable("replies", {
  id: serial("id").primaryKey(),
  coinId: integer("coin_id").notNull(),
  userId: text("user_id").notNull(),
  username: text("username"),
  userAvatar: text("user_avatar"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  likeCount: integer("like_count").default(0).notNull(),
  parentId: integer("parent_id"), // For comment replies
  isAnonymous: boolean("is_anonymous").default(false).notNull(),
});

export const insertReplySchema = createInsertSchema(replies).omit({
  id: true,
  createdAt: true,
  likeCount: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCoin = z.infer<typeof insertCoinSchema>;
export type Coin = typeof coins.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertReply = z.infer<typeof insertReplySchema>;
export type Reply = typeof replies.$inferSelect;

// Token Metadata schema for Metal API integration
export const tokenMetadata = pgTable("token_metadata", {
  id: serial("id").primaryKey(),
  tokenId: text("token_id").notNull().unique(),
  description: text("description"),
  image: text("image"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  metalAddress: text("metal_address"),
  merchantAddress: text("merchant_address"),
  additionalData: jsonb("additional_data"),
});

export const insertTokenMetadataSchema = createInsertSchema(tokenMetadata).omit({
  id: true,
  createdAt: true,
});

export type InsertTokenMetadata = z.infer<typeof insertTokenMetadataSchema>;
export type TokenMetadata = typeof tokenMetadata.$inferSelect;

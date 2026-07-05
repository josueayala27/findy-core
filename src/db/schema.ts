import {
  pgTable,
  foreignKey,
  unique,
  uniqueIndex,
  index,
  uuid,
  text,
  timestamp,
  doublePrecision,
  integer,
  bigint,
  boolean,
  numeric,
  date,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text().notNull(),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  image: text(),
  authProvider: text("auth_provider").default("credentials").notNull(),
  supabaseUserId: uuid("supabase_user_id"),
}, (table) => [
  unique("users_email_key").on(table.email),
  unique("users_supabase_user_id_key").on(table.supabaseUserId),
]);

export const savedPlaces = pgTable("saved_places", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid("user_id").notNull(),
  placeId: text("place_id").notNull(),
  placeName: text("place_name").notNull(),
  placeLocation: text("place_location").default("").notNull(),
  placeImage: text("place_image").default("").notNull(),
  placeCategories: text("place_categories").array().default([]).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
}, (table) => [
  foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "saved_places_user_id_fkey",
  }).onDelete("cascade"),
  unique("saved_places_user_id_place_id_key").on(table.userId, table.placeId),
]);

export const passwordResetOtps = pgTable("password_reset_otps", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid("user_id").notNull(),
  otpHash: text("otp_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
}, (table) => [
  index("password_reset_otps_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "password_reset_otps_user_id_fkey",
  }).onDelete("cascade"),
]);

export const places = pgTable("places", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  canonicalName: text("canonical_name").notNull(),
  locationText: text("location_text"),
  lat: doublePrecision(),
  lng: doublePrecision(),
  category: text(),
  suspiciousLocation: boolean("suspicious_location").default(false).notNull(),
  googlePlaceId: text("google_place_id"),
  verificationStatus: text("verification_status").default("unverified").notNull(),
  verificationScore: numeric("verification_score"),
  department: text(),
  municipality: text(),
  mentionCount: integer("mention_count").default(0).notNull(),
  totalLikes: bigint("total_likes", { mode: "number" }).default(0).notNull(),
  totalComments: bigint("total_comments", { mode: "number" }).default(0).notNull(),
  totalShares: bigint("total_shares", { mode: "number" }).default(0).notNull(),
  totalBookmarks: bigint("total_bookmarks", { mode: "number" }).default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("places_canonical_name_key").using("btree", table.canonicalName.asc().nullsLast().op("text_ops")),
  uniqueIndex("places_google_place_id_key").using("btree", table.googlePlaceId.asc().nullsLast().op("text_ops")),
]);

export const placeMentions = pgTable("place_mentions", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  placeId: uuid("place_id").notNull(),
  videoId: text("video_id").notNull(),
  sentiment: text().notNull(),
  sentimentScore: numeric("sentiment_score").notNull(),
  likes: integer().default(0).notNull(),
  comments: integer().default(0).notNull(),
  shares: integer().default(0).notNull(),
  bookmarks: integer().default(0).notNull(),
  summary: text(),
  locationText: text("location_text"),
  transcript: text(),
  source: text().default("tiktok").notNull(),
  sourceUrl: text("source_url"),
  evidence: text(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
}, (table) => [
  index("place_mentions_place_id_idx").using("btree", table.placeId.asc().nullsLast().op("uuid_ops")),
  foreignKey({
    columns: [table.placeId],
    foreignColumns: [places.id],
    name: "place_mentions_place_id_fkey",
  }).onDelete("cascade"),
]);

export const webSources = pgTable("web_sources", {
  url: text().primaryKey().notNull(),
  domain: text().notNull(),
  category: text(),
  scrapedAt: timestamp("scraped_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  status: text().default("pending").notNull(),
});

export const clickedPlaces = pgTable("clicked_places", {
  uuid: uuid().primaryKey().notNull(),
  userId: uuid("user_id"),
  placeId: text("place_id"),
  creation: date(),
});

export const placeLists = pgTable("place_lists", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid("user_id").notNull(),
  name: text().notNull(),
  description: text(),
  shareToken: uuid("share_token"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
}, (table) => [
  index("place_lists_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
  uniqueIndex("place_lists_share_token_key").using("btree", table.shareToken.asc().nullsLast().op("uuid_ops")),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "place_lists_user_id_fkey",
  }).onDelete("cascade"),
]);

export const placeListItems = pgTable("place_list_items", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  listId: uuid("list_id").notNull(),
  placeId: uuid("place_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
}, (table) => [
  index("place_list_items_list_id_idx").using("btree", table.listId.asc().nullsLast().op("uuid_ops")),
  foreignKey({
    columns: [table.listId],
    foreignColumns: [placeLists.id],
    name: "place_list_items_list_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.placeId],
    foreignColumns: [places.id],
    name: "place_list_items_place_id_fkey",
  }).onDelete("cascade"),
  unique("place_list_items_list_id_place_id_key").on(table.listId, table.placeId),
]);

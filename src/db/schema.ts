import { pgTable, foreignKey, unique, uuid, text, timestamp } from "drizzle-orm/pg-core";

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
}, (table) => [
  unique("users_email_key").on(table.email),
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

import { relations } from "drizzle-orm/relations";
import { users, savedPlaces } from "./schema";

export const savedPlacesRelations = relations(savedPlaces, ({ one }) => ({
  user: one(users, {
    fields: [savedPlaces.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  savedPlaces: many(savedPlaces),
}));

import { relations } from "drizzle-orm/relations";
import { users, savedPlaces, passwordResetOtps, places, placeMentions } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  savedPlaces: many(savedPlaces),
  passwordResetOtps: many(passwordResetOtps),
}));

export const savedPlacesRelations = relations(savedPlaces, ({ one }) => ({
  user: one(users, {
    fields: [savedPlaces.userId],
    references: [users.id],
  }),
}));

export const passwordResetOtpsRelations = relations(passwordResetOtps, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetOtps.userId],
    references: [users.id],
  }),
}));

export const placesRelations = relations(places, ({ many }) => ({
  placeMentions: many(placeMentions),
}));

export const placeMentionsRelations = relations(placeMentions, ({ one }) => ({
  place: one(places, {
    fields: [placeMentions.placeId],
    references: [places.id],
  }),
}));

import { relations } from "drizzle-orm/relations";
import { users, savedPlaces, passwordResetOtps, places, placeMentions, placeLists, placeListItems, placeReviews } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  savedPlaces: many(savedPlaces),
  passwordResetOtps: many(passwordResetOtps),
  placeLists: many(placeLists),
  placeReviews: many(placeReviews),
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
  placeListItems: many(placeListItems),
  placeReviews: many(placeReviews),
}));

export const placeMentionsRelations = relations(placeMentions, ({ one }) => ({
  place: one(places, {
    fields: [placeMentions.placeId],
    references: [places.id],
  }),
}));

export const placeListsRelations = relations(placeLists, ({ one, many }) => ({
  user: one(users, {
    fields: [placeLists.userId],
    references: [users.id],
  }),
  items: many(placeListItems),
}));

export const placeReviewsRelations = relations(placeReviews, ({ one }) => ({
  user: one(users, {
    fields: [placeReviews.userId],
    references: [users.id],
  }),
  place: one(places, {
    fields: [placeReviews.placeId],
    references: [places.id],
  }),
}));

export const placeListItemsRelations = relations(placeListItems, ({ one }) => ({
  list: one(placeLists, {
    fields: [placeListItems.listId],
    references: [placeLists.id],
  }),
  place: one(places, {
    fields: [placeListItems.placeId],
    references: [places.id],
  }),
}));

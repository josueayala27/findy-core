export interface PlaceReview {
  id: string;
  placeId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName: string;
    image: string | null;
  };
}

export interface MyPlaceReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  place: {
    id: string;
    canonicalName: string;
    locationText: string | null;
    category: string | null;
  };
}

export interface PlaceRatingAggregate {
  ratingAvg: number | null;
  ratingCount: number;
}

export interface PlaceMention {
  id: string;
  videoId: string;
  sentiment: string;
  sentimentScore: number;
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  summary: string | null;
  locationText: string | null;
  createdAt: string;
}

export interface PlaceTrending {
  mentionCount: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalBookmarks: number;
}

export interface Place {
  id: string;
  canonicalName: string;
  category: string | null;
  location: {
    text: string | null;
    lat: number | null;
    lng: number | null;
  };
  trending: PlaceTrending;
  mentions: PlaceMention[];
  createdAt: string;
  updatedAt: string;
}

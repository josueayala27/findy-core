export interface PlaceMention {
  id: string;
  videoId: string;
  source: string;
  sourceUrl: string | null;
  sentiment: string;
  sentimentScore: number;
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  summary: string | null;
  locationText: string | null;
  evidence: string | null;
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
    department: string | null;
    municipality: string | null;
  };
  verification: {
    status: string;
    score: number | null;
    suspiciousLocation: boolean;
    googlePlaceId: string | null;
  };
  trending: PlaceTrending;
  mentions: PlaceMention[];
  createdAt: string;
  updatedAt: string;
}

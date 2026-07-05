export interface PlaceListPlace {
  id: string;
  canonicalName: string;
  category: string | null;
  location: {
    text: string | null;
    lat: number | null;
    lng: number | null;
  };
  addedAt: string;
}

export interface PlaceList {
  id: string;
  name: string;
  description: string | null;
  placeCount: number;
  isShared: boolean;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlaceListDetail extends PlaceList {
  places: PlaceListPlace[];
}

export interface SharedPlaceList {
  name: string;
  description: string | null;
  owner: {
    firstName: string;
  };
  places: PlaceListPlace[];
}

export type TerritorySlug =
  | "messina-stretto"
  | "milazzo-tirrenica"
  | "nebrodi"
  | "isole-eolie";

export type CategorySlug =
  | "mangiare"
  | "esperienze"
  | "mare"
  | "natura"
  | "cultura"
  | "shopping-artigianato"
  | "famiglia";

export type Experience = {
  id: string;
  slug: string;
  name: string;
  excerpt: string;
  description: string;
  territory: TerritorySlug;
  category: CategorySlug;
  categoryName: string;
  location: string;
  duration?: string;
  priceFrom?: number;
  operatorName: string;
  operatorSlug?: string;
  operatorWhatsapp?: string;
  operatorWebsite?: string;
  operatorInstagram?: string;
  whySelected: string;
  featured?: boolean;
  bookable?: boolean;
  bookingUrl?: string;
  bookingNote?: string;
  meetingPoint?: string;
  googleMapsQuery?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  imageAlt?: string;
};

export type CultureEntry = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  placeName: string;
  address?: string;
  googleMapsQuery: string;
  latitude?: number;
  longitude?: number;
  sourceLabel?: string;
  sourceUrl?: string;
  featured?: boolean;
  imageUrl?: string;
  imageAlt?: string;
  imageAuthor?: string;
  imageLicense?: string;
  imageSourceUrl?: string;
  imageLicenseUrl?: string;
};

export type AnalyticsEventName =
  | "page_view"
  | "experience_view"
  | "operator_view"
  | "territory_view"
  | "itinerary_view"
  | "map_open"
  | "map_marker_click"
  | "search"
  | "filter_used"
  | "favorite_added"
  | "favorite_removed"
  | "phone_click"
  | "whatsapp_click"
  | "website_click"
  | "instagram_click"
  | "directions_click"
  | "booking_click"
  | "share_click"
  | "operator_application_started"
  | "operator_application_submitted";

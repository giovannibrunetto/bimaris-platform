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
  location: string;
  duration?: string;
  priceFrom?: number;
  operatorName: string;
  whySelected: string;
  featured?: boolean;
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

export type AnalyticsPayload = {
  event: AnalyticsEventName;
  path?: string;
  sessionId?: string;
  anonymousId?: string;
  userId?: string;
  properties?: Record<string, string | number | boolean | null>;
};

export const MARKETPLACE_CATEGORIES = [
  'All',
  'AI Images',
  'AI Videos',
  '3D & CGI',
  'Product Ads',
  'Fashion',
  'Social Media',
  'Animation',
  'Graphic Design',
  'Audio & Voice',
] as const;

export type MarketplaceCategory = (typeof MARKETPLACE_CATEGORIES)[number];

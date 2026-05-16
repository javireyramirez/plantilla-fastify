export const Resources = {
  COMPANIES: 'companies',
  LEADS: 'leads',
  DEALS: 'deals',
} as const;

export type Resource = (typeof Resources)[keyof typeof Resources];

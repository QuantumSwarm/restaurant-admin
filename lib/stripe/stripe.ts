// lib/stripe/stripe.ts
// FIXED: Updated to latest Stripe API version and removed deprecated type

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

/**
 * Stripe client instance
 * Configured with the latest stable API version
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // FIXED: Updated to Stripe's latest stable API version (2025-02-24)
  apiVersion: '2025-02-24.acacia',
  typescript: true,
  appInfo: {
    name: 'Restaurant Admin Panel',
    version: '1.0.0',
  },
});

/**
 * Default currency for all Stripe operations
 * FIXED: Removed deprecated Stripe.CurrencyCode type
 */
export const STRIPE_CURRENCY = (process.env.STRIPE_DEFAULT_CURRENCY || 'usd') as string;

/**
 * Helper function to format amount for Stripe
 * Stripe expects amounts in cents (smallest currency unit)
 */
export function formatAmountForStripe(amount: number, currency: string): number {
  const numberFormat = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol',
  });
  
  const parts = numberFormat.formatToParts(amount);
  let zeroDecimalCurrency = true;
  
  for (const part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false;
      break;
    }
  }
  
  return zeroDecimalCurrency ? amount : Math.round(amount * 100);
}

/**
 * Helper function to format amount from Stripe
 * Converts cents back to dollars
 */
export function formatAmountFromStripe(amount: number, currency: string): number {
  const numberFormat = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol',
  });
  
  const parts = numberFormat.formatToParts(amount);
  let zeroDecimalCurrency = true;
  
  for (const part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false;
      break;
    }
  }
  
  return zeroDecimalCurrency ? amount : amount / 100;
}

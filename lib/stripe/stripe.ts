// lib/stripe/stripe.ts
// Stripe initialization and utility functions
// Centralized Stripe configuration for admin subscription system

import Stripe from 'stripe';

// ============================================================================
// Configuration & Initialization
// ============================================================================

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    'STRIPE_SECRET_KEY is not defined in environment variables. ' +
    'Please add it to your .env file.'
  );
}

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Use latest stable API version
  typescript: true,
  maxNetworkRetries: 3, // Retry failed requests
  timeout: 10000, // 10 second timeout
});

// ============================================================================
// Constants
// ============================================================================

export const STRIPE_CURRENCY = (process.env.STRIPE_DEFAULT_CURRENCY || 'usd') as Stripe.CurrencyCode;
export const STRIPE_PRODUCT_ID = process.env.STRIPE_PRODUCT_ID;

// Validate product ID is configured
if (!STRIPE_PRODUCT_ID) {
  console.warn(
    '⚠️  STRIPE_PRODUCT_ID not set in environment variables. ' +
    'Run scripts/create-stripe-product.js to create the base product.'
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if Stripe is running in test mode
 * Test mode keys start with sk_test_
 */
export function isTestMode(): boolean {
  return process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ?? false;
}

/**
 * Convert dollars to cents for Stripe
 * Stripe amounts are in smallest currency unit (cents for USD)
 * @param dollars Amount in dollars (e.g., 50.00)
 * @returns Amount in cents (e.g., 5000)
 */
export function toStripeAmount(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars from Stripe
 * @param cents Amount in cents (e.g., 5000)
 * @returns Amount in dollars (e.g., 50.00)
 */
export function fromStripeAmount(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

/**
 * Format Stripe error for user-friendly display
 * @param error Stripe error object
 * @returns User-friendly error message
 */
export function formatStripeError(error: any): string {
  if (error.type === 'StripeCardError') {
    return `Payment failed: ${error.message}`;
  } else if (error.type === 'StripeRateLimitError') {
    return 'Too many requests. Please try again in a moment.';
  } else if (error.type === 'StripeInvalidRequestError') {
    return 'Invalid request. Please check your input.';
  } else if (error.type === 'StripeAPIError') {
    return 'Payment service error. Please try again later.';
  } else if (error.type === 'StripeConnectionError') {
    return 'Network error. Please check your connection.';
  } else if (error.type === 'StripeAuthenticationError') {
    return 'Authentication error. Please contact support.';
  }
  
  return error.message || 'An unexpected error occurred.';
}

/**
 * Calculate next billing date based on billing cycle day
 * @param billingCycleDay Day of month (1-28)
 * @param fromDate Starting date (defaults to today)
 * @returns Next billing date
 */
export function calculateNextBillingDate(
  billingCycleDay: number,
  fromDate: Date = new Date()
): Date {
  const nextBilling = new Date(fromDate);
  
  // Set to billing day of current month
  nextBilling.setDate(billingCycleDay);
  nextBilling.setHours(0, 0, 0, 0);
  
  // If we've already passed the billing day this month, move to next month
  if (nextBilling <= fromDate) {
    nextBilling.setMonth(nextBilling.getMonth() + 1);
  }
  
  return nextBilling;
}

/**
 * Calculate billing cycle anchor timestamp for Stripe
 * This determines when the first charge and all future charges occur
 * @param billingCycleDay Day of month (1-28)
 * @returns Unix timestamp for Stripe billing_cycle_anchor
 */
export function calculateBillingCycleAnchor(billingCycleDay: number): number {
  const anchorDate = calculateNextBillingDate(billingCycleDay);
  return Math.floor(anchorDate.getTime() / 1000);
}

/**
 * Get current billing period dates
 * @param billingCycleDay Day of month (1-28)
 * @returns Object with period_start and period_end dates
 */
export function getCurrentBillingPeriod(billingCycleDay: number) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Period start
  const periodStart = new Date(currentYear, currentMonth, billingCycleDay);
  if (periodStart > today) {
    // If billing day hasn't occurred this month, period started last month
    periodStart.setMonth(periodStart.getMonth() - 1);
  }
  
  // Period end (next billing day)
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  
  return {
    period_start: periodStart,
    period_end: periodEnd,
  };
}

// ============================================================================
// Initialization Log
// ============================================================================

const mode = isTestMode() ? 'TEST' : 'LIVE';
const modeEmoji = isTestMode() ? '🧪' : '🔴';

console.log(`${modeEmoji} Stripe initialized in ${mode} mode`);

if (isTestMode()) {
  console.log('   Using test API key - no real charges will be made');
} else {
  console.warn('   ⚠️  LIVE mode - real charges will be made!');
}

// ============================================================================
// Type Exports
// ============================================================================

export type StripeCustomer = Stripe.Customer;
export type StripeSubscription = Stripe.Subscription;
export type StripePrice = Stripe.Price;
export type StripeInvoice = Stripe.Invoice;
export type StripeInvoiceItem = Stripe.InvoiceItem;

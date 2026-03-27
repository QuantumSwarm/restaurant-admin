// test-stripe-import.ts
import { stripe, toStripeAmount, isTestMode } from "../lib/stripe/stripe";

console.log("Stripe loaded:", !!stripe);
console.log("Test mode:", isTestMode());
console.log("$50 in cents:", toStripeAmount(50.0));

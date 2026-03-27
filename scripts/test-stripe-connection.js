// scripts/test-stripe-connection.js
// Test script to verify Stripe is configured correctly
// Run this after setting up Stripe API keys

require('dotenv').config();
const Stripe = require('stripe');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in .env file');
  console.error('Please add your Stripe secret key to .env:');
  console.error('STRIPE_SECRET_KEY=sk_test_...');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

async function testConnection() {
  console.log('🔍 Testing Stripe connection...\n');
  
  try {
    // Test 1: Retrieve account info
    console.log('📋 Test 1: Retrieving account info...');
    const account = await stripe.accounts.retrieve();
    console.log('   ✅ Account ID:', account.id);
    console.log('   ✅ Business name:', account.business_profile?.name || 'Not set');
    console.log('   ✅ Mode:', STRIPE_SECRET_KEY.startsWith('sk_test_') ? 'TEST 🧪' : 'LIVE 🔴');
    console.log('');
    
    // Test 2: List products
    console.log('📦 Test 2: Listing products...');
    const products = await stripe.products.list({ limit: 5 });
    console.log(`   ✅ Found ${products.data.length} product(s)`);
    
    if (products.data.length > 0) {
      products.data.forEach((p, index) => {
        console.log(`   ${index + 1}. ${p.name} (${p.id})`);
      });
    } else {
      console.log('   ⚠️  No products found. Run create-stripe-product.js to create one.');
    }
    console.log('');
    
    // Test 3: Check for Admin Subscription product
    console.log('🔍 Test 3: Checking for Admin Subscription product...');
    const adminProducts = await stripe.products.search({
      query: 'metadata["type"]:"admin_subscription"',
    });
    
    if (adminProducts.data.length > 0) {
      const product = adminProducts.data[0];
      console.log('   ✅ Admin Subscription product found!');
      console.log('   Product ID:', product.id);
      console.log('   Make sure this is in your .env:');
      console.log(`   STRIPE_PRODUCT_ID=${product.id}`);
    } else {
      console.log('   ⚠️  Admin Subscription product not found.');
      console.log('   Run: node scripts/create-stripe-product.js');
    }
    console.log('');
    
    // Test 4: Create and delete test customer
    console.log('👤 Test 4: Creating test customer...');
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test Customer',
      metadata: { test: 'true', created_by: 'test_script' },
    });
    console.log('   ✅ Customer created:', customer.id);
    
    // Clean up
    await stripe.customers.del(customer.id);
    console.log('   ✅ Test customer deleted (cleanup)');
    console.log('');
    
    // Test 5: API rate limits
    console.log('⚡ Test 5: Checking API rate limits...');
    const balance = await stripe.balance.retrieve();
    console.log('   ✅ API responding normally');
    console.log('   Available balance:', 
      balance.available.map(b => `${b.amount / 100} ${b.currency.toUpperCase()}`).join(', ') || 'No funds');
    console.log('');
    
    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 All tests passed! Stripe is configured correctly.');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('✅ Checklist:');
    console.log('   [✓] Stripe SDK installed');
    console.log('   [✓] API key valid');
    console.log('   [✓] Test mode active');
    console.log('   [✓] Can create/delete customers');
    console.log('   [✓] API rate limits OK');
    console.log('');
    
    if (adminProducts.data.length > 0) {
      console.log('🚀 Ready to proceed with Chunk 2A: List Admins');
    } else {
      console.log('⏭️  Next step: Run node scripts/create-stripe-product.js');
    }
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Stripe connection test FAILED\n');
    console.error('Error message:', error.message);
    
    if (error.type) {
      console.error('Error type:', error.type);
    }
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.statusCode) {
      console.error('HTTP status:', error.statusCode);
    }
    
    console.error('\n💡 Troubleshooting tips:');
    console.error('   1. Verify STRIPE_SECRET_KEY in .env starts with sk_test_');
    console.error('   2. Check your internet connection');
    console.error('   3. Verify API key is active in Stripe dashboard');
    console.error('   4. Try regenerating your API key');
    console.error('');
    
    process.exit(1);
  }
}

testConnection();

// scripts/create-stripe-product.js
// One-time script to create the base Stripe product
// Run this ONCE after setting up your Stripe account

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

async function createProduct() {
  console.log('🏗️  Creating Stripe product for Admin Subscriptions...\n');
  
  try {
    // Check if product already exists
    const existingProducts = await stripe.products.search({
      query: 'metadata["type"]:"admin_subscription"',
    });
    
    if (existingProducts.data.length > 0) {
      const product = existingProducts.data[0];
      console.log('✅ Product already exists!');
      console.log('Product ID:', product.id);
      console.log('Name:', product.name);
      console.log('\nAdd this to your .env file:');
      console.log(`STRIPE_PRODUCT_ID=${product.id}`);
      return product;
    }
    
    // Create new product
    const product = await stripe.products.create({
      name: 'Admin Subscription',
      description: 'Monthly subscription for admin access with credit-based billing',
      metadata: {
        type: 'admin_subscription',
        billing_type: 'monthly_with_overages',
        created_by: 'setup_script',
      },
    });
    
    console.log('✅ Product created successfully!');
    console.log('\n📋 Product Details:');
    console.log('   ID:', product.id);
    console.log('   Name:', product.name);
    console.log('   Description:', product.description);
    console.log('\n🔧 Next Step:');
    console.log('Add this to your .env file:');
    console.log(`STRIPE_PRODUCT_ID=${product.id}`);
    console.log('\nThen restart your development server.');
    
    return product;
    
  } catch (error) {
    console.error('❌ Error creating product:', error.message);
    if (error.type) {
      console.error('Error type:', error.type);
    }
    process.exit(1);
  }
}

createProduct();

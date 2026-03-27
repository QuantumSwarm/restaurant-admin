// scripts/seed-bulk-stores.js
// Efficiently creates 200 test stores for admin@test.com with realistic data patterns
// Idempotent | Batch-optimized | CI/CD-safe | Progress-tracked

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CONFIG = {
  ADMIN_EMAIL: 'admin@test.com',
  RESTAURANT_NAME: 'Bulk Test Restaurant',
  LOCATION_PREFIX: 'Test Location',
  TOTAL_STORES: 200,
  BATCH_SIZE: 50, // Prevents DB connection timeouts
  PHONE_BASE: '416555', // Format: +1 (416) 555-XXXX
};

// Realistic Toronto postal code generator (simplified pattern)
const generatePostalCode = (index) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numPart = String(100 + (index % 900)).padStart(3, '0');
  const charPart = chars.charAt(index % chars.length);
  return `M5V ${numPart.charAt(0)}${charPart}${numPart.slice(1)}`;
};

// Generate unique phone with test-range safety
const generatePhone = (index, isPrimary = true) => {
  const offset = isPrimary ? 2000 : 3000;
  const num = String(offset + index).slice(-4);
  return `+1 (416) 555-${num}`;
};

async function seedBulkStores() {
  console.log(`🌱 Starting bulk store seeding (${CONFIG.TOTAL_STORES} stores)...\n`);
  const startTime = Date.now();

  // =============== STEP 1: VERIFY ADMIN ===============
  const admin = await prisma.admin.findUnique({
    where: { email: CONFIG.ADMIN_EMAIL },
    select: { adminId: true },
  });
  
  if (!admin?.adminId) {
    throw new Error(
      `❌ Admin not found: ${CONFIG.ADMIN_EMAIL}\n` +
      `👉 Run 'npm run seed:admin' first to create test admin`
    );
  }
  console.log(`✅ Verified admin account (ID: ${admin.adminId})`);

  // =============== STEP 2: UPSERT BULK RESTAURANT ===============
  const restaurant = await prisma.restaurant.upsert({
    where: { 
      adminId_name: { 
        adminId: admin.adminId, 
        name: CONFIG.RESTAURANT_NAME 
      } 
    },
    update: { isActive: true },
    create: {
      adminId: admin.adminId,
      name: CONFIG.RESTAURANT_NAME,
      isActive: true,
    },
  });
  console.log(`✅ Restaurant ready: "${restaurant.name}" (ID: ${restaurant.restaurantId})`);

  // =============== STEP 3: PREPARE LOCATIONS ===============
  console.log(`\n📍 Preparing ${CONFIG.TOTAL_STORES} locations...`);
  const locationNames = Array.from(
    { length: CONFIG.TOTAL_STORES }, 
    (_, i) => `${CONFIG.LOCATION_PREFIX} ${i + 1}`
  );

  // Fetch existing locations in our range
  const existingLocations = await prisma.location.findMany({
    where: { name: { in: locationNames } },
    select: { id: true, name: true },
  });
  
  const existingNames = new Set(existingLocations.map(l => l.name));
  const missingLocations = locationNames
    .filter(name => !existingNames.has(name))
    .map(name => ({ name, isActive: true }));

  // Create missing locations in batches
  if (missingLocations.length > 0) {
    for (let i = 0; i < missingLocations.length; i += CONFIG.BATCH_SIZE) {
      const batch = missingLocations.slice(i, i + CONFIG.BATCH_SIZE);
      await prisma.location.createMany({
        data: batch,
        skipDuplicates: true,
      });
      console.log(`  📦 Created location batch ${Math.floor(i / CONFIG.BATCH_SIZE) + 1}/${Math.ceil(missingLocations.length / CONFIG.BATCH_SIZE)}`);
    }
  }
  
  // Get ALL location IDs (existing + new)
  const allLocations = await prisma.location.findMany({
    where: { name: { in: locationNames } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  
  if (allLocations.length !== CONFIG.TOTAL_STORES) {
    throw new Error(`Location mismatch: Expected ${CONFIG.TOTAL_STORES}, got ${allLocations.length}. Check unique constraints on Location.name`);
  }
  console.log(`✅ All ${allLocations.length} locations ready`);

  // =============== STEP 4: PREPARE STORES ===============
  console.log(`\n🏪 Preparing stores...`);
  
  // Get existing stores for this restaurant in our locations
  const existingStores = await prisma.store.findMany({
    where: {
      restaurantId: restaurant.restaurantId,
      locationId: { in: allLocations.map(l => l.id) },
    },
    select: { locationId: true },
  });
  
  const existingLocationIds = new Set(existingStores.map(s => s.locationId));
  const storesToCreate = allLocations
    .filter(loc => !existingLocationIds.has(loc.id))
    .map((loc, idx) => {
      // Extract index from location name: "Test Location 42" → 42
      const locIndex = parseInt(loc.name.split(' ')[2], 10);
      return {
        restaurantId: restaurant.restaurantId,
        locationId: loc.id,
        address: `${100 + locIndex} Queen St W, Toronto, ON ${generatePostalCode(locIndex)}`,
        phonePrimary: generatePhone(locIndex, true),
        phoneSecondary: generatePhone(locIndex, false),
        isAiAgentEnabled: locIndex % 5 !== 0, // 80% enabled (realistic distribution)
        timeZone: 'America/Toronto',
        isActive: true,
      };
    });

  // Create stores in batches
  if (storesToCreate.length > 0) {
    console.log(`🆕 Creating ${storesToCreate.length} new stores...`);
    for (let i = 0; i < storesToCreate.length; i += CONFIG.BATCH_SIZE) {
      const batch = storesToCreate.slice(i, i + CONFIG.BATCH_SIZE);
      await prisma.store.createMany({
        data: batch,
        skipDuplicates: true,
      });
      
      const progress = Math.min(i + CONFIG.BATCH_SIZE, storesToCreate.length);
      console.log(`  📦 Store batch ${Math.floor(i / CONFIG.BATCH_SIZE) + 1}: ${progress}/${storesToCreate.length} created`);
    }
  } else {
    console.log('ℹ️  All stores already exist (idempotent run)');
  }

  // =============== STEP 5: SUMMARY ===============
  const finalStoreCount = existingStores.length + storesToCreate.length;
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log(`\n✨ SUCCESS!`);
  console.log(`📊 Final Summary:`);
  console.log(`   Restaurant: ${restaurant.name} (ID: ${restaurant.restaurantId})`);
  console.log(`   Total Stores: ${finalStoreCount}/${CONFIG.TOTAL_STORES}`);
  console.log(`   New Stores Created: ${storesToCreate.length}`);
  console.log(`   AI Agents Enabled: ${Math.floor(finalStoreCount * 0.8)} (${80}%)`);
  console.log(`   Execution Time: ${duration}s`);
  console.log(`\n🔗 View stores: http://localhost:3000/stores?restaurantId=${restaurant.restaurantId}`);
  console.log(`💡 Tip: Filter by "Bulk Test Restaurant" in UI`);
}

// =============== EXECUTION & ERROR HANDLING ===============
seedBulkStores()
  .then(() => {
    console.log('\n✅ Bulk seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ FATAL ERROR during bulk seeding:');
    console.error(`   Message: ${error.message}`);
    if (error.code) console.error(`   Prisma Code: ${error.code}`);
    if (error.meta) console.error(`   Meta: ${JSON.stringify(error.meta, null, 2)}`);
    process.exit(1); // Critical for CI/CD failure detection
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  });
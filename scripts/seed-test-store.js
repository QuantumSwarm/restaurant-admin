// scripts/seed-test-store.js
// Create test restaurant, location, and store

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seedTestStore() {
  try {
    console.log("🌱 Seeding test data...\n");

    // Get the Super Admin
    const admin = await prisma.admin.findUnique({
      where: { email: "admin@test.com" },
    });

    if (!admin) {
      console.error(
        "❌ Super Admin not found. Please run create-test-admin.js first.",
      );
      return;
    }

    // Create or get location
    let location = await prisma.location.findFirst({
      where: { name: "Downtown Toronto" },
    });

    if (!location) {
      location = await prisma.location.create({
        data: {
          name: "Downtown Toronto",
          isActive: true,
        },
      });
      console.log("✅ Location created: Downtown Toronto");
    } else {
      console.log("ℹ️  Location already exists: Downtown Toronto");
    }

    // Create or get restaurant
    let restaurant = await prisma.restaurant.findFirst({
      where: {
        name: "Joe's Pizza",
        adminId: admin.adminId,
      },
    });

    if (!restaurant) {
      restaurant = await prisma.restaurant.create({
        data: {
          adminId: admin.adminId,
          name: "Joe's Pizza",
          isActive: true,
        },
      });
      console.log("✅ Restaurant created: Joe's Pizza");
    } else {
      console.log("ℹ️  Restaurant already exists: Joe's Pizza");
    }

    // Create store
    const existingStore = await prisma.store.findFirst({
      where: {
        restaurantId: restaurant.restaurantId,
        locationId: location.locationId,
      },
    });

    if (!existingStore) {
      const store = await prisma.store.create({
        data: {
          restaurantId: restaurant.restaurantId,
          locationId: location.locationId,
          address: "123 Main Street, Toronto, ON M5V 1A1",
          phonePrimary: "+1 (416) 555-0100",
          phoneSecondary: "+1 (416) 555-0101",
          isAiAgentEnabled: true,
          timeZone: "America/Toronto",
          isActive: true,
        },
      });
      console.log("✅ Store created: 123 Main Street");
      console.log("\n📊 Summary:");
      console.log("   Restaurant:", restaurant.name);
      console.log("   Location:", location.name);
      console.log("   Address:", store.address);
      console.log("   Phone:", store.phonePrimary);
      console.log(
        "   AI Agent:",
        store.isAiAgentEnabled ? "Enabled" : "Disabled",
      );
    } else {
      console.log("ℹ️  Store already exists at this location");
    }

    // Create sample orders for testing analytics
    console.log("\n📦 Creating sample orders...");

    // First, ensure we have a customer
    let customer = await prisma.customer.findFirst({
      where: { phoneNumberProvided: "+1234567890" },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          phoneNumberProvided: "+1234567890",
          name: "Test Customer",
          sessionToken: require("crypto").randomUUID(),
          preferredContactMethod: "call",
          isActive: true,
        },
      });
      console.log("✅ Customer created: Test Customer");
    }

    // Get or create order type
    let orderType = await prisma.orderType.findFirst({
      where: { name: "Dine-in" },
    });

    if (!orderType) {
      orderType = await prisma.orderType.create({
        data: {
          name: "Dine-in",
          description: "Order for dine-in",
        },
      });
    }

    // Create sample orders within the date range
    const ordersToCreate = [
      {
        storeId: existingStore?.storeId || store.storeId,
        customerId: customer.customerId,
        orderTypeId: orderType.orderTypeId,
        totalPrice: 25.5,
        notes: "No onions",
        isCancel: false,
      },
      {
        storeId: existingStore?.storeId || store.storeId,
        customerId: customer.customerId,
        orderTypeId: orderType.orderTypeId,
        totalPrice: 35.75,
        notes: "Extra cheese",
        isCancel: false,
      },
      {
        storeId: existingStore?.storeId || store.storeId,
        customerId: customer.customerId,
        orderTypeId: orderType.orderTypeId,
        totalPrice: 42.0,
        notes: "Delivery",
        isCancel: false,
      },
    ];

    for (const orderData of ordersToCreate) {
      const existingOrder = await prisma.order.findFirst({
        where: {
          storeId: orderData.storeId,
          customerId: orderData.customerId,
          totalPrice: orderData.totalPrice,
        },
      });

      if (!existingOrder) {
        await prisma.order.create({
          data: orderData,
        });
      }
    }
    console.log("✅ Sample orders created");

    console.log("\n✨ Seeding complete!");
    console.log("🔗 Visit: http://localhost:3000/stores");
    console.log("📊 Visit: http://localhost:3000/analytics");
  } catch (error) {
    console.error("❌ Seeding error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestStore();

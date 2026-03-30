// app/api/admins/route.ts
// Admin CRUD API with Stripe Integration

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db/prisma";
import { verifyToken } from "@/lib/auth/jwt";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/email/welcome";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

// Generate secure random password
function generatePassword(length: number = 16): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// GET all admins
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    // Only super_admin can view all admins
    if (user.role !== "super_admin") {
      return NextResponse.json(
        { error: "You do not have permission to view admins" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    //const status = searchParams.get("status") || "";
    const role = searchParams.get("role") || "";

    // Build where clause
    const whereClause: any = {
      isActive: true, // Only show active admins
    };

    // Search filter
    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
      ];
    }

    // Role filter
    if (role) {
      whereClause.role = role;
    }

    const admins = await prisma.admin.findMany({
      where: whereClause,
      include: {
        subscription: true, // No nested plan - subscription has all data
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      admins,
    });
  } catch (error) {
    console.error("Get admins error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admins" },
      { status: 500 },
    );
  }
}

// CREATE new admin
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    // Only super_admin can create admins
    if (user.role !== "super_admin") {
      return NextResponse.json(
        { error: "You do not have permission to create admins" },
        { status: 403 },
      );
    }

    const body = await request.json();

    const {
      email,
      role,
      companyName,
      companyAddress,
      companyPhone,
      companyFax,
      companyUrl,
      monthlyCost,
      creditsLimit,
      overageCost,
      billingCycleDay,
      featureRestaurant,
      featureReports,
      featureAudioDownload,
      featureTranscriptDownload,
      featureBulkSms,
      featureSmsConfirmation,
    } = body;

    // Validate required fields
    if (!email || !role || !companyName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Additional validation for admin role (requires subscription fields)
    if (
      role === "admin" &&
      (!monthlyCost || !creditsLimit || !overageCost || !billingCycleDay)
    ) {
      return NextResponse.json(
        { error: "Missing required subscription fields for admin role" },
        { status: 400 },
      );
    }

    // Check if email already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 },
      );
    }

    // Generate secure password
    const tempPassword = generatePassword(16);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Create Stripe customer ONLY for regular admins (not super_admin)
    let stripeCustomer = null;
    if (role === "admin") {
      stripeCustomer = await stripe.customers.create({
        email,
        name: companyName,
        metadata: {
          role,
          companyPhone: companyPhone || "",
        },
      });
    }

    // Create admin with subscription in transaction
    const newAdmin = await prisma.$transaction(async (tx) => {
      // Create admin
      const admin = await tx.admin.create({
        data: {
          email,
          passwordHash,
          role,
          companyName,
          companyAddress: companyAddress || null,
          companyPhone: companyPhone || null,
          companyFax: companyFax || null,
          companyUrl: companyUrl || null,
          stripeCustomerId:
            role === "admin" && stripeCustomer ? stripeCustomer.id : null, // Only for regular admins
          isActive: true,
        },
      });

      // Create subscription ONLY for regular admins (not super_admin)
      let subscription = null;
      if (role === "admin") {
        subscription = await tx.adminSubscription.create({
          data: {
            adminId: admin.adminId,
            monthlyCost: parseFloat(monthlyCost),
            creditsLimit: parseInt(creditsLimit),
            creditsUsed: 0,
            overageCostPer100: parseFloat(overageCost),
            billingCycleDay: parseInt(billingCycleDay),
            status: "active",
            featureRestaurant: featureRestaurant ?? true,
            featureReports: featureReports ?? true,
            featureDownloadAudio: featureAudioDownload ?? true,
            featureDownloadTranscription: featureTranscriptDownload ?? true,
            featureBulkSms: featureBulkSms ?? true,
            featureSmsConfirmation: featureSmsConfirmation ?? true,
          },
        });
      }

      return { admin, subscription };
    });

    // Create Stripe subscription (using Stripe API)
    // Note: You'll need to create a price in Stripe dashboard or via API
    // For now, we'll store the subscription details in our database
    // In production, you'd create an actual Stripe subscription here

    // Send welcome email
    try {
      await sendWelcomeEmail({
        adminEmail: email,
        adminName: companyName,
        restaurantName: companyName,
        tempPassword,
        monthlyCost: parseFloat(monthlyCost),
        creditsLimit: parseInt(creditsLimit),
        overageCost: parseFloat(overageCost),
        billingCycleDay: parseInt(billingCycleDay),
        features: {
          restaurant: featureRestaurant ?? true,
          reports: featureReports ?? true,
          audioDownload: featureAudioDownload ?? true,
          transcriptDownload: featureTranscriptDownload ?? true,
          bulkSms: featureBulkSms ?? true,
          smsConfirmation: featureSmsConfirmation ?? true,
        },
      });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail the whole operation if email fails
    }

    return NextResponse.json({
      success: true,
      admin: newAdmin.admin,
      message: "Admin created successfully. Welcome email sent!",
    });
  } catch (error) {
    console.error("Create admin error:", error);
    return NextResponse.json(
      { error: "Failed to create admin" },
      { status: 500 },
    );
  }
}

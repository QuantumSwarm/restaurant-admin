// app/api/admins/[id]/route.ts
// Edit and Delete Admin endpoints

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyToken } from "@/lib/auth/jwt";
import {
  sendAdminUpdateEmail,
  sendAdminDeleteEmail,
} from "@/lib/email/admin-notifications";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

// GET single admin
//export async function GET(
//  request: NextRequest,
//  { params }: { params: { id: string } }
//)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    // Only super_admin can view admin details
    if (user.role !== "super_admin") {
      return NextResponse.json(
        { error: "You do not have permission to view admin details" },
        { status: 403 },
      );
    }

    // const adminId = parseInt(params.id);
    const { id } = await params; //
    const adminId = parseInt(id);

    const admin = await prisma.admin.findUnique({
      where: { adminId },
      include: {
        subscription: true,
      },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      admin,
    });
  } catch (error) {
    console.error("Get admin error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin" },
      { status: 500 },
    );
  }
}

// UPDATE admin
export async function PUT(
  request: NextRequest,
  //{ params }: { params: { id: string } }
  { params }: { params: Promise<{ id: string }> },
) {
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

    // Only super_admin can update admins
    if (user.role !== "super_admin") {
      return NextResponse.json(
        { error: "You do not have permission to update admins" },
        { status: 403 },
      );
    }

    // const adminId = parseInt(params.id);
    const { id } = await params; // ← AWAIT HERE
    const adminId = parseInt(id);
    const body = await request.json();

    const {
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

    // Check if admin exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { adminId },
      include: {
        subscription: true,
      },
    });

    if (!existingAdmin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Update admin and subscription in transaction
    const updatedAdmin = await prisma.$transaction(async (tx) => {
      // Update admin details
      const admin = await tx.admin.update({
        where: { adminId },
        data: {
          role: role || existingAdmin.role,
          companyName: companyName || existingAdmin.companyName,
          companyAddress:
            companyAddress !== undefined
              ? companyAddress
              : existingAdmin.companyAddress,
          companyPhone:
            companyPhone !== undefined
              ? companyPhone
              : existingAdmin.companyPhone,
          companyFax:
            companyFax !== undefined ? companyFax : existingAdmin.companyFax,
          companyUrl:
            companyUrl !== undefined ? companyUrl : existingAdmin.companyUrl,
        },
      });

      // Handle subscription based on role
      let subscription = null;

      if (role === "super_admin" && existingAdmin.subscription) {
        // Role changed to super_admin - delete subscription
        await tx.adminSubscription.delete({
          where: { adminId },
        });

        // Cancel Stripe subscription if exists
        if (existingAdmin.subscription.stripeSubscriptionId) {
          try {
            await stripe.subscriptions.cancel(
              existingAdmin.subscription.stripeSubscriptionId,
            );
          } catch (stripeError) {
            console.error("Failed to cancel Stripe subscription:", stripeError);
          }
        }
      } else if (role === "admin" && !existingAdmin.subscription) {
        // Role changed to admin - create subscription
        subscription = await tx.adminSubscription.create({
          data: {
            adminId,
            monthlyCost: parseFloat(monthlyCost) || 49.99,
            creditsLimit: parseInt(creditsLimit) || 1000,
            creditsUsed: 0,
            overageCostPer100: parseFloat(overageCost) || 5.0,
            billingCycleDay: parseInt(billingCycleDay) || 1,
            status: "active",
            featureRestaurant: featureRestaurant ?? true,
            featureReports: featureReports ?? true,
            featureDownloadAudio: featureAudioDownload ?? true,
            featureDownloadTranscription: featureTranscriptDownload ?? true,
            featureBulkSms: featureBulkSms ?? true,
            featureSmsConfirmation: featureSmsConfirmation ?? true,
          },
        });

        // Create Stripe customer if needed
        if (!admin.stripeCustomerId) {
          try {
            const stripeCustomer = await stripe.customers.create({
              email: admin.email,
              name: admin.companyName || "",
            });
            await tx.admin.update({
              where: { adminId },
              data: { stripeCustomerId: stripeCustomer.id },
            });
          } catch (stripeError) {
            console.error("Failed to create Stripe customer:", stripeError);
          }
        }
      } else if (role === "admin" && existingAdmin.subscription) {
        // Update existing subscription
        subscription = await tx.adminSubscription.update({
          where: { adminId },
          data: {
            monthlyCost:
              monthlyCost !== undefined
                ? parseFloat(monthlyCost)
                : existingAdmin.subscription.monthlyCost,
            creditsLimit:
              creditsLimit !== undefined
                ? parseInt(creditsLimit)
                : existingAdmin.subscription.creditsLimit,
            overageCostPer100:
              overageCost !== undefined
                ? parseFloat(overageCost)
                : existingAdmin.subscription.overageCostPer100,
            billingCycleDay:
              billingCycleDay !== undefined
                ? parseInt(billingCycleDay)
                : existingAdmin.subscription.billingCycleDay,
            featureRestaurant:
              featureRestaurant !== undefined
                ? featureRestaurant
                : existingAdmin.subscription.featureRestaurant,
            featureReports:
              featureReports !== undefined
                ? featureReports
                : existingAdmin.subscription.featureReports,
            featureDownloadAudio:
              featureAudioDownload !== undefined
                ? featureAudioDownload
                : existingAdmin.subscription.featureDownloadAudio,
            featureDownloadTranscription:
              featureTranscriptDownload !== undefined
                ? featureTranscriptDownload
                : existingAdmin.subscription.featureDownloadTranscription,
            featureBulkSms:
              featureBulkSms !== undefined
                ? featureBulkSms
                : existingAdmin.subscription.featureBulkSms,
            featureSmsConfirmation:
              featureSmsConfirmation !== undefined
                ? featureSmsConfirmation
                : existingAdmin.subscription.featureSmsConfirmation,
          },
        });
      }

      return { admin, subscription };
    });

    // Send update notification email
    try {
      await sendAdminUpdateEmail({
        adminEmail: updatedAdmin.admin.email,
        adminName: updatedAdmin.admin.companyName || "Admin",
        changes: {
          role: role !== existingAdmin.role,
          subscription: !!updatedAdmin.subscription,
        },
      });
    } catch (emailError) {
      console.error("Failed to send update email:", emailError);
    }

    return NextResponse.json({
      success: true,
      admin: updatedAdmin.admin,
      message: "Admin updated successfully. Notification email sent!",
    });
  } catch (error) {
    console.error("Update admin error:", error);
    return NextResponse.json(
      { error: "Failed to update admin" },
      { status: 500 },
    );
  }
}

// DELETE admin (soft delete)
export async function DELETE(
  request: NextRequest,
  // { params }: { params: { id: string } }
  { params }: { params: Promise<{ id: string }> },
) {
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

    // Only super_admin can delete admins
    if (user.role !== "super_admin") {
      return NextResponse.json(
        { error: "You do not have permission to delete admins" },
        { status: 403 },
      );
    }

    //const adminId = parseInt(params.id);
    const { id } = await params; // ← AWAIT HERE
    const adminId = parseInt(id);

    // Prevent deleting yourself
    if (user.adminId === adminId) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 },
      );
    }

    // Check if admin exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { adminId },
      include: {
        subscription: true,
      },
    });

    if (!existingAdmin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    if (!existingAdmin.isActive) {
      return NextResponse.json(
        { error: "Admin is already deleted" },
        { status: 400 },
      );
    }

    // Soft delete admin and cancel subscription
    await prisma.$transaction(async (tx) => {
      // Soft delete admin
      await tx.admin.update({
        where: { adminId },
        data: { isActive: false },
      });

      // Cancel subscription if exists
      if (existingAdmin.subscription) {
        await tx.adminSubscription.update({
          where: { adminId },
          data: {
            status: "canceled",
            canceledAt: new Date(),
          },
        });

        // Cancel Stripe subscription
        if (existingAdmin.subscription.stripeSubscriptionId) {
          try {
            await stripe.subscriptions.cancel(
              existingAdmin.subscription.stripeSubscriptionId,
            );
          } catch (stripeError) {
            console.error("Failed to cancel Stripe subscription:", stripeError);
          }
        }
      }
    });

    // Send deletion notification email
    try {
      await sendAdminDeleteEmail({
        adminEmail: existingAdmin.email,
        adminName: existingAdmin.companyName || "Admin",
      });
    } catch (emailError) {
      console.error("Failed to send deletion email:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Admin deleted successfully. Notification email sent!",
    });
  } catch (error) {
    console.error("Delete admin error:", error);
    return NextResponse.json(
      { error: "Failed to delete admin" },
      { status: 500 },
    );
  }
}

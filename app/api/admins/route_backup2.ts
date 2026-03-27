// app/api/admins/route.ts
// List all admins with subscription information
// Access: Super Admin only

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyToken } from "@/lib/auth/jwt";

export async function GET(request: NextRequest) {
  try {
    // ──────────────────────────────────────────────────────────────────────
    // 1. Authentication & Authorization
    // ──────────────────────────────────────────────────────────────────────
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    // Only super admins can list all admins
    if (decoded.role !== "super_admin") {
      return NextResponse.json(
        { error: "Access denied. Super admin privileges required." },
        { status: 403 },
      );
    }

    // ──────────────────────────────────────────────────────────────────────
    // 2. Get Query Parameters
    // ──────────────────────────────────────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const role = searchParams.get("role") || "";

    // ──────────────────────────────────────────────────────────────────────
    // 3. Build Query Filters
    // ──────────────────────────────────────────────────────────────────────

    // Search filter (email, company name)
    const searchClause = search.trim()
      ? `AND (
          a.email ILIKE '%${search.trim().replace(/'/g, "''")}%' OR
          a.company_name ILIKE '%${search.trim().replace(/'/g, "''")}%'
        )`
      : "";

    // Status filter
    const statusClause = status
      ? `AND s.status = '${status.replace(/'/g, "''")}'`
      : "";

    // Role filter
    const roleClause = role ? `AND a.role = '${role.replace(/'/g, "''")}'` : "";

    // ──────────────────────────────────────────────────────────────────────
    // 4. Fetch Admins with Subscription Data
    // ──────────────────────────────────────────────────────────────────────
    const admins = await prisma.$queryRawUnsafe<any[]>(`
SELECT
  a.admin_id,
  a.email,
  a.role,
  a.company_name,
  a.company_phone,
  a.company_url,
  a.stripe_customer_id,
  a.is_active,  -- FIXED: Changed from is_deleted to is_active
  a.created_at,
  a.updated_at,
  -- Subscription details
  s.subscription_id,
  s.stripe_subscription_id,
  s.monthly_cost,
  s.credits_limit,
  s.credits_used,
  s.overage_cost_per_100,
  s.billing_cycle_day,
  s.status as subscription_status,
  s.current_period_start,
  s.current_period_end,
  s.next_billing_date,
  -- Feature flags
  s.feature_restaurant,
  s.feature_reports,
  s.feature_download_audio,
  s.feature_download_transcription,
  s.feature_bulk_sms,
  s.feature_sms_confirmation,
  -- Subscription dates
  s.created_at as subscription_created_at,
  s.canceled_at
FROM admin a
LEFT JOIN admin_subscriptions s ON a.admin_id = s.admin_id
      WHERE a.is_active = true
      ${searchClause}
      ${statusClause}
      ${roleClause}
      ORDER BY a.created_at DESC
      LIMIT 100
    `);

    // ──────────────────────────────────────────────────────────────────────
    // 5. Format Response
    // ──────────────────────────────────────────────────────────────────────
    const formattedAdmins = admins.map((admin: any) => ({
      adminId: admin.admin_id,
      email: admin.email,
      role: admin.role,
      companyName: admin.company_name,
      companyPhone: admin.company_phone,
      companyUrl: admin.company_url,
      stripeCustomerId: admin.stripe_customer_id,
      createdAt: admin.created_at,
      updatedAt: admin.updated_at,

      // Subscription info (null if no subscription)
      subscription: admin.subscription_id
        ? {
            subscriptionId: admin.subscription_id,
            stripeSubscriptionId: admin.stripe_subscription_id,
            status: admin.subscription_status,

            // Pricing
            monthlyCost: admin.monthly_cost
              ? parseFloat(admin.monthly_cost)
              : null,
            creditsLimit: admin.credits_limit,
            creditsUsed: admin.credits_used,
            creditsRemaining: admin.credits_limit - admin.credits_used,
            overageCostPer100: admin.overage_cost_per_100
              ? parseFloat(admin.overage_cost_per_100)
              : null,

            // Billing
            billingCycleDay: admin.billing_cycle_day,
            currentPeriodStart: admin.current_period_start,
            currentPeriodEnd: admin.current_period_end,
            nextBillingDate: admin.next_billing_date,

            // Features
            features: {
              restaurant: admin.feature_restaurant,
              reports: admin.feature_reports,
              downloadAudio: admin.feature_download_audio,
              downloadTranscription: admin.feature_download_transcription,
              bulkSms: admin.feature_bulk_sms,
              smsConfirmation: admin.feature_sms_confirmation,
            },

            // Dates
            createdAt: admin.subscription_created_at,
            canceledAt: admin.canceled_at,
          }
        : null,
    }));

    // ──────────────────────────────────────────────────────────────────────
    // 6. Return Response
    // ──────────────────────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      admins: formattedAdmins,
      count: formattedAdmins.length,
      filters: {
        search: search || null,
        status: status || null,
        role: role || null,
      },
    });
  } catch (error) {
    console.error("[List Admins] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admins" },
      { status: 500 },
    );
  }
}

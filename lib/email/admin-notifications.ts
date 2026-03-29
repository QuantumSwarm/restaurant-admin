// lib/email/admin-notifications.ts
// Email notifications for admin updates and deletions

import nodemailer from "nodemailer";

interface AdminUpdateEmailParams {
  adminEmail: string;
  adminName: string;
  changes: {
    role?: boolean;
    subscription?: boolean;
  };
}

interface AdminDeleteEmailParams {
  adminEmail: string;
  adminName: string;
}

// Configure email transporter (reusable)
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.zoho.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

// Send admin update notification
export async function sendAdminUpdateEmail(params: AdminUpdateEmailParams) {
  const { adminEmail, adminName, changes } = params;

  const transporter = createTransporter();
  const platformName = process.env.APP_NAME || "Quantum Swarm";
  //const platformWebsite = process.env.APP_URL || "https://quantum-swarm.com";
  const supportEmail = process.env.SUPPORT_EMAIL || "support@quantum-swarm.com";

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
    .footer { text-align: center; padding: 20px; background: #f8f9fa; font-size: 14px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Account Update Notice</h1>
    </div>
    <div class="content">
      <p>Hi ${adminName},</p>
      <p>Your ${platformName} admin account has been updated by a system administrator.</p>
      
      ${
        changes.role
          ? "<p><strong>• Your role has been changed</strong></p>"
          : ""
      }
      ${
        changes.subscription
          ? "<p><strong>• Your subscription settings have been updated</strong></p>"
          : ""
      }
      
      <p>If you have any questions about these changes, please contact support.</p>
      <p style="margin-top: 30px;">
        <strong>Best regards,</strong><br>
        The ${platformName} Team<br>
        <a href="mailto:${supportEmail}">${supportEmail}</a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${platformName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `
Hi ${adminName},

Your ${platformName} admin account has been updated by a system administrator.

${changes.role ? "• Your role has been changed\n" : ""}
${
  changes.subscription ? "• Your subscription settings have been updated\n" : ""
}

If you have any questions about these changes, please contact support at ${supportEmail}.

Best regards,
The ${platformName} Team
  `;

  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME || platformName}" <${
      process.env.SMTP_FROM_EMAIL
    }>`,
    to: adminEmail,
    subject: `🔔 Your ${platformName} Account Has Been Updated`,
    text: textContent,
    html: htmlContent,
  });
}

// Send admin deletion notification
export async function sendAdminDeleteEmail(params: AdminDeleteEmailParams) {
  const { adminEmail, adminName } = params;

  const transporter = createTransporter();
  const platformName = process.env.APP_NAME || "Quantum Swarm";
  const supportEmail = process.env.SUPPORT_EMAIL || "support@quantum-swarm.com";

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ff4d4f; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
    .footer { text-align: center; padding: 20px; background: #f8f9fa; font-size: 14px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Account Deactivated</h1>
    </div>
    <div class="content">
      <p>Hi ${adminName},</p>
      <p>Your ${platformName} admin account has been deactivated by a system administrator.</p>
      <p><strong>What this means:</strong></p>
      <ul>
        <li>You will no longer have access to the admin dashboard</li>
        <li>Any active subscriptions have been canceled</li>
        <li>Your data has been archived for compliance purposes</li>
      </ul>
      <p>If you believe this is an error or have questions, please contact support immediately.</p>
      <p style="margin-top: 30px;">
        <strong>Best regards,</strong><br>
        The ${platformName} Team<br>
        <a href="mailto:${supportEmail}">${supportEmail}</a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${platformName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `
Hi ${adminName},

Your ${platformName} admin account has been deactivated by a system administrator.

What this means:
- You will no longer have access to the admin dashboard
- Any active subscriptions have been canceled
- Your data has been archived for compliance purposes

If you believe this is an error or have questions, please contact support at ${supportEmail}.

Best regards,
The ${platformName} Team
  `;

  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME || platformName}" <${
      process.env.SMTP_FROM_EMAIL
    }>`,
    to: adminEmail,
    subject: `⚠️ Your ${platformName} Account Has Been Deactivated`,
    text: textContent,
    html: htmlContent,
  });
}

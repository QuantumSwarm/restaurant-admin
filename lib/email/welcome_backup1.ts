// lib/email/welcome.ts
// Welcome Email Template for New Admins

import nodemailer from "nodemailer";

interface WelcomeEmailParams {
  adminEmail: string;
  adminName: string;
  restaurantName: string;
  tempPassword: string;
  monthlyCost: number;
  creditsLimit: number;
  overageCost: number;
  billingCycleDay: number;
  features: {
    restaurant: boolean;
    reports: boolean;
    audioDownload: boolean;
    transcriptDownload: boolean;
    bulkSms: boolean;
    smsConfirmation: boolean;
  };
}

export async function sendWelcomeEmail(params: WelcomeEmailParams) {
  const {
    adminEmail,
    adminName,
    restaurantName,
    tempPassword,
    monthlyCost,
    creditsLimit,
    overageCost,
    billingCycleDay,
    features,
  } = params;

  // Configure email transporter (using SendGrid SMTP)
  const transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    secure: false,
    auth: {
      user: "apikey",
      pass: process.env.SENDGRID_API_KEY,
    },
  });

  const platformName = "Quantum Swarm";
  const platformWebsite = process.env.APP_URL || "https://quantumswarm.com";
  const supportEmail = "support@quantumswarm.com";
  const loginUrl = `${platformWebsite}/login`;

  // Build features list
  const enabledFeatures = [];
  if (features.restaurant) enabledFeatures.push("Restaurant & Menu Management");
  if (features.reports) enabledFeatures.push("Sales Reports & Analytics");
  if (features.audioDownload) enabledFeatures.push("Download Audio Recordings");
  if (features.transcriptDownload)
    enabledFeatures.push("Download Transcriptions");
  if (features.bulkSms) enabledFeatures.push("Bulk SMS Campaigns");
  if (features.smsConfirmation) enabledFeatures.push("SMS Order Confirmations");

  const featuresHtml = enabledFeatures
    .map((f) => `<li style="margin-bottom: 8px;">${f}</li>`)
    .join("");

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 30px 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .header p {
      margin: 5px 0 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      background: white;
      padding: 40px 30px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .welcome-section {
      margin-bottom: 30px;
    }
    .welcome-section h2 {
      color: #667eea;
      font-size: 22px;
      margin-bottom: 15px;
    }
    .features-list {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .features-list ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .next-steps {
      background: #fff9e6;
      border-left: 4px solid #ffc107;
      padding: 20px;
      margin: 30px 0;
    }
    .next-steps h3 {
      margin-top: 0;
      color: #f57c00;
    }
    .next-steps ol {
      margin: 15px 0;
      padding-left: 20px;
    }
    .next-steps li {
      margin-bottom: 15px;
    }
    .credentials {
      background: #e3f2fd;
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
      font-family: 'Courier New', monospace;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: #667eea;
      color: white !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .subscription-details {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
    }
    .footer {
      text-align: center;
      padding: 30px;
      background: #f8f9fa;
      border-radius: 0 0 8px 8px;
      font-size: 14px;
      color: #666;
    }
    .footer p {
      margin: 5px 0;
    }
    .ps-note {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      font-style: italic;
      color: #666;
    }
  </style>
</head>
<body>
  <!-- Header / Branding -->
  <div class="header">
    <h1>🚀 ${platformName}</h1>
    <p>Smart Restaurant Management</p>
  </div>

  <div class="content">
    <!-- Greeting -->
    <div class="greeting">
      Hi ${adminName},
    </div>

    <!-- Main Welcome Section -->
    <div class="welcome-section">
      <h2>Welcome to the ${platformName} admin portal! 🎉</h2>
      <p>
        We're excited to have <strong>${restaurantName}</strong> on board. Your account has been successfully 
        created as the administrator, and everything is set up and ready for you.
      </p>
      <p>
        With ${platformName}, you can now manage your restaurant efficiently from one place:
      </p>
      <div class="features-list">
        <strong>Your Enabled Features:</strong>
        <ul>
          ${featuresHtml}
        </ul>
      </div>
    </div>

    <!-- Subscription Details -->
    <div class="subscription-details">
      <strong>📋 Your Subscription Plan:</strong>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Monthly Cost: <strong>$${monthlyCost.toFixed(2)}</strong></li>
        <li>Credits Included: <strong>${creditsLimit.toLocaleString()}</strong> credits/month</li>
        <li>Overage Rate: <strong>$${overageCost.toFixed(
          2,
        )}</strong> per 100 credits</li>
        <li>Billing Date: <strong>Day ${billingCycleDay}</strong> of each month</li>
      </ul>
    </div>

    <!-- Next Steps -->
    <div class="next-steps">
      <h3>🚀 Next Steps – Get Started in Under 2 Minutes</h3>
      <ol>
        <li>
          <strong>Log in now</strong><br>
          <div class="credentials">
            Username: ${adminEmail}<br>
            Temporary Password: ${tempPassword}
          </div>
          <a href="${loginUrl}" class="button">Login to Your Dashboard</a><br>
          <small style="color: #666;">You'll be asked to change your password on first login</small>
        </li>
        <li>
          <strong>Complete your restaurant profile</strong> (highly recommended first step)<br>
          Add address, hours, and menu items. This usually takes just 5–10 minutes and unlocks the full power of the platform.
        </li>
        <li>
          <strong>Invite your team</strong> (managers, hosts, kitchen staff)<br>
          Give them the right permissions so everyone can access what they need without cluttering your inbox.
        </li>
      </ol>
    </div>

    <p>
      We're here to make running <strong>${restaurantName}</strong> easier, more profitable, and less stressful — 
      so don't hesitate to reach out if anything feels unclear.
    </p>

    <p style="margin-top: 30px;">
      Looking forward to seeing your restaurant thrive!
    </p>

    <p style="margin-top: 20px;">
      <strong>Best regards,</strong><br>
      The ${platformName} Team<br>
      <a href="${platformWebsite}">${platformWebsite}</a> | <a href="mailto:${supportEmail}">${supportEmail}</a>
    </p>

    <!-- P.S. Note -->
    <div class="ps-note">
      <strong>P.S.</strong> Many restaurants see their first noticeable efficiency boost within the first week. 
      You're already on your way!
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>© ${new Date().getFullYear()} ${platformName}. All rights reserved.</p>
    <p>
      Need help? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a>
    </p>
  </div>
</body>
</html>
  `;

  const textContent = `
Hi ${adminName},

Welcome to the ${platformName} admin portal! 🎉

We're excited to have ${restaurantName} on board. Your account has been successfully created as the administrator, and everything is set up and ready for you.

With ${platformName}, you can now manage your restaurant efficiently from one place.

YOUR ENABLED FEATURES:
${enabledFeatures.map((f) => `- ${f}`).join("\n")}

YOUR SUBSCRIPTION PLAN:
- Monthly Cost: $${monthlyCost.toFixed(2)}
- Credits Included: ${creditsLimit.toLocaleString()} credits/month
- Overage Rate: $${overageCost.toFixed(2)} per 100 credits
- Billing Date: Day ${billingCycleDay} of each month

NEXT STEPS – GET STARTED IN UNDER 2 MINUTES:

1. Log in now
   Username: ${adminEmail}
   Temporary Password: ${tempPassword}
   Login URL: ${loginUrl}
   (You'll be asked to change your password on first login)

2. Complete your restaurant profile (highly recommended first step)
   Add address, hours, and menu items. This usually takes just 5–10 minutes.

3. Invite your team (managers, hosts, kitchen staff)
   Give them the right permissions so everyone can access what they need.

We're here to make running ${restaurantName} easier, more profitable, and less stressful — so don't hesitate to reach out if anything feels unclear.

Looking forward to seeing your restaurant thrive!

Best regards,
The ${platformName} Team
${platformWebsite} | ${supportEmail}

P.S. Many restaurants see their first noticeable efficiency boost within the first week. You're already on your way!

---
© ${new Date().getFullYear()} ${platformName}. All rights reserved.
Need help? Contact us at ${supportEmail}
  `;

  // Send email
  await transporter.sendMail({
    from: `"${platformName}" <${process.env.SENDGRID_FROM_EMAIL}>`,
    to: adminEmail,
    subject: `🎉 Welcome to ${platformName} – Your Account is Ready!`,
    text: textContent,
    html: htmlContent,
  });
}

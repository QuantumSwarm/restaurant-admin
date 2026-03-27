// test-email.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: "support@quantum-swarm.com",
    pass: "V2323!2sxx()",
  },
  tls: {
    // Don't fail on invalid certificates (for development)
    rejectUnauthorized: false,
  },
  debug: true, // Enable debug output
  logger: true, // Log to console
});

console.log("📧 Attempting to send test email...");

transporter
  .sendMail({
    from: '"Quantum Swarm" <support@quantum-swarm.com>',
    to: "support@quantum-swarm.com", // Send to yourself for testing
    subject: "✅ Test Email from Restaurant Admin",
    text: "If you receive this, SMTP is working correctly!",
    html: "<h1>✅ Success!</h1><p>If you receive this, SMTP is working correctly!</p>",
  })
  .then((info) => {
    console.log("✅ Email sent successfully!");
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);
  })
  .catch((err) => {
    console.error("❌ Error sending email:", err);
  });

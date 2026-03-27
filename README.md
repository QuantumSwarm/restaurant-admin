# 🍽️ Restaurant Admin Panel

A comprehensive admin panel for managing restaurant ordering systems with AI voice agents, built with Next.js, Refine.dev, and Ant Design.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Use Cases](#use-cases)
- [Development](#development)

## ✨ Features

- 🔐 **Authentication & Authorization**

  - Email/Password login with OTP verification
  - Role-based access control (Admin, Super Admin)
  - Password reset functionality

- 🏪 **Store Management**

  - Create, read, update, delete stores
  - Multi-location support
  - Store hours management
  - AI agent integration

- 📋 **Menu Management**

  - Menu template system
  - Item assignments to stores
  - Price overrides per store
  - Category organization

- 👥 **Admin Management**

  - User account management
  - Subscription integration with Stripe
  - Feature toggle controls
  - Credit tracking

- 📊 **Analytics & Reporting**

  - Order statistics
  - Revenue tracking
  - AI performance metrics
  - Custom date ranges

- 📱 **Bulk SMS Marketing**

  - Campaign management
  - Customer segmentation
  - Twilio integration

- 🎙️ **Audio & Transcription Downloads**
  - Download conversation recordings
  - Access transcriptions
  - Date-based filtering

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Admin Framework**: [Refine.dev](https://refine.dev/)
- **UI Library**: [Ant Design](https://ant.design/)
- **Database**: PostgreSQL
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Payment**: [Stripe](https://stripe.com/)
- **SMS**: [Twilio](https://www.twilio.com/)
- **Email**: [SendGrid](https://sendgrid.com/)
- **Language**: TypeScript

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** >= 14.0
- **Git**

## 🚀 Installation

### Step 1: Clone or Setup Project

If using the setup script:

```bash
# Run the setup-project.bat file (Windows)
setup-project.bat

# Navigate to project directory
cd restaurant-admin
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Setup Database

1. Create a PostgreSQL database:

```sql
CREATE DATABASE restaurant_db;
```

2. Run the database schema:

```bash
psql -U your_username -d restaurant_db -f create.sql
```

3. Generate Prisma Client:

```bash
npm run prisma:generate
```

## ⚙️ Configuration

### Step 1: Environment Variables

1. Copy the example environment file:

```bash
copy .env.example .env
```

2. Update `.env` with your actual values:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/restaurant_db"

# NextAuth
NEXTAUTH_SECRET="your-generated-secret"

# SendGrid
SENDGRID_API_KEY="your-sendgrid-key"

# Stripe (Test Mode)
STRIPE_SECRET_KEY="sk_test_..."

# Twilio
TWILIO_ACCOUNT_SID="your-sid"
TWILIO_AUTH_TOKEN="your-token"
```

### Step 2: Generate Secrets

Generate secure secrets for production:

```bash
# Generate NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

### Prisma Studio (Database GUI)

```bash
npm run prisma:studio
```

## 📁 Project Structure

```
restaurant-admin/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/
│   │   ├── verify-otp/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── dashboard/            # Home dashboard
│   │   ├── stores/               # Store management
│   │   ├── menus/                # Menu management
│   │   ├── admins/               # Admin management
│   │   ├── analytics/            # Analytics & reports
│   │   ├── marketing/            # SMS campaigns
│   │   ├── recordings/           # Audio/transcriptions
│   │   └── profile/              # User profile
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── stores/               # Store CRUD
│   │   ├── menus/                # Menu CRUD
│   │   └── ...
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── layout/                   # Layout components
│   ├── auth/                     # Auth-related components
│   ├── stores/                   # Store components
│   ├── menus/                    # Menu components
│   ├── admins/                   # Admin components
│   ├── analytics/                # Chart/analytics components
│   └── common/                   # Shared components
├── lib/                          # Utility libraries
│   ├── auth/                     # Auth utilities
│   ├── db/                       # Database utilities
│   ├── email/                    # Email utilities
│   └── sms/                      # SMS utilities
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript definitions
├── prisma/                       # Prisma ORM
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Migration files
├── public/                       # Static assets
│   ├── images/
│   └── icons/
├── styles/                       # Global styles
├── .env                          # Environment variables
├── .gitignore                    # Git ignore rules
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
└── README.md                     # This file
```

## 📋 Use Cases

The system implements the following use cases:

1. ✅ **Authentication** - Login with OTP
2. ✅ **Authorization** - Role-based access control
3. ✅ **Password Management** - Change/reset passwords
4. ✅ **Store Management** - CRUD operations
5. ✅ **Menu Management** - Template-based menus
6. ✅ **Admin Management** - User accounts with Stripe subscriptions
7. ✅ **Bulk SMS** - Marketing campaigns
8. ✅ **Analytics** - Reporting and insights
9. ✅ **Audio Downloads** - Conversation recordings
10. ✅ **Transcription Downloads** - Text transcripts

## 🔧 Development

### Code Style

This project uses ESLint and Prettier for code formatting:

```bash
npm run lint
```

### Database Migrations

When you modify the Prisma schema:

```bash
npm run prisma:migrate
```

### Adding New Features

1. Create API route in `app/api/`
2. Create page component in `app/(dashboard)/`
3. Create reusable components in `components/`
4. Update types in `types/`

## 🔐 Security Notes

- Never commit `.env` file
- Use strong secrets in production
- Enable HTTPS in production
- Implement rate limiting
- Regularly update dependencies
- Use environment-specific API keys

## 📝 License

This project is private and proprietary.

## 🤝 Support

For support, email support@yourdomain.com

---

**Built with ❤️ using Next.js, Refine.dev, and Ant Design**

## add npm install @tanstack/react-query to .env (did by co-pilot)

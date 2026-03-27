@echo off
REM ===================================================================
REM Restaurant Admin Panel - Installation Guide
REM Follow these steps to set up the project
REM ===================================================================

echo.
echo ========================================
echo Restaurant Admin Panel
echo Installation Guide for Windows
echo ========================================
echo.

echo STEP 1: Prerequisites Check
echo ========================================
echo.
echo Please ensure you have installed:
echo   - Node.js v18 or higher
echo   - PostgreSQL v14 or higher
echo   - Git
echo.

echo Checking Node.js version...
node --version
echo.

echo Checking npm version...
npm --version
echo.

echo Checking PostgreSQL...
psql --version
echo.

echo.
echo STEP 2: Project Setup
echo ========================================
echo.
echo Run the following commands:
echo.
echo 1. Run setup-project.bat to create directory structure
echo 2. Copy all config files to restaurant-admin folder
echo 3. Navigate to restaurant-admin: cd restaurant-admin
echo 4. Install dependencies: npm install
echo.

pause

echo.
echo STEP 3: Database Setup
echo ========================================
echo.
echo 1. Create PostgreSQL database:
echo    psql -U postgres
echo    CREATE DATABASE restaurant_db;
echo    \q
echo.
echo 2. Run the schema:
echo    psql -U postgres -d restaurant_db -f create.sql
echo.
echo 3. Copy Prisma schema to prisma folder:
echo    copy schema.prisma restaurant-admin\prisma\schema.prisma
echo.
echo 4. Generate Prisma Client:
echo    cd restaurant-admin
echo    npx prisma generate
echo.

pause

echo.
echo STEP 4: Environment Configuration
echo ========================================
echo.
echo 1. Copy .env.example to restaurant-admin\.env
echo 2. Edit .env file with your settings:
echo    - DATABASE_URL
echo    - NEXTAUTH_SECRET (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo    - JWT_SECRET (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo    - SENDGRID_API_KEY
echo    - STRIPE_SECRET_KEY
echo    - TWILIO credentials
echo.

pause

echo.
echo STEP 5: VS Code Setup (Optional)
echo ========================================
echo.
echo 1. Create .vscode folder in restaurant-admin:
echo    mkdir restaurant-admin\.vscode
echo.
echo 2. Copy VS Code config files:
echo    copy .vscode-settings.json restaurant-admin\.vscode\settings.json
echo    copy .vscode-extensions.json restaurant-admin\.vscode\extensions.json
echo.
echo 3. Open restaurant-admin folder in VS Code
echo 4. Install recommended extensions when prompted
echo.

pause

echo.
echo STEP 6: Running the Application
echo ========================================
echo.
echo 1. Navigate to project: cd restaurant-admin
echo 2. Start development server: npm run dev
echo 3. Open browser: http://localhost:3000
echo.
echo For production build:
echo   npm run build
echo   npm start
echo.

pause

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next Steps:
echo   1. Review the README.md for detailed documentation
echo   2. Check .env file has all required values
echo   3. Run: npm run dev
echo   4. Access: http://localhost:3000
echo.
echo For help, refer to README.md
echo.

pause

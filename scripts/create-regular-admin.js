// scripts/create-regular-admin.js
// Run this to create a regular admin user for testing

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createRegularAdmin() {
  try {
    // Hash the password
    const password = 'password123';
    const passwordHash = await bcrypt.hash(password, 10);

    // Create regular admin
    const admin = await prisma.admin.create({
      data: {
        email: 'user@test.com',
        passwordHash: passwordHash,
        role: 'admin',
        isActive: true,
      },
    });

    console.log('✅ Regular admin created successfully!');
    console.log('Email:', admin.email);
    console.log('Password: password123');
    console.log('Role:', admin.role);
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  Admin already exists. Updating...');
      
      const password = 'password123';
      const passwordHash = await bcrypt.hash(password, 10);
      
      await prisma.admin.update({
        where: { email: 'user@test.com' },
        data: { passwordHash: passwordHash, role: 'admin', isActive: true },
      });
      
      console.log('✅ Updated!');
      console.log('Email: user@test.com');
      console.log('Password: password123');
      console.log('Role: admin');
    } else {
      console.error('Error:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createRegularAdmin();

// lib/api.ts
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to convert role to Prisma enum
const toPrismaRole = (role: string): UserRole => {
  switch(role.toLowerCase()) {
    case 'client': return UserRole.CLIENT;
    case 'manager': return UserRole.MANAGER;
    default: return UserRole.GUEST;
  }
};

export const createOrUpdateUser = async (data: {
  clerkId: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
}) => {
  // Convert role to Prisma enum
  const prismaRole = toPrismaRole(data.role);
  
  return prisma.user.upsert({
    where: { clerkId: data.clerkId },
    update: {
      email: data.email,
      name: data.name,
      phone: data.phone,
      role: prismaRole
    },
    create: {
      clerkId: data.clerkId,
      email: data.email,
      name: data.name,
      phone: data.phone,
      role: prismaRole
    }
  });
};

export const getUserByClerkId = async (clerkId: string) => {
  return prisma.user.findUnique({
    where: { clerkId }
  });
};

// File: lib/api.ts


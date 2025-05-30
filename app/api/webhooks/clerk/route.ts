// app/api/webhooks/clerk/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const eventType = body.type;
    const user = body.data;

    if (eventType === 'user.created') {
      const { id: clerkId, email_addresses, first_name, last_name, phone_numbers, role } = user;

      const email = email_addresses?.[0]?.email_address || '';
      const phone = phone_numbers?.[0]?.phone_number || null;
      const name = `${first_name ?? ''} ${last_name ?? ''}`.trim();

      // 🔄 Upsert user to ensure no duplicates
      const createdUser = await prisma.user.upsert({
        where: { clerkId },
        update: {},
        create: {
          clerkId,
          email,
          name,
          phone,
          role
        },
      });

      console.log('✅ User created from Clerk:', createdUser.email);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Clerk webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

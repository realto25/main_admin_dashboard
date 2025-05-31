// app/api/users/[clerkId]/profile/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { clerkId: string } }
) {
  try {
    // Get the clerkId from params
    const { clerkId } = params;

    // Get the webhook headers
    const headersList = headers();
    const svix_id = headersList.get('svix-id');
    const svix_timestamp = headersList.get('svix-timestamp');
    const svix_signature = headersList.get('svix-signature');

    // If this is a webhook request, verify the signature
    if (svix_id && svix_timestamp && svix_signature) {
      if (!process.env.CLERK_WEBHOOK_SECRET) {
        return NextResponse.json(
          { error: 'Webhook secret not configured' },
          { status: 500 }
        );
      }

      const payload = await request.json();
      const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
      
      try {
        wh.verify(JSON.stringify(payload), {
          'svix-id': svix_id,
          'svix-timestamp': svix_timestamp,
          'svix-signature': svix_signature,
        });
      } catch (err) {
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 400 }
        );
      }

      // Return the webhook payload data
      return NextResponse.json(payload.data);
    }

    // If this is a regular API request (not a webhook)
    // You might want to fetch the user data from your database instead
    // For example:
    const userData = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        clerkId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error in profile route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: Add a POST handler to update user data
export async function POST(
  request: NextRequest,
  { params }: { params: { clerkId: string } }
) {
  try {
    const { clerkId } = params;
    const data = await request.json();

    // Update user data in your database
    const updatedUser = await prisma.user.update({
      where: { clerkId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
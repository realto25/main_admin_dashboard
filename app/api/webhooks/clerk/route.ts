// app/api/webhooks/clerk/route.ts
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createOrUpdateUser } from '@/lib/api';

// Type for Clerk user data in webhook events
type ClerkUserData = {
  id: string;
  email_addresses: {
    id: string;
    email_address: string;
  }[];
  first_name: string | null;
  last_name: string | null;
  phone_numbers: {
    phone_number: string;
  }[];
  primary_email_address_id: string | null;
  public_metadata: {
    role?: 'guest' | 'client' | 'manager';
  };
};

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const headers = req.headers;
    
    const svixId = headers.get('svix-id');
    const svixTimestamp = headers.get('svix-timestamp');
    const svixSignature = headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response('Missing required headers', { status: 400 });
    }

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
    let evt: WebhookEvent;

    try {
      evt = wh.verify(
        JSON.stringify(payload),
        {
          'svix-id': svixId,
          'svix-timestamp': svixTimestamp,
          'svix-signature': svixSignature,
        }
      ) as WebhookEvent;
    } catch (err) {
      return new Response('Invalid signature', { status: 400 });
    }

    // Only process user events
    if (!evt.type.startsWith('user.')) {
      return NextResponse.json({ message: 'Ignoring non-user event' });
    }

    // Type-safe extraction of user data
    const userData = evt.data as ClerkUserData;
    
    const primaryEmail = userData.primary_email_address_id 
      ? userData.email_addresses.find(
          email => email.id === userData.primary_email_address_id
        )?.email_address
      : userData.email_addresses[0]?.email_address || '';

    const name = [userData.first_name, userData.last_name]
      .filter(Boolean)
      .join(' ')
      .trim() || 'User';

    const phone = userData.phone_numbers[0]?.phone_number || '';
    const role = userData.public_metadata.role || 'guest';

    try {
      await createOrUpdateUser({
        clerkId: userData.id,
        email: primaryEmail,
        name,
        phone,
        role
      });
      return NextResponse.json({ success: true });
    } catch (err) {
      console.error('Webhook database error:', err);
      return NextResponse.json({ error: 'Database operation failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Clerk webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

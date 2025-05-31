// app/api/webhooks/clerk/route.ts
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createOrUpdateUser } from '@/lib/api';

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

    const { id, email_addresses, first_name, last_name, phone_numbers, primary_email_address_id, public_metadata } = evt.data;
    
    const primaryEmail = email_addresses?.find(
      email => email.id === primary_email_address_id
    )?.email_address;

    try {
      await createOrUpdateUser({
        clerkId: id!,
        email: primaryEmail || '',
        name: `${first_name || ''} ${last_name || ''}`.trim() || 'User',
        phone: phone_numbers?.[0]?.phone_number,
        role: (public_metadata?.role as 'guest' | 'client' | 'manager') || 'guest'
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

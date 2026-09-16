import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { execute } from '@/lib/db';

export const dynamic = 'force-dynamic';

const ContactSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  email: z.string().email('Invalid email address').max(150),
  phone: z.string().min(5, 'Phone number is required').max(30),
  course: z.string().optional(),
  message: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, phone, course, message } = parsed.data;

    await execute(
      `INSERT INTO crm_leads (name, email, phone, source, notes, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'new', NOW())`,
      [name, email, phone, course ? `Inquiry for ${course}` : 'Website Contact Form', message ?? null]
    );

    return NextResponse.json({
      success: true,
      message: 'Thank you! Our senior admissions counselor will reach out to you shortly.',
    }, { status: 201 });

  } catch (error) {
    console.error('[/api/contact POST]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit inquiry. Please try again.' },
      { status: 500 }
    );
  }
}

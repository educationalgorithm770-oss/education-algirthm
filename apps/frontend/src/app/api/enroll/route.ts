import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query, execute } from '@/lib/db';
import { signToken, setAuthCookie, getSessionFromRequest } from '@/lib/auth';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

const EnrollSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Valid email address is required'),
  phone: z.string().optional(),
  courseId: z.union([z.number(), z.string().transform((val) => parseInt(val, 10))]).optional(),
  courseTitle: z.string().optional(),
  amount: z.union([z.number(), z.string().transform((val) => parseFloat(val))]).optional(),
  couponCode: z.string().optional(),
});

interface CourseRow extends RowDataPacket {
  id: number;
  title: string;
  price: number;
  slug: string;
}

interface StudentRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Direct enrollment is disabled for security. Please use the official checkout flow at /checkout or /api/enrollment/create-intent.',
      redirectUrl: '/checkout',
    },
    { status: 400 }
  );
}

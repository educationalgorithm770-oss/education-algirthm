import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin authentication required.' }, { status: 403 });
    }

    // 1. Fetch live coupons
    const coupons = await query<RowDataPacket[]>(
      `SELECT id, code, discount_type, discount_value, max_uses, times_used, expires_at, is_active, created_at 
       FROM coupons 
       ORDER BY id DESC`
    );

    // 2. Fetch live transactions from enrollments & orders
    const transactions = await query<RowDataPacket[]>(
      `SELECT e.id, e.name AS student_name, e.email, e.course AS course_title, e.amount, 
              e.payment_status, e.status, e.razorpay_payment_id, e.created_at
       FROM enrollments e
       WHERE e.amount > 0
       ORDER BY e.id DESC
       LIMIT 50`
    );

    // 3. Compute revenue totals
    const revSummary = await query<RowDataPacket[]>(
      `SELECT 
         COALESCE(SUM(amount), 0) as gross_revenue,
         COUNT(id) as total_transactions,
         COALESCE(SUM(CASE WHEN payment_status = 'paid' OR payment_status = 'completed' THEN amount ELSE 0 END), 0) as net_collected
       FROM enrollments`
    );

    const gross = Number(revSummary[0]?.gross_revenue || 0);
    const net = Number(revSummary[0]?.net_collected || 0);
    const gstCollected = Math.round(net * 0.18);

    return NextResponse.json({
      success: true,
      data: {
        coupons: coupons.map((c) => ({
          id: String(c.id),
          code: c.code,
          type: c.discount_type === 'percentage' || c.discount_type === 'percent' ? 'percentage' : 'flat',
          value: Number(c.discount_value),
          maxUses: Number(c.max_uses),
          usedCount: Number(c.times_used || 0),
          expiresAt: c.expires_at ? new Date(c.expires_at).toISOString().split('T')[0] : '2026-12-31',
          isActive: Boolean(c.is_active),
        })),
        transactions: transactions.map((t) => ({
          id: `TXN-${t.id}`,
          student: t.student_name || t.email || 'Student',
          course: t.course_title || 'Enrolled Course',
          amount: `₹${Number(t.amount).toLocaleString('en-IN')}`,
          gst: `₹${Math.round(Number(t.amount) * 0.18).toLocaleString('en-IN')}`,
          date: new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          status: t.payment_status === 'paid' || t.status === 'active' ? 'Captured' : 'Pending',
          method: t.razorpay_payment_id ? 'Razorpay' : 'Direct / UPI',
        })),
        metrics: {
          grossRevenue: gross,
          netRevenue: net,
          gstCollected,
          totalTransactions: Number(revSummary[0]?.total_transactions || 0),
        },
      },
    });
  } catch (error: any) {
    console.error('API /api/admin/finance GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin authentication required.' }, { status: 403 });
    }

    const body = await req.json();
    const { code, type, value, maxUses, expiresAt } = body;

    if (!code || !value) {
      return NextResponse.json({ success: false, error: 'Code and discount value are required.' }, { status: 400 });
    }

    const cleanCode = String(code).trim().toUpperCase();
    const discountType = type === 'percentage' ? 'percentage' : 'fixed';
    const discountVal = Number(value);
    const maxUseCount = Number(maxUses) || 100;
    const expiry = expiresAt || null;

    const result = await execute(
      `INSERT INTO coupons (code, discount_type, discount_value, max_uses, times_used, expires_at, is_active, created_at)
       VALUES (?, ?, ?, ?, 0, ?, 1, NOW())
       ON DUPLICATE KEY UPDATE 
         discount_type = VALUES(discount_type),
         discount_value = VALUES(discount_value),
         max_uses = VALUES(max_uses),
         expires_at = VALUES(expires_at),
         is_active = 1`,
      [cleanCode, discountType, discountVal, maxUseCount, expiry]
    );

    return NextResponse.json({
      success: true,
      message: `Coupon ${cleanCode} created successfully.`,
      couponId: result.insertId,
    });
  } catch (error: any) {
    console.error('API /api/admin/finance POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin authentication required.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Coupon ID is required.' }, { status: 400 });
    }

    await execute(
      `UPDATE coupons SET is_active = ? WHERE id = ?`,
      [isActive ? 1 : 0, Number(id)]
    );

    return NextResponse.json({
      success: true,
      message: `Coupon status updated.`,
    });
  } catch (error: any) {
    console.error('API /api/admin/finance PATCH Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

'use server';

import { db } from '@/lib/db';
import { payments } from '@/lib/db/schema';
import { paymentSchema, type PaymentInput } from '@/lib/validations/financial';
import { requireAuth } from '@/lib/auth-utils';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createPayment(data: PaymentInput) {
  try {
    await requireAuth();
    const validated = paymentSchema.parse(data);

    const [payment] = await db
      .insert(payments)
      .values(validated)
      .returning();

    revalidatePath('/financial/payments');
    revalidatePath(`/applications/${data.applicationId}`);
    return { success: true, data: payment };
  } catch (error) {
    console.error('Create payment error:', error);
    return { error: 'Failed to create payment' };
  }
}

export async function updatePayment(id: string, data: PaymentInput) {
  try {
    const { user } = await requireAuth();
    const validated = paymentSchema.parse(data);

    // Verify payment belongs to user's company
    const existingPayment = await db.query.payments.findFirst({
      where: eq(payments.id, id),
      with: {
        application: true,
      },
    });

    if (!existingPayment || !existingPayment.application || (existingPayment.application as any).companyId !== user.companyId) {
      return { error: 'Payment not found' };
    }

    const [payment] = await db
      .update(payments)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, id))
      .returning();

    revalidatePath('/financial/payments');
    revalidatePath(`/applications/${data.applicationId}`);
    return { success: true, data: payment };
  } catch (error) {
    console.error('Update payment error:', error);
    return { error: 'Failed to update payment' };
  }
}

export async function deletePayment(id: string) {
  try {
    const { user } = await requireAuth();

    // Verify payment belongs to user's company
    const payment = await db.query.payments.findFirst({
      where: eq(payments.id, id),
      with: {
        application: true,
      },
    });

    if (!payment || !payment.application || (payment.application as any).companyId !== user.companyId) {
      return { error: 'Payment not found' };
    }

    await db.delete(payments).where(eq(payments.id, id));

    revalidatePath('/financial/payments');
    revalidatePath(`/applications/${payment.applicationId}`);
    return { success: true };
  } catch (error) {
    console.error('Delete payment error:', error);
    return { error: 'Failed to delete payment' };
  }
}

export async function getPayments() {
  try {
    const { user } = await requireAuth();

    const allPayments = await db.query.payments.findMany({
      orderBy: (payments, { desc }) => [desc(payments.paymentDate)],
      with: {
        application: {
          with: {
            candidate: true,
          },
        },
        client: true,
      },
    });

    // Filter by company
    const companyPayments = allPayments.filter(
      (payment) => payment.application && (payment.application as any).companyId === user.companyId
    );

    return { success: true, data: companyPayments };
  } catch (error) {
    console.error('Get payments error:', error);
    return { error: 'Failed to fetch payments' };
  }
}

export async function getPayment(id: string) {
  try {
    const { user } = await requireAuth();

    const payment = await db.query.payments.findFirst({
      where: eq(payments.id, id),
      with: {
        application: {
          with: {
            candidate: true,
          },
        },
        client: true,
      },
    });

    if (!payment || !payment.application || (payment.application as any).companyId !== user.companyId) {
      return { error: 'Payment not found' };
    }

    return { success: true, data: payment };
  } catch (error) {
    console.error('Get payment error:', error);
    return { error: 'Failed to fetch payment' };
  }
}

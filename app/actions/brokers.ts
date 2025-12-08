'use server';

import { db } from '@/lib/db';
import { brokers } from '@/lib/db/schema';
import { brokerSchema, type BrokerInput } from '@/lib/validations/agent';
import { requireAuth } from '@/lib/auth-utils';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createBroker(data: BrokerInput) {
  try {
    const { user } = await requireAuth();
    const validated = brokerSchema.parse(data);

    const [broker] = await db
      .insert(brokers)
      .values({
        ...validated,
        companyId: user.companyId,
      })
      .returning();

    revalidatePath('/dashboard/brokers');
    return { success: true, data: broker };
  } catch (error) {
    console.error('Create broker error:', error);
    return { error: 'Failed to create broker' };
  }
}

export async function updateBroker(id: string, data: BrokerInput) {
  try {
    const { user } = await requireAuth();
    const validated = brokerSchema.parse(data);

    const [broker] = await db
      .update(brokers)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(and(eq(brokers.id, id), eq(brokers.companyId, user.companyId)))
      .returning();

    if (!broker) {
      return { error: 'Broker not found' };
    }

    revalidatePath('/dashboard/brokers');
    return { success: true, data: broker };
  } catch (error) {
    console.error('Update broker error:', error);
    return { error: 'Failed to update broker' };
  }
}

export async function deleteBroker(id: string) {
  try {
    const { user } = await requireAuth();

    await db
      .delete(brokers)
      .where(and(eq(brokers.id, id), eq(brokers.companyId, user.companyId)));

    revalidatePath('/dashboard/brokers');
    return { success: true };
  } catch (error) {
    console.error('Delete broker error:', error);
    return { error: 'Failed to delete broker' };
  }
}

export async function getBrokers() {
  try {
    const { user } = await requireAuth();

    const allBrokers = await db.query.brokers.findMany({
      where: eq(brokers.companyId, user.companyId),
      orderBy: (brokers, { desc }) => [desc(brokers.createdAt)],
    });

    return { success: true, data: allBrokers };
  } catch (error) {
    console.error('Get brokers error:', error);
    return { error: 'Failed to fetch brokers' };
  }
}

export async function getBroker(id: string) {
  try {
    const { user } = await requireAuth();

    const broker = await db.query.brokers.findFirst({
      where: and(eq(brokers.id, id), eq(brokers.companyId, user.companyId)),
    });

    if (!broker) {
      return { error: 'Broker not found' };
    }

    return { success: true, data: broker };
  } catch (error) {
    console.error('Get broker error:', error);
    return { error: 'Failed to fetch broker' };
  }
}

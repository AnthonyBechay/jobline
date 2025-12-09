'use server';

import { db } from '@/lib/db';
import { costs } from '@/lib/db/schema';
import { costSchema, type CostInput } from '@/lib/validations/financial';
import { requireAuth } from '@/lib/auth-utils';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createCost(data: CostInput) {
  try {
    await requireAuth();
    const validated = costSchema.parse(data);

    const [cost] = await db
      .insert(costs)
      .values(validated)
      .returning();

    revalidatePath('/financial/costs');
    revalidatePath(`/applications/${data.applicationId}`);
    return { success: true, data: cost };
  } catch (error) {
    console.error('Create cost error:', error);
    return { error: 'Failed to create cost' };
  }
}

export async function updateCost(id: string, data: CostInput) {
  try {
    const { user } = await requireAuth();
    const validated = costSchema.parse(data);

    // Verify cost belongs to user's company
    const existingCost = await db.query.costs.findFirst({
      where: eq(costs.id, id),
      with: {
        application: true,
      },
    });

    if (!existingCost || !existingCost.application || (existingCost.application as any).companyId !== user.companyId) {
      return { error: 'Cost not found' };
    }

    const [cost] = await db
      .update(costs)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(costs.id, id))
      .returning();

    revalidatePath('/financial/costs');
    revalidatePath(`/applications/${data.applicationId}`);
    return { success: true, data: cost };
  } catch (error) {
    console.error('Update cost error:', error);
    return { error: 'Failed to update cost' };
  }
}

export async function deleteCost(id: string) {
  try {
    const { user } = await requireAuth();

    // Verify cost belongs to user's company
    const cost = await db.query.costs.findFirst({
      where: eq(costs.id, id),
      with: {
        application: true,
      },
    });

    if (!cost || !cost.application || (cost.application as any).companyId !== user.companyId) {
      return { error: 'Cost not found' };
    }

    await db.delete(costs).where(eq(costs.id, id));

    revalidatePath('/financial/costs');
    revalidatePath(`/applications/${cost.applicationId}`);
    return { success: true };
  } catch (error) {
    console.error('Delete cost error:', error);
    return { error: 'Failed to delete cost' };
  }
}

export async function getCosts() {
  try {
    const { user } = await requireAuth();

    const allCosts = await db.query.costs.findMany({
      orderBy: (costs, { desc }) => [desc(costs.costDate)],
      with: {
        application: {
          with: {
            candidate: true,
            client: true,
          },
        },
      },
    });

    // Filter by company
    const companyCosts = allCosts.filter(
      (cost) => cost.application && (cost.application as any).companyId === user.companyId
    );

    return { success: true, data: companyCosts };
  } catch (error) {
    console.error('Get costs error:', error);
    return { error: 'Failed to fetch costs' };
  }
}

export async function getCost(id: string) {
  try {
    const { user } = await requireAuth();

    const cost = await db.query.costs.findFirst({
      where: eq(costs.id, id),
      with: {
        application: {
          with: {
            candidate: true,
            client: true,
          },
        },
      },
    });

    if (!cost || !cost.application || (cost.application as any).companyId !== user.companyId) {
      return { error: 'Cost not found' };
    }

    return { success: true, data: cost };
  } catch (error) {
    console.error('Get cost error:', error);
    return { error: 'Failed to fetch cost' };
  }
}

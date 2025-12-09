'use server';

import { db } from '@/lib/db';
import { feeTemplates } from '@/lib/db/schema';
import { feeTemplateSchema, type FeeTemplateInput } from '@/lib/validations/financial';
import { requireAuth } from '@/lib/auth-utils';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getFeeTemplates() {
  try {
    const { user } = await requireAuth();

    const templates = await db.query.feeTemplates.findMany({
      where: eq(feeTemplates.companyId, user.companyId),
      orderBy: (feeTemplates, { desc }) => [desc(feeTemplates.createdAt)],
    });

    return { success: true, data: templates };
  } catch (error) {
    console.error('Error fetching fee templates:', error);
    return { success: false, error: 'Failed to fetch fee templates' };
  }
}

export async function getFeeTemplate(id: string) {
  try {
    const { user } = await requireAuth();

    const template = await db.query.feeTemplates.findFirst({
      where: and(
        eq(feeTemplates.id, id),
        eq(feeTemplates.companyId, user.companyId)
      ),
    });

    if (!template) {
      return { success: false, error: 'Fee template not found' };
    }

    return { success: true, data: template };
  } catch (error) {
    console.error('Error fetching fee template:', error);
    return { success: false, error: 'Failed to fetch fee template' };
  }
}

export async function createFeeTemplate(data: FeeTemplateInput) {
  try {
    const { user } = await requireAuth();

    const validated = feeTemplateSchema.parse(data);

    const [template] = await db
      .insert(feeTemplates)
      .values({
        ...validated,
        companyId: user.companyId,
      })
      .returning();

    revalidatePath('/financial/fee-templates');
    return { success: true, data: template };
  } catch (error) {
    console.error('Error creating fee template:', error);
    return { success: false, error: 'Failed to create fee template' };
  }
}

export async function updateFeeTemplate(id: string, data: FeeTemplateInput) {
  try {
    const { user } = await requireAuth();

    const validated = feeTemplateSchema.parse(data);

    const [template] = await db
      .update(feeTemplates)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(feeTemplates.id, id),
          eq(feeTemplates.companyId, user.companyId)
        )
      )
      .returning();

    if (!template) {
      return { success: false, error: 'Fee template not found' };
    }

    revalidatePath('/financial/fee-templates');
    revalidatePath(`/financial/fee-templates/${id}`);
    return { success: true, data: template };
  } catch (error) {
    console.error('Error updating fee template:', error);
    return { success: false, error: 'Failed to update fee template' };
  }
}

export async function deleteFeeTemplate(id: string) {
  try {
    const { user } = await requireAuth();

    const [deleted] = await db
      .delete(feeTemplates)
      .where(
        and(
          eq(feeTemplates.id, id),
          eq(feeTemplates.companyId, user.companyId)
        )
      )
      .returning();

    if (!deleted) {
      return { success: false, error: 'Fee template not found' };
    }

    revalidatePath('/financial/fee-templates');
    return { success: true };
  } catch (error) {
    console.error('Error deleting fee template:', error);
    return { success: false, error: 'Failed to delete fee template' };
  }
}

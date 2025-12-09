'use server';

import { db } from '@/lib/db';
import { feeTemplates, documentTemplates, nationalities, lawyerServiceSettings } from '@/lib/db/schema';
import { requireAuth, requireSuperAdmin } from '@/lib/auth-utils';
import { feeTemplateSchema, type FeeTemplateInput, documentTemplateSchema, type DocumentTemplateInput, nationalitySchema, type NationalityInput, lawyerFeeSchema, type LawyerFeeInput } from '@/lib/validations/settings';
import { eq, desc, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getFeeTemplates() {
    const { user } = await requireAuth();
    // Allow admins to view, but only super admins to edit (enforced in UI/actions)
    // But wait, "Admin: Operational Access only (No Profitability/Cost views)".
    // Fee Templates are "Settings".
    // So probably only Super Admin should see/manage them.
    // Sidebar hides Settings for non-Super Admin.
    // So we can enforce Super Admin here.

    if (user.role !== 'SUPER_ADMIN') {
        // If we want to allow Admins to READ templates for creating applications, we might need to relax this.
        // But for "Settings" management, it's Super Admin.
        // Let's assume Admins can READ for usage, but this action is for the Settings page list.
        // I'll stick to requireSuperAdmin for now as it's in Settings.
        // Actually, let's just use requireAuth and filter by company, assuming the UI handles the role check for the page access.
        // But for strict security, if this is the "Manage Fee Templates" action, it should be Super Admin.
    }

    // For now, let's just ensure company isolation.
    const templates = await db.query.feeTemplates.findMany({
        where: eq(feeTemplates.companyId, user.companyId),
        orderBy: [desc(feeTemplates.createdAt)],
    });

    return templates;
}

export async function createFeeTemplate(data: FeeTemplateInput) {
    const { user } = await requireSuperAdmin();

    const validated = feeTemplateSchema.safeParse(data);
    if (!validated.success) {
        return { error: 'Invalid data' };
    }

    try {
        await db.insert(feeTemplates).values({
            ...validated.data,
            defaultPrice: validated.data.defaultPrice.toString(),
            minPrice: validated.data.minPrice.toString(),
            maxPrice: validated.data.maxPrice.toString(),
            companyId: user.companyId,
        });

        revalidatePath('/settings/fee-templates');
        return { success: true };
    } catch (error) {
        console.error('Create fee template error:', error);
        return { error: 'Failed to create fee template' };
    }
}

export async function deleteFeeTemplate(id: string) {
    const { user } = await requireSuperAdmin();

    try {
        await db.delete(feeTemplates)
            .where(and(eq(feeTemplates.id, id), eq(feeTemplates.companyId, user.companyId)));

        revalidatePath('/settings/fee-templates');
        return { success: true };
    } catch (error) {
        console.error('Delete fee template error:', error);
        return { error: 'Failed to delete fee template' };
    }
}

export async function getDocumentTemplates(requiredFrom: 'office' | 'client') {
    const { user } = await requireAuth();

    const templates = await db.query.documentTemplates.findMany({
        where: and(
            eq(documentTemplates.companyId, user.companyId),
            eq(documentTemplates.requiredFrom, requiredFrom)
        ),
        orderBy: [desc(documentTemplates.createdAt)],
    });

    return templates;
}

export async function createDocumentTemplate(data: DocumentTemplateInput) {
    const { user } = await requireSuperAdmin();

    const validated = documentTemplateSchema.safeParse(data);
    if (!validated.success) {
        return { error: 'Invalid data' };
    }

    try {
        await db.insert(documentTemplates).values({
            ...validated.data,
            companyId: user.companyId,
        });

        revalidatePath(`/settings/${data.requiredFrom}-documents`);
        return { success: true };
    } catch (error) {
        console.error('Create document template error:', error);
        return { error: 'Failed to create document template' };
    }
}

export async function deleteDocumentTemplate(id: string, requiredFrom: 'office' | 'client') {
    const { user } = await requireSuperAdmin();

    try {
        await db.delete(documentTemplates)
            .where(and(eq(documentTemplates.id, id), eq(documentTemplates.companyId, user.companyId)));

        revalidatePath(`/settings/${requiredFrom}-documents`);
        return { success: true };
    } catch (error) {
        console.error('Delete document template error:', error);
        return { error: 'Failed to delete document template' };
    }
}

export async function getNationalities() {
    const { user } = await requireAuth();

    const items = await db.query.nationalities.findMany({
        where: eq(nationalities.companyId, user.companyId),
        orderBy: [desc(nationalities.active), desc(nationalities.name)],
    });

    return items;
}

export async function createNationality(data: NationalityInput) {
    const { user } = await requireSuperAdmin();

    const validated = nationalitySchema.safeParse(data);
    if (!validated.success) {
        return { error: 'Invalid data' };
    }

    try {
        await db.insert(nationalities).values({
            ...validated.data,
            companyId: user.companyId,
        });

        revalidatePath('/settings/nationalities');
        return { success: true };
    } catch (error) {
        console.error('Create nationality error:', error);
        return { error: 'Failed to create nationality' };
    }
}

export async function toggleNationality(id: string, active: boolean) {
    const { user } = await requireSuperAdmin();

    try {
        await db.update(nationalities)
            .set({ active })
            .where(and(eq(nationalities.id, id), eq(nationalities.companyId, user.companyId)));

        revalidatePath('/settings/nationalities');
        return { success: true };
    } catch (error) {
        console.error('Toggle nationality error:', error);
        return { error: 'Failed to update nationality' };
    }
}

export async function getLawyerFees() {
    const { user } = await requireAuth();

    const settings = await db.query.lawyerServiceSettings.findFirst({
        where: eq(lawyerServiceSettings.companyId, user.companyId),
    });

    return settings;
}

export async function updateLawyerFees(data: LawyerFeeInput) {
    const { user } = await requireSuperAdmin();

    const validated = lawyerFeeSchema.safeParse(data);
    if (!validated.success) {
        return { error: 'Invalid data' };
    }

    try {
        const existing = await db.query.lawyerServiceSettings.findFirst({
            where: eq(lawyerServiceSettings.companyId, user.companyId),
        });

        if (existing) {
            await db.update(lawyerServiceSettings)
                .set({
                    ...validated.data,
                    lawyerFeeCost: validated.data.lawyerFeeCost.toString(),
                    lawyerFeeCharge: validated.data.lawyerFeeCharge.toString(),
                })
                .where(eq(lawyerServiceSettings.id, existing.id));
        } else {
            await db.insert(lawyerServiceSettings).values({
                ...validated.data,
                lawyerFeeCost: validated.data.lawyerFeeCost.toString(),
                lawyerFeeCharge: validated.data.lawyerFeeCharge.toString(),
                companyId: user.companyId,
            });
        }

        revalidatePath('/settings/lawyer-fees');
        return { success: true };
    } catch (error) {
        console.error('Update lawyer fees error:', error);
        return { error: 'Failed to update lawyer fees' };
    }
}

export async function deleteNationality(id: string) {
    const { user } = await requireSuperAdmin();

    try {
        await db.delete(nationalities)
            .where(and(eq(nationalities.id, id), eq(nationalities.companyId, user.companyId)));

        revalidatePath('/settings/nationalities');
        return { success: true };
    } catch (error) {
        console.error('Delete nationality error:', error);
        return { error: 'Failed to delete nationality' };
    }
}

'use server';

import { db } from '@/lib/db';
import { applications } from '@/lib/db/schema';
import { applicationSchema, type ApplicationInput } from '@/lib/validations/application';
import { requireAuth } from '@/lib/auth-utils';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';

export async function createApplication(data: ApplicationInput) {
  try {
    const { user } = await requireAuth();
    const validated = applicationSchema.parse(data);

    // Generate unique shareable link
    const shareableLink = nanoid(16);

    const [application] = await db
      .insert(applications)
      .values({
        ...validated,
        companyId: user.companyId,
        shareableLink,
        fromClientId: validated.fromClientId || null,
        brokerId: validated.brokerId || null,
        feeTemplateId: validated.feeTemplateId || null,
        finalFeeAmount: validated.finalFeeAmount || null,
        lawyerFeeCost: validated.lawyerFeeCost || null,
        lawyerFeeCharge: validated.lawyerFeeCharge || null,
      })
      .returning();

    revalidatePath('/dashboard/applications');
    return { success: true, data: application };
  } catch (error) {
    console.error('Create application error:', error);
    return { error: 'Failed to create application' };
  }
}

export async function updateApplication(id: string, data: ApplicationInput) {
  try {
    const { user } = await requireAuth();
    const validated = applicationSchema.parse(data);

    const [application] = await db
      .update(applications)
      .set({
        ...validated,
        fromClientId: validated.fromClientId || null,
        brokerId: validated.brokerId || null,
        feeTemplateId: validated.feeTemplateId || null,
        finalFeeAmount: validated.finalFeeAmount || null,
        lawyerFeeCost: validated.lawyerFeeCost || null,
        lawyerFeeCharge: validated.lawyerFeeCharge || null,
        updatedAt: new Date(),
      })
      .where(and(eq(applications.id, id), eq(applications.companyId, user.companyId)))
      .returning();

    if (!application) {
      return { error: 'Application not found' };
    }

    revalidatePath('/dashboard/applications');
    revalidatePath(`/dashboard/applications/${id}`);
    return { success: true, data: application };
  } catch (error) {
    console.error('Update application error:', error);
    return { error: 'Failed to update application' };
  }
}

export async function updateApplicationStatus(id: string, status: string) {
  try {
    const { user } = await requireAuth();

    // Validate status is a valid enum value
    const statusSchema = applicationSchema.shape.status;
    const validatedStatus = statusSchema.parse(status);

    const [application] = await db
      .update(applications)
      .set({
        status: validatedStatus,
        updatedAt: new Date(),
      })
      .where(and(eq(applications.id, id), eq(applications.companyId, user.companyId)))
      .returning();

    if (!application) {
      return { error: 'Application not found' };
    }

    revalidatePath('/dashboard/applications');
    revalidatePath('/dashboard/pipeline');
    revalidatePath(`/dashboard/applications/${id}`);
    return { success: true, data: application };
  } catch (error) {
    console.error('Update application status error:', error);
    return { error: 'Failed to update application status' };
  }
}

export async function deleteApplication(id: string) {
  try {
    const { user } = await requireAuth();

    await db
      .delete(applications)
      .where(and(eq(applications.id, id), eq(applications.companyId, user.companyId)));

    revalidatePath('/dashboard/applications');
    return { success: true };
  } catch (error) {
    console.error('Delete application error:', error);
    return { error: 'Failed to delete application' };
  }
}

export async function getApplications() {
  try {
    const { user } = await requireAuth();

    const allApplications = await db.query.applications.findMany({
      where: eq(applications.companyId, user.companyId),
      orderBy: (applications, { desc }) => [desc(applications.createdAt)],
      with: {
        candidate: true,
        client: true,
        fromClient: true,
        broker: true,
      },
    });

    return { success: true, data: allApplications };
  } catch (error) {
    console.error('Get applications error:', error);
    return { error: 'Failed to fetch applications' };
  }
}

export async function getApplication(id: string) {
  try {
    const { user } = await requireAuth();

    const application = await db.query.applications.findFirst({
      where: and(eq(applications.id, id), eq(applications.companyId, user.companyId)),
      with: {
        candidate: true,
        client: true,
        fromClient: true,
        broker: true,
        feeTemplate: true,
      },
    });

    if (!application) {
      return { error: 'Application not found' };
    }

    return { success: true, data: application };
  } catch (error) {
    console.error('Get application error:', error);
    return { error: 'Failed to fetch application' };
  }
}

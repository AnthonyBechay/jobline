'use server';

import { db } from '@/lib/db';
import { candidates } from '@/lib/db/schema';
import { candidateSchema, type CandidateInput } from '@/lib/validations/candidate';
import { requireAuth } from '@/lib/auth-utils';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createCandidate(data: CandidateInput) {
  try {
    const { user } = await requireAuth();
    const validated = candidateSchema.parse(data);

    const [candidate] = await db
      .insert(candidates)
      .values({
        ...validated,
        companyId: user.companyId,
        agentId: validated.agentId || null,
      })
      .returning();

    revalidatePath('/dashboard/candidates');
    return { success: true, data: candidate };
  } catch (error) {
    console.error('Create candidate error:', error);
    return { error: 'Failed to create candidate' };
  }
}

export async function updateCandidate(id: string, data: CandidateInput) {
  try {
    const { user } = await requireAuth();
    const validated = candidateSchema.parse(data);

    const [candidate] = await db
      .update(candidates)
      .set({
        ...validated,
        agentId: validated.agentId || null,
        updatedAt: new Date(),
      })
      .where(and(eq(candidates.id, id), eq(candidates.companyId, user.companyId)))
      .returning();

    if (!candidate) {
      return { error: 'Candidate not found' };
    }

    revalidatePath('/dashboard/candidates');
    revalidatePath(`/dashboard/candidates/${id}`);
    return { success: true, data: candidate };
  } catch (error) {
    console.error('Update candidate error:', error);
    return { error: 'Failed to update candidate' };
  }
}

export async function deleteCandidate(id: string) {
  try {
    const { user } = await requireAuth();

    await db
      .delete(candidates)
      .where(and(eq(candidates.id, id), eq(candidates.companyId, user.companyId)));

    revalidatePath('/dashboard/candidates');
    return { success: true };
  } catch (error) {
    console.error('Delete candidate error:', error);
    return { error: 'Failed to delete candidate' };
  }
}

export async function getCandidates() {
  try {
    const { user } = await requireAuth();

    const allCandidates = await db.query.candidates.findMany({
      where: eq(candidates.companyId, user.companyId),
      orderBy: (candidates, { desc }) => [desc(candidates.createdAt)],
    });

    return { success: true, data: allCandidates };
  } catch (error) {
    console.error('Get candidates error:', error);
    return { error: 'Failed to fetch candidates' };
  }
}

export async function getCandidate(id: string) {
  try {
    const { user } = await requireAuth();

    const candidate = await db.query.candidates.findFirst({
      where: and(eq(candidates.id, id), eq(candidates.companyId, user.companyId)),
    });

    if (!candidate) {
      return { error: 'Candidate not found' };
    }

    return { success: true, data: candidate };
  } catch (error) {
    console.error('Get candidate error:', error);
    return { error: 'Failed to fetch candidate' };
  }
}

'use server';

import { db } from '@/lib/db';
import { candidates } from '@/lib/db/schema';
import { candidateSchema } from '@/lib/validations/candidates';
import { requireAuth } from '@/lib/auth-utils';
import { uploadToR2 } from '@/lib/storage';
import { revalidatePath } from 'next/cache';
import { eq, desc, and } from 'drizzle-orm';

export async function createCandidate(formData: FormData) {
  const { user } = await requireAuth();

  // Extract files
  const photo = formData.get('photo') as File | null;
  const facePhoto = formData.get('facePhoto') as File | null;
  const fullBodyPhoto = formData.get('fullBodyPhoto') as File | null;

  // Extract data
  const rawData: Record<string, any> = {};
  formData.forEach((value, key) => {
    if (key !== 'photo' && key !== 'facePhoto' && key !== 'fullBodyPhoto') {
      rawData[key] = value;
    }
  });

  // Parse data
  const validated = candidateSchema.safeParse(rawData);

  if (!validated.success) {
    return { error: 'Invalid data', details: validated.error.flatten() };
  }

  try {
    let photoUrl = '';
    let facePhotoUrl = '';
    let fullBodyPhotoUrl = '';

    // Upload files if present
    if (photo && photo.size > 0) {
      const result = await uploadToR2(photo, 'candidates/photos');
      photoUrl = result.publicUrl || result.url;
    }

    if (facePhoto && facePhoto.size > 0) {
      const result = await uploadToR2(facePhoto, 'candidates/face');
      facePhotoUrl = result.publicUrl || result.url;
    }

    if (fullBodyPhoto && fullBodyPhoto.size > 0) {
      const result = await uploadToR2(fullBodyPhoto, 'candidates/body');
      fullBodyPhotoUrl = result.publicUrl || result.url;
    }

    // Create candidate
    await db.insert(candidates).values({
      ...validated.data,
      photoUrl,
      facePhotoUrl,
      fullBodyPhotoUrl,
      companyId: user.companyId,
    });

    revalidatePath('/candidates');
    return { success: true };
  } catch (error) {
    console.error('Create candidate error:', error);
    return { error: 'Failed to create candidate' };
  }
}

export async function getCandidates() {
  try {
    const { user } = await requireAuth();

    const items = await db.query.candidates.findMany({
      where: eq(candidates.companyId, user.companyId),
      orderBy: [desc(candidates.createdAt)],
      with: {
        agent: true,
      },
    });

    return { success: true, data: items };
  } catch (error) {
    console.error('Get candidates error:', error);
    return { error: 'Failed to fetch candidates' };
  }
}

export async function deleteCandidate(id: string) {
  const { user } = await requireAuth();

  try {
    await db.delete(candidates)
      .where(and(eq(candidates.id, id), eq(candidates.companyId, user.companyId)));

    revalidatePath('/candidates');
    return { success: true };
  } catch (error) {
    console.error('Delete candidate error:', error);
    return { error: 'Failed to delete candidate' };
  }
}

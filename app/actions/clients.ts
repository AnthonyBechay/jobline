'use server';

import { db } from '@/lib/db';
import { clients } from '@/lib/db/schema';
import { clientSchema, type ClientInput } from '@/lib/validations/client';
import { requireAuth } from '@/lib/auth-utils';
import { uploadToR2 } from '@/lib/storage';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createClient(formData: FormData | ClientInput) {
  try {
    const { user } = await requireAuth();

    // Handle both FormData (with files) and plain object
    let validated: ClientInput;
    let identityDocUrl = '';
    let doc1Url = '';
    let doc2Url = '';

    if (formData instanceof FormData) {
      // Extract files
      const identityDoc = formData.get('identityDocument') as File | null;
      const document1 = formData.get('document1') as File | null;
      const document2 = formData.get('document2') as File | null;

      // Extract data
      const rawData: Record<string, any> = {};
      formData.forEach((value, key) => {
        if (key !== 'identityDocument' && key !== 'document1' && key !== 'document2') {
          rawData[key] = value;
        }
      });

      validated = clientSchema.parse(rawData);

      // Upload files if present
      if (identityDoc && identityDoc.size > 0) {
        const result = await uploadToR2(identityDoc, 'clients/identity');
        identityDocUrl = result.publicUrl || result.url;
      }

      if (document1 && document1.size > 0) {
        const result = await uploadToR2(document1, 'clients/documents');
        doc1Url = result.publicUrl || result.url;
      }

      if (document2 && document2.size > 0) {
        const result = await uploadToR2(document2, 'clients/documents');
        doc2Url = result.publicUrl || result.url;
      }
    } else {
      validated = clientSchema.parse(formData);
      identityDocUrl = validated.identityDocumentUrl || '';
      doc1Url = validated.document1Url || '';
      doc2Url = validated.document2Url || '';
    }

    const [client] = await db
      .insert(clients)
      .values({
        ...validated,
        companyId: user.companyId,
        referredByClient: validated.referredByClient || null,
        identityDocumentUrl: identityDocUrl || null,
        document1Url: doc1Url || null,
        document2Url: doc2Url || null,
      })
      .returning();

    revalidatePath('/clients');
    return { success: true, data: client };
  } catch (error) {
    console.error('Create client error:', error);
    return { error: 'Failed to create client' };
  }
}

export async function updateClient(id: string, data: ClientInput) {
  try {
    const { user } = await requireAuth();
    const validated = clientSchema.parse(data);

    const [client] = await db
      .update(clients)
      .set({
        ...validated,
        referredByClient: validated.referredByClient || null,
        updatedAt: new Date(),
      })
      .where(and(eq(clients.id, id), eq(clients.companyId, user.companyId)))
      .returning();

    if (!client) {
      return { error: 'Client not found' };
    }

    revalidatePath('/clients');
    revalidatePath(`/clients/${id}`);
    return { success: true, data: client };
  } catch (error) {
    console.error('Update client error:', error);
    return { error: 'Failed to update client' };
  }
}

export async function deleteClient(id: string) {
  try {
    const { user } = await requireAuth();

    await db
      .delete(clients)
      .where(and(eq(clients.id, id), eq(clients.companyId, user.companyId)));

    revalidatePath('/clients');
    return { success: true };
  } catch (error) {
    console.error('Delete client error:', error);
    return { error: 'Failed to delete client' };
  }
}

export async function getClients() {
  try {
    const { user } = await requireAuth();

    const allClients = await db.query.clients.findMany({
      where: eq(clients.companyId, user.companyId),
      orderBy: (clients, { desc }) => [desc(clients.createdAt)],
    });

    return { success: true, data: allClients };
  } catch (error) {
    console.error('Get clients error:', error);
    return { error: 'Failed to fetch clients' };
  }
}

export async function getClient(id: string) {
  try {
    const { user } = await requireAuth();

    const client = await db.query.clients.findFirst({
      where: and(eq(clients.id, id), eq(clients.companyId, user.companyId)),
    });

    if (!client) {
      return { error: 'Client not found' };
    }

    return { success: true, data: client };
  } catch (error) {
    console.error('Get client error:', error);
    return { error: 'Failed to fetch client' };
  }
}

'use server';

import { db } from '@/lib/db';
import { clientDocuments } from '@/lib/db/schema';
import { clientDocumentSchema, type ClientDocumentInput } from '@/lib/validations/document';
import { requireAuth } from '@/lib/auth-utils';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { deleteFromR2 } from '@/lib/storage';

export async function createClientDocument(data: ClientDocumentInput) {
  try {
    await requireAuth();
    const validated = clientDocumentSchema.parse(data);

    const [document] = await db
      .insert(clientDocuments)
      .values(validated)
      .returning();

    revalidatePath('/documents');
    revalidatePath(`/clients/${data.clientId}`);
    return { success: true, data: document };
  } catch (error) {
    console.error('Create document error:', error);
    return { error: 'Failed to create document' };
  }
}

export async function updateClientDocument(id: string, data: ClientDocumentInput) {
  try {
    const { user } = await requireAuth();
    const validated = clientDocumentSchema.parse(data);

    // Verify the document belongs to a client in the user's company
    const existingDoc = await db.query.clientDocuments.findFirst({
      where: eq(clientDocuments.id, id),
      with: {
        client: true,
      },
    });

    if (!existingDoc || !existingDoc.client || (existingDoc.client as any).companyId !== user.companyId) {
      return { error: 'Document not found' };
    }

    const [document] = await db
      .update(clientDocuments)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(clientDocuments.id, id))
      .returning();

    revalidatePath('/documents');
    revalidatePath(`/clients/${data.clientId}`);
    return { success: true, data: document };
  } catch (error) {
    console.error('Update document error:', error);
    return { error: 'Failed to update document' };
  }
}

export async function deleteClientDocument(id: string) {
  try {
    const { user } = await requireAuth();

    // Get document with client info
    const document = await db.query.clientDocuments.findFirst({
      where: eq(clientDocuments.id, id),
      with: {
        client: true,
      },
    });

    if (!document || !document.client || (document.client as any).companyId !== user.companyId) {
      return { error: 'Document not found' };
    }

    // Delete from R2 storage
    try {
      // Extract key from URL (assumes URL format includes the key)
      const urlParts = document.url.split('/');
      const key = urlParts.slice(-2).join('/'); // Get folder/filename
      await deleteFromR2(key);
    } catch (storageError) {
      console.error('Failed to delete from R2:', storageError);
      // Continue with database deletion even if R2 deletion fails
    }

    // Delete from database
    await db.delete(clientDocuments).where(eq(clientDocuments.id, id));

    revalidatePath('/documents');
    revalidatePath(`/clients/${document.clientId}`);
    return { success: true };
  } catch (error) {
    console.error('Delete document error:', error);
    return { error: 'Failed to delete document' };
  }
}

export async function getClientDocuments(clientId?: string) {
  try {
    const { user } = await requireAuth();

    if (clientId) {
      // Get documents for specific client
      const documents = await db.query.clientDocuments.findMany({
        where: eq(clientDocuments.clientId, clientId),
        orderBy: (clientDocuments, { desc }) => [desc(clientDocuments.createdAt)],
        with: {
          client: true,
        },
      });

      // Verify client belongs to user's company
      if (documents.length > 0 && documents[0].client && (documents[0].client as any).companyId !== user.companyId) {
        return { error: 'Unauthorized' };
      }

      return { success: true, data: documents };
    }

    // Get all documents for company's clients
    const documents = await db.query.clientDocuments.findMany({
      orderBy: (clientDocuments, { desc }) => [desc(clientDocuments.createdAt)],
      with: {
        client: true,
      },
    });

    // Filter by company
    const companyDocuments = documents.filter(
      (doc) => doc.client && (doc.client as any).companyId === user.companyId
    );

    return { success: true, data: companyDocuments };
  } catch (error) {
    console.error('Get documents error:', error);
    return { error: 'Failed to fetch documents' };
  }
}

export async function getClientDocument(id: string) {
  try {
    const { user } = await requireAuth();

    const document = await db.query.clientDocuments.findFirst({
      where: eq(clientDocuments.id, id),
      with: {
        client: true,
      },
    });

    if (!document || !document.client || (document.client as any).companyId !== user.companyId) {
      return { error: 'Document not found' };
    }

    return { success: true, data: document };
  } catch (error) {
    console.error('Get document error:', error);
    return { error: 'Failed to fetch document' };
  }
}

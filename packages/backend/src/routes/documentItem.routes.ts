import { Router } from 'express';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../index';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(adminOnly);

// Update document checklist item status
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const companyId = req.user!.companyId;
    
    // First, get the document item to find the application
    const documentItem = await prisma.documentChecklistItem.findUnique({
      where: { id },
      include: {
        application: true,
      },
    });
    
    if (!documentItem) {
      res.status(404).json({ error: 'Document item not found' });
      return;
    }
    
    // Verify the application belongs to the user's company
    if (documentItem.application.companyId !== companyId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    // Update the document status
    const updatedItem = await prisma.documentChecklistItem.update({
      where: { id },
      data: { status },
    });
    
    res.json(updatedItem);
  } catch (error) {
    console.error('Update document item error:', error);
    res.status(500).json({ error: 'Failed to update document item' });
  }
});

// Delete document checklist item
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    
    // First, get the document item to find the application
    const documentItem = await prisma.documentChecklistItem.findUnique({
      where: { id },
      include: {
        application: true,
      },
    });
    
    if (!documentItem) {
      res.status(404).json({ error: 'Document item not found' });
      return;
    }
    
    // Verify the application belongs to the user's company
    if (documentItem.application.companyId !== companyId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    // Delete the document item
    await prisma.documentChecklistItem.delete({
      where: { id },
    });
    
    res.json({ message: 'Document item deleted successfully' });
  } catch (error) {
    console.error('Delete document item error:', error);
    res.status(500).json({ error: 'Failed to delete document item' });
  }
});

export default router;

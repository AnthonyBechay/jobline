import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { prisma } from '../index';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(adminOnly);

// Get all applications with filters (company-specific)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { status, type, clientId, candidateId, page = 1, limit = 20 } = req.query;
    const companyId = req.user!.companyId;
    
    const where: any = {
      companyId, // Filter by company
    };
    
    if (status) where.status = status;
    if (type) where.type = type;
    if (clientId) where.clientId = clientId;
    if (candidateId) where.candidateId = candidateId;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          client: true,
          candidate: true,
          broker: true,
          _count: {
            select: {
              payments: true,
              costs: true,
              documentItems: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.application.count({ where }),
    ]);
    
    res.json({
      applications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get application by ID (company-specific)
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    
    const application = await prisma.application.findFirst({
      where: { 
        id,
        companyId, // Ensure application belongs to user's company
      },
      include: {
        client: true,
        candidate: true,
        broker: true,
        payments: true,
        costs: req.user?.role === 'SUPER_ADMIN' ? true : false,
        documentItems: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    
    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    
    res.json(application);
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// Create new application (company-specific)
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { clientId, candidateId, type, feeTemplateId, finalFeeAmount } = req.body;
    const companyId = req.user!.companyId;
    
    // Generate unique shareable link
    const shareableLink = uuidv4();
    
    // Check if candidate belongs to the same company and is available
    const candidate = await prisma.candidate.findFirst({
      where: { 
        id: candidateId,
        companyId, // Ensure candidate belongs to user's company
      },
    });
    
    if (!candidate) {
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }
    
    if (!['AVAILABLE_ABROAD', 'AVAILABLE_IN_LEBANON'].includes(candidate.status)) {
      res.status(400).json({ error: 'Candidate is not available' });
      return;
    }
    
    // Check if client belongs to the same company
    const client = await prisma.client.findFirst({
      where: { 
        id: clientId,
        companyId, // Ensure client belongs to user's company
      },
    });
    
    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }
    
    // Validate fee template if provided
    if (feeTemplateId) {
      const feeTemplate = await prisma.feeTemplate.findFirst({
        where: { 
          id: feeTemplateId,
          companyId, // Ensure fee template belongs to user's company
        },
      });
      
      if (!feeTemplate) {
        res.status(404).json({ error: 'Fee template not found' });
        return;
      }
      
      // Validate final fee amount is within the template's range
      if (finalFeeAmount !== undefined && finalFeeAmount !== null) {
        const amount = parseFloat(finalFeeAmount.toString());
        const minPrice = parseFloat(feeTemplate.minPrice.toString());
        const maxPrice = parseFloat(feeTemplate.maxPrice.toString());
        
        if (amount < minPrice || amount > maxPrice) {
          res.status(400).json({ 
            error: `Final fee amount must be between ${minPrice} and ${maxPrice}` 
          });
          return;
        }
      }
    }
    
    // Create application and update candidate status
    const [application] = await prisma.$transaction([
      prisma.application.create({
        data: {
          clientId,
          candidateId,
          type,
          status: 'PENDING_MOL',
          shareableLink,
          feeTemplateId,
          finalFeeAmount,
          companyId, // Set company ID
        },
        include: {
          client: true,
          candidate: true,
        },
      }),
      prisma.candidate.update({
        where: { id: candidateId },
        data: { status: 'IN_PROCESS' },
      }),
    ]);
    
    // Create initial document checklist based on status
    const documentTemplates = await prisma.documentTemplate.findMany({
      where: { 
        stage: 'PENDING_MOL',
        companyId, // Use company-specific templates
      },
      orderBy: { order: 'asc' },
    });
    
    if (documentTemplates.length > 0) {
      await prisma.documentChecklistItem.createMany({
        data: documentTemplates.map(template => ({
          applicationId: application.id,
          documentName: template.name,
          status: 'PENDING',
          stage: template.stage,
        })),
      });
    }
    
    res.status(201).json(application);
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// Update application status (company-specific)
router.patch('/:id/status', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const companyId = req.user!.companyId;
    
    // Check application belongs to company
    const existingApplication = await prisma.application.findFirst({
      where: { id, companyId },
    });
    
    if (!existingApplication) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    
    const application = await prisma.application.update({
      where: { id },
      data: { status },
      include: {
        client: true,
        candidate: true,
      },
    });
    
    // Update candidate status if application reaches certain states
    if (status === 'ACTIVE_EMPLOYMENT') {
      await prisma.candidate.update({
        where: { id: application.candidateId },
        data: { status: 'PLACED' },
      });
    } else if (status === 'CONTRACT_ENDED') {
      await prisma.candidate.update({
        where: { id: application.candidateId },
        data: { status: 'AVAILABLE_IN_LEBANON' },
      });
    }
    
    // Create document checklist for new stage
    const documentTemplates = await prisma.documentTemplate.findMany({
      where: { 
        stage: status,
        companyId, // Use company-specific templates
      },
      orderBy: { order: 'asc' },
    });
    
    if (documentTemplates.length > 0) {
      await prisma.documentChecklistItem.createMany({
        data: documentTemplates.map(template => ({
          applicationId: application.id,
          documentName: template.name,
          status: 'PENDING',
          stage: template.stage,
        })),
        skipDuplicates: true,
      });
    }
    
    res.json(application);
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

// Create document checklist item (company-specific)
router.post('/:id/documents', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { documentName, status = 'PENDING', stage } = req.body;
    const companyId = req.user!.companyId;
    
    // Verify application belongs to company
    const application = await prisma.application.findFirst({
      where: { id, companyId },
    });
    
    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    
    const document = await prisma.documentChecklistItem.create({
      data: {
        applicationId: id,
        documentName,
        status,
        stage: stage || application.status,
      },
    });
    
    res.status(201).json(document);
  } catch (error) {
    console.error('Create document item error:', error);
    res.status(500).json({ error: 'Failed to create document item' });
  }
});

// Update document checklist item (company-specific)
router.patch('/:id/documents/:itemId', async (req: AuthRequest, res) => {
  try {
    const { id, itemId } = req.params;
    const { status } = req.body;
    const companyId = req.user!.companyId;
    
    // Verify application belongs to company
    const application = await prisma.application.findFirst({
      where: { id, companyId },
    });
    
    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    
    const item = await prisma.documentChecklistItem.update({
      where: { id: itemId },
      data: { status },
    });
    
    res.json(item);
  } catch (error) {
    console.error('Update document item error:', error);
    res.status(500).json({ error: 'Failed to update document item' });
  }
});

// Delete document checklist item (company-specific)
router.delete('/:id/documents/:itemId', async (req: AuthRequest, res) => {
  try {
    const { id, itemId } = req.params;
    const companyId = req.user!.companyId;
    
    // Verify application belongs to company
    const application = await prisma.application.findFirst({
      where: { id, companyId },
    });
    
    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    
    await prisma.documentChecklistItem.delete({
      where: { id: itemId },
    });
    
    res.json({ message: 'Document item deleted successfully' });
  } catch (error) {
    console.error('Delete document item error:', error);
    res.status(500).json({ error: 'Failed to delete document item' });
  }
});

// Assign broker (Super Admin only, company-specific)
router.patch('/:id/broker', authenticate, async (req: AuthRequest, res) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    res.status(403).json({ error: 'Insufficient permissions' });
    return;
  }
  
  try {
    const { id } = req.params;
    const { brokerId } = req.body;
    const companyId = req.user!.companyId;
    
    // Verify application belongs to company
    const application = await prisma.application.findFirst({
      where: { id, companyId },
    });
    
    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    
    // Verify broker belongs to company if provided
    if (brokerId) {
      const broker = await prisma.broker.findFirst({
        where: { id: brokerId, companyId },
      });
      
      if (!broker) {
        res.status(400).json({ error: 'Invalid broker ID' });
        return;
      }
    }
    
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: { brokerId },
      include: {
        broker: true,
      },
    });
    
    res.json(updatedApplication);
  } catch (error) {
    console.error('Assign broker error:', error);
    res.status(500).json({ error: 'Failed to assign broker' });
  }
});

// Get application documents (company-specific)
router.get('/:id/documents', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    
    // Verify application belongs to company
    const application = await prisma.application.findFirst({
      where: { id, companyId },
    });
    
    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    
    const documents = await prisma.documentChecklistItem.findMany({
      where: { applicationId: id },
      orderBy: [{ stage: 'asc' }, { createdAt: 'asc' }],
    });
    
    res.json(documents);
  } catch (error) {
    console.error('Get application documents error:', error);
    res.status(500).json({ error: 'Failed to fetch application documents' });
  }
});

// Get application payments (company-specific)
router.get('/:id/payments', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    
    // Verify application belongs to company
    const application = await prisma.application.findFirst({
      where: { id, companyId },
    });
    
    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    
    const payments = await prisma.payment.findMany({
      where: { applicationId: id },
      include: {
        client: true,
      },
      orderBy: { paymentDate: 'desc' },
    });
    
    res.json(payments);
  } catch (error) {
    console.error('Get application payments error:', error);
    res.status(500).json({ error: 'Failed to fetch application payments' });
  }
});

// Get available fee templates for application creation (Admin can read, only Super Admin can modify)
router.get('/fee-templates/available', async (req: AuthRequest, res) => {
  try {
    const companyId = req.user!.companyId;
    
    const feeTemplates = await prisma.feeTemplate.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        defaultPrice: true,
        minPrice: true,
        maxPrice: true,
        currency: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    });
    
    res.json(feeTemplates);
  } catch (error) {
    console.error('Get fee templates error:', error);
    res.status(500).json({ error: 'Failed to fetch fee templates' });
  }
});

// Get shareable link (company-specific)
router.get('/:id/share-link', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    
    const application = await prisma.application.findFirst({
      where: { id, companyId },
      select: { shareableLink: true },
    });
    
    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const fullLink = `${baseUrl}/status/${application.shareableLink}`;
    
    res.json({ link: fullLink });
  } catch (error) {
    console.error('Get share link error:', error);
    res.status(500).json({ error: 'Failed to get share link' });
  }
});

export default router;
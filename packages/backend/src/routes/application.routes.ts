import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { prisma } from '../index';
import { v4 as uuidv4 } from 'uuid';
import { generateApplicationPDF } from '../services/pdf.service';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(adminOnly);

// Get all applications with filters (company-specific)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { status, type, clientId, candidateId, page = 1, limit = 20, search } = req.query;
    const companyId = req.user!.companyId;
    
    const where: any = {
      companyId, // Filter by company
    };
    
    // Handle multiple status filters (for preset filters)
    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      if (statuses.length > 1) {
        where.status = { in: statuses };
      } else {
        where.status = statuses[0];
      }
    }
    
    if (type) where.type = type;
    if (clientId) where.clientId = clientId;
    if (candidateId) where.candidateId = candidateId;
    
    // Add search functionality
    if (search && typeof search === 'string' && search.trim()) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
        { candidate: { firstName: { contains: search, mode: 'insensitive' } } },
        { candidate: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }
    
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
        feeTemplate: true,
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
    const { 
      clientId, 
      candidateId, 
      type, 
      feeTemplateId, 
      finalFeeAmount, 
      brokerId, 
      fromClientId,
      lawyerServiceRequested,
      lawyerFeeCost,
      lawyerFeeCharge
    } = req.body;
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
    
    // For guarantor change applications, validate fromClientId
    if (type === 'GUARANTOR_CHANGE') {
      if (!fromClientId) {
        res.status(400).json({ error: 'From Client ID is required for guarantor change applications' });
        return;
      }
      
      const fromClient = await prisma.client.findFirst({
        where: { 
          id: fromClientId,
          companyId, // Ensure from client belongs to user's company
        },
      });
      
      if (!fromClient) {
        res.status(404).json({ error: 'From Client not found' });
        return;
      }
      
      if (fromClientId === clientId) {
        res.status(400).json({ error: 'From Client and To Client cannot be the same' });
        return;
      }
    }
    
    // Auto-select fee template based on nationality if not provided
    let selectedFeeTemplateId = feeTemplateId;
    let selectedFinalFeeAmount = finalFeeAmount;
    
    if (!feeTemplateId && candidate.nationality) {
      // Try to find nationality-specific fee template
      const nationalityFeeTemplate = await prisma.feeTemplate.findFirst({
        where: { 
          nationality: candidate.nationality,
          companyId,
        },
      });
      
      if (nationalityFeeTemplate) {
        selectedFeeTemplateId = nationalityFeeTemplate.id;
        selectedFinalFeeAmount = selectedFinalFeeAmount || nationalityFeeTemplate.defaultPrice;
      }
    }
    
    // Validate fee template if provided or auto-selected
    if (selectedFeeTemplateId) {
      const feeTemplate = await prisma.feeTemplate.findFirst({
        where: { 
          id: selectedFeeTemplateId,
          companyId,
        },
      });
      
      if (!feeTemplate) {
        res.status(404).json({ error: 'Fee template not found' });
        return;
      }
      
      // Validate final fee amount is within the template's range
      if (selectedFinalFeeAmount !== undefined && selectedFinalFeeAmount !== null) {
        const amount = parseFloat(selectedFinalFeeAmount.toString());
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
          feeTemplateId: selectedFeeTemplateId,
          finalFeeAmount: selectedFinalFeeAmount,
          brokerId: brokerId && brokerId !== '' ? brokerId : null, // Handle empty string as null
          fromClientId: type === 'GUARANTOR_CHANGE' ? fromClientId : null,
          lawyerServiceRequested: lawyerServiceRequested || false,
          lawyerFeeCost: lawyerServiceRequested ? lawyerFeeCost : null,
          lawyerFeeCharge: lawyerServiceRequested ? lawyerFeeCharge : null,
          companyId, // Set company ID
        },
        include: {
          client: true,
          candidate: true,
          feeTemplate: true,
          broker: true,
          fromClient: true,
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

// Update application status (company-specific) - DEPRECATED: Use /api/applications/:id/status instead
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
    const { type } = req.query; // 'office' or 'client' or undefined for all
    const companyId = req.user!.companyId;
    
    // Verify application belongs to company
    const application = await prisma.application.findFirst({
      where: { id, companyId },
    });
    
    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    
    // Get document checklist items
    const documentItems = await prisma.documentChecklistItem.findMany({
      where: { applicationId: id },
      orderBy: [{ stage: 'asc' }, { createdAt: 'asc' }],
    });
    
    // Get templates to know which documents are for office vs client
    const templates = await prisma.documentTemplate.findMany({
      where: { 
        companyId,
        stage: { in: documentItems.map(d => d.stage) },
      },
    });
    
    // Map document items with requiredFrom information
    const documentsWithType = documentItems.map(item => {
      const template = templates.find(t => 
        t.name === item.documentName && t.stage === item.stage
      );
      return {
        ...item,
        requiredFrom: template?.requiredFrom || 'office',
      };
    });
    
    // Filter by type if requested
    let filteredDocuments = documentsWithType;
    if (type === 'office') {
      filteredDocuments = documentsWithType.filter(d => d.requiredFrom === 'office');
    } else if (type === 'client') {
      filteredDocuments = documentsWithType.filter(d => d.requiredFrom === 'client');
    }
    
    res.json(filteredDocuments);
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
    
    // Convert Decimal to number for frontend
    const formattedPayments = payments.map(payment => ({
      ...payment,
      amount: Number(payment.amount),
    }));
    
    res.json(formattedPayments);
  } catch (error) {
    console.error('Get application payments error:', error);
    res.status(500).json({ error: 'Failed to fetch application payments' });
  }
});

// Get application costs (Super Admin only)
router.get('/:id/costs', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    
    // Only Super Admin can view costs
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    
    // Verify application belongs to company
    const application = await prisma.application.findFirst({
      where: { id, companyId },
    });
    
    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    
    const costs = await prisma.cost.findMany({
      where: { applicationId: id },
      orderBy: { costDate: 'desc' },
    });
    
    // Convert Decimal to number for frontend
    const formattedCosts = costs.map(cost => ({
      ...cost,
      amount: Number(cost.amount),
    }));
    
    res.json(formattedCosts);
  } catch (error) {
    console.error('Get application costs error:', error);
    res.status(500).json({ error: 'Failed to fetch application costs' });
  }
});

// Update application (general update endpoint) with document validation
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, ...updateData } = req.body;
    const companyId = req.user!.companyId;
    
    // Check application belongs to company
    const existingApplication = await prisma.application.findFirst({
      where: { id, companyId },
      include: {
        documentItems: true,
      }
    });
    
    if (!existingApplication) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    
    // If status is being updated, validate required documents first
    if (status) {
      // Check if all required office documents for current stage are received/submitted
      const requiredDocs = await prisma.documentTemplate.findMany({
        where: {
          companyId,
          stage: existingApplication.status,
          required: true,
          requiredFrom: 'office'
        }
      });
      
      // Get document statuses for this application
      const docStatuses = existingApplication.documentItems.reduce((acc, item) => {
        acc[item.documentName] = item.status;
        return acc;
      }, {} as Record<string, string>);
      
      // Check if all required office documents are at least received
      const missingDocs = requiredDocs.filter(doc => 
        !docStatuses[doc.name] || docStatuses[doc.name] === 'PENDING'
      );
      
      if (missingDocs.length > 0) {
        const docList = missingDocs.map(d => d.name).join(', ');
        res.status(400).json({ 
          error: `Please submit the following documents before proceeding: ${docList}`,
          message: `We need these documents to move to the next stage: ${docList}`,
          missingDocuments: missingDocs.map(d => d.name),
          userFriendly: true,
          scrollToDocuments: true
        });
        return;
      }
      const application = await prisma.application.update({
        where: { id },
        data: { status, ...updateData },
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
          companyId,
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
    } else {
      // Regular update without status change
      const application = await prisma.application.update({
        where: { id },
        data: updateData,
        include: {
          client: true,
          candidate: true,
        },
      });
      
      res.json(application);
    }
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// Get available fee templates for application creation (Admin can read, only Super Admin can modify)
router.get('/fee-templates/available', async (req: AuthRequest, res) => {
  try {
    const companyId = req.user!.companyId;
    const { nationality } = req.query;
    
    // Build query conditions
    const where: any = { companyId };
    
    // If nationality is provided, get templates for that nationality or generic ones
    if (nationality) {
      where.OR = [
        { nationality: nationality as string },
        { nationality: null }
      ];
    }
    
    const feeTemplates = await prisma.feeTemplate.findMany({
      where,
      select: {
        id: true,
        name: true,
        defaultPrice: true,
        minPrice: true,
        maxPrice: true,
        currency: true,
        nationality: true,
        description: true,
      },
      orderBy: [{ nationality: 'desc' }, { name: 'asc' }], // Prioritize nationality-specific templates
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

// Generate PDF for an application
router.get('/:id/pdf', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    
    // Fetch application with all necessary relations
    const application = await prisma.application.findFirst({
      where: { 
        id,
        companyId,
      },
      include: {
        client: true,
        candidate: {
          include: {
            agent: true,
            company: true,
          }
        },
        broker: true,
        feeTemplate: true,
        company: true,
      }
    });
    
    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    
    // Generate PDF using the service
    const pdfBuffer = await generateApplicationPDF(application);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="application_${application.id.substring(0, 8)}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    
    // Send the PDF buffer
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Generate application PDF error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

export default router;
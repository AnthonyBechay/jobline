import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth.middleware';

// Get all clients with filters (company-specific)
export const getAllClients = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const companyId = req.user!.companyId;
    
    const where: any = {
      companyId, // Filter by company
    };
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          _count: {
            select: { applications: true },
          },
          referrer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.client.count({ where }),
    ]);
    
    res.json({
      data: clients,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
};

// Get client by ID (company-specific)
export const getClientById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    
    const client = await prisma.client.findFirst({
      where: { 
        id,
        companyId, // Ensure client belongs to user's company
      },
      include: {
        referrer: true,
        referrals: true,
        applications: {
          include: {
            candidate: true,
            payments: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });
    
    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }
    
    res.json(client);
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
};

// Create new client (company-specific)
export const createClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const { name, phone, address, notes, referredByClient } = req.body;
    
    // Verify referrer belongs to the same company if provided
    if (referredByClient) {
      const referrer = await prisma.client.findFirst({
        where: { id: referredByClient, companyId },
      });
      
      if (!referrer) {
        res.status(400).json({ error: 'Invalid referrer ID' });
        return;
      }
    }
    
    const client = await prisma.client.create({
      data: {
        name,
        phone,
        address,
        notes,
        referredByClient,
        companyId, // Set company ID
      },
      include: {
        referrer: true,
      },
    });
    
    res.status(201).json(client);
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
};

// Update client (company-specific)
export const updateClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const { referredByClient, ...updateData } = req.body;
    
    // Check client belongs to company
    const existingClient = await prisma.client.findFirst({
      where: { id, companyId },
    });
    
    if (!existingClient) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }
    
    // Verify referrer belongs to the same company if provided
    if (referredByClient) {
      const referrer = await prisma.client.findFirst({
        where: { id: referredByClient, companyId },
      });
      
      if (!referrer) {
        res.status(400).json({ error: 'Invalid referrer ID' });
        return;
      }
      updateData.referredByClient = referredByClient;
    }
    
    const client = await prisma.client.update({
      where: { id },
      data: updateData,
      include: {
        referrer: true,
      },
    });
    
    res.json(client);
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
};

// Delete client (company-specific)
export const deleteClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    
    // Check client belongs to company
    const client = await prisma.client.findFirst({
      where: { id, companyId },
    });
    
    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }
    
    // Check if client has applications
    const applicationsCount = await prisma.application.count({
      where: { clientId: id },
    });
    
    if (applicationsCount > 0) {
      res.status(400).json({ 
        error: 'Cannot delete client with existing applications' 
      });
      return;
    }
    
    await prisma.client.delete({
      where: { id },
    });
    
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
};

// Get client history/lifeline (company-specific)
export const getClientHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    
    const client = await prisma.client.findFirst({
      where: { id, companyId },
      include: {
        applications: {
          include: {
            candidate: true,
            payments: true,
            costs: req.user?.role === 'SUPER_ADMIN',
          },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });
    
    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }
    
    // Calculate total spent by client
    const totalSpent = client.payments.reduce((sum, payment) => {
      return sum + Number(payment.amount);
    }, 0);
    
    res.json({
      client,
      totalSpent,
      applicationCount: client.applications.length,
      lifeline: client.applications.map(app => ({
        id: app.id,
        candidate: `${app.candidate.firstName} ${app.candidate.lastName}`,
        status: app.status,
        type: app.type,
        createdAt: app.createdAt,
        permitExpiryDate: app.permitExpiryDate,
      })),
    });
  } catch (error) {
    console.error('Get client history error:', error);
    res.status(500).json({ error: 'Failed to fetch client history' });
  }
};

// Import clients from CSV (company-specific)
export const importClients = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // This would handle CSV file upload and parsing
    // For now, returning a placeholder response
    res.json({ 
      message: 'Import functionality will be implemented with file upload support' 
    });
  } catch (error) {
    console.error('Import clients error:', error);
    res.status(500).json({ error: 'Failed to import clients' });
  }
};

// Export clients to CSV (company-specific)
export const exportClients = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    
    const clients = await prisma.client.findMany({
      where: { companyId },
      include: {
        referrer: true,
        _count: {
          select: { applications: true },
        },
      },
    });
    
    // Convert to CSV format
    const headers = ['ID', 'Name', 'Phone', 'Address', 'Referred By', 'Applications Count'];
    const rows = clients.map(c => [
      c.id,
      c.name,
      c.phone,
      c.address || '',
      c.referrer?.name || '',
      c._count.applications,
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=clients.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export clients error:', error);
    res.status(500).json({ error: 'Failed to export clients' });
  }
};
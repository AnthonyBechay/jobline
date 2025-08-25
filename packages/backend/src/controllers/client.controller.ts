import { Request, Response } from 'express';
import { prisma } from '../index';

// Get all clients with search
export const getAllClients = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    
    const where: any = {};
    
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
          referrer: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              applications: true,
              referrals: true,
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
      clients,
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

// Get client by ID
export const getClientById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const client = await prisma.client.findUnique({
      where: { id },
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

// Get client hiring history
export const getClientHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const applications = await prisma.application.findMany({
      where: { clientId: id },
      include: {
        candidate: true,
        payments: {
          select: {
            amount: true,
            paymentDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    const history = applications.map(app => ({
      id: app.id,
      candidate: {
        id: app.candidate.id,
        name: `${app.candidate.firstName} ${app.candidate.lastName}`,
        nationality: app.candidate.nationality,
      },
      status: app.status,
      type: app.type,
      startDate: app.createdAt,
      endDate: app.status === 'CONTRACT_ENDED' ? app.updatedAt : null,
      totalPaid: app.payments.reduce((sum, p) => sum + Number(p.amount), 0),
    }));
    
    res.json(history);
  } catch (error) {
    console.error('Get client history error:', error);
    res.status(500).json({ error: 'Failed to fetch client history' });
  }
};

// Create new client
export const createClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, address, notes, referredByClient } = req.body;
    
    const client = await prisma.client.create({
      data: {
        name,
        phone,
        address,
        notes,
        referredByClient,
      },
      include: {
        referrer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    res.status(201).json(client);
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
};

// Update client
export const updateClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, phone, address, notes, referredByClient } = req.body;
    
    const client = await prisma.client.update({
      where: { id },
      data: {
        name,
        phone,
        address,
        notes,
        referredByClient,
      },
      include: {
        referrer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    res.json(client);
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
};

// Delete client
export const deleteClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
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

// Import clients from CSV
export const importClients = async (req: Request, res: Response): Promise<void> => {
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

// Export clients to CSV
export const exportClients = async (req: Request, res: Response): Promise<void> => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        referrer: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });
    
    // Convert to CSV format
    const headers = ['ID', 'Name', 'Phone', 'Address', 'Referred By', 'Total Applications'];
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

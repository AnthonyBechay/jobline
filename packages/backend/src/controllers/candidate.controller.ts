import { Request, Response } from 'express';
import { prisma } from '../index';
import { CandidateStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

// Get all candidates with filters
export const getAllCandidates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, nationality, search, page = 1, limit = 20 } = req.query;
    
    const where: any = {};
    
    if (status) {
      where.status = status as CandidateStatus;
    }
    
    if (nationality) {
      where.nationality = nationality as string;
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        include: {
          agent: true,
          _count: {
            select: { applications: true },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.candidate.count({ where }),
    ]);
    
    res.json({
      candidates,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
};

// Get candidate by ID
export const getCandidateById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        agent: true,
        applications: {
          include: {
            client: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    
    if (!candidate) {
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }
    
    res.json(candidate);
  } catch (error) {
    console.error('Get candidate error:', error);
    res.status(500).json({ error: 'Failed to fetch candidate' });
  }
};

// Create new candidate
export const createCandidate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      firstName,
      lastName,
      photoUrl,
      dateOfBirth,
      nationality,
      education,
      skills,
      experienceSummary,
      status,
      agentId,
    } = req.body;
    
    // Only Super Admin can assign agents
    const agentData = req.user?.role === 'SUPER_ADMIN' && agentId ? { agentId } : {};
    
    const candidate = await prisma.candidate.create({
      data: {
        firstName,
        lastName,
        photoUrl,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        nationality,
        education,
        skills,
        experienceSummary,
        status,
        ...agentData,
      },
      include: {
        agent: true,
      },
    });
    
    res.status(201).json(candidate);
  } catch (error) {
    console.error('Create candidate error:', error);
    res.status(500).json({ error: 'Failed to create candidate' });
  }
};

// Update candidate
export const updateCandidate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Remove agentId if user is not Super Admin
    if (req.user?.role !== 'SUPER_ADMIN') {
      delete updateData.agentId;
    }
    
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }
    
    const candidate = await prisma.candidate.update({
      where: { id },
      data: updateData,
      include: {
        agent: true,
      },
    });
    
    res.json(candidate);
  } catch (error) {
    console.error('Update candidate error:', error);
    res.status(500).json({ error: 'Failed to update candidate' });
  }
};

// Delete candidate
export const deleteCandidate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if candidate has applications
    const applicationsCount = await prisma.application.count({
      where: { candidateId: id },
    });
    
    if (applicationsCount > 0) {
      res.status(400).json({ 
        error: 'Cannot delete candidate with existing applications' 
      });
      return;
    }
    
    await prisma.candidate.delete({
      where: { id },
    });
    
    res.json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({ error: 'Failed to delete candidate' });
  }
};

// Import candidates from CSV
export const importCandidates = async (req: Request, res: Response): Promise<void> => {
  try {
    // This would handle CSV file upload and parsing
    // For now, returning a placeholder response
    res.json({ 
      message: 'Import functionality will be implemented with file upload support' 
    });
  } catch (error) {
    console.error('Import candidates error:', error);
    res.status(500).json({ error: 'Failed to import candidates' });
  }
};

// Export candidates to CSV
export const exportCandidates = async (req: Request, res: Response): Promise<void> => {
  try {
    const candidates = await prisma.candidate.findMany({
      include: {
        agent: true,
      },
    });
    
    // Convert to CSV format
    const headers = ['ID', 'First Name', 'Last Name', 'Nationality', 'Status', 'Agent'];
    const rows = candidates.map(c => [
      c.id,
      c.firstName,
      c.lastName,
      c.nationality,
      c.status,
      c.agent?.name || '',
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=candidates.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export candidates error:', error);
    res.status(500).json({ error: 'Failed to export candidates' });
  }
};

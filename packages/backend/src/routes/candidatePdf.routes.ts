import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../index';
import { generateCandidatePDF } from '../services/pdf.service';

const router = Router();

router.use(authenticate);

// Generate PDF for a candidate
router.get('/:id/export-pdf', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    
    // Fetch candidate with all necessary relations
    const candidate = await prisma.candidate.findFirst({
      where: { 
        id,
        companyId,
      },
      include: {
        agent: true,
        company: true,
        applications: {
          include: {
            client: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });
    
    if (!candidate) {
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }
    
    // Generate PDF using the service
    const pdfBuffer = await generateCandidatePDF(candidate);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${candidate.firstName}_${candidate.lastName}_profile.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    
    // Send the PDF buffer
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

export default router;
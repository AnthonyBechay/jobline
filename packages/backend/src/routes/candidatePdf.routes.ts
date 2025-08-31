import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../index';
import PDFDocument from 'pdfkit';
import axios from 'axios';

const router = Router();

router.use(authenticate);

// Generate PDF for a candidate
router.get('/:id/export-pdf', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    
    // Fetch candidate with agent details
    const candidate = await prisma.candidate.findFirst({
      where: { 
        id,
        companyId,
      },
      include: {
        agent: true,
      }
    });
    
    if (!candidate) {
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }
    
    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${candidate.firstName}_${candidate.lastName}_profile.pdf"`
    );
    
    // Pipe the PDF to the response
    doc.pipe(res);
    
    // Add header with company info
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('CANDIDATE PROFILE', { align: 'center' });
    
    doc.moveDown();
    
    // Add candidate name
    doc.fontSize(20)
       .text(`${candidate.firstName} ${candidate.lastName}`, { align: 'center' });
    
    doc.moveDown();
    
    // Add photos section if available
    const photoPromises = [];
    
    // Helper function to download and add image
    const addImageFromUrl = async (url: string, x: number, y: number, width: number, height: number, label: string) => {
      try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);
        
        // Add label
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text(label, x, y - 20);
        
        // Add image
        doc.image(buffer, x, y, {
          width: width,
          height: height,
          fit: [width, height],
          align: 'center',
          valign: 'center'
        });
      } catch (error) {
        console.error(`Failed to load image from ${url}:`, error);
        // Add placeholder text if image fails to load
        doc.fontSize(10)
           .font('Helvetica')
           .text(`[${label} not available]`, x, y + height/2);
      }
    };
    
    // Add face photo if available
    if (candidate.facePhotoUrl || candidate.photoUrl) {
      await addImageFromUrl(
        candidate.facePhotoUrl || candidate.photoUrl || '',
        50,
        180,
        250,
        300,
        'Face Photo'
      );
    }
    
    // Add full body photo if available
    if (candidate.fullBodyPhotoUrl) {
      await addImageFromUrl(
        candidate.fullBodyPhotoUrl,
        320,
        180,
        250,
        300,
        'Full Body Photo'
      );
    }
    
    // Move cursor below photos
    doc.y = 500;
    
    // Add personal information section
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('PERSONAL INFORMATION', 50, doc.y);
    
    doc.moveDown();
    
    // Add details in two columns
    const leftColumn = 50;
    const rightColumn = 300;
    let currentY = doc.y;
    
    // Left column
    doc.fontSize(11).font('Helvetica');
    
    doc.text('Nationality:', leftColumn, currentY);
    doc.font('Helvetica-Bold').text(candidate.nationality || 'N/A', leftColumn + 70, currentY);
    currentY += 20;
    
    doc.font('Helvetica').text('Date of Birth:', leftColumn, currentY);
    doc.font('Helvetica-Bold').text(
      candidate.dateOfBirth ? new Date(candidate.dateOfBirth).toLocaleDateString() : 'N/A',
      leftColumn + 70,
      currentY
    );
    currentY += 20;
    
    doc.font('Helvetica').text('Age:', leftColumn, currentY);
    const age = candidate.dateOfBirth ? 
      Math.floor((Date.now() - new Date(candidate.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 
      'N/A';
    doc.font('Helvetica-Bold').text(age.toString(), leftColumn + 70, currentY);
    currentY += 20;
    
    doc.font('Helvetica').text('Height:', leftColumn, currentY);
    doc.font('Helvetica-Bold').text(
      candidate.height ? `${candidate.height} cm` : 'N/A',
      leftColumn + 70,
      currentY
    );
    currentY += 20;
    
    doc.font('Helvetica').text('Weight:', leftColumn, currentY);
    doc.font('Helvetica-Bold').text(
      candidate.weight ? `${candidate.weight} kg` : 'N/A',
      leftColumn + 70,
      currentY
    );
    
    // Right column
    currentY = doc.y - 80; // Reset to start of details section
    
    doc.font('Helvetica').text('Status:', rightColumn, currentY);
    doc.font('Helvetica-Bold').text(
      candidate.status.replace(/_/g, ' '),
      rightColumn + 70,
      currentY
    );
    currentY += 20;
    
    doc.font('Helvetica').text('Education:', rightColumn, currentY);
    doc.font('Helvetica-Bold').text(
      candidate.education || 'N/A',
      rightColumn + 70,
      currentY
    );
    currentY += 20;
    
    doc.font('Helvetica').text('Agent:', rightColumn, currentY);
    doc.font('Helvetica-Bold').text(
      candidate.agent?.name || 'N/A',
      rightColumn + 70,
      currentY
    );
    
    // Add skills section
    doc.moveDown(2);
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('SKILLS', 50);
    
    doc.moveDown();
    doc.fontSize(11).font('Helvetica');
    
    if (candidate.skills && Array.isArray(candidate.skills)) {
      const skills = candidate.skills as string[];
      doc.text(skills.join(', ') || 'No skills listed', {
        width: 500,
        align: 'left'
      });
    } else {
      doc.text('No skills listed');
    }
    
    // Add experience section
    doc.moveDown();
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('EXPERIENCE SUMMARY', 50);
    
    doc.moveDown();
    doc.fontSize(11).font('Helvetica');
    doc.text(candidate.experienceSummary || 'No experience summary provided', {
      width: 500,
      align: 'left'
    });
    
    // Add footer
    doc.fontSize(10)
       .font('Helvetica')
       .text(
         `Generated on ${new Date().toLocaleDateString()}`,
         50,
         750,
         { align: 'center' }
       );
    
    // Finalize the PDF
    doc.end();
    
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

export default router;

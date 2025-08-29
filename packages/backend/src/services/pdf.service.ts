import PDFDocument from 'pdfkit';
import { Candidate } from '@prisma/client';

export async function generateCandidatePDF(candidate: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });
      
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      
      // Header with candidate name
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text(`${candidate.firstName} ${candidate.lastName}`, 50, 50);
      
      // Status badge
      doc.fontSize(12)
         .font('Helvetica')
         .fillColor(getStatusColor(candidate.status))
         .text(candidate.status.replace(/_/g, ' '), 50, 85)
         .fillColor('black');
      
      // Candidate ID
      doc.fontSize(10)
         .fillColor('#666666')
         .text(`ID: ${candidate.id.substring(0, 8)}`, 50, 105)
         .fillColor('black');
      
      // Add a line separator
      doc.moveTo(50, 130)
         .lineTo(550, 130)
         .stroke();
      
      // Personal Information Section
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('Personal Information', 50, 150);
      
      doc.fontSize(12)
         .font('Helvetica');
      
      let yPosition = 180;
      const lineHeight = 25;
      
      // Add personal details
      addInfoRow(doc, 'Nationality:', candidate.nationality || 'Not specified', 50, yPosition);
      yPosition += lineHeight;
      
      addInfoRow(doc, 'Date of Birth:', 
        candidate.dateOfBirth ? new Date(candidate.dateOfBirth).toLocaleDateString() : 'Not specified', 
        50, yPosition);
      yPosition += lineHeight;
      
      if (candidate.dateOfBirth) {
        addInfoRow(doc, 'Age:', `${calculateAge(new Date(candidate.dateOfBirth))} years`, 50, yPosition);
        yPosition += lineHeight;
      }
      
      addInfoRow(doc, 'Education:', candidate.education || 'Not specified', 50, yPosition);
      yPosition += lineHeight;
      
      if (candidate.agent) {
        addInfoRow(doc, 'Agent:', candidate.agent.name, 50, yPosition);
        yPosition += lineHeight;
      }
      
      // Skills Section
      yPosition += 20;
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('Skills & Expertise', 50, yPosition);
      
      yPosition += 30;
      doc.fontSize(12)
         .font('Helvetica');
      
      if (candidate.skills && candidate.skills.length > 0) {
        const skillsText = candidate.skills.join(', ');
        doc.text(skillsText, 50, yPosition, {
          width: 500,
          align: 'left'
        });
        yPosition += 40;
      } else {
        doc.fillColor('#999999')
           .text('No skills listed', 50, yPosition)
           .fillColor('black');
        yPosition += 25;
      }
      
      // Experience Summary Section
      yPosition += 20;
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('Experience Summary', 50, yPosition);
      
      yPosition += 30;
      doc.fontSize(12)
         .font('Helvetica')
         .text(candidate.experienceSummary || 'No experience summary provided.', 50, yPosition, {
           width: 500,
           align: 'left'
         });
      
      // Employment History Section (if available)
      if (candidate.applications && candidate.applications.length > 0) {
        yPosition += 60;
        
        // Check if we need a new page
        if (yPosition > 650) {
          doc.addPage();
          yPosition = 50;
        }
        
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('Employment History', 50, yPosition);
        
        yPosition += 30;
        doc.fontSize(12)
           .font('Helvetica');
        
        candidate.applications.forEach((app: any) => {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }
          
          doc.font('Helvetica-Bold')
             .text(app.client?.name || 'Unknown Client', 50, yPosition);
          
          doc.font('Helvetica')
             .fontSize(10)
             .fillColor('#666666')
             .text(
               `${new Date(app.createdAt).toLocaleDateString()} - ${
                 app.status === 'ACTIVE_EMPLOYMENT' ? 'Present' : new Date(app.updatedAt).toLocaleDateString()
               }`,
               50,
               yPosition + 15
             )
             .fillColor('black');
          
          yPosition += 40;
        });
      }
      
      // Footer
      const pageHeight = doc.page.height;
      doc.fontSize(10)
         .fillColor('#888888')
         .text(
           `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
           50,
           pageHeight - 100,
           { align: 'center', width: 500 }
         )
         .text(
           `© ${new Date().getFullYear()} Jobline Recruitment Platform - Confidential`,
           50,
           pageHeight - 80,
           { align: 'center', width: 500 }
         );
      
      // Finalize PDF
      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
}

function addInfoRow(doc: any, label: string, value: string, x: number, y: number) {
  doc.font('Helvetica-Bold')
     .text(label, x, y, { continued: true })
     .font('Helvetica')
     .text(` ${value}`);
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'AVAILABLE_ABROAD':
    case 'AVAILABLE_IN_LEBANON':
      return '#4CAF50'; // Green
    case 'RESERVED':
      return '#FF9800'; // Orange
    case 'PLACED':
      return '#9C27B0'; // Purple
    case 'IN_PROCESS':
      return '#2196F3'; // Blue
    default:
      return '#000000'; // Black
  }
}

function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

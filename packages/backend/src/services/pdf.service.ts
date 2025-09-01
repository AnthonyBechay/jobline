import PDFDocument from 'pdfkit';
import { Candidate, Application } from '@prisma/client';
import fetch from 'node-fetch';
import { getSignedUrlForB2 } from './backblaze.service';
import { prisma } from '../index';

/**
 * Fetch image from URL and convert to buffer for embedding in PDF
 */
async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    // If it's a B2 file, generate a fresh signed URL
    if (url && url.includes('backblaze')) {
      // Extract the key from the URL if needed
      const urlParts = url.split('/');
      const key = urlParts.slice(-1)[0]; // Get the last part as key
      
      // Try to find the file in database to get the actual key
      const file = await prisma.file.findFirst({
        where: {
          OR: [
            { url: url },
            { fileName: key }
          ]
        }
      });
      
      if (file) {
        url = await getSignedUrlForB2(file.fileName, 3600);
      }
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
}

export async function generateApplicationPDF(application: any): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Application #${application.id.substring(0, 8)} - ${application.candidate.firstName} ${application.candidate.lastName}`,
          Author: 'Jobline Recruitment Platform',
          Subject: 'Application Details',
          Keywords: 'recruitment, application, domestic worker'
        }
      });
      
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      
      // Header section
      let yPosition = 50;
      
      // Application header
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .fillColor('#1e3a5f')
         .text(`Application #${application.id.substring(0, 8).toUpperCase()}`, 50, yPosition)
         .fillColor('black');
      
      yPosition += 35;
      
      // Application type and status
      const statusColor = getStatusColor(application.status);
      doc.fontSize(12)
         .font('Helvetica')
         .fillColor('#666666')
         .text(`Type: ${application.type.replace(/_/g, ' ')}`, 50, yPosition)
         .fillColor(statusColor)
         .text(`Status: ${application.status.replace(/_/g, ' ')}`, 250, yPosition)
         .fillColor('black');
      
      yPosition += 20;
      
      // Creation date
      doc.fontSize(10)
         .fillColor('#666666')
         .text(`Created: ${new Date(application.createdAt).toLocaleDateString('en-US', { 
           year: 'numeric', 
           month: 'long', 
           day: 'numeric' 
         })}`, 50, yPosition)
         .fillColor('black');
      
      yPosition += 30;
      
      // Separator line
      doc.moveTo(50, yPosition)
         .lineTo(545, yPosition)
         .stroke('#e0e0e0');
      
      yPosition += 30;
      
      // Client Information Section
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .fillColor('#1e3a5f')
         .text('Client Information', 50, yPosition)
         .fillColor('black');
      
      yPosition += 30;
      
      // Client details
      const client = application.client;
      doc.fontSize(11).font('Helvetica');
      
      addInfoField(doc, 'Name', client.name, 50, yPosition);
      yPosition += 35;
      
      if (client.phone) {
        addInfoField(doc, 'Phone', client.phone, 50, yPosition);
        yPosition += 35;
      }
      
      if (client.email) {
        addInfoField(doc, 'Email', client.email, 50, yPosition);
        yPosition += 35;
      }
      
      if (client.address) {
        addInfoField(doc, 'Address', client.address, 50, yPosition);
        yPosition += 35;
      }
      
      yPosition += 20;
      
      // Separator line
      doc.moveTo(50, yPosition)
         .lineTo(545, yPosition)
         .stroke('#e0e0e0');
      
      yPosition += 30;
      
      // Candidate Information Section
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .fillColor('#1e3a5f')
         .text('Candidate Information', 50, yPosition)
         .fillColor('black');
      
      yPosition += 30;
      
      // Try to embed candidate photos in a side panel
      const candidate = application.candidate;
      let photoAreaUsed = false;
      
      // Try to embed face photo
      const facePhotoUrl = candidate.facePhotoUrl || candidate.photoUrl;
      if (facePhotoUrl) {
        const imageBuffer = await fetchImageBuffer(facePhotoUrl);
        if (imageBuffer) {
          try {
            doc.image(imageBuffer, 450, yPosition, { 
              width: 90,
              height: 110,
              fit: [90, 110],
              align: 'center',
              valign: 'center'
            });
            photoAreaUsed = true;
          } catch (imgError) {
            console.error('Error embedding face photo:', imgError);
            doc.rect(450, yPosition, 90, 110).stroke('#cccccc');
            doc.fontSize(9)
               .fillColor('#999999')
               .text('Photo', 475, yPosition + 50, { width: 40, align: 'center' })
               .fillColor('black');
            photoAreaUsed = true;
          }
        }
      }
      
      // Candidate details (left side)
      const leftColumnX = 50;
      const rightColumnX = 250;
      let leftY = yPosition;
      let rightY = yPosition;
      
      // Name
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#333333')
         .text(`${candidate.firstName} ${candidate.lastName}`, leftColumnX, leftY)
         .fillColor('black');
      leftY += 25;
      
      // Status
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor(getStatusColor(candidate.status))
         .text(candidate.status.replace(/_/g, ' '), leftColumnX, leftY)
         .fillColor('black');
      leftY += 30;
      
      // Personal details - Left column
      doc.fontSize(11).font('Helvetica');
      
      addInfoField(doc, 'Nationality', candidate.nationality || 'Not specified', leftColumnX, leftY);
      leftY += 35;
      
      if (candidate.dateOfBirth) {
        const age = calculateAge(new Date(candidate.dateOfBirth));
        addInfoField(doc, 'Date of Birth', 
          `${new Date(candidate.dateOfBirth).toLocaleDateString()} (${age} years)`, 
          leftColumnX, leftY);
        leftY += 35;
      }
      
      // Height
      if (candidate.height) {
        addInfoField(doc, 'Height', candidate.height, leftColumnX, leftY);
        leftY += 35;
      }
      
      // Weight
      if (candidate.weight) {
        addInfoField(doc, 'Weight', candidate.weight, leftColumnX, leftY);
        leftY += 35;
      }
      
      // Right column
      addInfoField(doc, 'Education', candidate.education || 'Not specified', rightColumnX, rightY);
      rightY += 35;
      
      // Skills
      if (candidate.skills && candidate.skills.length > 0) {
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#666666')
           .text('SKILLS', rightColumnX, rightY)
           .fontSize(11)
           .font('Helvetica-Bold')
           .fillColor('#333333');
        
        rightY += 12;
        const skillsText = candidate.skills.join(', ');
        doc.text(skillsText, rightColumnX, rightY, { width: 180 });
        rightY += doc.heightOfString(skillsText, { width: 180 }) + 20;
      }
      
      yPosition = Math.max(leftY, rightY, photoAreaUsed ? yPosition + 120 : yPosition);
      
      // Experience Summary
      if (candidate.experienceSummary) {
        yPosition += 20;
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#1e3a5f')
           .text('Experience Summary', 50, yPosition)
           .fillColor('black');
        
        yPosition += 20;
        
        doc.fontSize(10)
           .font('Helvetica')
           .text(candidate.experienceSummary, 50, yPosition, {
             width: 495,
             align: 'justify',
             lineGap: 3
           });
        
        yPosition += doc.heightOfString(candidate.experienceSummary, { width: 495 }) + 20;
      }
      
      // Check if we need a new page
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 50;
      }
      
      // Financial Information Section (if fee is set)
      if (application.finalFeeAmount || application.feeTemplate) {
        yPosition += 20;
        
        // Separator line
        doc.moveTo(50, yPosition)
           .lineTo(545, yPosition)
           .stroke('#e0e0e0');
        
        yPosition += 30;
        
        doc.fontSize(18)
           .font('Helvetica-Bold')
           .fillColor('#1e3a5f')
           .text('Fee Information', 50, yPosition)
           .fillColor('black');
        
        yPosition += 30;
        
        if (application.feeTemplate) {
          addInfoField(doc, 'Fee Template', application.feeTemplate.name, 50, yPosition);
          yPosition += 35;
        }
        
        if (application.finalFeeAmount) {
          doc.fontSize(9)
             .font('Helvetica')
             .fillColor('#666666')
             .text('AGREED FEE', 50, yPosition)
             .fontSize(16)
             .font('Helvetica-Bold')
             .fillColor('#4CAF50')
             .text(`$${application.finalFeeAmount}`, 50, yPosition + 12)
             .fillColor('black');
          yPosition += 45;
        }
      }
      
      // Broker Information (if assigned)
      if (application.broker) {
        if (yPosition > 650) {
          doc.addPage();
          yPosition = 50;
        }
        
        yPosition += 20;
        
        // Separator line
        doc.moveTo(50, yPosition)
           .lineTo(545, yPosition)
           .stroke('#e0e0e0');
        
        yPosition += 30;
        
        doc.fontSize(18)
           .font('Helvetica-Bold')
           .fillColor('#1e3a5f')
           .text('Broker Information', 50, yPosition)
           .fillColor('black');
        
        yPosition += 30;
        
        addInfoField(doc, 'Broker Name', application.broker.name, 50, yPosition);
        yPosition += 35;
        
        if (application.broker.contactDetails) {
          addInfoField(doc, 'Contact', application.broker.contactDetails, 50, yPosition);
          yPosition += 35;
        }
      }
      
      // Footer on every page
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        
        // Footer line
        doc.moveTo(50, doc.page.height - 120)
           .lineTo(doc.page.width - 50, doc.page.height - 120)
           .stroke('#e0e0e0');
        
        // Get company info
        const companyName = application.company?.name || 'Jobline Recruitment Platform';
        
        // Footer text
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#888888')
           .text(
             `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
             50,
             doc.page.height - 100,
             { align: 'center', width: doc.page.width - 100 }
           )
           .text(
             `Page ${i + 1} of ${pages.count}`,
             50,
             doc.page.height - 85,
             { align: 'center', width: doc.page.width - 100 }
           )
           .text(
             `© ${new Date().getFullYear()} ${companyName} - Confidential`,
             50,
             doc.page.height - 70,
             { align: 'center', width: doc.page.width - 100 }
           );
      }
      
      // Finalize PDF
      doc.end();
      
    } catch (error) {
      console.error('PDF generation error:', error);
      reject(error);
    }
  });
}

export async function generateCandidatePDF(candidate: any): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `${candidate.firstName} ${candidate.lastName} - Candidate Profile`,
          Author: 'Jobline Recruitment Platform',
          Subject: 'Candidate Profile',
          Keywords: 'recruitment, candidate, profile'
        }
      });
      
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      
      // Header section with actual photos
      let yPosition = 50;
      let photoAreaUsed = false;
      
      // Try to embed face photo
      const facePhotoUrl = candidate.facePhotoUrl || candidate.photoUrl;
      if (facePhotoUrl) {
        const imageBuffer = await fetchImageBuffer(facePhotoUrl);
        if (imageBuffer) {
          try {
            // Add the image to PDF (100x120 for face photo)
            doc.image(imageBuffer, 450, 50, { 
              width: 100,
              height: 120,
              fit: [100, 120],
              align: 'center',
              valign: 'center'
            });
            photoAreaUsed = true;
          } catch (imgError) {
            console.error('Error embedding face photo:', imgError);
            // Draw placeholder frame if image fails
            doc.rect(450, 50, 100, 120).stroke('#cccccc');
            doc.fontSize(10)
               .fillColor('#999999')
               .text('Face Photo', 465, 105, { width: 70, align: 'center' })
               .fillColor('black');
            photoAreaUsed = true;
          }
        } else {
          // Draw placeholder frame if image not found
          doc.rect(450, 50, 100, 120).stroke('#cccccc');
          doc.fontSize(10)
             .fillColor('#999999')
             .text('Face Photo', 465, 105, { width: 70, align: 'center' })
             .fillColor('black');
          photoAreaUsed = true;
        }
      }
      
      // Try to embed full body photo
      if (candidate.fullBodyPhotoUrl) {
        const imageBuffer = await fetchImageBuffer(candidate.fullBodyPhotoUrl);
        if (imageBuffer) {
          try {
            // Add the image to PDF (100x140 for full body)
            doc.image(imageBuffer, 450, 180, { 
              width: 100,
              height: 140,
              fit: [100, 140],
              align: 'center',
              valign: 'center'
            });
            photoAreaUsed = true;
          } catch (imgError) {
            console.error('Error embedding full body photo:', imgError);
            // Draw placeholder frame if image fails
            doc.rect(450, 180, 100, 140).stroke('#cccccc');
            doc.fontSize(10)
               .fillColor('#999999')
               .text('Full Body', 465, 245, { width: 70, align: 'center' })
               .fillColor('black');
          }
        } else if (photoAreaUsed) {
          // Only show full body placeholder if we already have a face photo area
          doc.rect(450, 180, 100, 140).stroke('#cccccc');
          doc.fontSize(10)
             .fillColor('#999999')
             .text('Full Body', 465, 245, { width: 70, align: 'center' })
             .fillColor('black');
        }
      }
      
      // Candidate name
      doc.fontSize(26)
         .font('Helvetica-Bold')
         .fillColor('#1e3a5f')
         .text(`${candidate.firstName} ${candidate.lastName}`, 50, yPosition)
         .fillColor('black');
      
      yPosition += 40;
      
      // Status badge with better styling
      const statusText = candidate.status.replace(/_/g, ' ').toUpperCase();
      const statusColor = getStatusColor(candidate.status);
      
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor(statusColor)
         .text(statusText, 50, yPosition)
         .fillColor('black');
      
      yPosition += 20;
      
      // Candidate ID
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#666666')
         .text(`ID: ${candidate.id.substring(0, 8).toUpperCase()}`, 50, yPosition)
         .fillColor('black');
      
      yPosition += 30;
      
      // Separator line
      doc.moveTo(50, yPosition)
         .lineTo(400, yPosition)
         .stroke('#e0e0e0');
      
      yPosition += 25;
      
      // Personal Information Section
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#1e3a5f')
         .text('Personal Information', 50, yPosition)
         .fillColor('black');
      
      yPosition += 30;
      
      // Create two-column layout for personal info
      const leftColumnX = 50;
      const rightColumnX = 300;
      let leftY = yPosition;
      let rightY = yPosition;
      
      // Left column
      doc.fontSize(11);
      
      addInfoField(doc, 'Nationality', candidate.nationality || 'Not specified', leftColumnX, leftY);
      leftY += 35;
      
      addInfoField(doc, 'Date of Birth', 
        candidate.dateOfBirth ? new Date(candidate.dateOfBirth).toLocaleDateString() : 'Not specified', 
        leftColumnX, leftY);
      leftY += 35;
      
      if (candidate.dateOfBirth) {
        addInfoField(doc, 'Age', `${calculateAge(new Date(candidate.dateOfBirth))} years`, leftColumnX, leftY);
        leftY += 35;
      }
      
      // Add Height
      if (candidate.height) {
        addInfoField(doc, 'Height', candidate.height, leftColumnX, leftY);
        leftY += 35;
      }
      
      // Add Weight
      if (candidate.weight) {
        addInfoField(doc, 'Weight', candidate.weight, leftColumnX, leftY);
        leftY += 35;
      }
      
      // Right column
      addInfoField(doc, 'Education', candidate.education || 'Not specified', rightColumnX, rightY);
      rightY += 35;
      
      if (candidate.agent) {
        addInfoField(doc, 'Agent', candidate.agent.name, rightColumnX, rightY);
        rightY += 35;
      }
      
      yPosition = Math.max(leftY, rightY) + 20;
      
      // Skills Section
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#1e3a5f')
         .text('Skills & Expertise', 50, yPosition)
         .fillColor('black');
      
      yPosition += 25;
      
      if (candidate.skills && candidate.skills.length > 0) {
        // Draw skill chips
        let xPos = 50;
        let lineY = yPosition;
        const chipHeight = 25;
        const chipPadding = 10;
        
        doc.fontSize(10).font('Helvetica');
        
        candidate.skills.forEach((skill: string) => {
          const skillWidth = doc.widthOfString(skill) + chipPadding * 2;
          
          // Check if we need to wrap to next line
          if (xPos + skillWidth > 550) {
            xPos = 50;
            lineY += chipHeight + 5;
          }
          
          // Draw skill chip
          doc.roundedRect(xPos, lineY, skillWidth, chipHeight, 12)
             .stroke('#4a6fa5');
          
          doc.fillColor('#4a6fa5')
             .text(skill, xPos + chipPadding, lineY + 7)
             .fillColor('black');
          
          xPos += skillWidth + 5;
        });
        
        yPosition = lineY + chipHeight + 20;
      } else {
        doc.fontSize(11)
           .font('Helvetica')
           .fillColor('#999999')
           .text('No skills listed', 50, yPosition)
           .fillColor('black');
        yPosition += 25;
      }
      
      // Experience Summary Section
      yPosition += 15;
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#1e3a5f')
         .text('Experience Summary', 50, yPosition)
         .fillColor('black');
      
      yPosition += 25;
      
      doc.fontSize(11)
         .font('Helvetica')
         .text(candidate.experienceSummary || 'No experience summary provided.', 50, yPosition, {
           width: 500,
           align: 'justify',
           lineGap: 3
         });
      
      yPosition += doc.heightOfString(candidate.experienceSummary || 'No experience summary provided.', {
        width: 500
      }) + 30;
      
      // Employment History Section (if available)
      if (candidate.applications && candidate.applications.length > 0) {
        // Check if we need a new page
        if (yPosition > 600) {
          doc.addPage();
          yPosition = 50;
        }
        
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .fillColor('#1e3a5f')
           .text('Employment History', 50, yPosition)
           .fillColor('black');
        
        yPosition += 25;
        
        candidate.applications.forEach((app: any, index: number) => {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }
          
          // Draw timeline marker
          doc.circle(45, yPosition + 5, 3)
             .fillAndStroke('#4a6fa5', '#4a6fa5');
          
          // Draw connecting line (except for last item)
          if (index < candidate.applications.length - 1) {
            doc.moveTo(45, yPosition + 8)
               .lineTo(45, yPosition + 45)
               .stroke('#cccccc');
          }
          
          // Employment details
          doc.fontSize(12)
             .font('Helvetica-Bold')
             .fillColor('#333333')
             .text(app.client?.name || 'Unknown Client', 60, yPosition)
             .fillColor('black');
          
          doc.fontSize(10)
             .font('Helvetica')
             .fillColor('#666666')
             .text(
               `${new Date(app.createdAt).toLocaleDateString()} - ${
                 app.status === 'ACTIVE_EMPLOYMENT' ? 'Present' : new Date(app.updatedAt).toLocaleDateString()
               }`,
               60,
               yPosition + 15
             );
          
          // Status
          doc.fontSize(9)
             .fillColor(getStatusColor(app.status))
             .text(app.status.replace(/_/g, ' '), 60, yPosition + 28)
             .fillColor('black');
          
          yPosition += 50;
        });
      }
      
      // Footer on every page
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        
        // Footer line
        doc.moveTo(50, doc.page.height - 120)
           .lineTo(doc.page.width - 50, doc.page.height - 120)
           .stroke('#e0e0e0');
        
        // Get company info from candidate
        const companyName = candidate.company?.name || 'Jobline Recruitment Platform';
        
        // Footer text
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#888888')
           .text(
             `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
             50,
             doc.page.height - 100,
             { align: 'center', width: doc.page.width - 100 }
           )
           .text(
             `Page ${i + 1} of ${pages.count}`,
             50,
             doc.page.height - 85,
             { align: 'center', width: doc.page.width - 100 }
           )
           .text(
             `© ${new Date().getFullYear()} ${companyName} - Confidential`,
             50,
             doc.page.height - 70,
             { align: 'center', width: doc.page.width - 100 }
           );
      }
      
      // Finalize PDF
      doc.end();
      
    } catch (error) {
      console.error('PDF generation error:', error);
      reject(error);
    }
  });
}

function addInfoField(doc: any, label: string, value: string, x: number, y: number) {
  doc.fontSize(9)
     .font('Helvetica')
     .fillColor('#666666')
     .text(label.toUpperCase(), x, y)
     .fontSize(11)
     .font('Helvetica-Bold')
     .fillColor('#333333')
     .text(value, x, y + 12)
     .fillColor('black');
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'AVAILABLE_ABROAD':
    case 'AVAILABLE_IN_LEBANON':
      return '#4CAF50'; // Green
    case 'RESERVED':
      return '#FF9800'; // Orange
    case 'PLACED':
    case 'ACTIVE_EMPLOYMENT':
      return '#9C27B0'; // Purple
    case 'IN_PROCESS':
      return '#2196F3'; // Blue
    case 'CONTRACT_ENDED':
      return '#757575'; // Grey
    case 'PENDING_MOL':
    case 'RENEWAL_PENDING':
      return '#FF9800'; // Orange
    case 'MOL_AUTH_RECEIVED':
    case 'VISA_RECEIVED':
    case 'WORKER_ARRIVED':
      return '#4CAF50'; // Green
    case 'VISA_PROCESSING':
    case 'LABOUR_PERMIT_PROCESSING':
    case 'RESIDENCY_PERMIT_PROCESSING':
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

import puppeteer from 'puppeteer';
import { Candidate } from '@prisma/client';

export async function generateCandidatePDF(candidate: any): Promise<Buffer> {
  // Create HTML template for the candidate
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 30px;
          border-bottom: 2px solid #2196F3;
          padding-bottom: 20px;
        }
        .photo-container {
          width: 120px;
          height: 150px;
          border: 1px solid #ddd;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f5;
        }
        .photo {
          max-width: 100%;
          max-height: 100%;
        }
        .candidate-name {
          font-size: 28px;
          font-weight: bold;
          color: #2196F3;
          margin-bottom: 5px;
        }
        .status-badge {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          margin-top: 10px;
        }
        .status-available { background: #4CAF50; color: white; }
        .status-reserved { background: #FF9800; color: white; }
        .status-placed { background: #9C27B0; color: white; }
        .status-process { background: #2196F3; color: white; }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #2196F3;
          margin-bottom: 10px;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 5px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-top: 10px;
        }
        .info-item {
          display: flex;
          flex-direction: column;
        }
        .info-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 2px;
        }
        .info-value {
          font-size: 14px;
          font-weight: 500;
        }
        .skills-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }
        .skill-chip {
          background: #E3F2FD;
          color: #1976D2;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 13px;
        }
        .experience-text {
          line-height: 1.6;
          color: #555;
          margin-top: 10px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          text-align: center;
          font-size: 12px;
          color: #888;
        }
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 120px;
          color: rgba(0, 0, 0, 0.05);
          z-index: -1;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="watermark">JOBLINE</div>
      
      <div class="header">
        <div>
          <div class="candidate-name">${candidate.firstName} ${candidate.lastName}</div>
          <div style="color: #666; font-size: 14px;">Candidate ID: ${candidate.id.substring(0, 8)}</div>
          <div class="status-badge ${getStatusClass(candidate.status)}">
            ${candidate.status.replace(/_/g, ' ')}
          </div>
        </div>
        <div class="photo-container">
          ${candidate.photoUrl ? 
            `<img src="${candidate.photoUrl}" alt="Photo" class="photo" />` :
            `<div style="color: #999;">No Photo</div>`
          }
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Personal Information</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Nationality</div>
            <div class="info-value">${candidate.nationality}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Date of Birth</div>
            <div class="info-value">${candidate.dateOfBirth ? 
              new Date(candidate.dateOfBirth).toLocaleDateString() : 'Not specified'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Age</div>
            <div class="info-value">${candidate.dateOfBirth ? 
              calculateAge(new Date(candidate.dateOfBirth)) : 'Not specified'} years</div>
          </div>
          <div class="info-item">
            <div class="info-label">Education</div>
            <div class="info-value">${candidate.education || 'Not specified'}</div>
          </div>
          ${candidate.agent ? `
          <div class="info-item">
            <div class="info-label">Agent</div>
            <div class="info-value">${candidate.agent.name}</div>
          </div>
          ` : ''}
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Skills & Expertise</div>
        ${candidate.skills && candidate.skills.length > 0 ? `
          <div class="skills-container">
            ${candidate.skills.map((skill: string) => 
              `<div class="skill-chip">${skill}</div>`
            ).join('')}
          </div>
        ` : '<div style="color: #999; margin-top: 10px;">No skills listed</div>'}
      </div>
      
      <div class="section">
        <div class="section-title">Experience Summary</div>
        <div class="experience-text">
          ${candidate.experienceSummary || 'No experience summary provided.'}
        </div>
      </div>
      
      ${candidate.applications && candidate.applications.length > 0 ? `
      <div class="section">
        <div class="section-title">Employment History</div>
        <div style="margin-top: 10px;">
          ${candidate.applications.map((app: any) => `
            <div style="margin-bottom: 10px; padding: 10px; background: #f9f9f9; border-radius: 4px;">
              <div style="font-weight: 500;">${app.client?.name || 'Unknown Client'}</div>
              <div style="font-size: 12px; color: #666;">
                ${new Date(app.createdAt).toLocaleDateString()} - 
                ${app.status === 'ACTIVE_EMPLOYMENT' ? 'Present' : new Date(app.updatedAt).toLocaleDateString()}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
      
      <div class="footer">
        <div>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
        <div style="margin-top: 5px;">© ${new Date().getFullYear()} Jobline Recruitment Platform - Confidential</div>
      </div>
    </body>
    </html>
  `;
  
  // Launch puppeteer and generate PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });
    
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'AVAILABLE_ABROAD':
    case 'AVAILABLE_IN_LEBANON':
      return 'status-available';
    case 'RESERVED':
      return 'status-reserved';
    case 'PLACED':
      return 'status-placed';
    case 'IN_PROCESS':
      return 'status-process';
    default:
      return '';
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

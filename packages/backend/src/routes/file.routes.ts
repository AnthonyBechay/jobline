import { Router } from 'express';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../index';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { uploadToB2, deleteFromB2, getSignedUrlForB2 } from '../services/backblaze.service';

const router = Router();

// Configure multer for temporary file storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// All routes require authentication
router.use(authenticate);
router.use(adminOnly);

// Upload files
router.post('/upload', upload.array('files', 10), async (req: AuthRequest, res) => {
  try {
    const { entityType, entityId } = req.body;
    const companyId = req.user!.companyId;
    // Cast req to any to access files property safely
    const reqFiles = (req as any).files;
    const files = Array.isArray(reqFiles) ? reqFiles : [];
    
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files provided' });
      return;
    }
    
    if (!entityType || !entityId) {
      res.status(400).json({ error: 'Entity type and ID are required' });
      return;
    }
    
    // Verify entity belongs to company
    let validEntity = false;
    switch (entityType) {
      case 'application':
        const application = await prisma.application.findFirst({
          where: { id: entityId, companyId },
        });
        validEntity = !!application;
        break;
      case 'client':
        const client = await prisma.client.findFirst({
          where: { id: entityId, companyId },
        });
        validEntity = !!client;
        break;
      case 'candidate':
        const candidate = await prisma.candidate.findFirst({
          where: { id: entityId, companyId },
        });
        validEntity = !!candidate;
        break;
      default:
        res.status(400).json({ error: 'Invalid entity type' });
        return;
    }
    
    if (!validEntity) {
      res.status(404).json({ error: `${entityType} not found` });
      return;
    }
    
    const uploadedFiles: any[] = [];
    
    for (const file of files) {
      try {
        // Upload to Backblaze B2
        const folder = `${companyId}/${entityType}/${entityId}`;
        const b2Result = await uploadToB2(file.buffer, file.originalname, {
          folder,
          contentType: file.mimetype,
        });
        
        // Save file record to database
        const fileRecord = await prisma.file.create({
          data: {
            entityType,
            entityId,
            fileName: b2Result.key,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            url: b2Result.url,
            cloudinaryId: b2Result.key, // Store B2 key in same field
            uploadedBy: req.user!.id,
            companyId,
          },
          include: {
            uploader: {
              select: {
                name: true,
              },
            },
          },
        });
        
        uploadedFiles.push({
          id: fileRecord.id,
          fileName: fileRecord.fileName,
          originalName: fileRecord.originalName,
          mimeType: fileRecord.mimeType,
          size: Number(fileRecord.size),
          url: fileRecord.url,
          uploadedAt: fileRecord.createdAt,
          uploadedBy: fileRecord.uploader?.name || 'Unknown',
        });
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        // Continue with other files even if one fails
      }
    }
    
    if (uploadedFiles.length === 0) {
      res.status(500).json({ error: 'Failed to upload any files' });
      return;
    }
    
    res.json(uploadedFiles);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Get files for an entity
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { entityType, entityId } = req.query;
    const companyId = req.user!.companyId;
    
    if (!entityType || !entityId) {
      res.status(400).json({ error: 'Entity type and ID are required' });
      return;
    }
    
    const files = await prisma.file.findMany({
      where: {
        entityType: entityType as string,
        entityId: entityId as string,
        companyId,
      },
      include: {
        uploader: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Generate fresh signed URLs for each file
    const formattedFiles = await Promise.all(
      files.map(async (file) => {
        // Generate a new signed URL that expires in 1 hour
        const signedUrl = await getSignedUrlForB2(file.fileName, 3600);
        
        return {
          id: file.id,
          fileName: file.fileName,
          originalName: file.originalName,
          mimeType: file.mimeType,
          size: Number(file.size), // Convert BigInt to number
          url: signedUrl,
          uploadedAt: file.createdAt,
          uploadedBy: file.uploader?.name || 'Unknown',
        };
      })
    );
    
    res.json(formattedFiles);
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Get a single file with fresh signed URL
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    
    const file = await prisma.file.findFirst({
      where: { id, companyId },
      include: {
        uploader: {
          select: {
            name: true,
          },
        },
      },
    });
    
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    
    // Generate a new signed URL
    const signedUrl = await getSignedUrlForB2(file.fileName, 3600);
    
    res.json({
      id: file.id,
      fileName: file.fileName,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: Number(file.size),
      url: signedUrl,
      uploadedAt: file.createdAt,
      uploadedBy: file.uploader?.name || 'Unknown',
    });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

// Delete a file
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    
    // Get the file record
    const file = await prisma.file.findFirst({
      where: { id, companyId },
    });
    
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    
    // Delete from Backblaze B2
    if (file.cloudinaryId) {
      await deleteFromB2(file.cloudinaryId);
    }
    
    // Delete from database
    await prisma.file.delete({
      where: { id },
    });
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Generate a new signed URL for a file (useful for refreshing expired URLs)
router.post('/:id/refresh-url', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { expiresIn = 3600 } = req.body; // Default 1 hour
    const companyId = req.user!.companyId;
    
    const file = await prisma.file.findFirst({
      where: { id, companyId },
    });
    
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    
    // Generate a new signed URL
    const signedUrl = await getSignedUrlForB2(file.fileName, expiresIn);
    
    res.json({ url: signedUrl });
  } catch (error) {
    console.error('Refresh URL error:', error);
    res.status(500).json({ error: 'Failed to refresh file URL' });
  }
});

export default router;

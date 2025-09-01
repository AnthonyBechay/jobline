import { Router } from 'express';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth.middleware';
import { searchFiles, getSignedUrlForB2, getFileMetadata } from '../services/backblaze.service';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(adminOnly);

/**
 * Search for documents across the system
 * Useful for finding old application documents, client files, etc.
 */
router.get('/search', async (req: AuthRequest, res) => {
  try {
    const companyId = req.user!.companyId;
    const { 
      entityType, 
      entityName, 
      year, 
      month, 
      documentType,
      limit = 50 
    } = req.query;
    
    // Validate parameters
    if (entityType && !['application', 'client', 'candidate', 'company'].includes(entityType as string)) {
      res.status(400).json({ error: 'Invalid entity type' });
      return;
    }
    
    // Search for files
    const files = await searchFiles(companyId, {
      entityType: entityType as any,
      entityName: entityName as string,
      year: year ? parseInt(year as string) : undefined,
      month: month ? parseInt(month as string) : undefined,
      documentType: documentType as string,
    });
    
    // Limit results
    const limitedFiles = files.slice(0, parseInt(limit as string));
    
    // Generate signed URLs for each file
    const filesWithUrls = await Promise.all(
      limitedFiles.map(async (file) => {
        const signedUrl = await getSignedUrlForB2(file.key, 3600);
        
        // Extract some useful info from the key
        const pathParts = file.key.split('/');
        const fileName = pathParts[pathParts.length - 1];
        
        // Try to determine entity info from path
        let entityInfo: any = {};
        if (file.key.includes('/applications/')) {
          entityInfo.type = 'application';
          // Extract app number if possible
          const appMatch = file.key.match(/\/([A-Z0-9]{8})-/);
          if (appMatch) {
            entityInfo.applicationNumber = appMatch[1];
          }
        } else if (file.key.includes('/clients/')) {
          entityInfo.type = 'client';
        } else if (file.key.includes('/candidates/')) {
          entityInfo.type = 'candidate';
        } else if (file.key.includes('/company-documents/')) {
          entityInfo.type = 'company';
        }
        
        return {
          key: file.key,
          fileName,
          size: file.size,
          lastModified: file.lastModified,
          url: signedUrl,
          entityInfo,
        };
      })
    );
    
    res.json({
      files: filesWithUrls,
      total: files.length,
      limited: files.length > limitedFiles.length,
    });
  } catch (error) {
    console.error('Document search error:', error);
    res.status(500).json({ error: 'Failed to search documents' });
  }
});

/**
 * Get metadata for a specific file
 */
router.get('/metadata', async (req: AuthRequest, res) => {
  try {
    const { key } = req.query;
    
    if (!key) {
      res.status(400).json({ error: 'File key is required' });
      return;
    }
    
    const metadata = await getFileMetadata(key as string);
    
    // Generate a signed URL for the file
    const signedUrl = await getSignedUrlForB2(key as string, 3600);
    
    res.json({
      ...metadata,
      url: signedUrl,
    });
  } catch (error) {
    console.error('Get metadata error:', error);
    res.status(500).json({ error: 'Failed to get file metadata' });
  }
});

/**
 * Generate a new signed URL for a file
 * Useful when URLs expire
 */
router.post('/refresh-url', async (req: AuthRequest, res) => {
  try {
    const { key, expiresIn = 3600 } = req.body;
    
    if (!key) {
      res.status(400).json({ error: 'File key is required' });
      return;
    }
    
    const signedUrl = await getSignedUrlForB2(key, expiresIn);
    
    res.json({ url: signedUrl });
  } catch (error) {
    console.error('Refresh URL error:', error);
    res.status(500).json({ error: 'Failed to refresh URL' });
  }
});

export default router;
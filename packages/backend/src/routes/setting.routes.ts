import { Router } from 'express';
import { authenticate, superAdminOnly, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../index';

const router = Router();

router.use(authenticate);
router.use(superAdminOnly);

// Get all settings (company-specific)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const companyId = req.user!.companyId;
    
    const settings = await prisma.setting.findMany({
      where: { companyId },
      orderBy: { key: 'asc' },
    });
    
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Get setting by key (company-specific)
router.get('/:key', async (req: AuthRequest, res) => {
  try {
    const { key } = req.params;
    const companyId = req.user!.companyId;
    
    const setting = await prisma.setting.findFirst({
      where: { 
        key,
        companyId,
      },
    });
    
    if (!setting) {
      res.status(404).json({ error: 'Setting not found' });
      return;
    }
    
    res.json(setting);
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// Create or update setting (company-specific)
router.put('/:key', async (req: AuthRequest, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    const companyId = req.user!.companyId;
    
    const setting = await prisma.setting.upsert({
      where: { 
        companyId_key: {
          companyId,
          key,
        },
      },
      update: { value, description },
      create: { key, value, description, companyId },
    });
    
    res.json(setting);
  } catch (error) {
    console.error('Upsert setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Delete setting (company-specific)
router.delete('/:key', async (req: AuthRequest, res) => {
  try {
    const { key } = req.params;
    const companyId = req.user!.companyId;
    
    const setting = await prisma.setting.findFirst({
      where: { key, companyId },
    });
    
    if (!setting) {
      res.status(404).json({ error: 'Setting not found' });
      return;
    }
    
    await prisma.setting.delete({
      where: { id: setting.id },
    });
    
    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({ error: 'Failed to delete setting' });
  }
});

// Get document templates (company-specific)
router.get('/documents/templates', async (req: AuthRequest, res) => {
  try {
    const companyId = req.user!.companyId;
    
    const templates = await prisma.documentTemplate.findMany({
      where: { companyId },
      orderBy: [{ stage: 'asc' }, { order: 'asc' }],
    });
    
    res.json(templates);
  } catch (error) {
    console.error('Get document templates error:', error);
    res.status(500).json({ error: 'Failed to fetch document templates' });
  }
});

// Create document template (company-specific)
router.post('/documents/templates', async (req: AuthRequest, res) => {
  try {
    const { stage, name, required, order } = req.body;
    const companyId = req.user!.companyId;
    
    const template = await prisma.documentTemplate.create({
      data: {
        stage,
        name,
        required,
        order,
        companyId,
      },
    });
    
    res.status(201).json(template);
  } catch (error) {
    console.error('Create document template error:', error);
    res.status(500).json({ error: 'Failed to create document template' });
  }
});

// Update document template (company-specific)
router.put('/documents/templates/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { stage, name, required, order } = req.body;
    const companyId = req.user!.companyId;
    
    // Check template belongs to company
    const existingTemplate = await prisma.documentTemplate.findFirst({
      where: { id, companyId },
    });
    
    if (!existingTemplate) {
      res.status(404).json({ error: 'Document template not found' });
      return;
    }
    
    const template = await prisma.documentTemplate.update({
      where: { id },
      data: {
        stage,
        name,
        required,
        order,
      },
    });
    
    res.json(template);
  } catch (error) {
    console.error('Update document template error:', error);
    res.status(500).json({ error: 'Failed to update document template' });
  }
});

// Delete document template (company-specific)
router.delete('/documents/templates/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    
    // Check template belongs to company
    const template = await prisma.documentTemplate.findFirst({
      where: { id, companyId },
    });
    
    if (!template) {
      res.status(404).json({ error: 'Document template not found' });
      return;
    }
    
    await prisma.documentTemplate.delete({
      where: { id },
    });
    
    res.json({ message: 'Document template deleted successfully' });
  } catch (error) {
    console.error('Delete document template error:', error);
    res.status(500).json({ error: 'Failed to delete document template' });
  }
});

// Get nationalities (company-specific)
router.get('/nationalities', async (req: AuthRequest, res) => {
  try {
    const companyId = req.user!.companyId;
    
    const nationalitiesSetting = await prisma.setting.findFirst({
      where: { 
        key: 'nationalities',
        companyId,
      },
    });
    
    // Default nationalities list
    const defaultNationalities = [
      'Ethiopian', 'Filipino', 'Sri Lankan', 'Bangladeshi', 'Kenyan',
      'Nigerian', 'Ugandan', 'Ghanaian', 'Nepalese', 'Indian'
    ];
    
    const nationalities = nationalitiesSetting?.value || defaultNationalities;
    res.json(nationalities);
  } catch (error) {
    console.error('Get nationalities error:', error);
    res.status(500).json({ error: 'Failed to fetch nationalities' });
  }
});

// Update nationalities (company-specific)
router.put('/nationalities', async (req: AuthRequest, res) => {
  try {
    const { nationalities } = req.body;
    const companyId = req.user!.companyId;
    
    if (!Array.isArray(nationalities)) {
      res.status(400).json({ error: 'Nationalities must be an array' });
      return;
    }
    
    const setting = await prisma.setting.upsert({
      where: { 
        companyId_key: {
          companyId,
          key: 'nationalities',
        },
      },
      update: { value: nationalities },
      create: { 
        key: 'nationalities', 
        value: nationalities, 
        description: 'List of available nationalities for candidates',
        companyId 
      },
    });
    
    res.json(nationalities);
  } catch (error) {
    console.error('Update nationalities error:', error);
    res.status(500).json({ error: 'Failed to update nationalities' });
  }
});

export default router;
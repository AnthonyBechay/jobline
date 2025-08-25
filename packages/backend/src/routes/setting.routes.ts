import { Router } from 'express';
import { authenticate, superAdminOnly } from '../middleware/auth.middleware';
import { prisma } from '../index';

const router = Router();

router.use(authenticate);
router.use(superAdminOnly);

// Get all settings
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.setting.findMany({
      orderBy: { key: 'asc' },
    });
    
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Get setting by key
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    const setting = await prisma.setting.findUnique({
      where: { key },
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

// Create or update setting
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    
    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    });
    
    res.json(setting);
  } catch (error) {
    console.error('Upsert setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Delete setting
router.delete('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    await prisma.setting.delete({
      where: { key },
    });
    
    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({ error: 'Failed to delete setting' });
  }
});

// Get document templates
router.get('/documents/templates', async (req, res) => {
  try {
    const templates = await prisma.documentTemplate.findMany({
      orderBy: [{ stage: 'asc' }, { order: 'asc' }],
    });
    
    res.json(templates);
  } catch (error) {
    console.error('Get document templates error:', error);
    res.status(500).json({ error: 'Failed to fetch document templates' });
  }
});

// Create document template
router.post('/documents/templates', async (req, res) => {
  try {
    const { stage, name, required, order } = req.body;
    
    const template = await prisma.documentTemplate.create({
      data: {
        stage,
        name,
        required,
        order,
      },
    });
    
    res.status(201).json(template);
  } catch (error) {
    console.error('Create document template error:', error);
    res.status(500).json({ error: 'Failed to create document template' });
  }
});

// Update document template
router.put('/documents/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, name, required, order } = req.body;
    
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

// Delete document template
router.delete('/documents/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.documentTemplate.delete({
      where: { id },
    });
    
    res.json({ message: 'Document template deleted successfully' });
  } catch (error) {
    console.error('Delete document template error:', error);
    res.status(500).json({ error: 'Failed to delete document template' });
  }
});

export default router;

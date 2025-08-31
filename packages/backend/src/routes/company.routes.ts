import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Get company settings
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: {
        id: req.user!.companyId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        website: true,
        taxId: true,
        molRegistrationNumber: true,
        bankName: true,
        bankAccountNumber: true,
        bankIBAN: true,
        bankSwiftCode: true,
        licenseNumber: true,
        establishedDate: true,
        numberOfEmployees: true,
        contactPersonName: true,
        contactPersonPhone: true,
        contactPersonEmail: true,
      },
    });

    if (!company) {
      // Return empty object if company not found (for new registrations)
      res.json({ 
        id: req.user!.companyId,
        name: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        taxId: '',
        molRegistrationNumber: '',
        bankName: '',
        bankAccountNumber: '',
        bankIBAN: '',
        bankSwiftCode: '',
        licenseNumber: '',
        establishedDate: null,
        numberOfEmployees: null,
        contactPersonName: '',
        contactPersonPhone: '',
        contactPersonEmail: '',
      });
      return;
    }

    res.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Failed to fetch company settings' });
  }
});

// Update company settings (Super Admin only)
router.put('/', authenticate, authorize(UserRole.SUPER_ADMIN), async (req: AuthRequest, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      address, 
      website, 
      taxId,
      molRegistrationNumber,
      bankName,
      bankAccountNumber,
      bankIBAN,
      bankSwiftCode,
      licenseNumber,
      establishedDate,
      numberOfEmployees,
      contactPersonName,
      contactPersonPhone,
      contactPersonEmail,
    } = req.body;

    const company = await prisma.company.update({
      where: {
        id: req.user!.companyId,
      },
      data: {
        name,
        email,
        phone,
        address,
        website,
        taxId,
        molRegistrationNumber,
        bankName,
        bankAccountNumber,
        bankIBAN,
        bankSwiftCode,
        licenseNumber,
        establishedDate: establishedDate ? new Date(establishedDate) : null,
        numberOfEmployees: numberOfEmployees ? parseInt(numberOfEmployees) : null,
        contactPersonName,
        contactPersonPhone,
        contactPersonEmail,
      },
    });

    res.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ error: 'Failed to update company settings' });
  }
});

export default router;

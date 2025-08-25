import { PrismaClient, UserRole, ApplicationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create default users
  const superAdminPassword = await bcrypt.hash('Admin123!', 10);
  const adminPassword = await bcrypt.hash('Secretary123!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@jobline.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@jobline.com',
      passwordHash: superAdminPassword,
      role: UserRole.SUPER_ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'secretary@jobline.com' },
    update: {},
    create: {
      name: 'Office Secretary',
      email: 'secretary@jobline.com',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
    },
  });

  console.log('✅ Users created');

  // Create default settings
  const defaultSettings = [
    {
      key: 'office_commission',
      value: { amount: 1500, currency: 'USD' },
      description: 'Standard office commission fee',
    },
    {
      key: 'standard_visa_fee',
      value: { amount: 300, currency: 'USD' },
      description: 'Standard visa processing fee',
    },
    {
      key: 'expedited_visa_fee',
      value: { amount: 600, currency: 'USD' },
      description: 'Expedited visa processing fee',
    },
    {
      key: 'attorney_visa_fee',
      value: { amount: 800, currency: 'USD' },
      description: 'Attorney-assisted visa processing fee',
    },
    {
      key: 'renewal_reminder_days',
      value: { days: 60 },
      description: 'Days before permit expiry to show renewal reminder',
    },
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log('✅ Settings created');

  // Create document templates for each stage
  const documentTemplates = [
    // MoL Pre-Authorization documents
    { stage: ApplicationStatus.PENDING_MOL, name: 'Passport Copy', required: true, order: 1 },
    { stage: ApplicationStatus.PENDING_MOL, name: 'Medical Certificate', required: true, order: 2 },
    { stage: ApplicationStatus.PENDING_MOL, name: 'Criminal Record', required: true, order: 3 },
    { stage: ApplicationStatus.PENDING_MOL, name: 'Employment Contract', required: true, order: 4 },
    
    // Visa Application documents
    { stage: ApplicationStatus.MOL_AUTH_RECEIVED, name: 'MoL Authorization Letter', required: true, order: 1 },
    { stage: ApplicationStatus.MOL_AUTH_RECEIVED, name: 'Visa Application Form', required: true, order: 2 },
    { stage: ApplicationStatus.MOL_AUTH_RECEIVED, name: 'Sponsor ID Copy', required: true, order: 3 },
    
    // Post-Arrival documents
    { stage: ApplicationStatus.WORKER_ARRIVED, name: 'Entry Stamp Copy', required: true, order: 1 },
    { stage: ApplicationStatus.WORKER_ARRIVED, name: 'Residence Application', required: true, order: 2 },
    
    // Labour Permit documents
    { stage: ApplicationStatus.LABOUR_PERMIT_PROCESSING, name: 'Labour Permit Application', required: true, order: 1 },
    { stage: ApplicationStatus.LABOUR_PERMIT_PROCESSING, name: 'Insurance Policy', required: true, order: 2 },
    
    // Residency Permit documents
    { stage: ApplicationStatus.RESIDENCY_PERMIT_PROCESSING, name: 'Residency Application', required: true, order: 1 },
    { stage: ApplicationStatus.RESIDENCY_PERMIT_PROCESSING, name: 'Housing Contract', required: true, order: 2 },
    { stage: ApplicationStatus.RESIDENCY_PERMIT_PROCESSING, name: 'Bank Guarantee', required: true, order: 3 },
  ];

  for (const template of documentTemplates) {
    await prisma.documentTemplate.upsert({
      where: {
        stage_name: {
          stage: template.stage,
          name: template.name,
        },
      },
      update: {},
      create: template,
    });
  }

  console.log('✅ Document templates created');

  // Create sample agents
  const agents = [
    {
      name: 'Global Recruitment Agency',
      contactDetails: {
        phone: '+63 123 456 7890',
        email: 'contact@globalrecruit.ph',
        address: 'Manila, Philippines',
      },
    },
    {
      name: 'Ethiopia Talent Source',
      contactDetails: {
        phone: '+251 11 123 4567',
        email: 'info@ethiopiatalent.et',
        address: 'Addis Ababa, Ethiopia',
      },
    },
  ];

  for (const agent of agents) {
    await prisma.agent.create({
      data: agent,
    });
  }

  console.log('✅ Sample agents created');

  // Create sample brokers
  const brokers = [
    {
      name: 'Beirut Airport Services',
      contactDetails: {
        phone: '+961 1 234 567',
        email: 'services@beirutairport.lb',
        address: 'Beirut International Airport',
      },
    },
    {
      name: 'Lebanon Express Arrivals',
      contactDetails: {
        phone: '+961 1 345 678',
        email: 'info@lebanonexpress.lb',
        address: 'Beirut, Lebanon',
      },
    },
  ];

  for (const broker of brokers) {
    await prisma.broker.create({
      data: broker,
    });
  }

  console.log('✅ Sample brokers created');

  console.log('🎉 Seed completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('Super Admin: admin@jobline.com / Admin123!');
  console.log('Admin: secretary@jobline.com / Secretary123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

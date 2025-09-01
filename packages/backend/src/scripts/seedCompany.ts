import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedData {
  nationalities: Array<{ code: string; name: string }>;
  costTypes: Array<{ name: string; description: string }>;
  serviceTypes: Array<{ name: string; description: string }>;
  feeTemplates: Array<{
    name: string;
    defaultPrice: number;
    minPrice: number;
    maxPrice: number;
    nationality: string | null;
    description: string;
  }>;
  documentTemplates: Array<{
    stage: string;
    name: string;
    order: number;
    required?: boolean;
  }>;
  settings: Array<{
    key: string;
    value: any;
    description: string;
  }>;
}

const DEFAULT_SEED_DATA: SeedData = {
  nationalities: [
    { code: 'ET', name: 'Ethiopian' },
    { code: 'PH', name: 'Filipino' },
    { code: 'KE', name: 'Kenyan' },
    { code: 'UG', name: 'Ugandan' },
    { code: 'GH', name: 'Ghanaian' },
    { code: 'NG', name: 'Nigerian' },
    { code: 'BD', name: 'Bangladeshi' },
    { code: 'IN', name: 'Indian' },
    { code: 'NP', name: 'Nepalese' },
    { code: 'LK', name: 'Sri Lankan' },
    { code: 'ID', name: 'Indonesian' },
    { code: 'TH', name: 'Thai' },
    { code: 'MM', name: 'Myanmar' },
    { code: 'VN', name: 'Vietnamese' },
    { code: 'CM', name: 'Cameroonian' },
    { code: 'SN', name: 'Senegalese' },
    { code: 'BF', name: 'Burkinabe' },
    { code: 'BJ', name: 'Beninese' },
    { code: 'TG', name: 'Togolese' },
    { code: 'CI', name: 'Ivorian' },
  ],
  
  documentTemplates: [
    // MoL Pre-Authorization documents
    { stage: 'PENDING_MOL', name: 'Passport Copy', order: 1, required: true },
    { stage: 'PENDING_MOL', name: 'Medical Certificate', order: 2, required: true },
    { stage: 'PENDING_MOL', name: 'Criminal Record', order: 3, required: true },
    { stage: 'PENDING_MOL', name: 'Birth Certificate', order: 4, required: false },
    { stage: 'PENDING_MOL', name: 'Education Certificate', order: 5, required: false },
    
    // Visa Processing documents
    { stage: 'VISA_PROCESSING', name: 'Visa Application Form', order: 1, required: true },
    { stage: 'VISA_PROCESSING', name: 'Sponsor ID', order: 2, required: true },
    { stage: 'VISA_PROCESSING', name: 'Employment Contract', order: 3, required: true },
    { stage: 'VISA_PROCESSING', name: 'Bank Statement', order: 4, required: false },
    
    // Worker Arrival documents
    { stage: 'WORKER_ARRIVED', name: 'Arrival Stamp', order: 1, required: true },
    { stage: 'WORKER_ARRIVED', name: 'Entry Visa Copy', order: 2, required: true },
    
    // Labour Permit documents
    { stage: 'LABOUR_PERMIT_PROCESSING', name: 'Work Permit Application', order: 1, required: true },
    { stage: 'LABOUR_PERMIT_PROCESSING', name: 'Medical Fitness Certificate', order: 2, required: true },
    { stage: 'LABOUR_PERMIT_PROCESSING', name: 'Fingerprints', order: 3, required: true },
    
    // Residency Permit documents
    { stage: 'RESIDENCY_PERMIT_PROCESSING', name: 'Residency Application', order: 1, required: true },
    { stage: 'RESIDENCY_PERMIT_PROCESSING', name: 'Housing Contract', order: 2, required: false },
    { stage: 'RESIDENCY_PERMIT_PROCESSING', name: 'Sponsor Undertaking', order: 3, required: true },
  ],
  
  settings: [
    {
      key: 'office_commission',
      value: { amount: 1500, currency: 'USD' },
      description: 'Default office commission fee',
    },
    {
      key: 'renewal_reminder_days',
      value: 60,
      description: 'Days before permit expiry to show renewal reminder',
    },
    {
      key: 'medical_expiry_days',
      value: 90,
      description: 'Days before medical certificate expires',
    },
    {
      key: 'visa_processing_days',
      value: 14,
      description: 'Standard visa processing time in days',
    },
    {
      key: 'default_currency',
      value: 'USD',
      description: 'Default currency for financial transactions',
    },
  ],
  
  costTypes: [
    { name: 'Agent Commission', description: 'Commission paid to sourcing agents' },
    { name: 'Broker Fee', description: 'Fee paid to arrival brokers' },
    { name: 'Government Fee', description: 'Official government fees and charges' },
    { name: 'Medical Exam', description: 'Medical examination and health certificate costs' },
    { name: 'Air Ticket', description: 'Flight ticket costs' },
    { name: 'Visa Processing', description: 'Visa application and processing fees' },
    { name: 'Document Translation', description: 'Translation and notarization costs' },
    { name: 'Insurance', description: 'Travel and health insurance costs' },
    { name: 'Training', description: 'Pre-departure training and orientation costs' },
    { name: 'Transportation', description: 'Local transportation and logistics' },
    { name: 'Legal Fees', description: 'Attorney and legal service fees' },
    { name: 'Embassy Fees', description: 'Embassy and consulate charges' },
    { name: 'Police Clearance', description: 'Police clearance and background check fees' },
    { name: 'Accommodation', description: 'Temporary accommodation costs' },
    { name: 'Other', description: 'Miscellaneous costs' },
  ],
  
  serviceTypes: [
    { name: 'Domestic Worker - Live In', description: 'Full-time live-in domestic worker' },
    { name: 'Domestic Worker - Live Out', description: 'Full-time live-out domestic worker' },
    { name: 'Nanny', description: 'Childcare specialist' },
    { name: 'Elderly Caregiver', description: 'Specialized elderly care provider' },
    { name: 'Cook', description: 'Professional cook or chef' },
    { name: 'Driver', description: 'Personal or family driver' },
    { name: 'Gardener', description: 'Gardening and landscaping services' },
    { name: 'Security Guard', description: 'Personal or property security' },
    { name: 'Office Cleaner', description: 'Commercial cleaning services' },
    { name: 'Housekeeper', description: 'House management and cleaning' },
    { name: 'Nurse', description: 'Medical care provider' },
    { name: 'General Helper', description: 'General assistance and support' },
  ],
  
  feeTemplates: [
    {
      name: 'Ethiopia Standard Fee',
      defaultPrice: 2000,
      minPrice: 1800,
      maxPrice: 2200,
      nationality: 'Ethiopian',
      description: 'Standard recruitment fee for Ethiopian domestic workers',
    },
    {
      name: 'Philippines Standard Fee',
      defaultPrice: 5000,
      minPrice: 4000,
      maxPrice: 7000,
      nationality: 'Filipino',
      description: 'Standard recruitment fee for Filipino domestic workers',
    },
    {
      name: 'Kenya Standard Fee',
      defaultPrice: 2300,
      minPrice: 2000,
      maxPrice: 2500,
      nationality: 'Kenyan',
      description: 'Standard recruitment fee for Kenyan domestic workers',
    },
    {
      name: 'Express Processing Fee',
      defaultPrice: 500,
      minPrice: 300,
      maxPrice: 800,
      nationality: null,
      description: 'Additional fee for expedited visa and document processing',
    },
    {
      name: 'Guarantor Change Fee',
      defaultPrice: 800,
      minPrice: 600,
      maxPrice: 1000,
      nationality: null,
      description: 'Fee for transferring worker to new employer',
    },
    {
      name: 'Medical Retest Fee',
      defaultPrice: 150,
      minPrice: 100,
      maxPrice: 200,
      nationality: null,
      description: 'Fee for medical examination retesting',
    },
  ],
};

/**
 * Seeds initial data for a newly created company
 * @param companyId - The ID of the company to seed data for
 */
export async function seedCompanyData(companyId: string) {
  try {
    console.log(`Starting seed for company: ${companyId}`);
    
    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });
    
    if (!company) {
      throw new Error(`Company with ID ${companyId} not found`);
    }
    
    console.log(`Seeding data for company: ${company.name}`);
    
    // Seed Nationalities
    console.log('Seeding nationalities...');
    const nationalityPromises = DEFAULT_SEED_DATA.nationalities.map(nat =>
      prisma.nationality.upsert({
        where: {
          companyId_code: {
            companyId,
            code: nat.code,
          },
        },
        update: {},
        create: {
          code: nat.code,
          name: nat.name,
          active: true,
          companyId,
        },
      })
    );
    await Promise.all(nationalityPromises);
    console.log(`✓ Seeded ${DEFAULT_SEED_DATA.nationalities.length} nationalities`);
    
    // Seed Cost Types
    console.log('Seeding cost types...');
    const costTypePromises = DEFAULT_SEED_DATA.costTypes.map(costType =>
      prisma.costTypeModel.upsert({
        where: {
          companyId_name: {
            companyId,
            name: costType.name,
          },
        },
        update: {},
        create: {
          name: costType.name,
          description: costType.description,
          active: true,
          companyId,
        },
      })
    );
    await Promise.all(costTypePromises);
    console.log(`✓ Seeded ${DEFAULT_SEED_DATA.costTypes.length} cost types`);
    
    // Seed Service Types
    console.log('Seeding service types...');
    const serviceTypePromises = DEFAULT_SEED_DATA.serviceTypes.map(serviceType =>
      prisma.serviceType.upsert({
        where: {
          companyId_name: {
            companyId,
            name: serviceType.name,
          },
        },
        update: {},
        create: {
          name: serviceType.name,
          description: serviceType.description,
          active: true,
          companyId,
        },
      })
    );
    await Promise.all(serviceTypePromises);
    console.log(`✓ Seeded ${DEFAULT_SEED_DATA.serviceTypes.length} service types`);
    
    // Seed Fee Templates
    console.log('Seeding fee templates...');
    const feeTemplatePromises = DEFAULT_SEED_DATA.feeTemplates.map(template =>
      prisma.feeTemplate.upsert({
        where: {
          companyId_name: {
            companyId,
            name: template.name,
          },
        },
        update: {},
        create: {
          name: template.name,
          defaultPrice: template.defaultPrice,
          minPrice: template.minPrice,
          maxPrice: template.maxPrice,
          currency: 'USD',
          nationality: template.nationality,
          description: template.description,
          companyId,
        },
      })
    );
    await Promise.all(feeTemplatePromises);
    console.log(`✓ Seeded ${DEFAULT_SEED_DATA.feeTemplates.length} fee templates`);
    
    // Seed Document Templates
    console.log('Seeding document templates...');
    const documentTemplatePromises = DEFAULT_SEED_DATA.documentTemplates.map(template =>
      prisma.documentTemplate.upsert({
        where: {
          companyId_stage_name: {
            companyId,
            stage: template.stage as any,
            name: template.name,
          },
        },
        update: {},
        create: {
          stage: template.stage as any,
          name: template.name,
          order: template.order,
          required: template.required !== false,
          companyId,
        },
      })
    );
    await Promise.all(documentTemplatePromises);
    console.log(`✓ Seeded ${DEFAULT_SEED_DATA.documentTemplates.length} document templates`);
    
    // Seed Settings
    console.log('Seeding settings...');
    const settingPromises = DEFAULT_SEED_DATA.settings.map(setting =>
      prisma.setting.upsert({
        where: {
          companyId_key: {
            companyId,
            key: setting.key,
          },
        },
        update: {},
        create: {
          key: setting.key,
          value: setting.value,
          description: setting.description,
          companyId,
        },
      })
    );
    await Promise.all(settingPromises);
    console.log(`✓ Seeded ${DEFAULT_SEED_DATA.settings.length} settings`);
    
    console.log(`✅ Successfully seeded all data for company: ${company.name}`);
    
    return {
      success: true,
      message: `Successfully seeded data for company ${company.name}`,
      stats: {
        nationalities: DEFAULT_SEED_DATA.nationalities.length,
        costTypes: DEFAULT_SEED_DATA.costTypes.length,
        serviceTypes: DEFAULT_SEED_DATA.serviceTypes.length,
        feeTemplates: DEFAULT_SEED_DATA.feeTemplates.length,
        documentTemplates: DEFAULT_SEED_DATA.documentTemplates.length,
        settings: DEFAULT_SEED_DATA.settings.length,
      },
    };
  } catch (error) {
    console.error('Error seeding company data:', error);
    throw error;
  }
}

/**
 * Seeds data for all companies that don't have seed data yet
 */
export async function seedAllCompanies() {
  try {
    console.log('Finding companies without seed data...');
    
    // Find companies that don't have nationalities (indicator of no seed data)
    const companies = await prisma.company.findMany({
      where: {
        nationalities: {
          none: {},
        },
      },
    });
    
    if (companies.length === 0) {
      console.log('All companies already have seed data');
      return;
    }
    
    console.log(`Found ${companies.length} companies without seed data`);
    
    for (const company of companies) {
      await seedCompanyData(company.id);
    }
    
    console.log('✅ Successfully seeded all companies');
  } catch (error) {
    console.error('Error seeding companies:', error);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  const companyId = process.argv[2];
  
  if (companyId) {
    // Seed specific company
    seedCompanyData(companyId)
      .then(() => {
        console.log('Seed completed successfully');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Seed failed:', error);
        process.exit(1);
      })
      .finally(() => {
        prisma.$disconnect();
      });
  } else {
    // Seed all companies without data
    seedAllCompanies()
      .then(() => {
        console.log('Seed completed successfully');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Seed failed:', error);
        process.exit(1);
      })
      .finally(() => {
        prisma.$disconnect();
      });
  }
}
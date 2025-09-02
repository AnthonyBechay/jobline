import { prisma } from '../index';
import { ApplicationStatus } from '@prisma/client';

export async function seedBusinessSettings(companyId: string) {
  console.log(`Seeding business settings for company: ${companyId}`);

  try {
    // Seed cancellation settings
    const cancellationSettings = [
      {
        cancellationType: 'pre_arrival',
        penaltyFee: 200,
        refundPercentage: 100,
        nonRefundableFees: ['GOV_FEE', 'ATTORNEY_FEE'],
        monthlyServiceFee: 0,
        maxRefundAmount: null,
        description: 'Pre-arrival cancellation: Full refund minus $200 penalty fee'
      },
      {
        cancellationType: 'post_arrival_within_3_months',
        penaltyFee: 0,
        refundPercentage: 80,
        nonRefundableFees: ['GOV_FEE', 'ATTORNEY_FEE', 'BROKER_FEE'],
        monthlyServiceFee: 50,
        maxRefundAmount: null,
        description: 'Post-arrival cancellation (within 3 months): 80% refund minus non-refundable fees and monthly service charges'
      },
      {
        cancellationType: 'post_arrival_after_3_months',
        penaltyFee: 0,
        refundPercentage: 100,
        nonRefundableFees: ['GOV_FEE', 'ATTORNEY_FEE', 'BROKER_FEE'],
        monthlyServiceFee: 100,
        maxRefundAmount: null,
        description: 'Post-arrival cancellation (after 3 months): Full refund minus non-refundable fees and monthly service fee'
      },
      {
        cancellationType: 'candidate_cancellation',
        penaltyFee: 0,
        refundPercentage: 100,
        nonRefundableFees: [],
        monthlyServiceFee: 0,
        maxRefundAmount: null,
        description: 'Candidate cancellation: Full refund to client, all costs absorbed by office'
      }
    ];

    for (const setting of cancellationSettings) {
      await prisma.cancellationSetting.upsert({
        where: {
          companyId_cancellationType: {
            companyId,
            cancellationType: setting.cancellationType
          }
        },
        update: setting,
        create: {
          ...setting,
          companyId
        }
      });
    }

    // Seed lawyer service settings
    await prisma.lawyerServiceSetting.upsert({
      where: { companyId },
      update: {
        lawyerFeeCost: 100,
        lawyerFeeCharge: 150,
        description: 'Lawyer service: $100 cost to office, $150 charge to client ($50 commission)',
        active: true
      },
      create: {
        companyId,
        lawyerFeeCost: 100,
        lawyerFeeCharge: 150,
        description: 'Lawyer service: $100 cost to office, $150 charge to client ($50 commission)',
        active: true
      }
    });

    // Seed additional fee templates for cancellation scenarios
    const additionalFeeTemplates = [
      {
        name: 'Pre-Arrival Cancellation',
        defaultPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        currency: 'USD',
        description: 'Fee template for pre-arrival cancellations (penalty only)'
      },
      {
        name: 'Post-Arrival Cancellation',
        defaultPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        currency: 'USD',
        description: 'Fee template for post-arrival cancellations (refund calculation)'
      },
      {
        name: 'Candidate Cancellation',
        defaultPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        currency: 'USD',
        description: 'Fee template for candidate-initiated cancellations (full refund)'
      },
      {
        name: 'In Lebanon Candidate',
        defaultPrice: 1500,
        minPrice: 1000,
        maxPrice: 2000,
        currency: 'USD',
        description: 'Reduced fee for candidates already in Lebanon (guarantor change)'
      }
    ];

    for (const template of additionalFeeTemplates) {
      await prisma.feeTemplate.upsert({
        where: {
          companyId_name: {
            companyId,
            name: template.name
          }
        },
        update: template,
        create: {
          ...template,
          companyId
        }
      });
    }

    // Seed additional document templates for guarantor change process
    const guarantorChangeDocuments = [
      {
        stage: ApplicationStatus.PENDING_MOL,
        name: 'Relinquish Letter',
        description: 'Letter from previous client relinquishing sponsorship',
        required: true,
        requiredFrom: 'office',
        order: 1
      },
      {
        stage: ApplicationStatus.PENDING_MOL,
        name: 'Commitment Letter',
        description: 'Letter from new client committing to sponsorship',
        required: true,
        requiredFrom: 'office',
        order: 2
      },
      {
        stage: ApplicationStatus.PENDING_MOL,
        name: 'Transfer of Sponsorship',
        description: 'Official transfer of sponsorship documents',
        required: true,
        requiredFrom: 'office',
        order: 3
      },
      {
        stage: ApplicationStatus.PENDING_MOL,
        name: 'Certificate of Deposit',
        description: 'Bank certificate of deposit from new client',
        required: true,
        requiredFrom: 'client',
        order: 4
      }
    ];

    for (const doc of guarantorChangeDocuments) {
      await prisma.documentTemplate.upsert({
        where: {
          companyId_stage_name: {
            companyId,
            stage: doc.stage,
            name: doc.name
          }
        },
        update: doc,
        create: {
          ...doc,
          companyId
        }
      });
    }

    // Seed additional cost types for new business workflows
    const additionalCostTypes = [
      {
        name: 'Deportation Cost',
        description: 'Cost for returning candidate to home country',
        active: true
      },
      {
        name: 'Transfer Fee',
        description: 'Government fee for transferring sponsorship',
        active: true
      },
      {
        name: 'Lawyer Service Cost',
        description: 'Actual cost paid to lawyer for services',
        active: true
      },
      {
        name: 'Monthly Service Fee',
        description: 'Monthly service charge for ongoing support',
        active: true
      }
    ];

    for (const costType of additionalCostTypes) {
      await prisma.costTypeModel.upsert({
        where: {
          companyId_name: {
            companyId,
            name: costType.name
          }
        },
        update: costType,
        create: {
          ...costType,
          companyId
        }
      });
    }

    console.log('✅ Business settings seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding business settings:', error);
    throw error;
  }
}

// Function to seed all companies (for migration)
export async function seedAllCompaniesBusinessSettings() {
  try {
    const companies = await prisma.company.findMany({
      select: { id: true, name: true }
    });

    console.log(`Found ${companies.length} companies to seed business settings for`);

    for (const company of companies) {
      console.log(`Seeding business settings for: ${company.name}`);
      await seedBusinessSettings(company.id);
    }

    console.log('✅ All companies business settings seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding all companies business settings:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedAllCompaniesBusinessSettings()
    .then(() => {
      console.log('Business settings seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Business settings seeding failed:', error);
      process.exit(1);
    });
}

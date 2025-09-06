import { ApplicationStatus, CandidateStatus, ApplicationType, Prisma } from '@prisma/client';
import { prisma } from '../index';

export interface FeeComponentData {
  name: string;
  amount: number;
  isRefundable: boolean;
  refundableAfterArrival: boolean;
  description?: string;
}

export interface RefundCalculationResult {
  totalPaid: number;
  refundableComponents: number;
  nonRefundableComponents: number;
  penaltyFee: number;
  monthlyServiceFees: number;
  calculatedRefund: number;
  finalRefund: number;
  description: string;
  componentBreakdown: {
    component: string;
    amount: number;
    isRefundable: boolean;
    refundReason?: string;
  }[];
}

export class ImprovedFinancialService {
  /**
   * Create or update fee template with components
   */
  static async createFeeTemplate(
    data: {
      name: string;
      defaultPrice: number;
      minPrice: number;
      maxPrice: number;
      nationality?: string;
      serviceType?: string;
      description?: string;
      components: FeeComponentData[];
    },
    companyId: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // Create fee template
      const feeTemplate = await tx.feeTemplate.create({
        data: {
          name: data.name,
          defaultPrice: data.defaultPrice,
          minPrice: data.minPrice,
          maxPrice: data.maxPrice,
          nationality: data.nationality,
          serviceType: data.serviceType,
          description: data.description,
          companyId
        }
      });

      // Create fee components
      if (data.components && data.components.length > 0) {
        await tx.feeComponent.createMany({
          data: data.components.map(component => ({
            feeTemplateId: feeTemplate.id,
            name: component.name,
            amount: component.amount,
            isRefundable: component.isRefundable,
            refundableAfterArrival: component.refundableAfterArrival,
            description: component.description
          }))
        });
      }

      return await tx.feeTemplate.findUnique({
        where: { id: feeTemplate.id },
        include: { feeComponents: true }
      });
    });
  }

  /**
   * Calculate refund based on application, cancellation type, and settings
   */
  static async calculateImprovedRefund(
    application: any,
    cancellationType: string,
    companyId: string,
    options: {
      customRefundAmount?: number;
      overridePenaltyFee?: number;
      monthsSinceArrival?: number;
    } = {}
  ): Promise<RefundCalculationResult> {
    // Get cancellation settings
    const settings = await prisma.cancellationSetting.findFirst({
      where: {
        companyId,
        cancellationType,
        active: true
      }
    });

    if (!settings) {
      throw new Error(`No active cancellation settings found for type: ${cancellationType}`);
    }

    // Get all payments for the application
    const payments = await prisma.payment.findMany({
      where: { applicationId: application.id }
    });

    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Get fee template with components
    let feeComponents: any[] = [];
    if (application.feeTemplateId) {
      const feeTemplate = await prisma.feeTemplate.findUnique({
        where: { id: application.feeTemplateId },
        include: { feeComponents: true }
      });
      if (feeTemplate) {
        feeComponents = feeTemplate.feeComponents;
      }
    }

    // Calculate component breakdown
    const componentBreakdown: any[] = [];
    let refundableComponents = 0;
    let nonRefundableComponents = 0;

    // Parse nonRefundableComponents from JSON
    const nonRefundableComponentsList = (settings.nonRefundableComponents as string[]) || [];

    // If no components exist, treat the entire payment as a single component
    if (feeComponents.length === 0) {
      const isRefundable = this.isComponentRefundable(
        'Application Fee',
        cancellationType,
        nonRefundableComponentsList
      );
      
      if (isRefundable) {
        refundableComponents = totalPaid;
      } else {
        nonRefundableComponents = totalPaid;
      }
      
      componentBreakdown.push({
        component: 'Application Fee',
        amount: totalPaid,
        isRefundable,
        refundReason: !isRefundable ? 'Non-refundable per policy' : undefined
      });
    } else {
      // Calculate based on actual components
      for (const component of feeComponents) {
        const componentAmount = Number(component.amount);
        const isRefundable = this.isComponentRefundable(
          component.name,
          cancellationType,
          nonRefundableComponentsList
        );

        // Special handling for post-arrival cancellations
        if (cancellationType.includes('post_arrival') && !component.refundableAfterArrival) {
          nonRefundableComponents += componentAmount;
          componentBreakdown.push({
            component: component.name,
            amount: componentAmount,
            isRefundable: false,
            refundReason: 'Non-refundable after arrival'
          });
        } else if (isRefundable) {
          refundableComponents += componentAmount;
          componentBreakdown.push({
            component: component.name,
            amount: componentAmount,
            isRefundable: true
          });
        } else {
          nonRefundableComponents += componentAmount;
          componentBreakdown.push({
            component: component.name,
            amount: componentAmount,
            isRefundable: false,
            refundReason: 'Non-refundable per policy'
          });
        }
      }
    }

    // Calculate penalty fee
    const penaltyFee = options.overridePenaltyFee !== undefined 
      ? options.overridePenaltyFee 
      : Number(settings.penaltyFee);

    // Calculate monthly service fees for post-arrival cancellations
    let monthlyServiceFees = 0;
    if (options.monthsSinceArrival && options.monthsSinceArrival > 0) {
      monthlyServiceFees = options.monthsSinceArrival * Number(settings.monthlyServiceFee);
    }

    // Note: Deportation costs should be added as regular costs to the application
    // They are not handled specially in refund calculations

    // Calculate refund
    let calculatedRefund = refundableComponents - penaltyFee - monthlyServiceFees;
    
    // Apply refund percentage if set
    const refundPercentage = Number(settings.refundPercentage);
    if (refundPercentage < 100) {
      calculatedRefund = calculatedRefund * (refundPercentage / 100);
    }

    // Apply max refund limit if set
    if (settings.maxRefundAmount) {
      calculatedRefund = Math.min(calculatedRefund, Number(settings.maxRefundAmount));
    }

    // Ensure refund is not negative
    calculatedRefund = Math.max(0, calculatedRefund);

    // Apply custom refund amount if provided (super admin override)
    const finalRefund = options.customRefundAmount !== undefined 
      ? options.customRefundAmount 
      : calculatedRefund;

    // Generate description
    const description = this.generateRefundDescription(
      cancellationType,
      totalPaid,
      refundableComponents,
      nonRefundableComponents,
      penaltyFee,
      monthlyServiceFees,
      finalRefund
    );

    return {
      totalPaid,
      refundableComponents,
      nonRefundableComponents,
      penaltyFee,
      monthlyServiceFees,
      calculatedRefund,
      finalRefund,
      description,
      componentBreakdown
    };
  }

  /**
   * Check if a component is refundable based on cancellation settings
   */
  private static isComponentRefundable(
    componentName: string,
    cancellationType: string,
    nonRefundableComponents: string[] = []
  ): boolean {
    // Pre-arrival candidate cancellation - everything is refundable
    if (cancellationType === 'pre_arrival_candidate') {
      return true;
    }

    // Check if component is in non-refundable list
    return !nonRefundableComponents.includes(componentName);
  }

  /**
   * Generate human-readable refund description
   */
  private static generateRefundDescription(
    cancellationType: string,
    totalPaid: number,
    refundableComponents: number,
    nonRefundableComponents: number,
    penaltyFee: number,
    monthlyServiceFees: number,
    finalRefund: number
  ): string {
    const parts = [`Total paid: $${totalPaid}`];

    if (nonRefundableComponents > 0) {
      parts.push(`Non-refundable components: $${nonRefundableComponents}`);
    }

    if (penaltyFee > 0) {
      parts.push(`Cancellation penalty: $${penaltyFee}`);
    }

    if (monthlyServiceFees > 0) {
      parts.push(`Monthly service fees: $${monthlyServiceFees}`);
    }

    parts.push(`Final refund: $${finalRefund}`);

    return parts.join(' | ');
  }

  /**
   * Get default cancellation settings for initial setup
   */
  static async createDefaultCancellationSettings(companyId: string) {
    const defaultSettings = [
      {
        cancellationType: 'pre_arrival_client',
        name: 'Pre-Arrival Client Cancellation',
        penaltyFee: 200,
        refundPercentage: 100,
        nonRefundableComponents: [],
        monthlyServiceFee: 0,
        description: 'Client cancels before worker arrival'
      },
      {
        cancellationType: 'pre_arrival_candidate',
        name: 'Pre-Arrival Candidate Cancellation',
        penaltyFee: 0,
        refundPercentage: 100,
        nonRefundableComponents: [],
        monthlyServiceFee: 0,
        description: 'Candidate cancels before arrival - full refund'
      },
      {
        cancellationType: 'post_arrival_within_3_months',
        name: 'Post-Arrival Within Probation',
        penaltyFee: 300,
        refundPercentage: 100,
        nonRefundableComponents: ['Insurance', 'Government Fees'],
        monthlyServiceFee: 100,
        description: 'Cancellation within 3-month probation period'
      },
      {
        cancellationType: 'post_arrival_after_3_months',
        name: 'Post-Arrival After Probation',
        penaltyFee: 500,
        refundPercentage: 50,
        nonRefundableComponents: ['Insurance', 'Government Fees', 'Ticket'],
        monthlyServiceFee: 150,
        maxRefundAmount: 1000,
        description: 'Cancellation after probation period'
      },
      {
        cancellationType: 'candidate_cancellation',
        name: 'Candidate Post-Arrival Cancellation',
        penaltyFee: 0,
        refundPercentage: 100,
        nonRefundableComponents: [],
        monthlyServiceFee: 0,
        description: 'Candidate initiated cancellation - full refund'
      }
    ];

    for (const setting of defaultSettings) {
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
          companyId,
          active: true
        }
      });
    }
  }

  /**
   * Create default fee templates with components
   */
  static async createDefaultFeeTemplates(companyId: string) {
    const defaultTemplates = [
      {
        name: 'Standard Package - Philippines',
        defaultPrice: 2500,
        minPrice: 2000,
        maxPrice: 3000,
        nationality: 'Philippines',
        serviceType: 'NEW_CANDIDATE',
        description: 'Standard package for Filipino workers',
        components: [
          { name: 'Office Service', amount: 800, isRefundable: true, refundableAfterArrival: false },
          { name: 'Insurance', amount: 300, isRefundable: false, refundableAfterArrival: false },
          { name: 'Ticket', amount: 600, isRefundable: true, refundableAfterArrival: false },
          { name: 'Government Fees', amount: 400, isRefundable: false, refundableAfterArrival: false },
          { name: 'Medical Checkup', amount: 200, isRefundable: false, refundableAfterArrival: false },
          { name: 'Processing Fee', amount: 200, isRefundable: true, refundableAfterArrival: false }
        ]
      },
      {
        name: 'Guarantor Change Package',
        defaultPrice: 1200,
        minPrice: 1000,
        maxPrice: 1500,
        serviceType: 'GUARANTOR_CHANGE',
        description: 'Package for guarantor change applications',
        components: [
          { name: 'Transfer Processing', amount: 500, isRefundable: true, refundableAfterArrival: true },
          { name: 'Government Transfer Fee', amount: 300, isRefundable: false, refundableAfterArrival: false },
          { name: 'Certificate of Deposit', amount: 200, isRefundable: false, refundableAfterArrival: false },
          { name: 'Documentation', amount: 200, isRefundable: true, refundableAfterArrival: true }
        ]
      }
    ];

    for (const template of defaultTemplates) {
      await this.createFeeTemplate(template, companyId);
    }
  }

  /**
   * Calculate months since arrival for post-arrival cancellations
   */
  static calculateMonthsSinceArrival(arrivalDate: Date, cancellationDate: Date = new Date()): number {
    const diffTime = Math.abs(cancellationDate.getTime() - arrivalDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 30); // Simple month calculation
  }

  /**
   * Check if within probation period (3 months)
   */
  static isWithinProbationPeriod(arrivalDate: Date, checkDate: Date = new Date()): boolean {
    const monthsSinceArrival = this.calculateMonthsSinceArrival(arrivalDate, checkDate);
    return monthsSinceArrival <= 3;
  }
}

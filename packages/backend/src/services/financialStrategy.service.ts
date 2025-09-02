import { ApplicationStatus, ApplicationType, CandidateStatus } from '@prisma/client';
import { prisma } from '../index';

export interface FeeCalculationResult {
  totalFee: number;
  breakdown: {
    baseFee: number;
    lawyerFee?: number;
    expeditedFee?: number;
    otherFees?: number;
  };
  currency: string;
  description: string;
}

export interface RefundCalculationResult {
  totalPaid: number;
  refundableAmount: number;
  nonRefundableAmount: number;
  penaltyFee: number;
  calculatedRefund: number;
  finalRefund: number;
  breakdown: {
    paymentType: string;
    amount: number;
    isRefundable: boolean;
    refundAmount: number;
  }[];
  description: string;
}

export interface CancellationFinancialImpact {
  refundAmount: number;
  penaltyFee: number;
  nonRefundableFees: number;
  monthlyServiceFee: number;
  totalMonths: number;
  description: string;
}

// Abstract base class for fee calculation strategies
abstract class FeeCalculationStrategy {
  abstract calculate(
    application: any,
    feeTemplate: any,
    options?: any
  ): Promise<FeeCalculationResult>;
}

// Strategy for new candidate fees
class NewCandidateFeeStrategy extends FeeCalculationStrategy {
  async calculate(
    application: any,
    feeTemplate: any,
    options: { lawyerService?: boolean; expedited?: boolean } = {}
  ): Promise<FeeCalculationResult> {
    let totalFee = Number(feeTemplate.defaultPrice);
    const breakdown: any = { baseFee: totalFee };

    // Add lawyer service fee if requested
    if (options.lawyerService && application.lawyerFeeCharge) {
      breakdown.lawyerFee = Number(application.lawyerFeeCharge);
      totalFee += breakdown.lawyerFee;
    }

    // Add expedited fee if applicable
    if (options.expedited) {
      const expeditedFee = totalFee * 0.2; // 20% expedited fee
      breakdown.expeditedFee = expeditedFee;
      totalFee += expeditedFee;
    }

    return {
      totalFee,
      breakdown,
      currency: feeTemplate.currency,
      description: `New candidate fee for ${application.candidate?.nationality || 'unknown nationality'}`
    };
  }
}

// Strategy for guarantor change fees
class GuarantorChangeFeeStrategy extends FeeCalculationStrategy {
  async calculate(
    application: any,
    feeTemplate: any,
    options: { hasExistingPaperwork?: boolean } = {}
  ): Promise<FeeCalculationResult> {
    let totalFee = Number(feeTemplate.defaultPrice);
    const breakdown: any = { baseFee: totalFee };

    // If no existing paperwork, add additional fees for full process
    if (!options.hasExistingPaperwork) {
      const additionalFee = totalFee * 0.3; // 30% additional for full paperwork
      breakdown.otherFees = additionalFee;
      totalFee += additionalFee;
    }

    return {
      totalFee,
      breakdown,
      currency: feeTemplate.currency,
      description: `Guarantor change fee ${options.hasExistingPaperwork ? '(transfer only)' : '(full process)'}`
    };
  }
}

// Strategy for in-Lebanon candidate fees
class InLebanonCandidateFeeStrategy extends FeeCalculationStrategy {
  async calculate(
    application: any,
    feeTemplate: any,
    options: any = {}
  ): Promise<FeeCalculationResult> {
    const totalFee = Number(feeTemplate.defaultPrice);
    const breakdown = { baseFee: totalFee };

    return {
      totalFee,
      breakdown,
      currency: feeTemplate.currency,
      description: 'In-Lebanon candidate fee (reduced rate)'
    };
  }
}

// Abstract base class for refund calculation strategies
abstract class RefundCalculationStrategy {
  abstract calculate(
    application: any,
    cancellationType: string,
    settings: any,
    options?: any
  ): Promise<RefundCalculationResult>;
}

// Strategy for pre-arrival cancellation refunds
class PreArrivalRefundStrategy extends RefundCalculationStrategy {
  async calculate(
    application: any,
    cancellationType: string,
    settings: any,
    options: any = {}
  ): Promise<RefundCalculationResult> {
    const payments = application.payments || [];
    const totalPaid = payments.reduce((sum: number, payment: any) => 
      sum + Number(payment.amount), 0
    );

    const penaltyFee = Number(settings.penaltyFee || 0);
    const refundPercentage = Number(settings.refundPercentage || 100) / 100;
    
    const refundableAmount = totalPaid - penaltyFee;
    const calculatedRefund = refundableAmount * refundPercentage;
    const finalRefund = Math.max(0, calculatedRefund);

    const breakdown = payments.map((payment: any) => ({
      paymentType: payment.paymentType || 'FEE',
      amount: Number(payment.amount),
      isRefundable: payment.isRefundable !== false,
      refundAmount: payment.isRefundable !== false ? 
        (Number(payment.amount) * refundPercentage) : 0
    }));

    return {
      totalPaid,
      refundableAmount,
      nonRefundableAmount: penaltyFee,
      penaltyFee,
      calculatedRefund,
      finalRefund,
      breakdown,
      description: `Pre-arrival cancellation: Full refund minus $${penaltyFee} penalty`
    };
  }
}

// Strategy for post-arrival cancellation refunds (within probation)
class PostArrivalProbationRefundStrategy extends RefundCalculationStrategy {
  async calculate(
    application: any,
    cancellationType: string,
    settings: any,
    options: { monthsSinceArrival?: number } = {}
  ): Promise<RefundCalculationResult> {
    const payments = application.payments || [];
    const totalPaid = payments.reduce((sum: number, payment: any) => 
      sum + Number(payment.amount), 0
    );

    const nonRefundableFees = settings.nonRefundableFees || [];
    const monthlyServiceFee = Number(settings.monthlyServiceFee || 0);
    const monthsSinceArrival = options.monthsSinceArrival || 0;

    // Calculate non-refundable amount
    let nonRefundableAmount = 0;
    const breakdown = payments.map((payment: any) => {
      const isNonRefundable = nonRefundableFees.includes(payment.paymentType) || 
                             payment.paymentType === 'GOV_FEE' ||
                             payment.paymentType === 'ATTORNEY_FEE';
      
      if (isNonRefundable) {
        nonRefundableAmount += Number(payment.amount);
      }

      return {
        paymentType: payment.paymentType || 'FEE',
        amount: Number(payment.amount),
        isRefundable: !isNonRefundable,
        refundAmount: !isNonRefundable ? Number(payment.amount) : 0
      };
    });

    // Subtract monthly service fees
    const serviceFeeDeduction = monthlyServiceFee * monthsSinceArrival;
    const refundableAmount = totalPaid - nonRefundableAmount - serviceFeeDeduction;
    const finalRefund = Math.max(0, refundableAmount);

    return {
      totalPaid,
      refundableAmount,
      nonRefundableAmount,
      penaltyFee: serviceFeeDeduction,
      calculatedRefund: refundableAmount,
      finalRefund,
      breakdown,
      description: `Post-arrival cancellation: Refund minus non-refundable fees and ${monthsSinceArrival} months service fee`
    };
  }
}

// Strategy for post-arrival cancellation refunds (after probation)
class PostArrivalPostProbationRefundStrategy extends RefundCalculationStrategy {
  async calculate(
    application: any,
    cancellationType: string,
    settings: any,
    options: { monthsSinceArrival?: number; maxRefundAmount?: number } = {}
  ): Promise<RefundCalculationResult> {
    const payments = application.payments || [];
    const totalPaid = payments.reduce((sum: number, payment: any) => 
      sum + Number(payment.amount), 0
    );

    const nonRefundableFees = settings.nonRefundableFees || [];
    const monthlyServiceFee = Number(settings.monthlyServiceFee || 0);
    const monthsSinceArrival = options.monthsSinceArrival || 0;
    const maxRefundAmount = options.maxRefundAmount || Number(settings.maxRefundAmount || 0);

    // Calculate non-refundable amount
    let nonRefundableAmount = 0;
    const breakdown = payments.map((payment: any) => {
      const isNonRefundable = nonRefundableFees.includes(payment.paymentType) || 
                             payment.paymentType === 'GOV_FEE' ||
                             payment.paymentType === 'ATTORNEY_FEE';
      
      if (isNonRefundable) {
        nonRefundableAmount += Number(payment.amount);
      }

      return {
        paymentType: payment.paymentType || 'FEE',
        amount: Number(payment.amount),
        isRefundable: !isNonRefundable,
        refundAmount: !isNonRefundable ? Number(payment.amount) : 0
      };
    });

    // Subtract monthly service fees
    const serviceFeeDeduction = monthlyServiceFee * monthsSinceArrival;
    let refundableAmount = totalPaid - nonRefundableAmount - serviceFeeDeduction;
    
    // Apply maximum refund limit if set
    if (maxRefundAmount > 0) {
      refundableAmount = Math.min(refundableAmount, maxRefundAmount);
    }

    const finalRefund = Math.max(0, refundableAmount);

    return {
      totalPaid,
      refundableAmount,
      nonRefundableAmount,
      penaltyFee: serviceFeeDeduction,
      calculatedRefund: refundableAmount,
      finalRefund,
      breakdown,
      description: `Post-probation cancellation: Limited refund minus non-refundable fees and service fees`
    };
  }
}

// Strategy for candidate cancellation refunds
class CandidateCancellationRefundStrategy extends RefundCalculationStrategy {
  async calculate(
    application: any,
    cancellationType: string,
    settings: any,
    options: any = {}
  ): Promise<RefundCalculationResult> {
    const payments = application.payments || [];
    const totalPaid = payments.reduce((sum: number, payment: any) => 
      sum + Number(payment.amount), 0
    );

    // Candidate cancellation typically results in full refund
    const breakdown = payments.map((payment: any) => ({
      paymentType: payment.paymentType || 'FEE',
      amount: Number(payment.amount),
      isRefundable: true,
      refundAmount: Number(payment.amount)
    }));

    return {
      totalPaid,
      refundableAmount: totalPaid,
      nonRefundableAmount: 0,
      penaltyFee: 0,
      calculatedRefund: totalPaid,
      finalRefund: totalPaid,
      breakdown,
      description: 'Candidate cancellation: Full refund to client'
    };
  }
}

// Main financial service class
export class FinancialStrategyService {
  private static feeStrategies = new Map<string, FeeCalculationStrategy>([
    ['NEW_CANDIDATE', new NewCandidateFeeStrategy()],
    ['GUARANTOR_CHANGE', new GuarantorChangeFeeStrategy()],
    ['IN_LEBANON_CANDIDATE', new InLebanonCandidateFeeStrategy()]
  ]);

  private static refundStrategies = new Map<string, RefundCalculationStrategy>([
    ['pre_arrival', new PreArrivalRefundStrategy()],
    ['post_arrival_probation', new PostArrivalProbationRefundStrategy()],
    ['post_arrival_post_probation', new PostArrivalPostProbationRefundStrategy()],
    ['candidate_cancellation', new CandidateCancellationRefundStrategy()]
  ]);

  /**
   * Calculate fee for an application
   */
  static async calculateFee(
    application: any,
    feeTemplate: any,
    options: any = {}
  ): Promise<FeeCalculationResult> {
    const strategyKey = this.getFeeStrategyKey(application);
    const strategy = this.feeStrategies.get(strategyKey);
    
    if (!strategy) {
      throw new Error(`No fee strategy found for application type: ${strategyKey}`);
    }

    return await strategy.calculate(application, feeTemplate, options);
  }

  /**
   * Calculate refund for a cancellation
   */
  static async calculateRefund(
    application: any,
    cancellationType: string,
    settings: any,
    options: any = {}
  ): Promise<RefundCalculationResult> {
    const strategyKey = this.getRefundStrategyKey(cancellationType, application, options);
    const strategy = this.refundStrategies.get(strategyKey);
    
    if (!strategy) {
      throw new Error(`No refund strategy found for cancellation type: ${strategyKey}`);
    }

    return await strategy.calculate(application, cancellationType, settings, options);
  }

  /**
   * Get appropriate fee template for an application
   */
  static async getFeeTemplate(
    applicationType: ApplicationType,
    candidateNationality: string,
    candidateStatus: CandidateStatus,
    companyId: string
  ): Promise<any> {
    // First try to find nationality-specific template
    let feeTemplate = await prisma.feeTemplate.findFirst({
      where: {
        nationality: candidateNationality,
        companyId
      }
    });

    // If not found, try to find by application type and candidate status
    if (!feeTemplate) {
      const templateName = this.getTemplateName(applicationType, candidateStatus);
      feeTemplate = await prisma.feeTemplate.findFirst({
        where: {
          name: templateName,
          companyId
        }
      });
    }

    // Fallback to default template
    if (!feeTemplate) {
      feeTemplate = await prisma.feeTemplate.findFirst({
        where: {
          name: 'Default',
          companyId
        }
      });
    }

    return feeTemplate;
  }

  /**
   * Get cancellation settings for a company
   */
  static async getCancellationSettings(
    companyId: string,
    cancellationType: string
  ): Promise<any> {
    return await prisma.cancellationSetting.findFirst({
      where: {
        companyId,
        cancellationType,
        active: true
      }
    });
  }

  /**
   * Get lawyer service settings for a company
   */
  static async getLawyerServiceSettings(companyId: string): Promise<any> {
    return await prisma.lawyerServiceSetting.findFirst({
      where: {
        companyId,
        active: true
      }
    });
  }

  /**
   * Calculate monthly service fee deduction
   */
  static calculateMonthlyServiceFee(
    arrivalDate: Date,
    currentDate: Date = new Date(),
    monthlyFee: number
  ): { months: number; totalFee: number } {
    const months = Math.max(0, this.getMonthsDifference(arrivalDate, currentDate));
    return {
      months,
      totalFee: months * monthlyFee
    };
  }

  /**
   * Get months difference between two dates
   */
  private static getMonthsDifference(date1: Date, date2: Date): number {
    const yearDiff = date2.getFullYear() - date1.getFullYear();
    const monthDiff = date2.getMonth() - date1.getMonth();
    return yearDiff * 12 + monthDiff;
  }

  /**
   * Get fee strategy key based on application properties
   */
  private static getFeeStrategyKey(application: any): string {
    if (application.type === ApplicationType.GUARANTOR_CHANGE) {
      return 'GUARANTOR_CHANGE';
    }

    if (application.candidate?.status === CandidateStatus.AVAILABLE_IN_LEBANON) {
      return 'IN_LEBANON_CANDIDATE';
    }

    return 'NEW_CANDIDATE';
  }

  /**
   * Get refund strategy key based on cancellation type and context
   */
  private static getRefundStrategyKey(
    cancellationType: string,
    application: any,
    options: any
  ): string {
    if (cancellationType === 'candidate_cancellation') {
      return 'candidate_cancellation';
    }

    if (cancellationType === 'pre_arrival') {
      return 'pre_arrival';
    }

    if (cancellationType === 'post_arrival_within_3_months') {
      return 'post_arrival_probation';
    }
    
    if (cancellationType === 'post_arrival_after_3_months') {
      return 'post_arrival_post_probation';
    }

    // Legacy support for old 'post_arrival' type
    if (cancellationType === 'post_arrival') {
      // Check if within probation period
      if (application.exactArrivalDate) {
        const arrivalDate = new Date(application.exactArrivalDate);
        const isWithinProbation = this.isWithinProbationPeriod(arrivalDate);
        return isWithinProbation ? 'post_arrival_probation' : 'post_arrival_post_probation';
      }
    }

    return 'post_arrival_probation'; // Default fallback
  }

  /**
   * Get template name based on application type and candidate status
   */
  private static getTemplateName(
    applicationType: ApplicationType,
    candidateStatus: CandidateStatus
  ): string {
    if (applicationType === ApplicationType.GUARANTOR_CHANGE) {
      return 'Guarantor Change';
    }

    if (candidateStatus === CandidateStatus.AVAILABLE_IN_LEBANON) {
      return 'In Lebanon Candidate';
    }

    return 'New Candidate';
  }

  /**
   * Check if within probation period (3 months)
   */
  private static isWithinProbationPeriod(arrivalDate: Date): boolean {
    const probationEnd = new Date(arrivalDate);
    probationEnd.setMonth(probationEnd.getMonth() + 3);
    return new Date() <= probationEnd;
  }
}

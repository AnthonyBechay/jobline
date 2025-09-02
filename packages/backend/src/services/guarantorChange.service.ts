import { prisma } from '../index';
import { CandidateStatus, ApplicationStatus } from '@prisma/client';

export interface GuarantorChangeRequest {
  originalApplicationId: string;
  toClientId: string;
  reason?: string;
  candidateInLebanon: boolean;
  candidateDeparted?: boolean;
  customRefundAmount?: number;
  notes?: string;
}

export interface RefundCalculation {
  totalPaid: number;
  refundableAmount: number;
  nonRefundableAmount: number;
  calculatedRefund: number;
  finalRefund: number;
  refundBreakdown: Array<{
    paymentType: string;
    amount: number;
    isRefundable: boolean;
    refundAmount: number;
  }>;
}

export class GuarantorChangeService {
  /**
   * Calculate refund amount based on payment types and fee templates
   */
  static async calculateRefund(
    applicationId: string,
    candidateInLebanon: boolean,
    candidateDeparted: boolean = false,
    customRefundAmount?: number
  ): Promise<RefundCalculation> {
    // Get all payments for the application
    const payments = await prisma.payment.findMany({
      where: { applicationId },
      orderBy: { paymentDate: 'asc' }
    });

    // Get the application to check dates
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { candidate: true }
    });

    if (!application) {
      throw new Error('Application not found');
    }

    const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const refundBreakdown: Array<{
      paymentType: string;
      amount: number;
      isRefundable: boolean;
      refundAmount: number;
    }> = [];
    let refundableAmount = 0;
    let nonRefundableAmount = 0;

    // Calculate refund based on payment types and business rules
    for (const payment of payments) {
      let isRefundable = payment.isRefundable;
      let refundAmount = Number(payment.amount);

      // Apply business rules for refundability
      if (candidateDeparted) {
        // If candidate departed, no refund
        isRefundable = false;
        refundAmount = 0;
      } else if (candidateInLebanon) {
        // If candidate is in Lebanon, check if it's been more than 3 months
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        if (application.createdAt < threeMonthsAgo) {
          // More than 3 months, full refund
          isRefundable = true;
          refundAmount = Number(payment.amount);
        } else {
          // Less than 3 months, check payment type
          if (payment.paymentType === 'INSURANCE' || payment.paymentType === 'VISA_FEE') {
            isRefundable = false;
            refundAmount = 0;
          } else {
            isRefundable = true;
            refundAmount = Number(payment.amount) * 0.5; // 50% refund
          }
        }
      } else {
        // Candidate not in Lebanon, full refund for most payment types
        if (payment.paymentType === 'INSURANCE') {
          isRefundable = false;
          refundAmount = 0;
        } else {
          isRefundable = true;
          refundAmount = Number(payment.amount);
        }
      }

      refundBreakdown.push({
        paymentType: payment.paymentType,
        amount: Number(payment.amount),
        isRefundable,
        refundAmount
      });

      if (isRefundable) {
        refundableAmount += refundAmount;
      } else {
        nonRefundableAmount += Number(payment.amount);
      }
    }

    const calculatedRefund = refundableAmount;
    const finalRefund = customRefundAmount !== undefined ? customRefundAmount : calculatedRefund;

    return {
      totalPaid,
      refundableAmount,
      nonRefundableAmount,
      calculatedRefund,
      finalRefund,
      refundBreakdown
    };
  }

  /**
   * Process a guarantor change
   */
  static async processGuarantorChange(
    request: GuarantorChangeRequest,
    companyId: string
  ): Promise<{ guarantorChange: any; newApplication?: any }> {
    return await prisma.$transaction(async (tx) => {
      // Get the original application
      const originalApplication = await tx.application.findUnique({
        where: { id: request.originalApplicationId },
        include: {
          client: true,
          candidate: true,
          payments: true
        }
      });

      if (!originalApplication) {
        throw new Error('Original application not found');
      }

      // Get the new client
      const toClient = await tx.client.findUnique({
        where: { id: request.toClientId }
      });

      if (!toClient) {
        throw new Error('New client not found');
      }

      // Calculate refund
      const refundCalculation = await this.calculateRefund(
        request.originalApplicationId,
        request.candidateInLebanon,
        request.candidateDeparted,
        request.customRefundAmount
      );

      // Determine new candidate status
      let newCandidateStatus: CandidateStatus;
      if (request.candidateDeparted) {
        newCandidateStatus = CandidateStatus.PLACED; // Mark as placed but departed
      } else if (request.candidateInLebanon) {
        newCandidateStatus = CandidateStatus.AVAILABLE_IN_LEBANON;
      } else {
        newCandidateStatus = CandidateStatus.AVAILABLE_ABROAD;
      }

      // Update candidate status
      await tx.candidate.update({
        where: { id: originalApplication.candidateId },
        data: { status: newCandidateStatus }
      });

      // Update original application status
      await tx.application.update({
        where: { id: request.originalApplicationId },
        data: { status: ApplicationStatus.CONTRACT_ENDED }
      });

      // Create refund payment if applicable
      if (refundCalculation.finalRefund > 0) {
        await tx.payment.create({
          data: {
            applicationId: request.originalApplicationId,
            clientId: originalApplication.clientId,
            amount: -refundCalculation.finalRefund, // Negative amount for refund
            currency: 'USD',
            paymentType: 'REFUND',
            notes: `Refund for guarantor change - ${request.reason || 'No reason provided'}`,
            isRefundable: false
          }
        });
      }

      // Create guarantor change record
      const guarantorChange = await tx.guarantorChange.create({
        data: {
          originalApplicationId: request.originalApplicationId,
          fromClientId: originalApplication.clientId,
          toClientId: request.toClientId,
          candidateId: originalApplication.candidateId,
          reason: request.reason,
          refundAmount: refundCalculation.finalRefund,
          refundCurrency: 'USD',
          refundProcessed: refundCalculation.finalRefund > 0,
          refundProcessedDate: refundCalculation.finalRefund > 0 ? new Date() : null,
          candidateStatusBefore: originalApplication.candidate.status,
          candidateStatusAfter: newCandidateStatus,
          notes: request.notes,
          companyId
        },
        include: {
          originalApplication: {
            include: { client: true, candidate: true }
          },
          fromClient: true,
          toClient: true,
          candidate: true
        }
      });

      return { guarantorChange };
    });
  }

  /**
   * Create a new application for the guarantor change
   */
  static async createNewApplicationForGuarantorChange(
    guarantorChangeId: string,
    companyId: string,
    feeTemplateId?: string,
    brokerId?: string
  ): Promise<any> {
    return await prisma.$transaction(async (tx) => {
      // Get the guarantor change
      const guarantorChange = await tx.guarantorChange.findUnique({
        where: { id: guarantorChangeId },
        include: {
          originalApplication: true,
          toClient: true,
          candidate: true
        }
      });

      if (!guarantorChange) {
        throw new Error('Guarantor change not found');
      }

      // Generate shareable link
      const shareableLink = `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create new application
      const newApplication = await tx.application.create({
        data: {
          clientId: guarantorChange.toClientId,
          candidateId: guarantorChange.candidateId,
          type: 'GUARANTOR_CHANGE',
          status: ApplicationStatus.PENDING_MOL,
          shareableLink,
          feeTemplateId,
          brokerId,
          fromClientId: guarantorChange.fromClientId,
          companyId
        },
        include: {
          client: true,
          candidate: true,
          broker: true,
          feeTemplate: true
        }
      });

      // Update guarantor change with new application ID
      await tx.guarantorChange.update({
        where: { id: guarantorChangeId },
        data: { newApplicationId: newApplication.id }
      });

      return newApplication;
    });
  }

  /**
   * Get guarantor change history for a candidate
   */
  static async getCandidateGuarantorHistory(candidateId: string, companyId: string) {
    return await prisma.guarantorChange.findMany({
      where: {
        candidateId,
        companyId
      },
      include: {
        originalApplication: {
          include: { client: true }
        },
        newApplication: {
          include: { client: true }
        },
        fromClient: true,
        toClient: true
      },
      orderBy: { changeDate: 'desc' }
    });
  }

  /**
   * Get guarantor change history for a client
   */
  static async getClientGuarantorHistory(clientId: string, companyId: string) {
    return await prisma.guarantorChange.findMany({
      where: {
        OR: [
          { fromClientId: clientId },
          { toClientId: clientId }
        ],
        companyId
      },
      include: {
        originalApplication: {
          include: { client: true, candidate: true }
        },
        newApplication: {
          include: { client: true, candidate: true }
        },
        fromClient: true,
        toClient: true,
        candidate: true
      },
      orderBy: { changeDate: 'desc' }
    });
  }

  /**
   * Process refund for a guarantor change
   */
  static async processRefund(guarantorChangeId: string, companyId: string) {
    return await prisma.$transaction(async (tx) => {
      const guarantorChange = await tx.guarantorChange.findUnique({
        where: { id: guarantorChangeId }
      });

      if (!guarantorChange) {
        throw new Error('Guarantor change not found');
      }

      if (guarantorChange.refundProcessed) {
        throw new Error('Refund already processed');
      }

      // Update guarantor change
      const updatedGuarantorChange = await tx.guarantorChange.update({
        where: { id: guarantorChangeId },
        data: {
          refundProcessed: true,
          refundProcessedDate: new Date()
        }
      });

      return updatedGuarantorChange;
    });
  }
}


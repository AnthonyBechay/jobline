import { ApplicationStatus, CandidateStatus, ApplicationType } from '@prisma/client';
import { prisma } from '../index';
import { ApplicationStateMachine } from './applicationStateMachine.service';
import { FinancialStrategyService, RefundCalculationResult } from './financialStrategy.service';
import { ImprovedFinancialService } from './improvedFinancial.service';

export interface CancellationRequest {
  applicationId: string;
  cancellationType: 'pre_arrival' | 'pre_arrival_client' | 'pre_arrival_candidate' | 'post_arrival_within_3_months' | 'post_arrival_after_3_months' | 'candidate_cancellation';
  reason?: string;
  notes?: string;
  customRefundAmount?: number;
  overrideFee?: number; // New field for super admin to override penalty fee
  candidateInLebanon?: boolean;
  candidateDeparted?: boolean;
  newClientId?: string; // For reassignment
  deportCandidate?: boolean; // For deportation option
}

export interface CancellationResult {
  success: boolean;
  application: any;
  refundCalculation?: RefundCalculationResult;
  newApplication?: any; // If reassigned
  message: string;
  financialImpact: {
    refundAmount: number;
    penaltyFee: number;
    nonRefundableFees: number;
    totalCostsAbsorbed: number;
  };
}

export class ApplicationCancellationService {
  /**
   * Process application cancellation based on the business workflow rules
   */
  static async processCancellation(
    request: CancellationRequest,
    performedBy: string,
    companyId: string
  ): Promise<CancellationResult> {
    return await prisma.$transaction(async (tx) => {
      // Get the application with all related data
      const application = await tx.application.findUnique({
        where: { id: request.applicationId },
        include: {
          client: true,
          candidate: true,
          payments: true,
          costs: true,
          feeTemplate: true
        }
      });

      if (!application) {
        throw new Error('Application not found');
      }

      // Validate cancellation is allowed
      const isValidCancellation = ApplicationStateMachine.isValidTransition(
        application.status,
        this.getCancellationStatus(request.cancellationType)
      );

      if (!isValidCancellation.valid) {
        throw new Error(`Cancellation not allowed: ${isValidCancellation.reason}`);
      }

      // Calculate refund using improved financial service
      const refundCalculation = await this.calculateRefund(
        application,
        request,
        companyId
      );

      // Process the cancellation based on type
      let result: CancellationResult;

      switch (request.cancellationType) {
        case 'pre_arrival':
          result = await this.processPreArrivalCancellation(
            application,
            request,
            refundCalculation,
            performedBy,
            companyId,
            tx
          );
          break;

        case 'post_arrival_within_3_months':
        case 'post_arrival_after_3_months':
          result = await this.processPostArrivalCancellation(
            application,
            request,
            refundCalculation,
            performedBy,
            companyId,
            tx
          );
          break;

        case 'candidate_cancellation':
          result = await this.processCandidateCancellation(
            application,
            request,
            refundCalculation,
            performedBy,
            companyId,
            tx
          );
          break;

        default:
          throw new Error(`Unknown cancellation type: ${request.cancellationType}`);
      }

      return result;
    });
  }

  /**
   * Process pre-arrival cancellation (Flow B)
   */
  private static async processPreArrivalCancellation(
    application: any,
    request: CancellationRequest,
    refundCalculation: RefundCalculationResult,
    performedBy: string,
    companyId: string,
    tx: any
  ): Promise<CancellationResult> {
    // Update application status
    const updatedApplication = await tx.application.update({
      where: { id: application.id },
      data: { status: ApplicationStatus.CANCELLED_PRE_ARRIVAL }
    });

    // Log lifecycle event
    await ApplicationStateMachine.logStateTransition(
      application.id,
      application.status,
      ApplicationStatus.CANCELLED_PRE_ARRIVAL,
      performedBy,
      companyId,
      `Pre-arrival cancellation: ${request.reason || 'No reason provided'}`,
      { refundCalculation },
      tx
    );

    // Update candidate status to Available (Abroad)
    await tx.candidate.update({
      where: { id: application.candidateId },
      data: { status: CandidateStatus.AVAILABLE_ABROAD }
    });

    // Create refund payment if applicable
    if (refundCalculation.finalRefund > 0) {
      await tx.payment.create({
        data: {
          applicationId: application.id,
          clientId: application.clientId,
          amount: -refundCalculation.finalRefund, // Negative amount for refund
          currency: 'USD',
          paymentType: 'REFUND',
          notes: `Pre-arrival cancellation refund - ${request.reason || 'No reason provided'}`,
          isRefundable: false
        }
      });
    }

    // Log the cancellation
    await ApplicationStateMachine.logCancellation(
      application.id,
      application.status,
      ApplicationStatus.CANCELLED_PRE_ARRIVAL,
      'pre_arrival',
      performedBy,
      companyId,
      request.notes,
      {
        refundAmount: refundCalculation.finalRefund,
        penaltyFee: request.overrideFee !== undefined ? request.overrideFee : refundCalculation.penaltyFee,
        actualCancellationFee: request.overrideFee !== undefined ? request.overrideFee : refundCalculation.penaltyFee,
        reason: request.reason
      }
    );

    return {
      success: true,
      application: updatedApplication,
      refundCalculation,
      message: 'Application cancelled successfully. Candidate remains available abroad.',
      financialImpact: {
        refundAmount: refundCalculation.finalRefund,
        penaltyFee: refundCalculation.penaltyFee,
        nonRefundableFees: refundCalculation.nonRefundableAmount,
        totalCostsAbsorbed: this.calculateTotalCostsAbsorbed(application.costs)
      }
    };
  }

  /**
   * Process post-arrival cancellation (Flow C & D)
   */
  private static async processPostArrivalCancellation(
    application: any,
    request: CancellationRequest,
    refundCalculation: RefundCalculationResult,
    performedBy: string,
    companyId: string,
    tx: any
  ): Promise<CancellationResult> {
    // Determine the correct cancellation status based on type
    const cancellationStatus = request.cancellationType === 'post_arrival_within_3_months' 
      ? ApplicationStatus.CANCELLED_POST_ARRIVAL 
      : ApplicationStatus.CANCELLED_POST_ARRIVAL; // We can add a new status later if needed

    // Update application status
    const updatedApplication = await tx.application.update({
      where: { id: application.id },
      data: { status: cancellationStatus }
    });

    // Log lifecycle event
    await ApplicationStateMachine.logStateTransition(
      application.id,
      application.status,
      cancellationStatus,
      performedBy,
      companyId,
      `Post-arrival cancellation (${request.cancellationType}): ${request.reason || 'No reason provided'}`,
      { refundCalculation, cancellationType: request.cancellationType },
      tx
    );

    // Update candidate status based on next action
    let candidateStatus: any = CandidateStatus.AVAILABLE_IN_LEBANON;
    if (request.newClientId && !request.deportCandidate) {
      // If reassigning to new client, candidate should be IN_PROCESS (not available for new applications)
      candidateStatus = CandidateStatus.IN_PROCESS;
    } else if (request.deportCandidate) {
      // If deporting, keep as AVAILABLE_IN_LEBANON for now (will be changed to DEPORTED later)
      candidateStatus = CandidateStatus.AVAILABLE_IN_LEBANON;
    }
    
    await tx.candidate.update({
      where: { id: application.candidateId },
      data: { status: candidateStatus }
    });

    // Create refund payment if applicable
    if (refundCalculation.finalRefund > 0) {
      await tx.payment.create({
        data: {
          applicationId: application.id,
          clientId: application.clientId,
          amount: -refundCalculation.finalRefund,
          currency: 'USD',
          paymentType: 'REFUND',
          notes: `Post-arrival cancellation refund - ${request.reason || 'No reason provided'}`,
          isRefundable: false
        }
      });
    }

    // Handle next actions for candidate
    let newApplication = null;
    let message = 'Application cancelled successfully. Candidate is now available in Lebanon.';

    if (request.newClientId && !request.deportCandidate) {
      // Option A: Assign to New Client
      newApplication = await this.createReassignmentApplication(
        application,
        request.newClientId,
        performedBy,
        companyId,
        tx
      );
      message += ' New application created for reassignment.';
    } else if (request.deportCandidate) {
      // Option B: Deport Candidate
      await this.processCandidateDeportation(application, performedBy, companyId, tx);
      message += ' Candidate marked for deportation.';
    }

    // Log the cancellation
    await ApplicationStateMachine.logCancellation(
      application.id,
      application.status,
      ApplicationStatus.CANCELLED_POST_ARRIVAL,
      'post_arrival',
      performedBy,
      companyId,
      request.notes,
      {
        refundAmount: refundCalculation.finalRefund,
        penaltyFee: refundCalculation.penaltyFee,
        reason: request.reason,
        nextAction: request.newClientId ? 'reassignment' : request.deportCandidate ? 'deportation' : 'pending'
      }
    );

    return {
      success: true,
      application: updatedApplication,
      refundCalculation,
      newApplication,
      message,
      financialImpact: {
        refundAmount: refundCalculation.finalRefund,
        penaltyFee: refundCalculation.penaltyFee,
        nonRefundableFees: refundCalculation.nonRefundableAmount,
        totalCostsAbsorbed: this.calculateTotalCostsAbsorbed(application.costs)
      }
    };
  }

  /**
   * Process candidate cancellation (Flow E)
   */
  private static async processCandidateCancellation(
    application: any,
    request: CancellationRequest,
    refundCalculation: RefundCalculationResult,
    performedBy: string,
    companyId: string,
    tx: any
  ): Promise<CancellationResult> {
    // Update application status
    const updatedApplication = await tx.application.update({
      where: { id: application.id },
      data: { status: ApplicationStatus.CANCELLED_CANDIDATE }
    });

    // Log lifecycle event
    await ApplicationStateMachine.logStateTransition(
      application.id,
      application.status,
      ApplicationStatus.CANCELLED_CANDIDATE,
      performedBy,
      companyId,
      `Candidate cancellation: ${request.reason || 'No reason provided'}`,
      { refundCalculation },
      tx
    );

    // Update candidate status to Available (In Lebanon)
    await tx.candidate.update({
      where: { id: application.candidateId },
      data: { status: CandidateStatus.AVAILABLE_IN_LEBANON }
    });

    // Create refund payment (typically full refund for candidate cancellation)
    if (refundCalculation.finalRefund > 0) {
      await tx.payment.create({
        data: {
          applicationId: application.id,
          clientId: application.clientId,
          amount: -refundCalculation.finalRefund,
          currency: 'USD',
          paymentType: 'REFUND',
          notes: `Candidate cancellation refund - ${request.reason || 'No reason provided'}`,
          isRefundable: false
        }
      });
    }

    // Log the cancellation
    await ApplicationStateMachine.logCancellation(
      application.id,
      application.status,
      ApplicationStatus.CANCELLED_CANDIDATE,
      'candidate_cancellation',
      performedBy,
      companyId,
      request.notes,
      {
        refundAmount: refundCalculation.finalRefund,
        penaltyFee: 0, // No penalty for candidate cancellation
        reason: request.reason
      }
    );

    return {
      success: true,
      application: updatedApplication,
      refundCalculation,
      message: 'Application cancelled by candidate. Full refund processed. All costs absorbed by office.',
      financialImpact: {
        refundAmount: refundCalculation.finalRefund,
        penaltyFee: 0,
        nonRefundableFees: 0,
        totalCostsAbsorbed: this.calculateTotalCostsAbsorbed(application.costs)
      }
    };
  }

  /**
   * Create reassignment application for guarantor change
   */
  private static async createReassignmentApplication(
    originalApplication: any,
    newClientId: string,
    performedBy: string,
    companyId: string,
    tx: any
  ): Promise<any> {
    // Check if original paperwork was completed
    const hasExistingPaperwork = this.hasCompletedPaperwork(originalApplication);

    // Get appropriate fee template for in-Lebanon candidate
    const feeTemplate = await FinancialStrategyService.getFeeTemplate(
      ApplicationType.GUARANTOR_CHANGE,
      originalApplication.candidate.nationality,
      CandidateStatus.AVAILABLE_IN_LEBANON,
      companyId
    );

    // Determine starting status based on original application progress
    let startingStatus = ApplicationStatus.PENDING_MOL;
    let transferSteps: string[] = [];
    
    if (hasExistingPaperwork) {
      // If paperwork was completed, start from where original application left off
      if (originalApplication.status === ApplicationStatus.ACTIVE_EMPLOYMENT) {
        startingStatus = ApplicationStatus.PENDING_MOL; // Start fresh for transfer
        transferSteps = [
          'Transfer of Sponsorship',
          'Relinquish Letter from Previous Client',
          'Commitment Letter from New Client',
          'Certificate of Deposit from New Client'
        ];
      } else if (originalApplication.status === ApplicationStatus.RESIDENCY_PERMIT_PROCESSING) {
        startingStatus = ApplicationStatus.PENDING_MOL; // Start fresh for transfer
        transferSteps = [
          'Transfer of Sponsorship',
          'Relinquish Letter from Previous Client',
          'Commitment Letter from New Client',
          'Certificate of Deposit from New Client'
        ];
      } else if (originalApplication.status === ApplicationStatus.LABOUR_PERMIT_PROCESSING) {
        startingStatus = ApplicationStatus.PENDING_MOL; // Start fresh for transfer
        transferSteps = [
          'Transfer of Sponsorship',
          'Relinquish Letter from Previous Client',
          'Commitment Letter from New Client',
          'Certificate of Deposit from New Client'
        ];
      } else if (originalApplication.status === ApplicationStatus.WORKER_ARRIVED) {
        startingStatus = ApplicationStatus.PENDING_MOL; // Start fresh for transfer
        transferSteps = [
          'Transfer of Sponsorship',
          'Relinquish Letter from Previous Client',
          'Commitment Letter from New Client',
          'Certificate of Deposit from New Client'
        ];
      }
    }

    // Generate shareable link
    const shareableLink = `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create new application
    const newApplication = await tx.application.create({
      data: {
        clientId: newClientId,
        candidateId: originalApplication.candidateId,
        type: ApplicationType.GUARANTOR_CHANGE,
        status: startingStatus,
        shareableLink,
        feeTemplateId: feeTemplate?.id,
        finalFeeAmount: feeTemplate?.defaultPrice,
        fromClientId: originalApplication.clientId,
        companyId
      },
      include: {
        client: true,
        candidate: true,
        feeTemplate: true
      }
    });

    // Create document checklist based on paperwork status
    const documentTemplates = await tx.documentTemplate.findMany({
      where: {
        stage: startingStatus,
        companyId
      },
      orderBy: { order: 'asc' }
    });

    const documentItems: any[] = [];
    
    // Add standard documents
    if (documentTemplates.length > 0) {
      documentItems.push(...documentTemplates.map(template => ({
        applicationId: newApplication.id,
        documentName: template.name,
        status: 'PENDING',
        stage: template.stage,
        required: template.required,
        requiredFrom: template.requiredFrom,
        order: template.order
      })));
    }
    
    // Add transfer-specific documents if this is a guarantor change
    if (transferSteps.length > 0) {
      documentItems.push(...transferSteps.map((step, index) => ({
        applicationId: newApplication.id,
        documentName: step,
        status: 'PENDING',
        stage: startingStatus,
        required: true,
        requiredFrom: 'office',
        order: (documentTemplates.length || 0) + index + 1
      })));
    }

    if (documentItems.length > 0) {
      await tx.documentChecklistItem.createMany({
        data: documentItems
      });
    }

    // Log the reassignment
    await ApplicationStateMachine.logStateTransition(
      newApplication.id,
      null as any,
      ApplicationStatus.PENDING_MOL,
      performedBy,
      companyId,
      `Guarantor change application created from cancelled application ${originalApplication.id}`,
      {
        originalApplicationId: originalApplication.id,
        hasExistingPaperwork
      }
    );

    return newApplication;
  }

  /**
   * Process candidate deportation
   */
  private static async processCandidateDeportation(
    application: any,
    performedBy: string,
    companyId: string,
    tx: any
  ): Promise<void> {
    // Log deportation cost
    await tx.cost.create({
      data: {
        applicationId: application.id,
        amount: 500, // Default deportation cost - should be configurable
        currency: 'USD',
        costType: 'DEPORTATION',
        description: 'Return ticket and deportation costs'
      }
    });

    // Log the deportation
    await ApplicationStateMachine.logStateTransition(
      application.id,
      application.status,
      application.status, // No status change, just logging
      performedBy,
      companyId,
      'Candidate marked for deportation',
      {
        action: 'deportation',
        cost: 500
      }
    );
  }

  /**
   * Calculate refund based on cancellation type and settings
   */
  private static async calculateRefund(
    application: any,
    request: CancellationRequest,
    companyId: string
  ): Promise<any> {
    const options: any = {};

    // Use the cancellation type directly (it should already be specific)
    let specificCancellationType = request.cancellationType;
    // Handle legacy 'pre_arrival' type by defaulting to client cancellation
    if (specificCancellationType === 'pre_arrival') {
      specificCancellationType = 'pre_arrival_client';
    }

    // Add timing information for post-arrival cancellations
    if ((request.cancellationType === 'post_arrival_within_3_months' || request.cancellationType === 'post_arrival_after_3_months') && application.exactArrivalDate) {
      const arrivalDate = new Date(application.exactArrivalDate);
      const monthsSinceArrival = ImprovedFinancialService.calculateMonthsSinceArrival(
        arrivalDate,
        new Date()
      );
      options.monthsSinceArrival = monthsSinceArrival;
    }

    // Add custom refund amount if provided
    if (request.customRefundAmount !== undefined) {
      options.customRefundAmount = request.customRefundAmount;
    }

    // Override penalty fee if provided (super admin only)
    if (request.overrideFee !== undefined) {
      options.overridePenaltyFee = request.overrideFee;
    }

    // Add deportation flag
    if (request.deportCandidate) {
      options.deportCandidate = true;
    }

    return await ImprovedFinancialService.calculateImprovedRefund(
      application,
      specificCancellationType,
      companyId,
      options
    );
  }

  /**
   * Check if original paperwork was completed
   */
  private static hasCompletedPaperwork(application: any): boolean {
    // Check if application reached ACTIVE_EMPLOYMENT status
    return application.status === ApplicationStatus.ACTIVE_EMPLOYMENT ||
           application.status === ApplicationStatus.CONTRACT_ENDED ||
           application.status === ApplicationStatus.RENEWAL_PENDING;
  }

  /**
   * Calculate total costs absorbed by office
   */
  private static calculateTotalCostsAbsorbed(costs: any[]): number {
    return costs.reduce((sum, cost) => sum + Number(cost.amount), 0);
  }

  /**
   * Get cancellation status for a cancellation type
   */
  private static getCancellationStatus(cancellationType: string): ApplicationStatus {
    switch (cancellationType) {
      case 'pre_arrival':
      case 'pre_arrival_client':
      case 'pre_arrival_candidate':
        return ApplicationStatus.CANCELLED_PRE_ARRIVAL;
      case 'post_arrival_within_3_months':
      case 'post_arrival_after_3_months':
        return ApplicationStatus.CANCELLED_POST_ARRIVAL;
      case 'candidate_cancellation':
        return ApplicationStatus.CANCELLED_CANDIDATE;
      default:
        throw new Error(`Unknown cancellation type: ${cancellationType}`);
    }
  }

  /**
   * Get available cancellation options for an application
   */
  static async getAvailableCancellationOptions(
    applicationId: string,
    companyId: string
  ): Promise<{
    canCancel: boolean;
    availableTypes: string[];
    warnings: string[];
    refundEstimate?: RefundCalculationResult;
  }> {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        payments: true,
        candidate: true
      }
    });

    if (!application) {
      throw new Error('Application not found');
    }

    const canCancel = ApplicationStateMachine.isCancellable(application.status);
    const availableTypes: string[] = [];
    const warnings: string[] = [];

    if (!canCancel) {
      return { canCancel: false, availableTypes: [], warnings: ['Application cannot be cancelled in current state'] };
    }

    // Determine available cancellation types
    if (application.status === ApplicationStatus.WORKER_ARRIVED ||
        application.status === ApplicationStatus.LABOUR_PERMIT_PROCESSING ||
        application.status === ApplicationStatus.RESIDENCY_PERMIT_PROCESSING ||
        application.status === ApplicationStatus.ACTIVE_EMPLOYMENT) {
      
      // Check if within 3 months of arrival
      if (application.exactArrivalDate) {
        const arrivalDate = new Date(application.exactArrivalDate);
        const isWithinProbation = ApplicationStateMachine.isWithinProbationPeriod(arrivalDate);
        
        if (isWithinProbation) {
          availableTypes.push('post_arrival_within_3_months');
        } else {
          availableTypes.push('post_arrival_after_3_months');
        }
      } else {
        // If no arrival date, default to within 3 months
        availableTypes.push('post_arrival_within_3_months');
      }
      
      availableTypes.push('candidate_cancellation');
    } else {
      availableTypes.push('pre_arrival');
    }

    // Add warnings based on state
    if (application.status === ApplicationStatus.ACTIVE_EMPLOYMENT) {
      warnings.push('This will end an active employment contract');
    }

    if (application.exactArrivalDate) {
      const arrivalDate = new Date(application.exactArrivalDate);
      const isWithinProbation = ApplicationStateMachine.isWithinProbationPeriod(arrivalDate);
      if (!isWithinProbation) {
        warnings.push('Application is outside probation period - limited refund may apply');
      }
    }

    // Get refund estimate for the most likely cancellation type
    let refundEstimate: any | undefined;
    if (availableTypes.length > 0) {
      try {
        console.log(`🔍 Calculating refund estimate for application ${application.id}, type: ${availableTypes[0]}`);
        refundEstimate = await this.calculateRefund(application, {
          applicationId,
          cancellationType: availableTypes[0] as any,
          reason: ''
        }, companyId);
        console.log(`✅ Refund estimate calculated:`, refundEstimate);
      } catch (error) {
        console.warn('Could not calculate refund estimate:', error);
      }
    }

    return {
      canCancel,
      availableTypes,
      warnings,
      refundEstimate
    };
  }
}

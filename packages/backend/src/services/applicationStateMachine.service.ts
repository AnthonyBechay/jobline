
import { ApplicationStatus, CandidateStatus, ApplicationType } from '@prisma/client';
import { prisma } from '../index';

export interface StateTransition {
  from: ApplicationStatus;
  to: ApplicationStatus;
  allowed: boolean;
  requiresExactArrivalDate?: boolean;
  candidateStatusChange?: CandidateStatus;
  description: string;
}

export interface CancellationFlow {
  type: 'pre_arrival' | 'post_arrival' | 'candidate_cancellation';
  allowedFromStatuses: ApplicationStatus[];
  targetStatus: ApplicationStatus;
  candidateStatusChange: CandidateStatus;
  description: string;
}

export class ApplicationStateMachine {
  // Define valid state transitions
  private static readonly VALID_TRANSITIONS: StateTransition[] = [
    // Standard flow
    {
      from: ApplicationStatus.PENDING_MOL,
      to: ApplicationStatus.MOL_AUTH_RECEIVED,
      allowed: true,
      description: 'MoL Pre-Authorization received'
    },
    {
      from: ApplicationStatus.MOL_AUTH_RECEIVED,
      to: ApplicationStatus.VISA_PROCESSING,
      allowed: true,
      description: 'Visa application submitted'
    },
    {
      from: ApplicationStatus.VISA_PROCESSING,
      to: ApplicationStatus.VISA_RECEIVED,
      allowed: true,
      description: 'Visa received'
    },
    {
      from: ApplicationStatus.VISA_RECEIVED,
      to: ApplicationStatus.WORKER_ARRIVED,
      allowed: true,
      requiresExactArrivalDate: true,
      candidateStatusChange: CandidateStatus.IN_PROCESS,
      description: 'Worker arrived in Lebanon'
    },
    {
      from: ApplicationStatus.WORKER_ARRIVED,
      to: ApplicationStatus.LABOUR_PERMIT_PROCESSING,
      allowed: true,
      description: 'Labour permit application started'
    },
    {
      from: ApplicationStatus.LABOUR_PERMIT_PROCESSING,
      to: ApplicationStatus.RESIDENCY_PERMIT_PROCESSING,
      allowed: true,
      description: 'Labour permit received, residency permit processing'
    },
    {
      from: ApplicationStatus.RESIDENCY_PERMIT_PROCESSING,
      to: ApplicationStatus.ACTIVE_EMPLOYMENT,
      allowed: true,
      candidateStatusChange: CandidateStatus.PLACED,
      description: 'All permits received, active employment'
    },
    {
      from: ApplicationStatus.ACTIVE_EMPLOYMENT,
      to: ApplicationStatus.CONTRACT_ENDED,
      allowed: true,
      candidateStatusChange: CandidateStatus.AVAILABLE_IN_LEBANON,
      description: 'Contract ended'
    },
    {
      from: ApplicationStatus.ACTIVE_EMPLOYMENT,
      to: ApplicationStatus.RENEWAL_PENDING,
      allowed: true,
      description: 'Permit renewal required'
    },
    {
      from: ApplicationStatus.RENEWAL_PENDING,
      to: ApplicationStatus.ACTIVE_EMPLOYMENT,
      allowed: true,
      description: 'Permit renewed'
    }
  ];

  // Define cancellation flows
  private static readonly CANCELLATION_FLOWS: CancellationFlow[] = [
    {
      type: 'pre_arrival',
      allowedFromStatuses: [
        ApplicationStatus.PENDING_MOL,
        ApplicationStatus.MOL_AUTH_RECEIVED,
        ApplicationStatus.VISA_PROCESSING,
        ApplicationStatus.VISA_RECEIVED
      ],
      targetStatus: ApplicationStatus.CANCELLED_PRE_ARRIVAL,
      candidateStatusChange: CandidateStatus.AVAILABLE_ABROAD,
      description: 'Application cancelled before worker arrival'
    },
    {
      type: 'post_arrival',
      allowedFromStatuses: [
        ApplicationStatus.WORKER_ARRIVED,
        ApplicationStatus.LABOUR_PERMIT_PROCESSING,
        ApplicationStatus.RESIDENCY_PERMIT_PROCESSING,
        ApplicationStatus.ACTIVE_EMPLOYMENT
      ],
      targetStatus: ApplicationStatus.CANCELLED_POST_ARRIVAL,
      candidateStatusChange: CandidateStatus.AVAILABLE_IN_LEBANON,
      description: 'Application cancelled after worker arrival'
    },
    {
      type: 'candidate_cancellation',
      allowedFromStatuses: [
        ApplicationStatus.WORKER_ARRIVED,
        ApplicationStatus.LABOUR_PERMIT_PROCESSING,
        ApplicationStatus.RESIDENCY_PERMIT_PROCESSING,
        ApplicationStatus.ACTIVE_EMPLOYMENT
      ],
      targetStatus: ApplicationStatus.CANCELLED_CANDIDATE,
      candidateStatusChange: CandidateStatus.AVAILABLE_IN_LEBANON,
      description: 'Application cancelled by candidate'
    }
  ];

  /**
   * Check if a state transition is valid
   */
  static isValidTransition(
    from: ApplicationStatus,
    to: ApplicationStatus,
    applicationType?: ApplicationType
  ): { valid: boolean; transition?: StateTransition; reason?: string } {
    // Check for standard transitions
    const transition = this.VALID_TRANSITIONS.find(t => t.from === from && t.to === to);
    if (transition) {
      return { valid: true, transition };
    }

    // Check for cancellation flows
    const cancellationFlow = this.CANCELLATION_FLOWS.find(cf => cf.targetStatus === to);
    if (cancellationFlow && cancellationFlow.allowedFromStatuses.includes(from)) {
      return { valid: true, transition: {
        from,
        to,
        allowed: true,
        candidateStatusChange: cancellationFlow.candidateStatusChange,
        description: cancellationFlow.description
      }};
    }

    return { 
      valid: false, 
      reason: `Invalid transition from ${from} to ${to}` 
    };
  }

  /**
   * Get all valid next states for a given current state
   */
  static getValidNextStates(currentState: ApplicationStatus): ApplicationStatus[] {
    const validTransitions = this.VALID_TRANSITIONS
      .filter(t => t.from === currentState)
      .map(t => t.to);

    const validCancellations = this.CANCELLATION_FLOWS
      .filter(cf => cf.allowedFromStatuses.includes(currentState))
      .map(cf => cf.targetStatus);

    return [...validTransitions, ...validCancellations];
  }

  /**
   * Get cancellation flows available for a given state
   */
  static getAvailableCancellationFlows(currentState: ApplicationStatus): CancellationFlow[] {
    return this.CANCELLATION_FLOWS.filter(cf => 
      cf.allowedFromStatuses.includes(currentState)
    );
  }

  /**
   * Check if exact arrival date is required for a transition
   */
  static requiresExactArrivalDate(to: ApplicationStatus): boolean {
    return to === ApplicationStatus.WORKER_ARRIVED;
  }

  /**
   * Get candidate status change for a transition
   */
  static getCandidateStatusChange(
    from: ApplicationStatus,
    to: ApplicationStatus
  ): CandidateStatus | null {
    const transition = this.VALID_TRANSITIONS.find(t => t.from === from && t.to === to);
    if (transition?.candidateStatusChange) {
      return transition.candidateStatusChange;
    }

    const cancellationFlow = this.CANCELLATION_FLOWS.find(cf => cf.targetStatus === to);
    if (cancellationFlow && cancellationFlow.allowedFromStatuses.includes(from)) {
      return cancellationFlow.candidateStatusChange;
    }

    return null;
  }

  /**
   * Check if an application is in a cancellable state
   */
  static isCancellable(currentState: ApplicationStatus): boolean {
    return this.CANCELLATION_FLOWS.some(cf => 
      cf.allowedFromStatuses.includes(currentState)
    );
  }

  /**
   * Check if an application is in a completed state
   */
  static isCompleted(currentState: ApplicationStatus): boolean {
    const completedStates: ApplicationStatus[] = [
      ApplicationStatus.CONTRACT_ENDED,
      ApplicationStatus.CANCELLED_PRE_ARRIVAL,
      ApplicationStatus.CANCELLED_POST_ARRIVAL,
      ApplicationStatus.CANCELLED_CANDIDATE
    ];
    return completedStates.includes(currentState);
  }

  /**
   * Check if an application is in an active state
   */
  static isActive(currentState: ApplicationStatus): boolean {
    const activeStates: ApplicationStatus[] = [
      ApplicationStatus.ACTIVE_EMPLOYMENT,
      ApplicationStatus.RENEWAL_PENDING
    ];
    return activeStates.includes(currentState);
  }

  /**
   * Get the probation period end date (3 months after arrival)
   */
  static getProbationEndDate(arrivalDate: Date): Date {
    const probationEnd = new Date(arrivalDate);
    probationEnd.setMonth(probationEnd.getMonth() + 3);
    return probationEnd;
  }

  /**
   * Check if an application is within the 3-month probation period
   */
  static isWithinProbationPeriod(arrivalDate: Date, currentDate: Date = new Date()): boolean {
    const probationEnd = this.getProbationEndDate(arrivalDate);
    return currentDate <= probationEnd;
  }

  /**
   * Get the appropriate cancellation type based on application state and timing
   */
  static getCancellationType(
    currentState: ApplicationStatus,
    arrivalDate?: Date
  ): 'pre_arrival' | 'post_arrival' | 'candidate_cancellation' | null {
    if (currentState === ApplicationStatus.WORKER_ARRIVED && arrivalDate) {
      const isWithinProbation = this.isWithinProbationPeriod(arrivalDate);
      return isWithinProbation ? 'post_arrival' : 'post_arrival'; // Both are post-arrival, but different rules apply
    }

    const preArrivalStates: ApplicationStatus[] = [
      ApplicationStatus.PENDING_MOL,
      ApplicationStatus.MOL_AUTH_RECEIVED,
      ApplicationStatus.VISA_PROCESSING,
      ApplicationStatus.VISA_RECEIVED
    ];

    if (preArrivalStates.includes(currentState)) {
      return 'pre_arrival';
    }

    const postArrivalStates: ApplicationStatus[] = [
      ApplicationStatus.LABOUR_PERMIT_PROCESSING,
      ApplicationStatus.RESIDENCY_PERMIT_PROCESSING,
      ApplicationStatus.ACTIVE_EMPLOYMENT
    ];

    if (postArrivalStates.includes(currentState)) {
      return 'post_arrival';
    }

    return null;
  }

  /**
   * Get document requirements for a new application based on type and existing paperwork
   */
  static getDocumentRequirements(
    applicationType: ApplicationType,
    hasExistingPaperwork: boolean = false
  ): string[] {
    if (applicationType === ApplicationType.NEW_CANDIDATE) {
      return [
        'Passport Copy',
        'Medical Certificate',
        'Criminal Record',
        'Educational Certificates',
        'Work Experience Letters',
        'MoL Pre-Authorization',
        'Visa Application',
        'Labour Permit',
        'Residency Permit'
      ];
    }

    if (applicationType === ApplicationType.GUARANTOR_CHANGE) {
      const baseDocuments = [
        'Relinquish Letter',
        'Commitment Letter',
        'Transfer of Sponsorship',
        'Certificate of Deposit'
      ];

      if (!hasExistingPaperwork) {
        return [
          ...baseDocuments,
          'Labour Permit',
          'Residency Permit'
        ];
      }

      return baseDocuments;
    }

    return [];
  }

  /**
   * Log a state transition in the lifecycle history
   */
  static async logStateTransition(
    applicationId: string,
    fromStatus: ApplicationStatus,
    toStatus: ApplicationStatus,
    performedBy: string,
    companyId: string,
    notes?: string,
    financialImpact?: any,
    tx?: any
  ): Promise<void> {
    const prismaClient = tx || prisma;
    
    // Verify the application exists before creating lifecycle history
    const application = await prismaClient.application.findUnique({
      where: { id: applicationId },
      select: { id: true }
    });
    
    if (!application) {
      console.warn(`Application ${applicationId} not found when logging state transition`);
      return;
    }
    
    await prismaClient.applicationLifecycleHistory.create({
      data: {
        applicationId,
        action: 'status_change',
        fromStatus,
        toStatus,
        performedBy,
        companyId,
        notes,
        financialImpact
      }
    });
  }

  /**
   * Log a cancellation action
   */
  static async logCancellation(
    applicationId: string,
    fromStatus: ApplicationStatus,
    toStatus: ApplicationStatus,
    cancellationType: string,
    performedBy: string,
    companyId: string,
    notes?: string,
    financialImpact?: any
  ): Promise<void> {
    await prisma.applicationLifecycleHistory.create({
      data: {
        applicationId,
        action: 'cancellation',
        fromStatus,
        toStatus,
        performedBy,
        companyId,
        notes: `Cancellation (${cancellationType}): ${notes}`,
        financialImpact
      }
    });
  }
}

import { ApplicationStatus, CandidateStatus } from '@prisma/client';
import { prisma } from '../index';

export interface LifecycleHistoryEntry {
  id: string;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  fromClientId?: string;
  toClientId?: string;
  candidateStatusBefore?: string;
  candidateStatusAfter?: string;
  financialImpact?: any;
  notes?: string;
  performedBy: {
    id: string;
    name: string;
    email: string;
  };
  performedAt: Date;
}

export interface LifecycleHistoryFilters {
  applicationId?: string;
  candidateId?: string;
  clientId?: string;
  action?: string;
  performedBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface LifecycleSummary {
  totalEntries: number;
  statusChanges: number;
  cancellations: number;
  payments: number;
  costs: number;
  guarantorChanges: number;
  recentActivity: LifecycleHistoryEntry[];
}

export class LifecycleHistoryService {
  /**
   * Get lifecycle history for an application
   */
  static async getApplicationHistory(
    applicationId: string,
    companyId: string,
    limit: number = 50
  ): Promise<LifecycleHistoryEntry[]> {
    const history = await prisma.applicationLifecycleHistory.findMany({
      where: {
        applicationId,
        companyId
      },
      include: {
        performer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        performedAt: 'desc'
      },
      take: limit
    });

    return history.map(entry => ({
      id: entry.id,
      action: entry.action,
      fromStatus: entry.fromStatus || undefined,
      toStatus: entry.toStatus || undefined,
      fromClientId: entry.fromClientId || undefined,
      toClientId: entry.toClientId || undefined,
      candidateStatusBefore: entry.candidateStatusBefore || undefined,
      candidateStatusAfter: entry.candidateStatusAfter || undefined,
      financialImpact: entry.financialImpact,
      notes: entry.notes || undefined,
      performedBy: entry.performer,
      performedAt: entry.performedAt
    }));
  }

  /**
   * Get lifecycle history for a candidate across all applications
   */
  static async getCandidateHistory(
    candidateId: string,
    companyId: string,
    limit: number = 100
  ): Promise<LifecycleHistoryEntry[]> {
    // Get all applications for this candidate
    const applications = await prisma.application.findMany({
      where: {
        candidateId,
        companyId
      },
      select: { id: true }
    });

    const applicationIds = applications.map(app => app.id);

    if (applicationIds.length === 0) {
      return [];
    }

    const history = await prisma.applicationLifecycleHistory.findMany({
      where: {
        applicationId: {
          in: applicationIds
        },
        companyId
      },
      include: {
        performer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        application: {
          select: {
            id: true,
            client: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        performedAt: 'desc'
      },
      take: limit
    });

    return history.map(entry => ({
      id: entry.id,
      action: entry.action,
      fromStatus: entry.fromStatus || undefined,
      toStatus: entry.toStatus || undefined,
      fromClientId: entry.fromClientId || undefined,
      toClientId: entry.toClientId || undefined,
      candidateStatusBefore: entry.candidateStatusBefore || undefined,
      candidateStatusAfter: entry.candidateStatusAfter || undefined,
      financialImpact: entry.financialImpact,
      notes: entry.notes || undefined,
      performedBy: entry.performer,
      performedAt: entry.performedAt
    }));
  }

  /**
   * Get lifecycle history for a client across all applications
   */
  static async getClientHistory(
    clientId: string,
    companyId: string,
    limit: number = 100
  ): Promise<LifecycleHistoryEntry[]> {
    // Get all applications for this client
    const applications = await prisma.application.findMany({
      where: {
        OR: [
          { clientId },
          { fromClientId: clientId }
        ],
        companyId
      },
      select: { id: true }
    });

    const applicationIds = applications.map(app => app.id);

    if (applicationIds.length === 0) {
      return [];
    }

    const history = await prisma.applicationLifecycleHistory.findMany({
      where: {
        applicationId: {
          in: applicationIds
        },
        companyId
      },
      include: {
        performer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        application: {
          select: {
            id: true,
            candidate: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        performedAt: 'desc'
      },
      take: limit
    });

    return history.map(entry => ({
      id: entry.id,
      action: entry.action,
      fromStatus: entry.fromStatus || undefined,
      toStatus: entry.toStatus || undefined,
      fromClientId: entry.fromClientId || undefined,
      toClientId: entry.toClientId || undefined,
      candidateStatusBefore: entry.candidateStatusBefore || undefined,
      candidateStatusAfter: entry.candidateStatusAfter || undefined,
      financialImpact: entry.financialImpact,
      notes: entry.notes || undefined,
      performedBy: entry.performer,
      performedAt: entry.performedAt
    }));
  }

  /**
   * Get filtered lifecycle history
   */
  static async getFilteredHistory(
    filters: LifecycleHistoryFilters,
    companyId: string
  ): Promise<{
    entries: LifecycleHistoryEntry[];
    total: number;
  }> {
    const where: any = {
      companyId
    };

    if (filters.applicationId) {
      where.applicationId = filters.applicationId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.performedBy) {
      where.performedBy = filters.performedBy;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.performedAt = {};
      if (filters.dateFrom) {
        where.performedAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.performedAt.lte = filters.dateTo;
      }
    }

    // If filtering by candidate or client, we need to get application IDs first
    if (filters.candidateId || filters.clientId) {
      const applicationWhere: any = { companyId };
      
      if (filters.candidateId) {
        applicationWhere.candidateId = filters.candidateId;
      }
      
      if (filters.clientId) {
        applicationWhere.OR = [
          { clientId: filters.clientId },
          { fromClientId: filters.clientId }
        ];
      }

      const applications = await prisma.application.findMany({
        where: applicationWhere,
        select: { id: true }
      });

      const applicationIds = applications.map(app => app.id);
      if (applicationIds.length === 0) {
        return { entries: [], total: 0 };
      }

      where.applicationId = {
        in: applicationIds
      };
    }

    const [entries, total] = await Promise.all([
      prisma.applicationLifecycleHistory.findMany({
        where,
        include: {
          performer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          application: {
            select: {
              id: true,
              client: {
                select: {
                  name: true
                }
              },
              candidate: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: {
          performedAt: 'desc'
        },
        take: filters.limit || 50,
        skip: filters.offset || 0
      }),
      prisma.applicationLifecycleHistory.count({ where })
    ]);

    return {
      entries: entries.map(entry => ({
        id: entry.id,
        action: entry.action,
        fromStatus: entry.fromStatus || undefined,
        toStatus: entry.toStatus || undefined,
        fromClientId: entry.fromClientId || undefined,
        toClientId: entry.toClientId || undefined,
        candidateStatusBefore: entry.candidateStatusBefore || undefined,
        candidateStatusAfter: entry.candidateStatusAfter || undefined,
        financialImpact: entry.financialImpact,
        notes: entry.notes || undefined,
        performedBy: entry.performer,
        performedAt: entry.performedAt
      })),
      total
    };
  }

  /**
   * Get lifecycle summary for an application
   */
  static async getApplicationSummary(
    applicationId: string,
    companyId: string
  ): Promise<LifecycleSummary> {
    const [totalEntries, statusChanges, cancellations, payments, costs, guarantorChanges, recentActivity] = await Promise.all([
      prisma.applicationLifecycleHistory.count({
        where: { applicationId, companyId }
      }),
      prisma.applicationLifecycleHistory.count({
        where: { applicationId, companyId, action: 'status_change' }
      }),
      prisma.applicationLifecycleHistory.count({
        where: { applicationId, companyId, action: 'cancellation' }
      }),
      prisma.applicationLifecycleHistory.count({
        where: { applicationId, companyId, action: 'payment_added' }
      }),
      prisma.applicationLifecycleHistory.count({
        where: { applicationId, companyId, action: 'cost_added' }
      }),
      prisma.applicationLifecycleHistory.count({
        where: { applicationId, companyId, action: 'guarantor_change' }
      }),
      this.getApplicationHistory(applicationId, companyId, 10)
    ]);

    return {
      totalEntries,
      statusChanges,
      cancellations,
      payments,
      costs,
      guarantorChanges,
      recentActivity
    };
  }

  /**
   * Get lifecycle summary for a candidate
   */
  static async getCandidateSummary(
    candidateId: string,
    companyId: string
  ): Promise<LifecycleSummary> {
    // Get all applications for this candidate
    const applications = await prisma.application.findMany({
      where: {
        candidateId,
        companyId
      },
      select: { id: true }
    });

    const applicationIds = applications.map(app => app.id);

    if (applicationIds.length === 0) {
      return {
        totalEntries: 0,
        statusChanges: 0,
        cancellations: 0,
        payments: 0,
        costs: 0,
        guarantorChanges: 0,
        recentActivity: []
      };
    }

    const [totalEntries, statusChanges, cancellations, payments, costs, guarantorChanges, recentActivity] = await Promise.all([
      prisma.applicationLifecycleHistory.count({
        where: { 
          applicationId: { in: applicationIds },
          companyId 
        }
      }),
      prisma.applicationLifecycleHistory.count({
        where: { 
          applicationId: { in: applicationIds },
          companyId,
          action: 'status_change' 
        }
      }),
      prisma.applicationLifecycleHistory.count({
        where: { 
          applicationId: { in: applicationIds },
          companyId,
          action: 'cancellation' 
        }
      }),
      prisma.applicationLifecycleHistory.count({
        where: { 
          applicationId: { in: applicationIds },
          companyId,
          action: 'payment_added' 
        }
      }),
      prisma.applicationLifecycleHistory.count({
        where: { 
          applicationId: { in: applicationIds },
          companyId,
          action: 'cost_added' 
        }
      }),
      prisma.applicationLifecycleHistory.count({
        where: { 
          applicationId: { in: applicationIds },
          companyId,
          action: 'guarantor_change' 
        }
      }),
      this.getCandidateHistory(candidateId, companyId, 10)
    ]);

    return {
      totalEntries,
      statusChanges,
      cancellations,
      payments,
      costs,
      guarantorChanges,
      recentActivity
    };
  }

  /**
   * Log a payment addition
   */
  static async logPaymentAdded(
    applicationId: string,
    paymentId: string,
    amount: number,
    paymentType: string,
    performedBy: string,
    companyId: string,
    notes?: string
  ): Promise<void> {
    await prisma.applicationLifecycleHistory.create({
      data: {
        applicationId,
        action: 'payment_added',
        performedBy,
        companyId,
        notes: `Payment added: $${amount} (${paymentType})${notes ? ` - ${notes}` : ''}`,
        financialImpact: {
          paymentId,
          amount,
          paymentType
        }
      }
    });
  }

  /**
   * Log a cost addition
   */
  static async logCostAdded(
    applicationId: string,
    costId: string,
    amount: number,
    costType: string,
    performedBy: string,
    companyId: string,
    notes?: string
  ): Promise<void> {
    await prisma.applicationLifecycleHistory.create({
      data: {
        applicationId,
        action: 'cost_added',
        performedBy,
        companyId,
        notes: `Cost added: $${amount} (${costType})${notes ? ` - ${notes}` : ''}`,
        financialImpact: {
          costId,
          amount,
          costType
        }
      }
    });
  }

  /**
   * Log a guarantor change
   */
  static async logGuarantorChange(
    applicationId: string,
    fromClientId: string,
    toClientId: string,
    performedBy: string,
    companyId: string,
    notes?: string,
    financialImpact?: any
  ): Promise<void> {
    await prisma.applicationLifecycleHistory.create({
      data: {
        applicationId,
        action: 'guarantor_change',
        fromClientId,
        toClientId,
        performedBy,
        companyId,
        notes: `Guarantor change${notes ? ` - ${notes}` : ''}`,
        financialImpact
      }
    });
  }

  /**
   * Log document status change
   */
  static async logDocumentStatusChange(
    applicationId: string,
    documentName: string,
    fromStatus: string,
    toStatus: string,
    performedBy: string,
    companyId: string,
    notes?: string
  ): Promise<void> {
    await prisma.applicationLifecycleHistory.create({
      data: {
        applicationId,
        action: 'document_status_change',
        performedBy,
        companyId,
        notes: `Document "${documentName}" status changed from ${fromStatus} to ${toStatus}${notes ? ` - ${notes}` : ''}`,
        financialImpact: {
          documentName,
          fromStatus,
          toStatus
        }
      }
    });
  }

  /**
   * Get activity timeline for dashboard
   */
  static async getActivityTimeline(
    companyId: string,
    limit: number = 20
  ): Promise<LifecycleHistoryEntry[]> {
    const history = await prisma.applicationLifecycleHistory.findMany({
      where: { companyId },
      include: {
        performer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        application: {
          select: {
            id: true,
            client: {
              select: {
                name: true
              }
            },
            candidate: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        performedAt: 'desc'
      },
      take: limit
    });

    return history.map(entry => ({
      id: entry.id,
      action: entry.action,
      fromStatus: entry.fromStatus || undefined,
      toStatus: entry.toStatus || undefined,
      fromClientId: entry.fromClientId || undefined,
      toClientId: entry.toClientId || undefined,
      candidateStatusBefore: entry.candidateStatusBefore || undefined,
      candidateStatusAfter: entry.candidateStatusAfter || undefined,
      financialImpact: entry.financialImpact,
      notes: entry.notes || undefined,
      performedBy: entry.performer,
      performedAt: entry.performedAt
    }));
  }

  /**
   * Get statistics for reporting
   */
  static async getStatistics(
    companyId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    actionsByUser: Record<string, number>;
    actionsByMonth: Record<string, number>;
  }> {
    const where: any = { companyId };
    
    if (dateFrom || dateTo) {
      where.performedAt = {};
      if (dateFrom) {
        where.performedAt.gte = dateFrom;
      }
      if (dateTo) {
        where.performedAt.lte = dateTo;
      }
    }

    const [totalActions, actionsByType, actionsByUser, actionsByMonth] = await Promise.all([
      prisma.applicationLifecycleHistory.count({ where }),
      this.getActionsByType(where),
      this.getActionsByUser(where),
      this.getActionsByMonth(where)
    ]);

    return {
      totalActions,
      actionsByType,
      actionsByUser,
      actionsByMonth
    };
  }

  private static async getActionsByType(where: any): Promise<Record<string, number>> {
    const actions = await prisma.applicationLifecycleHistory.groupBy({
      by: ['action'],
      where,
      _count: {
        action: true
      }
    });

    return actions.reduce((acc, action) => {
      acc[action.action] = action._count.action;
      return acc;
    }, {} as Record<string, number>);
  }

  private static async getActionsByUser(where: any): Promise<Record<string, number>> {
    const actions = await prisma.applicationLifecycleHistory.groupBy({
      by: ['performedBy'],
      where,
      _count: {
        performedBy: true
      }
    });

    // Get user names
    const userIds = actions.map(a => a.performedBy);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true }
    });

    const userMap = users.reduce((acc, user) => {
      acc[user.id] = user.name;
      return acc;
    }, {} as Record<string, string>);

    return actions.reduce((acc, action) => {
      const userName = userMap[action.performedBy] || 'Unknown User';
      acc[userName] = action._count.performedBy;
      return acc;
    }, {} as Record<string, number>);
  }

  private static async getActionsByMonth(where: any): Promise<Record<string, number>> {
    const actions = await prisma.applicationLifecycleHistory.findMany({
      where,
      select: { performedAt: true }
    });

    return actions.reduce((acc, action) => {
      const month = action.performedAt.toISOString().substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

import { prisma } from '../index';

export interface OverheadCost {
  id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  costDate: Date;
  category: string;
  recurring: boolean;
  recurringFrequency?: string;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface OverheadCostFilters {
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  recurring?: boolean;
  createdBy?: string;
  limit?: number;
  offset?: number;
}

export interface OverheadCostSummary {
  totalCosts: number;
  costsByCategory: Record<string, number>;
  costsByMonth: Record<string, number>;
  recurringCosts: number;
  oneTimeCosts: number;
  averageMonthlyCost: number;
}

export interface RecurringCostProjection {
  monthly: number;
  quarterly: number;
  yearly: number;
  nextDue: Array<{
    name: string;
    amount: number;
    dueDate: Date;
    category: string;
  }>;
}

export class OfficeOverheadCostsService {
  /**
   * Create a new overhead cost
   */
  static async createOverheadCost(
    data: {
      name: string;
      description?: string;
      amount: number;
      currency?: string;
      costDate?: Date;
      category: string;
      recurring?: boolean;
      recurringFrequency?: string;
    },
    createdBy: string,
    companyId: string
  ): Promise<OverheadCost> {
    const overheadCost = await prisma.officeOverheadCost.create({
      data: {
        name: data.name,
        description: data.description,
        amount: data.amount,
        currency: data.currency || 'USD',
        costDate: data.costDate || new Date(),
        category: data.category,
        recurring: data.recurring || false,
        recurringFrequency: data.recurringFrequency,
        companyId,
        createdBy
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return {
      id: overheadCost.id,
      name: overheadCost.name,
      description: overheadCost.description || undefined,
      amount: Number(overheadCost.amount),
      currency: overheadCost.currency,
      costDate: overheadCost.costDate,
      category: overheadCost.category,
      recurring: overheadCost.recurring,
      recurringFrequency: overheadCost.recurringFrequency || undefined,
      createdBy: overheadCost.creator,
      createdAt: overheadCost.createdAt,
      updatedAt: overheadCost.updatedAt
    };
  }

  /**
   * Get overhead costs with filters
   */
  static async getOverheadCosts(
    filters: OverheadCostFilters,
    companyId: string
  ): Promise<{
    costs: OverheadCost[];
    total: number;
  }> {
    const where: any = { companyId };

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.recurring !== undefined) {
      where.recurring = filters.recurring;
    }

    if (filters.createdBy) {
      where.createdBy = filters.createdBy;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.costDate = {};
      if (filters.dateFrom) {
        where.costDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.costDate.lte = filters.dateTo;
      }
    }

    const [costs, total] = await Promise.all([
      prisma.officeOverheadCost.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          costDate: 'desc'
        },
        take: filters.limit || 50,
        skip: filters.offset || 0
      }),
      prisma.officeOverheadCost.count({ where })
    ]);

    return {
      costs: costs.map(cost => ({
        id: cost.id,
        name: cost.name,
        description: cost.description || undefined,
        amount: Number(cost.amount),
        currency: cost.currency,
        costDate: cost.costDate,
        category: cost.category,
        recurring: cost.recurring,
        recurringFrequency: cost.recurringFrequency || undefined,
        createdBy: cost.creator,
        createdAt: cost.createdAt,
        updatedAt: cost.updatedAt
      })),
      total
    };
  }

  /**
   * Get overhead cost by ID
   */
  static async getOverheadCostById(
    id: string,
    companyId: string
  ): Promise<OverheadCost | null> {
    const cost = await prisma.officeOverheadCost.findFirst({
      where: { id, companyId },
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!cost) {
      return null;
    }

    return {
      id: cost.id,
      name: cost.name,
      description: cost.description || undefined,
      amount: Number(cost.amount),
      currency: cost.currency,
      costDate: cost.costDate,
      category: cost.category,
      recurring: cost.recurring,
      recurringFrequency: cost.recurringFrequency || undefined,
      createdBy: cost.creator,
      createdAt: cost.createdAt,
      updatedAt: cost.updatedAt
    };
  }

  /**
   * Update overhead cost
   */
  static async updateOverheadCost(
    id: string,
    data: {
      name?: string;
      description?: string;
      amount?: number;
      currency?: string;
      costDate?: Date;
      category?: string;
      recurring?: boolean;
      recurringFrequency?: string;
    },
    companyId: string
  ): Promise<OverheadCost> {
    const updatedCost = await prisma.officeOverheadCost.update({
      where: { id },
      data: {
        ...data,
        amount: data.amount ? data.amount : undefined
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return {
      id: updatedCost.id,
      name: updatedCost.name,
      description: updatedCost.description || undefined,
      amount: Number(updatedCost.amount),
      currency: updatedCost.currency,
      costDate: updatedCost.costDate,
      category: updatedCost.category,
      recurring: updatedCost.recurring,
      recurringFrequency: updatedCost.recurringFrequency || undefined,
      createdBy: updatedCost.creator,
      createdAt: updatedCost.createdAt,
      updatedAt: updatedCost.updatedAt
    };
  }

  /**
   * Delete overhead cost
   */
  static async deleteOverheadCost(
    id: string,
    companyId: string
  ): Promise<void> {
    await prisma.officeOverheadCost.delete({
      where: { id }
    });
  }

  /**
   * Get overhead cost summary
   */
  static async getOverheadCostSummary(
    companyId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<OverheadCostSummary> {
    const where: any = { companyId };
    
    if (dateFrom || dateTo) {
      where.costDate = {};
      if (dateFrom) {
        where.costDate.gte = dateFrom;
      }
      if (dateTo) {
        where.costDate.lte = dateTo;
      }
    }

    const [totalCosts, costsByCategory, costsByMonth, recurringCosts, oneTimeCosts] = await Promise.all([
      this.getTotalCosts(where),
      this.getCostsByCategory(where),
      this.getCostsByMonth(where),
      this.getRecurringCosts(where),
      this.getOneTimeCosts(where)
    ]);

    // Calculate average monthly cost
    const months = this.getMonthsBetween(dateFrom || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), dateTo || new Date());
    const averageMonthlyCost = months > 0 ? totalCosts / months : 0;

    return {
      totalCosts,
      costsByCategory,
      costsByMonth,
      recurringCosts,
      oneTimeCosts,
      averageMonthlyCost
    };
  }

  /**
   * Get recurring cost projection
   */
  static async getRecurringCostProjection(
    companyId: string
  ): Promise<RecurringCostProjection> {
    const recurringCosts = await prisma.officeOverheadCost.findMany({
      where: {
        companyId,
        recurring: true
      }
    });

    let monthly = 0;
    let quarterly = 0;
    let yearly = 0;
    const nextDue: Array<{
      name: string;
      amount: number;
      dueDate: Date;
      category: string;
    }> = [];

    const now = new Date();

    for (const cost of recurringCosts) {
      const amount = Number(cost.amount);
      
      switch (cost.recurringFrequency) {
        case 'monthly':
          monthly += amount;
          nextDue.push({
            name: cost.name,
            amount,
            dueDate: this.getNextDueDate(now, 'monthly'),
            category: cost.category
          });
          break;
        case 'quarterly':
          quarterly += amount;
          nextDue.push({
            name: cost.name,
            amount,
            dueDate: this.getNextDueDate(now, 'quarterly'),
            category: cost.category
          });
          break;
        case 'yearly':
          yearly += amount;
          nextDue.push({
            name: cost.name,
            amount,
            dueDate: this.getNextDueDate(now, 'yearly'),
            category: cost.category
          });
          break;
      }
    }

    // Sort next due by date
    nextDue.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    return {
      monthly,
      quarterly,
      yearly,
      nextDue: nextDue.slice(0, 10) // Show next 10 due items
    };
  }

  /**
   * Get available categories
   */
  static async getCategories(companyId: string): Promise<string[]> {
    const categories = await prisma.officeOverheadCost.findMany({
      where: { companyId },
      select: { category: true },
      distinct: ['category']
    });

    return categories.map(c => c.category).sort();
  }

  /**
   * Get cost trends over time
   */
  static async getCostTrends(
    companyId: string,
    months: number = 12
  ): Promise<Array<{
    month: string;
    total: number;
    byCategory: Record<string, number>;
  }>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const costs = await prisma.officeOverheadCost.findMany({
      where: {
        companyId,
        costDate: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        costDate: 'asc'
      }
    });

    // Group by month
    const monthlyData: Record<string, { total: number; byCategory: Record<string, number> }> = {};

    for (const cost of costs) {
      const month = cost.costDate.toISOString().substring(0, 7); // YYYY-MM
      
      if (!monthlyData[month]) {
        monthlyData[month] = { total: 0, byCategory: {} };
      }

      const amount = Number(cost.amount);
      monthlyData[month].total += amount;
      monthlyData[month].byCategory[cost.category] = 
        (monthlyData[month].byCategory[cost.category] || 0) + amount;
    }

    // Convert to array and fill missing months
    const result: Array<{
      month: string;
      total: number;
      byCategory: Record<string, number>;
    }> = [];
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - (months - 1 - i));
      const month = date.toISOString().substring(0, 7);
      
      result.push({
        month,
        total: monthlyData[month]?.total || 0,
        byCategory: monthlyData[month]?.byCategory || {}
      });
    }

    return result;
  }

  // Helper methods
  private static async getTotalCosts(where: any): Promise<number> {
    const result = await prisma.officeOverheadCost.aggregate({
      where,
      _sum: {
        amount: true
      }
    });
    return Number(result._sum.amount || 0);
  }

  private static async getCostsByCategory(where: any): Promise<Record<string, number>> {
    const costs = await prisma.officeOverheadCost.groupBy({
      by: ['category'],
      where,
      _sum: {
        amount: true
      }
    });

    return costs.reduce((acc, cost) => {
      acc[cost.category] = Number(cost._sum.amount || 0);
      return acc;
    }, {} as Record<string, number>);
  }

  private static async getCostsByMonth(where: any): Promise<Record<string, number>> {
    const costs = await prisma.officeOverheadCost.findMany({
      where,
      select: { costDate: true, amount: true }
    });

    return costs.reduce((acc, cost) => {
      const month = cost.costDate.toISOString().substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + Number(cost.amount);
      return acc;
    }, {} as Record<string, number>);
  }

  private static async getRecurringCosts(where: any): Promise<number> {
    const result = await prisma.officeOverheadCost.aggregate({
      where: { ...where, recurring: true },
      _sum: {
        amount: true
      }
    });
    return Number(result._sum.amount || 0);
  }

  private static async getOneTimeCosts(where: any): Promise<number> {
    const result = await prisma.officeOverheadCost.aggregate({
      where: { ...where, recurring: false },
      _sum: {
        amount: true
      }
    });
    return Number(result._sum.amount || 0);
  }

  private static getMonthsBetween(date1: Date, date2: Date): number {
    const yearDiff = date2.getFullYear() - date1.getFullYear();
    const monthDiff = date2.getMonth() - date1.getMonth();
    return yearDiff * 12 + monthDiff + 1; // +1 to include both months
  }

  private static getNextDueDate(currentDate: Date, frequency: string): Date {
    const nextDate = new Date(currentDate);
    
    switch (frequency) {
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
    
    return nextDate;
  }
}

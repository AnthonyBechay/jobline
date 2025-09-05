// Company type
export interface Company {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

// User types
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
  company?: Company;
  createdAt: Date;
  updatedAt: Date;
}

// Candidate types
export enum CandidateStatus {
  AVAILABLE_ABROAD = 'AVAILABLE_ABROAD',
  AVAILABLE_IN_LEBANON = 'AVAILABLE_IN_LEBANON',
  RESERVED = 'RESERVED',
  IN_PROCESS = 'IN_PROCESS',
  PLACED = 'PLACED',
}

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  facePhotoUrl?: string;
  fullBodyPhotoUrl?: string;
  dateOfBirth?: Date;
  nationality: string;
  education?: string;
  skills?: string[];
  experienceSummary?: string;
  status: CandidateStatus;
  agentId?: string;
  agent?: Agent;
  applications?: Application[];
  companyId: string;
  height?: string;
  weight?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Client types
export interface Client {
  id: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  referredByClient?: string;
  referrer?: Client;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Application types
export enum ApplicationStatus {
  PENDING_MOL = 'PENDING_MOL',
  MOL_AUTH_RECEIVED = 'MOL_AUTH_RECEIVED',
  VISA_PROCESSING = 'VISA_PROCESSING',
  VISA_RECEIVED = 'VISA_RECEIVED',
  WORKER_ARRIVED = 'WORKER_ARRIVED',
  LABOUR_PERMIT_PROCESSING = 'LABOUR_PERMIT_PROCESSING',
  RESIDENCY_PERMIT_PROCESSING = 'RESIDENCY_PERMIT_PROCESSING',
  ACTIVE_EMPLOYMENT = 'ACTIVE_EMPLOYMENT',
  CONTRACT_ENDED = 'CONTRACT_ENDED',
  RENEWAL_PENDING = 'RENEWAL_PENDING',
}

export enum ApplicationType {
  NEW_CANDIDATE = 'NEW_CANDIDATE',
  GUARANTOR_CHANGE = 'GUARANTOR_CHANGE',
}

export interface Application {
  id: string;
  clientId: string;
  client?: Client;
  fromClientId?: string;
  fromClient?: Client;
  candidateId: string;
  candidate?: Candidate;
  status: ApplicationStatus;
  type: ApplicationType;
  brokerId?: string;
  broker?: Broker;
  permitExpiryDate?: Date;
  exactArrivalDate?: Date;
  laborPermitDate?: Date;
  residencyPermitDate?: Date;
  shareableLink: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
  payments?: Payment[];
  costs?: Cost[];
  documentItems?: DocumentChecklistItem[];
  feeTemplate?: FeeTemplate;
  feeTemplateId?: string;
  finalFeeAmount?: number;
  lawyerServiceRequested?: boolean;
  lawyerFeeCost?: number;
  lawyerFeeCharge?: number;
}

// Payment types
export interface Payment {
  id: string;
  applicationId: string;
  application?: Application;
  clientId: string;
  client?: Client;
  amount: number;
  currency: string;
  paymentDate: Date;
  paymentType: string;
  notes?: string;
  isRefundable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Cost types - now dynamic string instead of enum
export interface Cost {
  id: string;
  applicationId: string;
  application?: Application;
  amount: number;
  currency: string;
  costDate: Date;
  costType: string; // Changed from enum to string for dynamic values
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Cost Type management
export interface CostTypeModel {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GuarantorChange {
  id: string;
  originalApplicationId: string;
  originalApplication?: Application;
  newApplicationId?: string;
  newApplication?: Application;
  fromClientId: string;
  fromClient?: Client;
  toClientId: string;
  toClient?: Client;
  candidateId: string;
  candidate?: Candidate;
  changeDate: Date;
  reason?: string;
  refundAmount?: number;
  refundCurrency: string;
  refundProcessed: boolean;
  refundProcessedDate?: Date;
  candidateStatusBefore: string;
  candidateStatusAfter: string;
  notes?: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefundCalculation {
  totalPaid: number;
  refundableAmount: number;
  nonRefundableAmount: number;
  calculatedRefund: number;
  finalRefund: number;
  refundBreakdown: {
    paymentType: string;
    amount: number;
    isRefundable: boolean;
    refundAmount: number;
  }[];
}

// Service Type management  
export interface ServiceType {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Document types
export enum DocumentStatus {
  PENDING = 'PENDING',
  RECEIVED = 'RECEIVED',
  SUBMITTED = 'SUBMITTED',
}

export interface DocumentChecklistItem {
  id: string;
  applicationId: string;
  application?: Application;
  documentName: string;
  status: DocumentStatus;
  stage: ApplicationStatus;
  required?: boolean;
  requiredFrom?: 'office' | 'client';
  createdAt: Date;
  updatedAt: Date;
}

// Agent types
export interface Agent {
  id: string;
  name: string;
  contactDetails: any;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Broker types
export interface Broker {
  id: string;
  name: string;
  contactDetails: any;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Setting types
export interface Setting {
  id: string;
  key: string;
  value: any;
  description?: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Fee Template types
export interface FeeTemplate {
  id: string;
  name: string;
  description?: string;
  defaultPrice: number;
  minPrice: number;
  maxPrice: number;
  nationality?: string;
  serviceType?: string; // New field for service type
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Document Template types
export interface DocumentTemplate {
  id: string;
  stage: ApplicationStatus;
  name: string;
  description?: string;
  required: boolean;
  requiredFrom: string; // "office" or "client"
  order: number;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Dashboard types
export interface DashboardStats {
  totalClients: number;
  totalCandidates: number;
  activeApplications: number;
  pendingDocuments: number;
  pendingPayments: number;
  upcomingRenewals: number;
  financialSummary?: {
    revenue: number;
    costs: number;
    profit: number;
  };
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  error: string;
  details?: any;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  companyName: string;
  name: string;
  email: string;
  password: string;
}
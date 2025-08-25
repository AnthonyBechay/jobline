// Application status display names
export const APPLICATION_STATUS_LABELS = {
  PENDING_MOL: 'Pending MoL Pre-Authorization',
  MOL_AUTH_RECEIVED: 'MoL Authorization Received',
  VISA_PROCESSING: 'Visa Processing',
  VISA_RECEIVED: 'Visa Received',
  WORKER_ARRIVED: 'Worker Arrived',
  LABOUR_PERMIT_PROCESSING: 'Labour Permit Processing',
  RESIDENCY_PERMIT_PROCESSING: 'Residency Permit Processing',
  ACTIVE_EMPLOYMENT: 'Active Employment',
  CONTRACT_ENDED: 'Contract Ended',
  RENEWAL_PENDING: 'Renewal Pending',
};

// Candidate status display names
export const CANDIDATE_STATUS_LABELS = {
  AVAILABLE_ABROAD: 'Available (Abroad)',
  AVAILABLE_IN_LEBANON: 'Available (In Lebanon)',
  RESERVED: 'Reserved',
  IN_PROCESS: 'In Process',
  PLACED: 'Placed',
};

// Cost type display names
export const COST_TYPE_LABELS = {
  AGENT_FEE: 'Agent Fee',
  BROKER_FEE: 'Broker Fee',
  GOV_FEE: 'Government Fee',
  TICKET: 'Ticket',
  EXPEDITED_FEE: 'Expedited Processing Fee',
  ATTORNEY_FEE: 'Attorney Fee',
  OTHER: 'Other',
};

// Document status display names
export const DOCUMENT_STATUS_LABELS = {
  PENDING: 'Pending',
  RECEIVED: 'Received',
  SUBMITTED: 'Submitted',
};

// Application type display names
export const APPLICATION_TYPE_LABELS = {
  NEW_CANDIDATE: 'New Candidate',
  GUARANTOR_CHANGE: 'Guarantor Change',
};

// User role display names
export const USER_ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
};

// Status colors for UI
export const STATUS_COLORS = {
  // Application statuses
  PENDING_MOL: '#FFA500',
  MOL_AUTH_RECEIVED: '#4169E1',
  VISA_PROCESSING: '#9370DB',
  VISA_RECEIVED: '#20B2AA',
  WORKER_ARRIVED: '#32CD32',
  LABOUR_PERMIT_PROCESSING: '#FFD700',
  RESIDENCY_PERMIT_PROCESSING: '#FF69B4',
  ACTIVE_EMPLOYMENT: '#00CED1',
  CONTRACT_ENDED: '#808080',
  RENEWAL_PENDING: '#FF4500',
  
  // Candidate statuses
  AVAILABLE_ABROAD: '#32CD32',
  AVAILABLE_IN_LEBANON: '#00CED1',
  RESERVED: '#FFA500',
  IN_PROCESS: '#4169E1',
  PLACED: '#808080',
  
  // Document statuses
  PENDING: '#FFA500',
  RECEIVED: '#4169E1',
  SUBMITTED: '#32CD32',
};

// Currency options
export const CURRENCIES = ['USD', 'LBP', 'EUR'];

// Default pagination
export const DEFAULT_PAGE_SIZE = 20;

// Date formats
export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

// File upload limits
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

// Validation rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  PHONE_REGEX: /^[\d\s\-\+\(\)]+$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

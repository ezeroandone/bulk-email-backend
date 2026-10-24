// ── Status Enums ──────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'admin';

export type CampaignStatus =
  | 'draft'
  | 'ready'
  | 'queued'
  | 'processing'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type DeliveryJobStatus =
  | 'draft'
  | 'queued'
  | 'processing'
  | 'accepted'
  | 'failed'
  | 'retrying'
  | 'cancelled'
  | 'uncertain'
  | 'completed';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'successful'
  | 'failed'
  | 'abandoned'
  | 'reversed'
  | 'refunded'
  | 'disputed';

export type DocumentType = 'template' | 'asset';
export type DocumentFormat = 'docx' | 'pdf' | 'xlsx' | 'csv' | 'txt';

// ── Auth / Users ──────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  timezone: string | null;
  notificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Workspace ─────────────────────────────────────────────────────────────────

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

// ── Credits & Billing ─────────────────────────────────────────────────────────

export interface CreditWallet {
  id: string;
  userId: string;
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  updatedAt: string;
}

export type CreditLedgerEntryType =
  | 'signup_bonus'
  | 'purchase'
  | 'campaign_debit'
  | 'refund'
  | 'admin_adjustment'
  | 'expiry';

export interface CreditLedgerEntry {
  id: string;
  userId: string;
  type: CreditLedgerEntryType;
  amount: number; // positive = credit, negative = debit
  balanceAfter: number;
  description: string | null;
  referenceId: string | null; // campaign_id or payment_order_id
  referenceType: string | null;
  createdAt: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceKobo: number; // price in kobo (NGN * 100)
  currency: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

// ── Payments ──────────────────────────────────────────────────────────────────

export interface PaymentOrder {
  id: string;
  userId: string;
  packageId: string;
  amountKobo: number;
  currency: string;
  credits: number;
  status: PaymentStatus;
  paystackReference: string | null;
  paystackAccessCode: string | null;
  paystackAuthorizationUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentEvent {
  id: string;
  orderId: string;
  eventType: string;
  payload: Record<string, unknown>;
  processedAt: string | null;
  createdAt: string;
}

// ── SMTP ──────────────────────────────────────────────────────────────────────

export interface SmtpConfiguration {
  id: string;
  userId: string;
  host: string;
  port: number;
  secure: boolean;
  usernameEncrypted: string;
  passwordEncrypted: string;
  fromName: string;
  fromEmail: string;
  replyTo: string | null;
  isVerified: boolean;
  lastTestedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Decrypted SMTP config — never persisted, only used in memory */
export interface SmtpConfigDecrypted {
  id: string;
  userId: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
  replyTo: string | null;
}

// ── Datasets (spreadsheet uploads) ───────────────────────────────────────────

export interface Dataset {
  id: string;
  userId: string;
  name: string;
  originalFilename: string;
  storagePath: string;
  mimeType: string;
  rowCount: number;
  columns: DatasetColumn[];
  previewRows: DatasetRow[];
  createdAt: string;
  updatedAt: string;
}

export interface DatasetColumn {
  index: number;
  name: string;
  sample: string[];
}

export interface DatasetRow {
  [column: string]: string | number | boolean | null;
}

// ── Document Templates & Assets ───────────────────────────────────────────────

export interface DocumentTemplate {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  originalFilename: string;
  storagePath: string;
  mimeType: string;
  format: DocumentFormat;
  type: DocumentType;
  placeholders: string[];
  fileSize: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentAsset {
  id: string;
  userId: string;
  campaignId: string | null;
  recipientIdentifier: string | null;
  name: string;
  storagePath: string;
  mimeType: string;
  format: DocumentFormat;
  fileSize: number;
  generatedFrom: string | null; // template_id
  createdAt: string;
}

export interface DocumentMapping {
  id: string;
  campaignId: string;
  datasetColumnName: string;
  templatePlaceholder: string;
  createdAt: string;
}

// ── Email Templates ───────────────────────────────────────────────────────────

export interface EmailTemplate {
  id: string;
  userId: string;
  name: string;
  subjectTemplate: string;
  bodyTemplate: string;
  isHtml: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Campaigns ─────────────────────────────────────────────────────────────────

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  status: CampaignStatus;
  datasetId: string | null;
  documentTemplateId: string | null;
  emailTemplateId: string | null;
  smtpConfigId: string | null;
  emailSubject: string;
  emailBody: string;
  emailIsHtml: boolean;
  recipientEmailColumn: string | null;
  recipientNameColumn: string | null;
  documentMappings: DocumentMapping[];
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  creditsUsed: number;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignRecipient {
  id: string;
  campaignId: string;
  rowIndex: number;
  email: string;
  name: string | null;
  rowData: DatasetRow;
  documentAssetId: string | null;
  status: DeliveryJobStatus;
  lastAttemptAt: string | null;
  nextRetryAt: string | null;
  attemptCount: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Delivery ──────────────────────────────────────────────────────────────────

export interface DeliveryJob {
  id: string;
  campaignId: string;
  recipientId: string;
  status: DeliveryJobStatus;
  priority: number;
  queuedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  messageId: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryAttempt {
  id: string;
  jobId: string;
  attemptNumber: number;
  status: 'success' | 'failure';
  smtpResponse: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  attemptedAt: string;
  durationMs: number | null;
}

// ── File matching ─────────────────────────────────────────────────────────────

export interface FileMatch {
  filename: string;
  storagePath: string;
  recipientIdentifier: string;
  confidence: 'exact' | 'partial' | 'none';
  matchedColumn: string | null;
}

// ── Audit log ─────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ── Platform settings (admin) ─────────────────────────────────────────────────

export interface PlatformSettings {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

// ── Pagination & API response helpers ────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

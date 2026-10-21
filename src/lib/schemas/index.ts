import { z } from 'zod';

// ── SMTP Configuration ────────────────────────────────────────────────────────

export const SmtpConfigSchema = z.object({
  host: z
    .string()
    .min(1, 'Host is required')
    .max(255, 'Host too long')
    .regex(/^[a-zA-Z0-9.-]+$/, 'Invalid hostname'),
  port: z
    .number()
    .int()
    .min(1, 'Port must be at least 1')
    .max(65535, 'Port must be at most 65535'),
  secure: z.boolean(),
  username: z.string().min(1, 'Username is required').max(320, 'Username too long'),
  password: z.string().min(1, 'Password is required').max(512, 'Password too long'),
  fromName: z.string().min(1, 'From name is required').max(100, 'From name too long'),
  fromEmail: z
    .string()
    .email('Invalid from email address')
    .max(320, 'Email address too long'),
  replyTo: z
    .string()
    .email('Invalid reply-to email address')
    .max(320, 'Email address too long')
    .nullable()
    .optional()
});

export type SmtpConfigInput = z.infer<typeof SmtpConfigSchema>;

// ── Dataset Upload ────────────────────────────────────────────────────────────

export const DatasetUploadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  file: z.instanceof(File, { message: 'A spreadsheet file is required' })
});

export type DatasetUploadInput = z.infer<typeof DatasetUploadSchema>;

// ── Campaign Create / Update ──────────────────────────────────────────────────

export const CampaignCreateSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(200, 'Name too long'),
  datasetId: z.string().uuid('Invalid dataset ID').nullable().optional(),
  documentTemplateId: z.string().uuid('Invalid template ID').nullable().optional(),
  emailTemplateId: z.string().uuid('Invalid email template ID').nullable().optional(),
  smtpConfigId: z.string().uuid('Invalid SMTP config ID').nullable().optional(),
  emailSubject: z.string().min(1, 'Email subject is required').max(998, 'Subject too long'),
  emailBody: z.string().min(1, 'Email body is required').max(1_000_000, 'Body too long'),
  emailIsHtml: z.boolean().default(false),
  recipientEmailColumn: z.string().max(100).nullable().optional(),
  recipientNameColumn: z.string().max(100).nullable().optional(),
  scheduledAt: z.string().datetime().nullable().optional()
});

export type CampaignCreateInput = z.infer<typeof CampaignCreateSchema>;

export const CampaignUpdateSchema = CampaignCreateSchema.partial().extend({
  id: z.string().uuid('Invalid campaign ID')
});

export type CampaignUpdateInput = z.infer<typeof CampaignUpdateSchema>;

// ── Document Template Upload ──────────────────────────────────────────────────

export const DocumentTemplateUploadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long').nullable().optional(),
  file: z.instanceof(File, { message: 'A document file is required' })
});

export type DocumentTemplateUploadInput = z.infer<typeof DocumentTemplateUploadSchema>;

// ── Document Mapping ──────────────────────────────────────────────────────────

export const DocumentMappingSchema = z.object({
  campaignId: z.string().uuid('Invalid campaign ID'),
  mappings: z
    .array(
      z.object({
        datasetColumnName: z.string().min(1).max(100),
        templatePlaceholder: z.string().min(1).max(100)
      })
    )
    .min(1, 'At least one mapping is required')
});

export type DocumentMappingInput = z.infer<typeof DocumentMappingSchema>;

// ── Email Template ────────────────────────────────────────────────────────────

export const EmailTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  subjectTemplate: z.string().min(1, 'Subject is required').max(998, 'Subject too long'),
  bodyTemplate: z.string().min(1, 'Body is required').max(1_000_000, 'Body too long'),
  isHtml: z.boolean().default(false)
});

export type EmailTemplateInput = z.infer<typeof EmailTemplateSchema>;

// ── Payment Init ──────────────────────────────────────────────────────────────

export const PaymentInitSchema = z.object({
  packageId: z.string().uuid('Invalid package ID')
});

export type PaymentInitInput = z.infer<typeof PaymentInitSchema>;

// ── Payment Verify ────────────────────────────────────────────────────────────

export const PaymentVerifySchema = z.object({
  reference: z.string().min(1, 'Reference is required').max(200, 'Reference too long')
});

export type PaymentVerifyInput = z.infer<typeof PaymentVerifySchema>;

// ── SMTP Test ─────────────────────────────────────────────────────────────────

export const SmtpTestSchema = z.object({
  smtpConfigId: z.string().uuid('Invalid SMTP config ID').optional(),
  testEmail: z.string().email('Invalid test email address').max(320)
});

export type SmtpTestInput = z.infer<typeof SmtpTestSchema>;

// ── User Profile Update ───────────────────────────────────────────────────────

export const ProfileUpdateSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(100, 'Name too long'),
  timezone: z.string().max(50, 'Timezone too long').nullable().optional(),
  notificationsEnabled: z.boolean().optional()
});

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;

// ── Pagination ────────────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  sortBy: z.string().max(50).optional(),
  sortDir: z.enum(['asc', 'desc']).default('desc')
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

// ── Admin: Credit Package ─────────────────────────────────────────────────────

export const CreditPackageSchema = z.object({
  name: z.string().min(1).max(100),
  credits: z.number().int().min(1, 'Credits must be at least 1'),
  priceKobo: z.number().int().min(1, 'Price must be at least 1 kobo'),
  currency: z.string().length(3).default('NGN'),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0)
});

export type CreditPackageInput = z.infer<typeof CreditPackageSchema>;

// ── Admin: Credit Adjustment ──────────────────────────────────────────────────

export const AdminCreditAdjustmentSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  amount: z.number().int().refine((v) => v !== 0, { message: 'Amount cannot be zero' }),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long')
});

export type AdminCreditAdjustmentInput = z.infer<typeof AdminCreditAdjustmentSchema>;

// ── Admin: Platform Settings ──────────────────────────────────────────────────

export const PlatformSettingsSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().max(10_000),
  description: z.string().max(500).nullable().optional()
});

export type PlatformSettingsInput = z.infer<typeof PlatformSettingsSchema>;

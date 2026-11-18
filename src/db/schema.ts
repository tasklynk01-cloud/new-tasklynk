import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  jsonb,
  uuid,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ========================================
// ACCOUNTS TABLE
// ========================================
export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  accountName: varchar('account_name', { length: 255 }).notNull().unique(),
  contactPerson: varchar('contact_person', { length: 255 }).notNull(),
  contactEmail: varchar('contact_email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// DOMAINS TABLE
// ========================================
export const domains = pgTable('domains', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: text('description'),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  maxUsers: integer('max_users'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// USERS TABLE
// ========================================
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  displayId: varchar('display_id', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  roleId: integer('role_id').notNull().default(2),
  approved: boolean('approved').notNull().default(false),
  emailVerified: boolean('email_verified').notNull().default(false),
  balance: decimal('balance', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  earned: decimal('earned', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  totalEarnings: decimal('total_earnings', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  rating: decimal('rating', { precision: 3, scale: 2, mode: 'number' }),
  ratingAverage: decimal('rating_average', { precision: 3, scale: 2, mode: 'number' }).default(0),
  ratingCount: integer('rating_count').default(0),
  badgeList: text('badge_list').notNull().default('[]'),
  presenceStatus: varchar('presence_status', { length: 50 }).notNull().default('offline'),
  phone: varchar('phone', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  suspendedUntil: timestamp('suspended_until', { mode: 'string' }),
  suspensionReason: text('suspension_reason'),
  blacklistReason: text('blacklist_reason'),
  rejectedAt: timestamp('rejected_at', { mode: 'string' }),
  rejectionReason: text('rejection_reason'),
  totalEarned: decimal('total_earned', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  totalSpent: decimal('total_spent', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  completedJobs: integer('completed_jobs').notNull().default(0),
  completionRate: decimal('completion_rate', { precision: 5, scale: 2, mode: 'number' }),
  profilePictureUrl: text('profile_picture_url'),
  lastLoginAt: timestamp('last_login_at', { mode: 'string' }),
  lastLoginIp: varchar('last_login_ip', { length: 50 }),
  lastLoginDevice: text('last_login_device'),
  loginCount: integer('login_count').notNull().default(0),
  twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
  twoFactorSecret: text('two_factor_secret'),
  twoFactorBackupCodes: text('two_factor_backup_codes'),
  twoFactorVerifiedAt: timestamp('two_factor_verified_at', { mode: 'string' }),
  domainId: integer('domain_id').references(() => domains.id, { onDelete: 'set null' }),
  accountId: integer('account_id').references(() => accounts.id, { onDelete: 'set null' }),
  accountName: text('account_name'),
  assignedManagerId: integer('assigned_manager_id'),
  freelancerBadge: text('freelancer_badge'),
  clientTier: varchar('client_tier', { length: 50 }).default('basic'),
  clientPriority: varchar('client_priority', { length: 50 }).notNull().default('regular'),
  paymentTerms: varchar('payment_terms', { length: 50 }).notNull().default('pod'),
  skillsCompleted: boolean('skills_completed').notNull().default(false),
  // Google OAuth fields
  googleId: varchar('google_id', { length: 255 }).unique(),
  avatarUrl: text('avatar_url'),
  authProvider: varchar('auth_provider', { length: 50 }).default('local'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('users_phone_unique').on(table.phone),
  index('users_email_idx').on(table.email),
  index('users_role_idx').on(table.role),
  index('users_status_idx').on(table.status),
]);

// ========================================
// ROLES TABLE
// ========================================
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: text('description'),
  permissions: jsonb('permissions'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// SYSTEM SETTINGS TABLE
// ========================================
export const systemSettings = pgTable('system_settings', {
  key: varchar('key', { length: 255 }).primaryKey(),
  value: text('value').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  updatedBy: integer('updated_by').references(() => users.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// SETTINGS HISTORY TABLE
// ========================================
export const settingsHistory = pgTable('settings_history', {
  id: serial('id').primaryKey(),
  settingKey: varchar('setting_key', { length: 255 }).notNull(),
  previousValue: text('previous_value'),
  newValue: text('new_value').notNull(),
  previousType: varchar('previous_type', { length: 50 }),
  newType: varchar('new_type', { length: 50 }).notNull(),
  changedBy: integer('changed_by').references(() => users.id, { onDelete: 'set null' }),
  changedByName: varchar('changed_by_name', { length: 255 }),
  changeReason: text('change_reason'),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// INVITATIONS TABLE
// ========================================
export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  used: boolean('used').notNull().default(false),
  usedAt: timestamp('used_at', { mode: 'string' }),
  expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
  createdByAdminId: integer('created_by_admin_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('invitations_email_role_unique').on(table.email, table.role),
]);

// ========================================
// USER STATS TABLE
// ========================================
export const userStats = pgTable('user_stats', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  totalJobsPosted: integer('total_jobs_posted').notNull().default(0),
  totalJobsCompleted: integer('total_jobs_completed').notNull().default(0),
  totalJobsCancelled: integer('total_jobs_cancelled').notNull().default(0),
  totalAmountEarned: decimal('total_amount_earned', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  totalAmountSpent: decimal('total_amount_spent', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  averageRating: decimal('average_rating', { precision: 3, scale: 2, mode: 'number' }),
  totalRatings: integer('total_ratings').notNull().default(0),
  onTimeDelivery: integer('on_time_delivery').notNull().default(0),
  lateDelivery: integer('late_delivery').notNull().default(0),
  revisionsRequested: integer('revisions_requested').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// JOBS (ORDERS) TABLE
// ========================================
export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  displayId: varchar('display_id', { length: 50 }).notNull().unique(),
  orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
  orderId: varchar('order_id', { length: 100 }).notNull().unique(),
  accountOrderNumber: varchar('account_order_number', { length: 100 }),
  accountLinked: boolean('account_linked').notNull().default(false),
  clientId: integer('client_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  assignedFreelancerId: integer('assigned_freelancer_id').references(() => users.id, { onDelete: 'set null' }),
  managerId: integer('manager_id').references(() => users.id, { onDelete: 'set null' }),
  assignedById: integer('assigned_by_id').references(() => users.id, { onDelete: 'set null' }),
  deliveredById: integer('delivered_by_id').references(() => users.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 500 }).notNull(),
  instructions: text('instructions').notNull(),
  workType: varchar('work_type', { length: 50 }).notNull(),
  pages: integer('pages'),
  slides: integer('slides'),
  problems: integer('problems'),
  amount: decimal('amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  managerEarnings: decimal('manager_earnings', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  freelancerEarnings: decimal('freelancer_earnings', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  adminProfit: decimal('admin_profit', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  managerAssignedFee: decimal('manager_assigned_fee', { precision: 10, scale: 2, mode: 'number' }).notNull().default(0),
  managerDeliveryFee: decimal('manager_delivery_fee', { precision: 10, scale: 2, mode: 'number' }).notNull().default(0),
  deadline: timestamp('deadline', { mode: 'string' }).notNull(),
  actualDeadline: timestamp('actual_deadline', { mode: 'string' }).notNull(),
  freelancerDeadline: timestamp('freelancer_deadline', { mode: 'string' }).notNull(),
  requestDraft: boolean('request_draft').notNull().default(false),
  draftDelivered: boolean('draft_delivered').notNull().default(false),
  requestPrintableSources: boolean('request_printable_sources').notNull().default(false),
  singleSpaced: boolean('single_spaced').notNull().default(false),
  baseCpp: decimal('base_cpp', { precision: 10, scale: 2, mode: 'number' }),
  effectiveCpp: decimal('effective_cpp', { precision: 10, scale: 2, mode: 'number' }),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  managerApproved: boolean('manager_approved').notNull().default(false),
  managerApprovedAt: timestamp('manager_approved_at', { mode: 'string' }),
  managerApprovalNotes: text('manager_approval_notes'),
  assignedEditorId: integer('assigned_editor_id').references(() => users.id, { onDelete: 'set null' }),
  editorStatus: varchar('editor_status', { length: 50 }).default('not_assigned'),
  editorApproved: boolean('editor_approved').notNull().default(false),
  editorApprovedAt: timestamp('editor_approved_at', { mode: 'string' }),
  editorApprovalNotes: text('editor_approval_notes'),
  editorNotes: text('editor_notes'),
  editorRequestedRevision: boolean('editor_requested_revision').notNull().default(false),
  editorRevisionNotes: text('editor_revision_notes'),
  editorAssignedAt: timestamp('editor_assigned_at', { mode: 'string' }),
  editorStartedAt: timestamp('editor_started_at', { mode: 'string' }),
  editorCompletedAt: timestamp('editor_completed_at', { mode: 'string' }),
  editorClaimedAt: timestamp('editor_claimed_at', { mode: 'string' }),
  editorFlagged: boolean('editor_flagged').notNull().default(false),
  adminApproved: boolean('admin_approved').notNull().default(false),
  clientApproved: boolean('client_approved').notNull().default(false),
  approvedByClientAt: timestamp('approved_by_client_at', { mode: 'string' }),
  revisionRequested: boolean('revision_requested').notNull().default(false),
  revisionNotes: text('revision_notes'),
  paymentConfirmed: boolean('payment_confirmed').notNull().default(false),
  paidOrderConfirmedAt: timestamp('paid_order_confirmed_at', { mode: 'string' }),
  invoiceGenerated: boolean('invoice_generated').notNull().default(false),
  clientRating: integer('client_rating'),
  writerRating: integer('writer_rating'),
  reviewComment: text('review_comment'),
  placementPriority: integer('placement_priority').notNull().default(0),
  urgencyMultiplier: decimal('urgency_multiplier', { precision: 5, scale: 2, mode: 'number' }).notNull().default(1.0),
  calculatedPrice: decimal('calculated_price', { precision: 12, scale: 2, mode: 'number' }),
  isRealOrder: boolean('is_real_order').notNull().default(true),
  requiresReports: boolean('requires_reports').notNull().default(true),
  finalSubmissionComplete: boolean('final_submission_complete').notNull().default(false),
  revisionSubmissionComplete: boolean('revision_submission_complete').notNull().default(false),
  clientCpp: decimal('client_cpp', { precision: 10, scale: 2, mode: 'number' }),
  clientCppConfirmed: boolean('client_cpp_confirmed').notNull().default(false),
  serviceType: varchar('service_type', { length: 50 }).default('writing_page'),
  managerAdditional: decimal('manager_additional', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  managerAdditionalNote: text('manager_additional_note'),
  managerAdditionalStatus: varchar('manager_additional_status', { length: 50 }).default('none'),
  clientBonus: decimal('client_bonus', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  statusTotalAmount: decimal('status_total_amount', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  cppPaymentStatus: varchar('cpp_payment_status', { length: 50 }).default('unpaid'),
  lastAmountUpdateAt: timestamp('last_amount_update_at', { mode: 'string' }),
  freelancerAccepted: boolean('freelancer_accepted').notNull().default(false),
  freelancerAcceptedAt: timestamp('freelancer_accepted_at', { mode: 'string' }),
  freelancerRejected: boolean('freelancer_rejected').notNull().default(false),
  freelancerRejectedAt: timestamp('freelancer_rejected_at', { mode: 'string' }),
  freelancerRejectionReason: text('freelancer_rejection_reason'),
  freelancerResponsePending: boolean('freelancer_response_pending').notNull().default(false),
  acceptedAt: timestamp('accepted_at', { mode: 'string' }),
  assignedAt: timestamp('assigned_at', { mode: 'string' }),
  submittedAt: timestamp('submitted_at', { mode: 'string' }),
  deliveredAt: timestamp('delivered_at', { mode: 'string' }),
  approvedAt: timestamp('approved_at', { mode: 'string' }),
  paidAt: timestamp('paid_at', { mode: 'string' }),
  completedAt: timestamp('completed_at', { mode: 'string' }),
  isInvoiced: boolean('is_invoiced').notNull().default(false),
  orderType: varchar('order_type', { length: 50 }),
  invoicedAt: timestamp('invoiced_at', { mode: 'string' }),
  hasOpenInternalRevision: boolean('has_open_internal_revision').notNull().default(false),
  internalRevisionCount: integer('internal_revision_count').notNull().default(0),
  clientRequestedRevision: boolean('client_requested_revision').notNull().default(false),
  escalationLevel: integer('escalation_level').notNull().default(0),
  lastEscalationAt: timestamp('last_escalation_at', { mode: 'string' }),
  clientNotes: text('client_notes'),
  clientPreferredFreelancer: integer('client_preferred_freelancer').references(() => users.id, { onDelete: 'set null' }),
  clientPreferenceType: varchar('client_preference_type', { length: 50 }),
  urgencyLevel: varchar('urgency_level', { length: 50 }).default('normal'),
  complexityLevel: varchar('complexity_level', { length: 50 }).default('standard'),
  submittedToClientAt: timestamp('submitted_to_client_at', { mode: 'string' }),
  clientFirstViewedAt: timestamp('client_first_viewed_at', { mode: 'string' }),
  lastClientActivityAt: timestamp('last_client_activity_at', { mode: 'string' }),
  lastFreelancerActivityAt: timestamp('last_freelancer_activity_at', { mode: 'string' }),
  qualityScore: integer('quality_score'),
  qualityNotes: text('quality_notes'),
  plagiarismScore: decimal('plagiarism_score', { precision: 5, scale: 2, mode: 'number' }),
  aiDetectionScore: decimal('ai_detection_score', { precision: 5, scale: 2, mode: 'number' }),
  grammarScore: integer('grammar_score'),
  totalRevisionCount: integer('total_revision_count').notNull().default(0),
  clientRevisionCount: integer('client_revision_count').notNull().default(0),
  lastRevisionRequestedAt: timestamp('last_revision_requested_at', { mode: 'string' }),
  revisionDeadline: timestamp('revision_deadline', { mode: 'string' }),
  unreadClientMessages: integer('unread_client_messages').notNull().default(0),
  unreadFreelancerMessages: integer('unread_freelancer_messages').notNull().default(0),
  unreadAdminMessages: integer('unread_admin_messages').notNull().default(0),
  lastMessageAt: timestamp('last_message_at', { mode: 'string' }),
  totalFilesUploaded: integer('total_files_uploaded').notNull().default(0),
  clientFilesCount: integer('client_files_count').notNull().default(0),
  freelancerFilesCount: integer('freelancer_files_count').notNull().default(0),
  finalFilesCount: integer('final_files_count').notNull().default(0),
  cancelledAt: timestamp('cancelled_at', { mode: 'string' }),
  cancelledBy: integer('cancelled_by').references(() => users.id, { onDelete: 'set null' }),
  cancellationReason: text('cancellation_reason'),
  cancellationCategory: varchar('cancellation_category', { length: 50 }),
  refundIssued: boolean('refund_issued').notNull().default(false),
  refundAmount: decimal('refund_amount', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  onHoldAt: timestamp('on_hold_at', { mode: 'string' }),
  onHoldBy: integer('on_hold_by').references(() => users.id, { onDelete: 'set null' }),
  onHoldReason: text('on_hold_reason'),
  expectedResumeDate: timestamp('expected_resume_date', { mode: 'string' }),
  resumedAt: timestamp('resumed_at', { mode: 'string' }),
  metadata: jsonb('metadata'),
  tags: text('tags').array(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('jobs_client_id_idx').on(table.clientId),
  index('jobs_freelancer_id_idx').on(table.assignedFreelancerId),
  index('jobs_manager_id_idx').on(table.managerId),
  index('jobs_status_idx').on(table.status),
  index('jobs_created_at_idx').on(table.createdAt),
]);

// ========================================
// FREELANCER ORDER RESPONSES TABLE
// ========================================
export const freelancerOrderResponses = pgTable('freelancer_order_responses', {
  id: serial('id').primaryKey(),
  freelancerId: integer('freelancer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  responseStatus: varchar('response_status', { length: 50 }).notNull(),
  responseAt: timestamp('response_at', { mode: 'string' }),
  rejectionReason: text('rejection_reason'),
  responseTimeMinutes: integer('response_time_minutes'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// ORDER STATUS HISTORY TABLE
// ========================================
export const orderStatusHistory = pgTable('order_status_history', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  fromStatus: varchar('from_status', { length: 50 }),
  toStatus: varchar('to_status', { length: 50 }).notNull(),
  changedBy: integer('changed_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  changedByRole: varchar('changed_by_role', { length: 50 }).notNull(),
  reason: text('reason'),
  notes: text('notes'),
  automaticTransition: boolean('automatic_transition').notNull().default(false),
  metadata: jsonb('metadata'),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// ORDER TIMELINE EVENTS TABLE
// ========================================
export const orderTimelineEvents = pgTable('order_timeline_events', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  eventCategory: varchar('event_category', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  actorId: integer('actor_id').references(() => users.id, { onDelete: 'set null' }),
  actorRole: varchar('actor_role', { length: 50 }),
  actorName: varchar('actor_name', { length: 255 }),
  metadata: jsonb('metadata'),
  importance: varchar('importance', { length: 50 }).default('normal'),
  visibleToClient: boolean('visible_to_client').notNull().default(true),
  visibleToFreelancer: boolean('visible_to_freelancer').notNull().default(true),
  visibleToAdmin: boolean('visible_to_admin').notNull().default(true),
  icon: varchar('icon', { length: 50 }),
  color: varchar('color', { length: 20 }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// BIDS TABLE
// ========================================
export const bids = pgTable('bids', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  freelancerId: integer('freelancer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  message: text('message'),
  bidAmount: decimal('bid_amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// PAYMENTS TABLE
// ========================================
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  reference: varchar('reference', { length: 100 }).unique(), // Unique internal payment reference: TLK-YYYYMMDD-XXXXXXXX
  jobId: integer('job_id').references(() => jobs.id, { onDelete: 'cascade' }),
  orderId: integer('order_id').references(() => jobs.id, { onDelete: 'cascade' }),
  projectId: integer('project_id'),
  clientId: integer('client_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  freelancerId: integer('freelancer_id').references(() => users.id, { onDelete: 'set null' }),
  invoiceId: integer('invoice_id').references(() => invoices.id, { onDelete: 'set null' }),
  amount: decimal('amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  currency: varchar('currency', { length: 10 }).default('KES'),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull().default('mpesa'),
  provider: varchar('provider', { length: 50 }).notNull().default('mpesa'), // 'mpesa' | 'paystack' | 'pesapal'
  providerReference: varchar('provider_reference', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // 'pending' | 'initiated' | 'awaiting_confirmation' | 'paid' | 'completed' | 'failed' | 'cancelled' | 'expired' | 'reversed' | 'payment_review_required'
  source: varchar('source', { length: 50 }).default('website'), // 'website' | 'app'
  product: varchar('product', { length: 100 }),
  plan: varchar('plan', { length: 100 }),
  purpose: varchar('purpose', { length: 100 }), // 'order' | 'wallet_topup' | 'subscription' | 'service'
  email: varchar('email', { length: 255 }),
  authorizationUrl: text('authorization_url'),
  callbackUrl: text('callback_url'),
  paystackReference: varchar('paystack_reference', { length: 255 }),
  paystackAccessCode: varchar('paystack_access_code', { length: 255 }),
  paystackTransactionId: varchar('paystack_transaction_id', { length: 100 }),
  mpesaCode: varchar('mpesa_code', { length: 100 }),
  adminVerificationCode: varchar('admin_verification_code', { length: 100 }),
  phoneNumber: varchar('phone_number', { length: 50 }),
  merchantRequestId: varchar('merchant_request_id', { length: 255 }),
  checkoutRequestId: varchar('checkout_request_id', { length: 255 }),
  mpesaCheckoutRequestId: varchar('mpesa_checkout_request_id', { length: 255 }),
  mpesaMerchantRequestId: varchar('mpesa_merchant_request_id', { length: 255 }),
  mpesaReceiptNumber: varchar('mpesa_receipt_number', { length: 255 }),
  mpesaTransactionDate: varchar('mpesa_transaction_date', { length: 100 }),
  resultCode: integer('result_code'),
  resultDescription: text('result_description'),
  mpesaResultDesc: text('mpesa_result_desc'),
  merchantReference: varchar('merchant_reference', { length: 255 }),
  orderTrackingId: varchar('order_tracking_id', { length: 255 }),
  rawCallback: jsonb('raw_callback'),
  unmatched: boolean('unmatched').notNull().default(false), // For C2B payments not matched automatically
  reconciled: boolean('reconciled').notNull().default(false),
  reconciledAt: timestamp('reconciled_at', { mode: 'string' }),
  reconciledBy: integer('reconciled_by').references(() => users.id, { onDelete: 'set null' }),
  reconciliationNotes: text('reconciliation_notes'),
  confirmedByAdmin: boolean('confirmed_by_admin').notNull().default(false),
  confirmedAt: timestamp('confirmed_at', { mode: 'string' }),
  paidAt: timestamp('paid_at', { mode: 'string' }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('payments_reference_idx').on(table.reference),
  index('payments_client_id_idx').on(table.clientId),
  index('payments_user_id_idx').on(table.userId),
  index('payments_order_id_idx').on(table.orderId),
  index('payments_job_id_idx').on(table.jobId),
  index('payments_status_idx').on(table.status),
  index('payments_provider_idx').on(table.provider),
  index('payments_checkout_req_id_idx').on(table.checkoutRequestId),
  index('payments_mpesa_checkout_req_id_idx').on(table.mpesaCheckoutRequestId),
  index('payments_mpesa_receipt_idx').on(table.mpesaReceiptNumber),
  index('payments_paystack_ref_idx').on(table.paystackReference),
  index('payments_unmatched_idx').on(table.unmatched),
  index('payments_source_idx').on(table.source),
]);

// ========================================
// PAYMENT AUDIT LOGS TABLE
// ========================================
export const paymentAuditLogs = pgTable('payment_audit_logs', {
  id: serial('id').primaryKey(),
  paymentId: integer('payment_id').references(() => payments.id, { onDelete: 'cascade' }),
  event: varchar('event', { length: 100 }).notNull(), // 'payment_created' | 'stk_requested' | 'stk_accepted' | 'callback_received' | 'payment_paid' | 'payment_failed' | 'payment_review_required' | 'payment_reconciled' | 'payment_reversed'
  actor: varchar('actor', { length: 100 }).notNull().default('system'), // 'client' | 'system' | 'safaricom' | 'admin'
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('payment_audit_logs_payment_id_idx').on(table.paymentId),
  index('payment_audit_logs_event_idx').on(table.event),
  index('payment_audit_logs_created_at_idx').on(table.createdAt),
]);

// ========================================
// WEBHOOK EVENTS TABLE (Idempotency)
// ========================================
export const webhookEvents = pgTable('webhook_events', {
  id: serial('id').primaryKey(),
  eventId: varchar('event_id', { length: 255 }).notNull().unique(),
  provider: varchar('provider', { length: 50 }).notNull().default('paystack'),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  reference: varchar('reference', { length: 255 }),
  payload: jsonb('payload'),
  status: varchar('status', { length: 50 }).notNull().default('processed'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  processedAt: timestamp('processed_at', { mode: 'string' }),
}, (table) => [
  uniqueIndex('webhook_events_provider_event_id_idx').on(table.provider, table.eventId),
  index('webhook_events_reference_idx').on(table.reference),
]);

// ========================================
// NOTIFICATIONS TABLE
// ========================================
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  jobId: integer('job_id').references(() => jobs.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 100 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  read: boolean('is_read').notNull().default(false),
  relatedId: integer('related_id'),
  relatedType: varchar('related_type', { length: 50 }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('notifications_user_id_idx').on(table.userId),
  index('notifications_read_idx').on(table.read),
]);

// ========================================
// JOB MESSAGES TABLE (LEGACY)
// ========================================
export const jobMessages = pgTable('job_messages', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  senderId: integer('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  messageType: varchar('message_type', { length: 50 }).notNull().default('text'),
  adminApproved: boolean('admin_approved').notNull().default(false),
  isDelivered: boolean('is_delivered').notNull().default(false),
  approvedAt: timestamp('approved_at', { mode: 'string' }),
  approvedBy: integer('approved_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// ORDER CHAT MESSAGES TABLE
// ========================================
export const orderChatMessages = pgTable('order_chat_messages', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  senderId: integer('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  senderRole: varchar('sender_role', { length: 50 }).notNull(),
  displaySenderName: varchar('display_sender_name', { length: 255 }),
  displaySenderRole: varchar('display_sender_role', { length: 50 }),
  message: text('message').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  readAt: timestamp('read_at', { mode: 'string' }),
  chatSpace: varchar('chat_space', { length: 50 }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// RATINGS TABLE
// ========================================
export const ratings = pgTable('ratings', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  raterId: integer('rater_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  ratedUserId: integer('rated_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// JOB ATTACHMENTS TABLE (LEGACY)
// ========================================
export const jobAttachments = pgTable('job_attachments', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  uploadedBy: integer('uploaded_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size').notNull(),
  fileType: varchar('file_type', { length: 100 }).notNull(),
  uploadType: varchar('upload_type', { length: 50 }).notNull(),
  attachmentCategory: varchar('attachment_category', { length: 50 }),
  scheduledDeletionAt: timestamp('scheduled_deletion_at', { mode: 'string' }),
  deletedAt: timestamp('deleted_at', { mode: 'string' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// BILLING INVOICES TABLE
// ========================================
export const billingInvoices = pgTable('billing_invoices', {
  id: serial('id').primaryKey(),
  invoiceNumber: varchar('invoice_number', { length: 100 }).notNull().unique(),
  recipientId: integer('recipient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipientRole: varchar('recipient_role', { length: 50 }).notNull(),
  recipientName: varchar('recipient_name', { length: 255 }).notNull(),
  recipientEmail: varchar('recipient_email', { length: 255 }).notNull(),
  periodStart: timestamp('period_start', { mode: 'string' }).notNull(),
  periodEnd: timestamp('period_end', { mode: 'string' }).notNull(),
  orderCount: integer('order_count').notNull().default(0),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  currency: varchar('currency', { length: 10 }).notNull().default('KES'),
  status: varchar('status', { length: 50 }).notNull().default('draft'),
  notes: text('notes'),
  mpesaCode: varchar('mpesa_code', { length: 100 }),
  merchantReference: varchar('merchant_reference', { length: 255 }),
  orderTrackingId: varchar('order_tracking_id', { length: 255 }),
  transactionId: varchar('transaction_id', { length: 255 }),
  paymentMethod: varchar('payment_method', { length: 50 }),
  pdfUrl: text('pdf_url'),
  paymentReference: varchar('payment_reference', { length: 255 }),
  sentAt: timestamp('sent_at', { mode: 'string' }),
  sentBy: integer('sent_by').references(() => users.id, { onDelete: 'set null' }),
  confirmedAt: timestamp('confirmed_at', { mode: 'string' }),
  confirmedBy: integer('confirmed_by').references(() => users.id, { onDelete: 'set null' }),
  paidAt: timestamp('paid_at', { mode: 'string' }),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// BILLING INVOICE ITEMS TABLE
// ========================================
export const billingInvoiceItems = pgTable('billing_invoice_items', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id').notNull().references(() => billingInvoices.id, { onDelete: 'cascade' }),
  jobId: integer('job_id').references(() => jobs.id, { onDelete: 'set null' }),
  orderNumber: varchar('order_number', { length: 50 }),
  description: text('description').notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  amount: decimal('amount', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// INVOICES TABLE
// ========================================
export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  clientId: integer('client_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  freelancerId: integer('freelancer_id').references(() => users.id, { onDelete: 'set null' }),
  invoiceNumber: varchar('invoice_number', { length: 100 }).notNull().unique(),
  amount: decimal('amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  freelancerAmount: decimal('freelancer_amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  adminCommission: decimal('admin_commission', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  managerAmount: decimal('manager_amount', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  companyFee: decimal('company_fee', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  clientCppAtInvoice: decimal('client_cpp_at_invoice', { precision: 10, scale: 2, mode: 'number' }),
  managerAdditionalIncluded: decimal('manager_additional_included', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  clientBonusIncluded: decimal('client_bonus_included', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  description: text('description').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  isPaid: boolean('is_paid').notNull().default(false),
  paidAt: timestamp('paid_at', { mode: 'string' }),
  billingInvoiceId: integer('billing_invoice_id').references(() => billingInvoices.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// MESSAGES TABLE
// ========================================
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  receiverId: integer('receiver_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  jobId: integer('job_id').references(() => jobs.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  fileUrl: text('file_url'),
  adminApproved: boolean('admin_approved').notNull().default(false),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// REVISIONS TABLE (LEGACY)
// ========================================
export const revisions = pgTable('revisions', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  submittedBy: integer('submitted_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fileUrl: text('file_url').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size').notNull(),
  fileType: varchar('file_type', { length: 100 }).notNull(),
  revisionNotes: text('revision_notes'),
  status: varchar('status', { length: 50 }).notNull().default('pending_review'),
  sentToFreelancer: boolean('sent_to_freelancer').notNull().default(false),
  approvedByAdmin: boolean('approved_by_admin').notNull().default(false),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// ORDER REVISIONS TABLE
// ========================================
export const orderRevisions = pgTable('order_revisions', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  revisionType: varchar('revision_type', { length: 50 }).notNull(),
  requestedBy: integer('requested_by').notNull().references(() => users.id, { onDelete: 'set null' }),
  assignedTo: integer('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  description: text('description').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  filesJson: jsonb('files_json').default('[]'),
  freelancerResponse: text('freelancer_response'),
  reviewerNotes: text('reviewer_notes'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
  submittedAt: timestamp('submitted_at', { mode: 'string' }),
  completedAt: timestamp('completed_at', { mode: 'string' }),
  closedBy: integer('closed_by').references(() => users.id, { onDelete: 'set null' }),
});

// ========================================
// EMAIL LOGS TABLE
// ========================================
export const emailLogs = pgTable('email_logs', {
  id: serial('id').primaryKey(),
  sentBy: integer('sent_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sentTo: varchar('sent_to', { length: 255 }).notNull(),
  recipientType: varchar('recipient_type', { length: 50 }).notNull(),
  recipientCount: integer('recipient_count').notNull(),
  fromEmail: varchar('from_email', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }).notNull(),
  body: text('body').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('sent'),
  failedRecipients: text('failed_recipients'),
  jobId: integer('job_id').references(() => jobs.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// ORDER FILES TABLE (CONSOLIDATED)
// ========================================
export const orderFiles = pgTable('order_files', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  uploadedBy: integer('uploaded_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  uploadedByRole: varchar('uploaded_by_role', { length: 50 }),
  fileUrl: text('file_url').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileType: varchar('file_type', { length: 50 }).notNull(),
  fileClassification: varchar('file_classification', { length: 50 }).notNull().default('other'),
  notes: text('notes'),
  versionNumber: integer('version_number').notNull().default(1),
  uploadStatus: varchar('upload_status', { length: 50 }).notNull().default('completed'),
  uploadProgress: integer('upload_progress').notNull().default(100),
  uploadError: text('upload_error'),
  verifiedBy: integer('verified_by').references(() => users.id, { onDelete: 'set null' }),
  verifiedAt: timestamp('verified_at', { mode: 'string' }),
  verificationStatus: varchar('verification_status', { length: 50 }).default('pending'),
  verificationNotes: text('verification_notes'),
  isDeleted: boolean('is_deleted').notNull().default(false),
  deletedBy: integer('deleted_by').references(() => users.id, { onDelete: 'set null' }),
  deletedAt: timestamp('deleted_at', { mode: 'string' }),
  deletionReason: text('deletion_reason'),
  replacedBy: integer('replaced_by'),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  cloudinaryPublicId: varchar('cloudinary_public_id', { length: 255 }),
  downloadCount: integer('download_count').notNull().default(0),
  lastDownloadedAt: timestamp('last_downloaded_at', { mode: 'string' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('order_files_order_id_idx').on(table.orderId),
  index('order_files_uploaded_by_idx').on(table.uploadedBy),
]);

// ========================================
// DOCUMENT PREVIEWS TABLE
// ========================================
export const documentPreviews = pgTable('document_previews', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  originalFileUrl: text('original_file_url').notNull(),
  previewPdfPath: text('preview_pdf_path').notNull(),
  fullPdfPath: text('full_pdf_path').notNull(),
  totalPages: integer('total_pages').notNull(),
  previewPages: integer('preview_pages').notNull(),
  fileSize: integer('file_size').notNull(),
  watermarkText: varchar('watermark_text', { length: 255 }).notNull(),
  accessToken: varchar('access_token', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
  lastAccessedAt: timestamp('last_accessed_at', { mode: 'string' }),
  accessCount: integer('access_count').notNull().default(0),
});

// ========================================
// FILE UPLOAD AUDIT LOG TABLE
// ========================================
export const fileUploadAuditLog = pgTable('file_upload_audit_log', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  uploaderId: integer('uploader_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  uploaderRole: varchar('uploader_role', { length: 50 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size').notNull(),
  fileType: varchar('file_type', { length: 100 }).notNull(),
  fileClassification: varchar('file_classification', { length: 50 }),
  uploadEndpoint: varchar('upload_endpoint', { length: 255 }).notNull(),
  uploadStatus: varchar('upload_status', { length: 50 }).notNull(),
  cloudinaryUrl: text('cloudinary_url'),
  errorMessage: text('error_message'),
  errorCode: varchar('error_code', { length: 50 }),
  requestPayload: jsonb('request_payload'),
  responsePayload: jsonb('response_payload'),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  durationMs: integer('duration_ms'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// ORDER SUBMISSIONS TABLE
// ========================================
export const orderSubmissions = pgTable('order_submissions', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  freelancerId: integer('freelancer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  submissionType: varchar('submission_type', { length: 50 }).notNull(),
  submissionStatus: varchar('submission_status', { length: 50 }).notNull(),
  filesSubmitted: integer('files_submitted').notNull().default(0),
  hasFinalDocument: boolean('has_final_document').notNull().default(false),
  hasPlagiarismReport: boolean('has_plagiarism_report').notNull().default(false),
  hasAiReport: boolean('has_ai_report').notNull().default(false),
  checklistCompleted: boolean('checklist_completed').notNull().default(false),
  submissionNotes: text('submission_notes'),
  reviewedBy: integer('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at', { mode: 'string' }),
  reviewNotes: text('review_notes'),
  reviewStatus: varchar('review_status', { length: 50 }),
  submittedAt: timestamp('submitted_at', { mode: 'string' }).notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// EMAIL VERIFICATION CODES TABLE
// ========================================
export const emailVerificationCodes = pgTable('email_verification_codes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
  used: boolean('used').notNull().default(false),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// PENDING REGISTRATIONS TABLE
// ========================================
export const pendingRegistrations = pgTable('pending_registrations', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  accountName: varchar('account_name', { length: 255 }),
  domainId: integer('domain_id'),
  subjectIds: text('subject_ids'),
  verificationCode: varchar('verification_code', { length: 50 }).notNull(),
  codeExpiresAt: timestamp('code_expires_at', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// PASSWORD RESET TOKENS TABLE
// ========================================
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
  used: boolean('used').notNull().default(false),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// PAYMENT REQUESTS TABLE
// ========================================
export const paymentRequests = pgTable('payment_requests', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  phoneNumber: varchar('phone_number', { length: 50 }),
  transactionReference: varchar('transaction_reference', { length: 255 }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  confirmedAt: timestamp('confirmed_at', { mode: 'string' }),
  confirmedBy: integer('confirmed_by').references(() => users.id, { onDelete: 'set null' }),
  rejectionReason: text('rejection_reason'),
});

// ========================================
// EMAIL NOTIFICATIONS TABLE
// ========================================
export const emailNotifications = pgTable('email_notifications', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  notificationType: varchar('notification_type', { length: 100 }).notNull(),
  sentTo: varchar('sent_to', { length: 255 }).notNull(),
  sentAt: timestamp('sent_at', { mode: 'string' }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('sent'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// MANAGER INVITATIONS TABLE (LEGACY)
// ========================================
export const managerInvitations = pgTable('manager_invitations', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  role: varchar('role', { length: 50 }).default('manager'),
  status: varchar('status', { length: 50 }).default('pending'),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  used: boolean('used').notNull().default(false),
  usedAt: timestamp('used_at', { mode: 'string' }),
  expiresAt: timestamp('expires_at', { mode: 'string' }),
});

// ========================================
// JOB STATUS LOGS TABLE (LEGACY)
// ========================================
export const jobStatusLogs = pgTable('job_status_logs', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  oldStatus: varchar('old_status', { length: 50 }),
  newStatus: varchar('new_status', { length: 50 }).notNull(),
  changedBy: integer('changed_by').references(() => users.id, { onDelete: 'set null' }),
  note: text('note'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// ORDER HISTORY TABLE
// ========================================
export const orderHistory = pgTable('order_history', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 255 }).notNull(),
  oldStatus: varchar('old_status', { length: 50 }),
  newStatus: varchar('new_status', { length: 50 }),
  actorId: integer('actor_id').references(() => users.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// WRITER BALANCES TABLE
// ========================================
export const writerBalances = pgTable('writer_balances', {
  id: serial('id').primaryKey(),
  writerId: integer('writer_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  availableBalance: decimal('available_balance', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  pendingBalance: decimal('pending_balance', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  totalEarned: decimal('total_earned', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// BALANCES TABLE
// ========================================
export const balances = pgTable('balances', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  availableBalance: decimal('available_balance', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  pendingBalance: decimal('pending_balance', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  reservedBalance: decimal('reserved_balance', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  totalEarned: decimal('total_earned', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  totalWithdrawn: decimal('total_withdrawn', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  assignmentBalance: decimal('assignment_balance', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  deliveryBalance: decimal('delivery_balance', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// MANAGERS TABLE
// ========================================
export const managers = pgTable('managers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  phone: varchar('phone', { length: 50 }),
  balance: decimal('balance', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  totalEarnings: decimal('total_earnings', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// CLIENT MANAGER TABLE
// ========================================
export const clientManager = pgTable('client_manager', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  managerId: integer('manager_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('client_manager_client_manager_unique').on(table.clientId, table.managerId),
]);

// ========================================
// MANAGER EARNINGS TABLE
// ========================================
export const managerEarnings = pgTable('manager_earnings', {
  id: serial('id').primaryKey(),
  managerId: integer('manager_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  earningType: varchar('earning_type', { length: 50 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// USER CATEGORIES TABLE
// ========================================
export const userCategories = pgTable('user_categories', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 100 }).notNull(),
  assignedAt: timestamp('assigned_at', { mode: 'string' }).notNull(),
  assignedBy: integer('assigned_by').references(() => users.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// SYSTEM LOGS TABLE
// ========================================
export const systemLogs = pgTable('system_logs', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 50 }).notNull(),
  message: text('message').notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 255 }),
  context: jsonb('context'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// BADGES TABLE
// ========================================
export const badges = pgTable('badges', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  criteria: jsonb('criteria').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  color: varchar('color', { length: 20 }),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// USER BADGES TABLE
// ========================================
export const userBadges = pgTable('user_badges', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  badgeId: integer('badge_id').notNull().references(() => badges.id, { onDelete: 'cascade' }),
  badgeName: varchar('badge_name', { length: 100 }),
  badgeIcon: varchar('badge_icon', { length: 50 }),
  awardedAt: timestamp('awarded_at', { mode: 'string' }).notNull(),
  awardedBy: integer('awarded_by').references(() => users.id, { onDelete: 'set null' }),
  reason: text('reason'),
  description: text('description'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// PAYOUT REQUESTS TABLE
// ========================================
export const payoutRequests = pgTable('payout_requests', {
  id: serial('id').primaryKey(),
  writerId: integer('writer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  method: varchar('method', { length: 50 }).notNull(),
  accountDetails: jsonb('account_details').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  requestedAt: timestamp('requested_at', { mode: 'string' }).notNull(),
  processedAt: timestamp('processed_at', { mode: 'string' }),
  processedBy: integer('processed_by').references(() => users.id, { onDelete: 'set null' }),
  rejectionReason: text('rejection_reason'),
  transactionReference: varchar('transaction_reference', { length: 255 }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// ADMIN AUDIT LOGS TABLE
// ========================================
export const adminAuditLogs = pgTable('admin_audit_logs', {
  id: serial('id').primaryKey(),
  adminId: integer('admin_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 255 }).notNull(),
  targetId: integer('target_id'),
  targetType: varchar('target_type', { length: 50 }).notNull(),
  details: jsonb('details'),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// AUDIT LOGS TABLE
// ========================================
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  userEmail: varchar('user_email', { length: 255 }),
  userRole: varchar('user_role', { length: 50 }),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  description: text('description').notNull(),
  severity: varchar('severity', { length: 50 }).notNull(),
  resourceType: varchar('resource_type', { length: 50 }),
  resourceId: integer('resource_id'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  metadata: jsonb('metadata'),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  sessionId: varchar('session_id', { length: 255 }),
  success: boolean('success').notNull().default(true),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// WRITER TIERS TABLE
// ========================================
export const writerTiers = pgTable('writer_tiers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  minRating: decimal('min_rating', { precision: 3, scale: 2, mode: 'number' }).notNull(),
  minJobs: integer('min_jobs').notNull(),
  minSuccessRate: decimal('min_success_rate', { precision: 5, scale: 2, mode: 'number' }).notNull(),
  benefits: jsonb('benefits'),
  color: varchar('color', { length: 20 }),
  icon: varchar('icon', { length: 50 }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// CONVERSATIONS TABLE
// ========================================
export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').references(() => jobs.id, { onDelete: 'set null' }),
  participant1Id: integer('participant1_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  participant2Id: integer('participant2_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lastMessageAt: timestamp('last_message_at', { mode: 'string' }),
  lastMessageSenderId: integer('last_message_sender_id').references(() => users.id, { onDelete: 'set null' }),
  lastMessagePreview: text('last_message_preview'),
  isArchived: boolean('is_archived').notNull().default(false),
  archivedAt: timestamp('archived_at', { mode: 'string' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// FREELANCER PROFILES TABLE
// ========================================
export const freelancerProfiles = pgTable('freelancer_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  currentTierId: integer('current_tier_id').references(() => writerTiers.id, { onDelete: 'set null' }),
  bio: text('bio'),
  skills: jsonb('skills'),
  certifications: jsonb('certifications'),
  portfolio: jsonb('portfolio'),
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2, mode: 'number' }),
  languages: jsonb('languages'),
  timezone: varchar('timezone', { length: 100 }),
  availability: varchar('availability', { length: 50 }).default('part-time'),
  availableDays: jsonb('available_days'),
  availableTimeStart: varchar('available_time_start', { length: 10 }),
  availableTimeEnd: varchar('available_time_end', { length: 10 }),
  responseTime: integer('response_time'),
  totalClients: integer('total_clients').default(0),
  repeatClientRate: decimal('repeat_client_rate', { precision: 5, scale: 2, mode: 'number' }).default(0),
  jobsCompleted: integer('jobs_completed').default(0),
  isProfileComplete: boolean('is_profile_complete').default(false),
  publicSlug: varchar('public_slug', { length: 255 }).unique(),
  profileHeadline: varchar('profile_headline', { length: 255 }),
  profileStatus: varchar('profile_status', { length: 50 }).notNull().default('draft'),
  education: jsonb('education'),
  experience: jsonb('experience'),
  portfolioScreenshots: jsonb('portfolio_screenshots'),
  seoTitle: varchar('seo_title', { length: 255 }),
  seoDescription: text('seo_description'),
  publishedAt: timestamp('published_at', { mode: 'string' }),
  reviewedBy: integer('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// EDITOR PROFILES TABLE
// ========================================
export const editorProfiles = pgTable('editor_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  specialization: varchar('specialization', { length: 100 }),
  yearsExperience: integer('years_experience'),
  languages: jsonb('languages'),
  qualifications: jsonb('qualifications'),
  areasOfExpertise: jsonb('areas_of_expertise'),
  averageEditsPerOrder: integer('average_edits_per_order').default(0),
  ordersTouched: integer('orders_touched').default(0),
  clientSatisfactionRate: decimal('client_satisfaction_rate', { precision: 5, scale: 2, mode: 'number' }).default(0),
  isProfileComplete: boolean('is_profile_complete').default(false),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// EDITOR ASSIGNMENTS TABLE
// ========================================
export const editorAssignments = pgTable('editor_assignments', {
  id: serial('id').primaryKey(),
  editorId: integer('editor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at', { mode: 'string' }).notNull(),
  reviewStartedAt: timestamp('review_started_at', { mode: 'string' }),
  approvalStatus: varchar('approval_status', { length: 50 }).notNull().default('pending'),
  approvalReason: text('approval_reason'),
  revisionsRequested: boolean('revisions_requested').notNull().default(false),
  revisionNotes: text('revision_notes'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// EDITOR FILES TABLE
// ========================================
export const editorFiles = pgTable('editor_files', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  editorId: integer('editor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size').notNull(),
  fileType: varchar('file_type', { length: 100 }).notNull(),
  version: integer('version').notNull().default(1),
  notes: text('notes'),
  isLatest: boolean('is_latest').notNull().default(true),
  uploadedAt: timestamp('uploaded_at', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// EDITOR MESSAGES TABLE
// ========================================
export const editorMessages = pgTable('editor_messages', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  senderId: integer('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  senderRole: varchar('sender_role', { length: 50 }).notNull(),
  receiverId: integer('receiver_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  receiverRole: varchar('receiver_role', { length: 50 }).notNull(),
  message: text('message').notNull(),
  messageType: varchar('message_type', { length: 50 }).notNull().default('text'),
  fileUrl: text('file_url'),
  isRead: boolean('is_read').notNull().default(false),
  readAt: timestamp('read_at', { mode: 'string' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// EDITOR INTERNAL REVISIONS TABLE
// ========================================
export const editorInternalRevisions = pgTable('editor_internal_revisions', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  editorId: integer('editor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  requestedAt: timestamp('requested_at', { mode: 'string' }).notNull(),
  reason: text('reason').notNull(),
  issueType: varchar('issue_type', { length: 100 }).notNull(),
  detailedNotes: text('detailed_notes').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  approvedBy: integer('approved_by').references(() => users.id, { onDelete: 'set null' }),
  approvedAt: timestamp('approved_at', { mode: 'string' }),
  sentToFreelancerAt: timestamp('sent_to_freelancer_at', { mode: 'string' }),
  resubmittedAt: timestamp('resubmitted_at', { mode: 'string' }),
  completedAt: timestamp('completed_at', { mode: 'string' }),
  freelancerResponse: text('freelancer_response'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// PAYMENT TRANSACTIONS TABLE
// ========================================
export const paymentTransactions = pgTable('payment_transactions', {
  id: serial('id').primaryKey(),
  paymentId: integer('payment_id').notNull().references(() => payments.id, { onDelete: 'cascade' }),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  transactionType: varchar('transaction_type', { length: 100 }).notNull(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  balanceBefore: decimal('balance_before', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  balanceAfter: decimal('balance_after', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('completed'),
  reason: text('reason'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// CLIENT PROFILES TABLE
// ========================================
export const clientProfiles = pgTable('client_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  companyName: varchar('company_name', { length: 255 }),
  industry: varchar('industry', { length: 100 }),
  website: varchar('website', { length: 255 }),
  taxId: varchar('tax_id', { length: 100 }),
  businessRegistration: varchar('business_registration', { length: 100 }),
  billingAddress: jsonb('billing_address'),
  shippingAddress: jsonb('shipping_address'),
  preferredPaymentMethod: varchar('preferred_payment_method', { length: 50 }),
  automatePayments: boolean('automate_payments').default(false),
  totalJobsPosted: integer('total_jobs_posted').default(0),
  totalSpent: decimal('total_spent', { precision: 12, scale: 2, mode: 'number' }).default(0),
  recurringClientDiscount: decimal('recurring_client_discount', { precision: 5, scale: 2, mode: 'number' }).default(0),
  isProfileComplete: boolean('is_profile_complete').default(false),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// CLIENT FREELANCER HISTORY TABLE
// ========================================
export const clientFreelancerHistory = pgTable('client_freelancer_history', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  freelancerId: integer('freelancer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  completedJobsCount: integer('completed_jobs_count').notNull().default(1),
  lastWorkedAt: timestamp('last_worked_at', { mode: 'string' }).notNull(),
  avgRating: decimal('avg_rating', { precision: 3, scale: 2, mode: 'number' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('client_freelancer_unique').on(table.clientId, table.freelancerId),
]);

// ========================================
// FREELANCER ONLINE STATUS TABLE (DEPRECATED)
// ========================================
export const freelancerOnlineStatus = pgTable('freelancer_online_status', {
  id: serial('id').primaryKey(),
  freelancerId: integer('freelancer_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  isOnline: boolean('is_online').notNull().default(false),
  lastSeenAt: timestamp('last_seen_at', { mode: 'string' }).notNull(),
  currentJobsCount: integer('current_jobs_count').notNull().default(0),
  onlineStatusUpdatedAt: timestamp('online_status_updated_at', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// MANAGER ONLINE STATUS TABLE (DEPRECATED)
// ========================================
export const managerOnlineStatus = pgTable('manager_online_status', {
  id: serial('id').primaryKey(),
  managerId: integer('manager_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  isOnline: boolean('is_online').notNull().default(false),
  lastSeenAt: timestamp('last_seen_at', { mode: 'string' }).notNull(),
  onlineStatusUpdatedAt: timestamp('online_status_updated_at', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// CLIENT ONLINE STATUS TABLE (DEPRECATED)
// ========================================
export const clientOnlineStatus = pgTable('client_online_status', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  isOnline: boolean('is_online').notNull().default(false),
  lastSeenAt: timestamp('last_seen_at', { mode: 'string' }).notNull(),
  onlineStatusUpdatedAt: timestamp('online_status_updated_at', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// FREELANCER CPP LEVELS TABLE
// ========================================
export const freelancerCPPLevels = pgTable('freelancer_cpp_levels', {
  id: serial('id').primaryKey(),
  level: integer('level').notNull().unique(),
  levelName: varchar('level_name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  completedOrdersRequired: integer('completed_orders_required').notNull(),
  cppNonTechnical: decimal('cpp_non_technical', { precision: 10, scale: 2, mode: 'number' }).notNull(),
  cppTechnical: decimal('cpp_technical', { precision: 10, scale: 2, mode: 'number' }).notNull(),
  orderCountInLevel: integer('order_count_in_level').notNull(),
  progressBarColor: varchar('progress_bar_color', { length: 20 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// FREELANCER CPP PROGRESS TABLE
// ========================================
export const freelancerCPPProgress = pgTable('freelancer_cpp_progress', {
  id: serial('id').primaryKey(),
  freelancerId: integer('freelancer_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  currentLevel: integer('current_level').notNull().default(1),
  totalCompletedOrders: integer('total_completed_orders').notNull().default(0),
  ordersInCurrentLevel: integer('orders_in_current_level').notNull().default(0),
  progressPercentage: decimal('progress_percentage', { precision: 5, scale: 2, mode: 'number' }).notNull().default(0),
  nextLevelOrdersRequired: integer('next_level_orders_required').notNull().default(3),
  isWorkTypeSpecialized: boolean('is_work_type_specialized').notNull().default(false),
  lastProgressUpdate: timestamp('last_progress_update', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// CONTACT MESSAGES TABLE
// ========================================
export const contactMessages = pgTable('contact_messages', {
  id: serial('id').primaryKey(),
  senderName: varchar('sender_name', { length: 255 }).notNull(),
  senderEmail: varchar('sender_email', { length: 255 }).notNull(),
  senderPhone: varchar('sender_phone', { length: 50 }),
  content: text('content').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  isGuest: boolean('is_guest').notNull().default(true),
  resolvedBy: integer('resolved_by').references(() => users.id, { onDelete: 'set null' }),
  resolvedAt: timestamp('resolved_at', { mode: 'string' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// SUBMISSIONS TABLE
// ========================================
export const submissions = pgTable('submissions', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  writerId: integer('writer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  submissionType: varchar('submission_type', { length: 50 }).notNull(),
  content: text('content'),
  wordCount: integer('word_count').default(0),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  submittedAt: timestamp('submitted_at', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// SUBMISSION FILES TABLE
// ========================================
export const submissionFiles = pgTable('submission_files', {
  id: serial('id').primaryKey(),
  submissionId: integer('submission_id').notNull().references(() => submissions.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size').notNull(),
  fileType: varchar('file_type', { length: 100 }).notNull(),
  uploadedAt: timestamp('uploaded_at', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// PRICING MINIMUMS TABLE
// ========================================
export const pricingMinimums = pgTable('pricing_minimums', {
  id: serial('id').primaryKey(),
  serviceType: varchar('service_type', { length: 100 }).notNull().unique(),
  minCpp: decimal('min_cpp', { precision: 10, scale: 2, mode: 'number' }).notNull(),
  minCps: decimal('min_cps', { precision: 10, scale: 2, mode: 'number' }),
  description: text('description'),
  effectiveFrom: timestamp('effective_from', { mode: 'string' }).notNull(),
  effectiveTo: timestamp('effective_to', { mode: 'string' }),
  enforcedBy: varchar('enforced_by', { length: 50 }).default('system'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// ORDER AMOUNT ADJUSTMENTS TABLE
// ========================================
export const orderAmountAdjustments = pgTable('order_amount_adjustments', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  changedBy: integer('changed_by').references(() => users.id, { onDelete: 'set null' }),
  changeType: varchar('change_type', { length: 100 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  previousTotal: decimal('previous_total', { precision: 12, scale: 2, mode: 'number' }),
  newTotal: decimal('new_total', { precision: 12, scale: 2, mode: 'number' }),
  reason: text('reason'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  approvedBy: integer('approved_by').references(() => users.id, { onDelete: 'set null' }),
  approvedAt: timestamp('approved_at', { mode: 'string' }),
  rejectedAt: timestamp('rejected_at', { mode: 'string' }),
  rejectionReason: text('rejection_reason'),
  appliedAt: timestamp('applied_at', { mode: 'string' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// FREELANCER SUBJECTS TABLE
// ========================================
export const freelancerSubjects = pgTable('freelancer_subjects', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  categoryId: integer('category_id'),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ALIAS for backward compatibility
export const subjects = freelancerSubjects;

// ========================================
// FREELANCER SOFTWARE TABLE
// ========================================
export const freelancerSoftware = pgTable('freelancer_software', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// FREELANCER SERVICES TABLE
// ========================================
export const freelancerServices = pgTable('freelancer_services', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// FREELANCER SUBJECT MAP TABLE
// ========================================
export const freelancerSubjectMap = pgTable('freelancer_subject_map', {
  id: serial('id').primaryKey(),
  freelancerId: integer('freelancer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subjectId: integer('subject_id').notNull().references(() => freelancerSubjects.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// FREELANCER SOFTWARE MAP TABLE
// ========================================
export const freelancerSoftwareMap = pgTable('freelancer_software_map', {
  id: serial('id').primaryKey(),
  freelancerId: integer('freelancer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  softwareId: integer('software_id').notNull().references(() => freelancerSoftware.id, { onDelete: 'cascade' }),
  otherSoftware: text('other_software'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// FREELANCER SERVICES MAP TABLE
// ========================================
export const freelancerServicesMap = pgTable('freelancer_services_map', {
  id: serial('id').primaryKey(),
  freelancerId: integer('freelancer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  serviceId: integer('service_id').notNull().references(() => freelancerServices.id, { onDelete: 'cascade' }),
  otherService: text('other_service'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// MEMOS TABLE
// ========================================
export const memos = pgTable('memos', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  targetRole: varchar('target_role', { length: 50 }).notNull(),
  priority: varchar('priority', { length: 50 }).notNull().default('normal'),
  requiresAcknowledgement: boolean('requires_acknowledgement').notNull().default(true),
  expiresAt: timestamp('expires_at', { mode: 'string' }),
  createdBy: integer('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// MEMO READS TABLE
// ========================================
export const memoReads = pgTable('memo_reads', {
  id: serial('id').primaryKey(),
  memoId: integer('memo_id').notNull().references(() => memos.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  readAt: timestamp('read_at', { mode: 'string' }).notNull(),
  acknowledgedAt: timestamp('acknowledged_at', { mode: 'string' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// MANAGER FREELANCERS TABLE
// ========================================
export const managerFreelancers = pgTable('manager_freelancers', {
  id: serial('id').primaryKey(),
  managerId: integer('manager_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  freelancerId: integer('freelancer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  assignedBy: integer('assigned_by').references(() => users.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  notes: text('notes'),
  assignedAt: timestamp('assigned_at', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('manager_freelancer_unique').on(table.managerId, table.freelancerId),
]);

// ========================================
// MANAGER CLIENTS TABLE
// ========================================
export const managerClients = pgTable('manager_clients', {
  id: serial('id').primaryKey(),
  managerId: integer('manager_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  clientId: integer('client_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  assignedBy: integer('assigned_by').references(() => users.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  notes: text('notes'),
  assignedAt: timestamp('assigned_at', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('manager_client_unique').on(table.managerId, table.clientId),
]);

// ========================================
// INVOICE SETTLEMENTS TABLE
// ========================================
export const invoiceSettlements = pgTable('invoice_settlements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  userType: varchar('user_type', { length: 50 }).notNull(),
  settlementAmount: decimal('settlement_amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  ordersSettled: integer('orders_settled').notNull(),
  orderIds: jsonb('order_ids').notNull(),
  balanceBeforeSettlement: decimal('balance_before_settlement', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  balanceAfterSettlement: decimal('balance_after_settlement', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  notes: text('notes'),
  settledBy: integer('settled_by').notNull().references(() => users.id, { onDelete: 'set null' }),
  settledAt: timestamp('settled_at', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// ORDER SETTLEMENTS TABLE
// ========================================
export const orderSettlements = pgTable('order_settlements', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().unique().references(() => jobs.id, { onDelete: 'cascade' }),
  settlementId: integer('settlement_id').notNull().references(() => invoiceSettlements.id, { onDelete: 'cascade' }),
  freelancerAmount: decimal('freelancer_amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  managerAmount: decimal('manager_amount', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  isSettled: boolean('is_settled').notNull().default(true),
  settledAt: timestamp('settled_at', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// USER FINES TABLE
// ========================================
export const userFines = pgTable('user_fines', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  userType: varchar('user_type', { length: 50 }).notNull(),
  jobId: integer('job_id').references(() => jobs.id, { onDelete: 'set null' }),
  fineAmount: decimal('fine_amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  fineType: varchar('fine_type', { length: 100 }).notNull(),
  reason: text('reason').notNull(),
  balanceBeforeFine: decimal('balance_before_fine', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  balanceAfterFine: decimal('balance_after_fine', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('applied'),
  issuedBy: integer('issued_by').notNull().references(() => users.id, { onDelete: 'set null' }),
  issuedAt: timestamp('issued_at', { mode: 'string' }).notNull(),
  reversedAt: timestamp('reversed_at', { mode: 'string' }),
  reversedBy: integer('reversed_by').references(() => users.id, { onDelete: 'set null' }),
  reversalReason: text('reversal_reason'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// ORDER ADDITIONAL PAYMENTS TABLE
// ========================================
export const orderAdditionalPayments = pgTable('order_additional_payments', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  recipientId: integer('recipient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  additionalAmount: decimal('additional_amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  reason: text('reason').notNull(),
  originalAmount: decimal('original_amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  newTotalAmount: decimal('new_total_amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  addedBy: integer('added_by').notNull().references(() => users.id, { onDelete: 'set null' }),
  addedAt: timestamp('added_at', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// USER BALANCE HISTORY TABLE
// ========================================
export const userBalanceHistory = pgTable('user_balance_history', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  balanceBefore: decimal('balance_before', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  balanceAfter: decimal('balance_after', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  changeAmount: decimal('change_amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  changeType: varchar('change_type', { length: 100 }).notNull(),
  referenceType: varchar('reference_type', { length: 50 }),
  referenceId: integer('reference_id'),
  notes: text('notes'),
  changedBy: integer('changed_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// INTERNAL REVISIONS TABLE
// ========================================
export const internalRevisions = pgTable('internal_revisions', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  requestedBy: integer('requested_by').notNull().references(() => users.id, { onDelete: 'set null' }),
  assignedTo: integer('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// ADJUSTMENTS TABLE
// ========================================
export const adjustments = pgTable('adjustments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => jobs.id, { onDelete: 'set null' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  reason: text('reason'),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// BALANCE LEDGER TABLE
// ========================================
export const balanceLedger = pgTable('balance_ledger', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  jobId: integer('job_id').references(() => jobs.id, { onDelete: 'set null' }),
  amount: decimal('amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// USER SUBJECTS TABLE (NEW)
// ========================================
export const userSubjects = pgTable('user_subjects', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subjectId: integer('subject_id').notNull().references(() => freelancerSubjects.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('user_subjects_unique').on(table.userId, table.subjectId),
]);

// ========================================
// SESSIONS TABLE (NEW - For OAuth)
// ========================================
export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('sessions_user_id_idx').on(table.userId),
  index('sessions_expires_at_idx').on(table.expiresAt),
]);

// ========================================
// GOOGLE ACCOUNTS TABLE (NEW)
// ========================================
export const googleAccounts = pgTable('google_accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  googleId: varchar('google_id', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at', { mode: 'string' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

// ========================================
// TASKLYNK TRAINING ACADEMY TABLES
// ========================================
export * from './training-schema';



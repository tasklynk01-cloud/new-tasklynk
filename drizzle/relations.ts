import { relations } from "drizzle-orm/relations";
import {
  users,
  jobs,
  bids,
  userStats,
  invoices,
  emailLogs,
  jobMessages,
  revisions,
  jobAttachments,
  passwordResetTokens,
  emailVerificationCodes,
  paymentRequests,
  emailNotifications,
  jobStatusLogs,
  managerInvitations,
  balanceLedger,
  roles,
  managers,
  orderHistory,
  messages,
  notifications,
  ratings,
  userCategories,
  systemLogs,
  clientManager,
  managerEarnings,
  invitations,
  writerBalances,
  conversations,
  freelancerProfiles,
  clientProfiles,
  userBadges,
  badges,
  payoutRequests,
  adminAuditLogs,
  managerClients,
  managerProfiles,
  orderStatusHistory,
  orderFiles,
  systemSettings,
  editorProfiles,
  editorAssignments,
  paymentTransactions,
  payments,
  clientFreelancerHistory,
  freelancerOnlineStatus,
  managerOnlineStatus,
  clientOnlineStatus,
  freelancerCPPProgress,
  submissions,
  submissionFiles,
  contactMessages,
  orderAmountAdjustments,
  freelancerSubjectMap,
  freelancerSubjects,
  freelancerSoftwareMap,
  freelancerSoftware,
  freelancerServicesMap,
  freelancerServices,
  freelancerOrderResponses,
  memos,
  memoReads,
  managerFreelancers,
  invoiceSettlements,
  orderSettlements,
  userFines,
  orderAdditionalPayments,
  userBalanceHistory,
  internalRevisions,
  balances,
  adjustments,
  auditLogs,
  orderChatMessages,
  billingInvoices,
  billingInvoiceItems,
  editorFiles,
  editorMessages,
  editorInternalRevisions,
  domains,
  accounts,
  settingsHistory,
  orderTimelineEvents,
  documentPreviews,
  fileUploadAuditLog,
  orderSubmissions,
  pendingRegistrations,
  writerTiers,
  freelancerCPPLevels,
  pricingMinimums,
  freelancerSubjectMap as freelancerSubjectMapTable,
  freelancerSoftwareMap as freelancerSoftwareMapTable,
  freelancerServicesMap as freelancerServicesMapTable,
} from "./schema";

// ========================================
// USERS RELATIONS
// ========================================
export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  domain: one(domains, {
    fields: [users.domainId],
    references: [domains.id],
  }),
  account: one(accounts, {
    fields: [users.accountId],
    references: [accounts.id],
  }),
  userStats: many(userStats),
  jobsAsClient: many(jobs, { relationName: "jobs_clientId_users_id" }),
  jobsAsFreelancer: many(jobs, { relationName: "jobs_assignedFreelancerId_users_id" }),
  jobsAsManager: many(jobs, { relationName: "jobs_managerId_users_id" }),
  payments: many(payments),
  notifications: many(notifications),
  ratingsAsRater: many(ratings, { relationName: "ratings_raterId_users_id" }),
  ratingsAsRated: many(ratings, { relationName: "ratings_ratedUserId_users_id" }),
  messages: many(messages),
  orderFiles: many(orderFiles),
  balances: many(balances),
  writerBalances: many(writerBalances),
  freelancerProfile: one(freelancerProfiles),
  clientProfile: one(clientProfiles),
  editorProfile: one(editorProfiles),
  userBadges: many(userBadges),
  payoutRequests: many(payoutRequests),
  adminAuditLogs: many(adminAuditLogs),
  auditLogs: many(auditLogs),
}));

// ========================================
// JOBS RELATIONS
// ========================================
export const jobsRelations = relations(jobs, ({ one, many }) => ({
  client: one(users, {
    fields: [jobs.clientId],
    references: [users.id],
    relationName: "jobs_clientId_users_id",
  }),
  assignedFreelancer: one(users, {
    fields: [jobs.assignedFreelancerId],
    references: [users.id],
    relationName: "jobs_assignedFreelancerId_users_id",
  }),
  manager: one(users, {
    fields: [jobs.managerId],
    references: [users.id],
    relationName: "jobs_managerId_users_id",
  }),
  bids: many(bids),
  payments: many(payments),
  invoices: many(invoices),
  revisions: many(revisions),
  orderFiles: many(orderFiles),
  notifications: many(notifications),
  jobMessages: many(jobMessages),
  orderHistory: many(orderHistory),
  orderStatusHistory: many(orderStatusHistory),
}));

// ========================================
// BIDS RELATIONS
// ========================================
export const bidsRelations = relations(bids, ({ one }) => ({
  job: one(jobs, {
    fields: [bids.jobId],
    references: [jobs.id],
  }),
  freelancer: one(users, {
    fields: [bids.freelancerId],
    references: [users.id],
  }),
}));

// ========================================
// PAYMENTS RELATIONS
// ========================================
export const paymentsRelations = relations(payments, ({ one }) => ({
  job: one(jobs, {
    fields: [payments.jobId],
    references: [jobs.id],
  }),
  client: one(users, {
    fields: [payments.clientId],
    references: [users.id],
  }),
  freelancer: one(users, {
    fields: [payments.freelancerId],
    references: [users.id],
  }),
}));

// ========================================
// NOTIFICATIONS RELATIONS
// ========================================
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [notifications.jobId],
    references: [jobs.id],
  }),
}));

// ========================================
// RATINGS RELATIONS
// ========================================
export const ratingsRelations = relations(ratings, ({ one }) => ({
  order: one(jobs, {
    fields: [ratings.orderId],
    references: [jobs.id],
  }),
  rater: one(users, {
    fields: [ratings.raterId],
    references: [users.id],
    relationName: "ratings_raterId_users_id",
  }),
  ratedUser: one(users, {
    fields: [ratings.ratedUserId],
    references: [users.id],
    relationName: "ratings_ratedUserId_users_id",
  }),
}));

// ========================================
// MESSAGES RELATIONS
// ========================================
export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [messages.jobId],
    references: [jobs.id],
  }),
}));

// ========================================
// INVOICES RELATIONS
// ========================================
export const invoicesRelations = relations(invoices, ({ one }) => ({
  job: one(jobs, {
    fields: [invoices.jobId],
    references: [jobs.id],
  }),
  client: one(users, {
    fields: [invoices.clientId],
    references: [users.id],
  }),
  freelancer: one(users, {
    fields: [invoices.freelancerId],
    references: [users.id],
  }),
}));

// ========================================
// EMAIL LOGS RELATIONS
// ========================================
export const emailLogsRelations = relations(emailLogs, ({ one }) => ({
  user: one(users, {
    fields: [emailLogs.sentBy],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [emailLogs.jobId],
    references: [jobs.id],
  }),
}));

// ========================================
// JOB MESSAGES RELATIONS
// ========================================
export const jobMessagesRelations = relations(jobMessages, ({ one }) => ({
  job: one(jobs, {
    fields: [jobMessages.jobId],
    references: [jobs.id],
  }),
  sender: one(users, {
    fields: [jobMessages.senderId],
    references: [users.id],
  }),
}));

// ========================================
// REVISIONS RELATIONS
// ========================================
export const revisionsRelations = relations(revisions, ({ one }) => ({
  job: one(jobs, {
    fields: [revisions.jobId],
    references: [jobs.id],
  }),
  submitter: one(users, {
    fields: [revisions.submittedBy],
    references: [users.id],
  }),
}));

// ========================================
// ORDER FILES RELATIONS
// ========================================
export const orderFilesRelations = relations(orderFiles, ({ one }) => ({
  order: one(jobs, {
    fields: [orderFiles.orderId],
    references: [jobs.id],
  }),
  uploader: one(users, {
    fields: [orderFiles.uploadedBy],
    references: [users.id],
  }),
}));

// ========================================
// ORDER HISTORY RELATIONS
// ========================================
export const orderHistoryRelations = relations(orderHistory, ({ one }) => ({
  job: one(jobs, {
    fields: [orderHistory.jobId],
    references: [jobs.id],
  }),
  actor: one(users, {
    fields: [orderHistory.actorId],
    references: [users.id],
  }),
}));

// ========================================
// ORDER STATUS HISTORY RELATIONS
// ========================================
export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(jobs, {
    fields: [orderStatusHistory.orderId],
    references: [jobs.id],
  }),
  changedByUser: one(users, {
    fields: [orderStatusHistory.changedBy],
    references: [users.id],
  }),
}));

// ========================================
// BALANCES RELATIONS
// ========================================
export const balancesRelations = relations(balances, ({ one }) => ({
  user: one(users, {
    fields: [balances.userId],
    references: [users.id],
  }),
}));

// ========================================
// WRITER BALANCES RELATIONS
// ========================================
export const writerBalancesRelations = relations(writerBalances, ({ one }) => ({
  writer: one(users, {
    fields: [writerBalances.writerId],
    references: [users.id],
  }),
}));

// ========================================
// USER STATS RELATIONS
// ========================================
export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, {
    fields: [userStats.userId],
    references: [users.id],
  }),
}));

// ========================================
// MANAGERS RELATIONS
// ========================================
export const managersRelations = relations(managers, ({ one }) => ({
  user: one(users, {
    fields: [managers.userId],
    references: [users.id],
  }),
}));

// ========================================
// CLIENT MANAGER RELATIONS
// ========================================
export const clientManagerRelations = relations(clientManager, ({ one }) => ({
  client: one(users, {
    fields: [clientManager.clientId],
    references: [users.id],
  }),
  manager: one(users, {
    fields: [clientManager.managerId],
    references: [users.id],
  }),
}));

// ========================================
// MANAGER EARNINGS RELATIONS
// ========================================
export const managerEarningsRelations = relations(managerEarnings, ({ one }) => ({
  manager: one(users, {
    fields: [managerEarnings.managerId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [managerEarnings.jobId],
    references: [jobs.id],
  }),
}));

// ========================================
// INVITATIONS RELATIONS
// ========================================
export const invitationsRelations = relations(invitations, ({ one }) => ({
  creator: one(users, {
    fields: [invitations.createdByAdminId],
    references: [users.id],
  }),
}));

// ========================================
// CONVERSATIONS RELATIONS
// ========================================
export const conversationsRelations = relations(conversations, ({ one }) => ({
  participant1: one(users, {
    fields: [conversations.participant1Id],
    references: [users.id],
  }),
  participant2: one(users, {
    fields: [conversations.participant2Id],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [conversations.jobId],
    references: [jobs.id],
  }),
}));

// ========================================
// FREELANCER PROFILES RELATIONS
// ========================================
export const freelancerProfilesRelations = relations(freelancerProfiles, ({ one }) => ({
  user: one(users, {
    fields: [freelancerProfiles.userId],
    references: [users.id],
  }),
  currentTier: one(writerTiers, {
    fields: [freelancerProfiles.currentTierId],
    references: [writerTiers.id],
  }),
}));

// ========================================
// CLIENT PROFILES RELATIONS
// ========================================
export const clientProfilesRelations = relations(clientProfiles, ({ one }) => ({
  user: one(users, {
    fields: [clientProfiles.userId],
    references: [users.id],
  }),
}));

// ========================================
// EDITOR PROFILES RELATIONS
// ========================================
export const editorProfilesRelations = relations(editorProfiles, ({ one }) => ({
  user: one(users, {
    fields: [editorProfiles.userId],
    references: [users.id],
  }),
}));

// ========================================
// EDITOR ASSIGNMENTS RELATIONS
// ========================================
export const editorAssignmentsRelations = relations(editorAssignments, ({ one }) => ({
  editor: one(users, {
    fields: [editorAssignments.editorId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [editorAssignments.jobId],
    references: [jobs.id],
  }),
}));

// ========================================
// EDITOR FILES RELATIONS
// ========================================
export const editorFilesRelations = relations(editorFiles, ({ one }) => ({
  editor: one(users, {
    fields: [editorFiles.editorId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [editorFiles.jobId],
    references: [jobs.id],
  }),
}));

// ========================================
// EDITOR MESSAGES RELATIONS
// ========================================
export const editorMessagesRelations = relations(editorMessages, ({ one }) => ({
  sender: one(users, {
    fields: [editorMessages.senderId],
    references: [users.id],
  }),
  receiver: one(users, {
    fields: [editorMessages.receiverId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [editorMessages.jobId],
    references: [jobs.id],
  }),
}));

// ========================================
// EDITOR INTERNAL REVISIONS RELATIONS
// ========================================
export const editorInternalRevisionsRelations = relations(editorInternalRevisions, ({ one }) => ({
  editor: one(users, {
    fields: [editorInternalRevisions.editorId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [editorInternalRevisions.jobId],
    references: [jobs.id],
  }),
}));

// ========================================
// PAYMENT TRANSACTIONS RELATIONS
// ========================================
export const paymentTransactionsRelations = relations(paymentTransactions, ({ one }) => ({
  payment: one(payments, {
    fields: [paymentTransactions.paymentId],
    references: [payments.id],
  }),
  job: one(jobs, {
    fields: [paymentTransactions.jobId],
    references: [jobs.id],
  }),
  user: one(users, {
    fields: [paymentTransactions.userId],
    references: [users.id],
  }),
}));

// ========================================
// CLIENT FREELANCER HISTORY RELATIONS
// ========================================
export const clientFreelancerHistoryRelations = relations(clientFreelancerHistory, ({ one }) => ({
  client: one(users, {
    fields: [clientFreelancerHistory.clientId],
    references: [users.id],
  }),
  freelancer: one(users, {
    fields: [clientFreelancerHistory.freelancerId],
    references: [users.id],
  }),
}));

// ========================================
// ONLINE STATUS RELATIONS
// ========================================
export const freelancerOnlineStatusRelations = relations(freelancerOnlineStatus, ({ one }) => ({
  freelancer: one(users, {
    fields: [freelancerOnlineStatus.freelancerId],
    references: [users.id],
  }),
}));

export const managerOnlineStatusRelations = relations(managerOnlineStatus, ({ one }) => ({
  manager: one(users, {
    fields: [managerOnlineStatus.managerId],
    references: [users.id],
  }),
}));

export const clientOnlineStatusRelations = relations(clientOnlineStatus, ({ one }) => ({
  client: one(users, {
    fields: [clientOnlineStatus.clientId],
    references: [users.id],
  }),
}));

// ========================================
// FREELANCER CPP PROGRESS RELATIONS
// ========================================
export const freelancerCPPProgressRelations = relations(freelancerCPPProgress, ({ one }) => ({
  freelancer: one(users, {
    fields: [freelancerCPPProgress.freelancerId],
    references: [users.id],
  }),
}));

// ========================================
// SUBMISSIONS RELATIONS
// ========================================
export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  job: one(jobs, {
    fields: [submissions.jobId],
    references: [jobs.id],
  }),
  writer: one(users, {
    fields: [submissions.writerId],
    references: [users.id],
  }),
  files: many(submissionFiles),
}));

// ========================================
// SUBMISSION FILES RELATIONS
// ========================================
export const submissionFilesRelations = relations(submissionFiles, ({ one }) => ({
  submission: one(submissions, {
    fields: [submissionFiles.submissionId],
    references: [submissions.id],
  }),
}));

// ========================================
// CONTACT MESSAGES RELATIONS
// ========================================
export const contactMessagesRelations = relations(contactMessages, ({ one }) => ({
  resolver: one(users, {
    fields: [contactMessages.resolvedBy],
    references: [users.id],
  }),
}));

// ========================================
// ORDER AMOUNT ADJUSTMENTS RELATIONS
// ========================================
export const orderAmountAdjustmentsRelations = relations(orderAmountAdjustments, ({ one }) => ({
  job: one(jobs, {
    fields: [orderAmountAdjustments.jobId],
    references: [jobs.id],
  }),
  changedByUser: one(users, {
    fields: [orderAmountAdjustments.changedBy],
    references: [users.id],
  }),
}));

// ========================================
// FREELANCER SUBJECT MAP RELATIONS
// ========================================
export const freelancerSubjectMapRelations = relations(freelancerSubjectMap, ({ one }) => ({
  freelancer: one(users, {
    fields: [freelancerSubjectMap.freelancerId],
    references: [users.id],
  }),
  subject: one(freelancerSubjects, {
    fields: [freelancerSubjectMap.subjectId],
    references: [freelancerSubjects.id],
  }),
}));

// ========================================
// FREELANCER SOFTWARE MAP RELATIONS
// ========================================
export const freelancerSoftwareMapRelations = relations(freelancerSoftwareMap, ({ one }) => ({
  freelancer: one(users, {
    fields: [freelancerSoftwareMap.freelancerId],
    references: [users.id],
  }),
  software: one(freelancerSoftware, {
    fields: [freelancerSoftwareMap.softwareId],
    references: [freelancerSoftware.id],
  }),
}));

// ========================================
// FREELANCER SERVICES MAP RELATIONS
// ========================================
export const freelancerServicesMapRelations = relations(freelancerServicesMap, ({ one }) => ({
  freelancer: one(users, {
    fields: [freelancerServicesMap.freelancerId],
    references: [users.id],
  }),
  service: one(freelancerServices, {
    fields: [freelancerServicesMap.serviceId],
    references: [freelancerServices.id],
  }),
}));

// ========================================
// FREELANCER ORDER RESPONSES RELATIONS
// ========================================
export const freelancerOrderResponsesRelations = relations(freelancerOrderResponses, ({ one }) => ({
  freelancer: one(users, {
    fields: [freelancerOrderResponses.freelancerId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [freelancerOrderResponses.jobId],
    references: [jobs.id],
  }),
}));

// ========================================
// MEMOS RELATIONS
// ========================================
export const memosRelations = relations(memos, ({ one, many }) => ({
  creator: one(users, {
    fields: [memos.createdBy],
    references: [users.id],
  }),
  reads: many(memoReads),
}));

// ========================================
// MEMO READS RELATIONS
// ========================================
export const memoReadsRelations = relations(memoReads, ({ one }) => ({
  memo: one(memos, {
    fields: [memoReads.memoId],
    references: [memos.id],
  }),
  user: one(users, {
    fields: [memoReads.userId],
    references: [users.id],
  }),
}));

// ========================================
// MANAGER FREELANCERS RELATIONS
// ========================================
export const managerFreelancersRelations = relations(managerFreelancers, ({ one }) => ({
  manager: one(users, {
    fields: [managerFreelancers.managerId],
    references: [users.id],
  }),
  freelancer: one(users, {
    fields: [managerFreelancers.freelancerId],
    references: [users.id],
  }),
  assigner: one(users, {
    fields: [managerFreelancers.assignedBy],
    references: [users.id],
  }),
}));

// ========================================
// MANAGER CLIENTS RELATIONS
// ========================================
export const managerClientsRelations = relations(managerClients, ({ one }) => ({
  manager: one(users, {
    fields: [managerClients.managerId],
    references: [users.id],
  }),
  client: one(users, {
    fields: [managerClients.clientId],
    references: [users.id],
  }),
  assigner: one(users, {
    fields: [managerClients.assignedBy],
    references: [users.id],
  }),
}));

// ========================================
// INVOICE SETTLEMENTS RELATIONS
// ========================================
export const invoiceSettlementsRelations = relations(invoiceSettlements, ({ one, many }) => ({
  user: one(users, {
    fields: [invoiceSettlements.userId],
    references: [users.id],
  }),
  settler: one(users, {
    fields: [invoiceSettlements.settledBy],
    references: [users.id],
  }),
  orderSettlements: many(orderSettlements),
}));

// ========================================
// ORDER SETTLEMENTS RELATIONS
// ========================================
export const orderSettlementsRelations = relations(orderSettlements, ({ one }) => ({
  settlement: one(invoiceSettlements, {
    fields: [orderSettlements.settlementId],
    references: [invoiceSettlements.id],
  }),
  job: one(jobs, {
    fields: [orderSettlements.jobId],
    references: [jobs.id],
  }),
}));

// ========================================
// USER FINES RELATIONS
// ========================================
export const userFinesRelations = relations(userFines, ({ one }) => ({
  user: one(users, {
    fields: [userFines.userId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [userFines.jobId],
    references: [jobs.id],
  }),
  issuer: one(users, {
    fields: [userFines.issuedBy],
    references: [users.id],
  }),
}));

// ========================================
// ORDER ADDITIONAL PAYMENTS RELATIONS
// ========================================
export const orderAdditionalPaymentsRelations = relations(orderAdditionalPayments, ({ one }) => ({
  job: one(jobs, {
    fields: [orderAdditionalPayments.jobId],
    references: [jobs.id],
  }),
  recipient: one(users, {
    fields: [orderAdditionalPayments.recipientId],
    references: [users.id],
  }),
  addedByUser: one(users, {
    fields: [orderAdditionalPayments.addedBy],
    references: [users.id],
  }),
}));

// ========================================
// USER BALANCE HISTORY RELATIONS
// ========================================
export const userBalanceHistoryRelations = relations(userBalanceHistory, ({ one }) => ({
  user: one(users, {
    fields: [userBalanceHistory.userId],
    references: [users.id],
  }),
  changedByUser: one(users, {
    fields: [userBalanceHistory.changedBy],
    references: [users.id],
  }),
}));

// ========================================
// INTERNAL REVISIONS RELATIONS
// ========================================
export const internalRevisionsRelations = relations(internalRevisions, ({ one }) => ({
  order: one(jobs, {
    fields: [internalRevisions.orderId],
    references: [jobs.id],
  }),
  requester: one(users, {
    fields: [internalRevisions.requestedBy],
    references: [users.id],
  }),
  assignee: one(users, {
    fields: [internalRevisions.assignedTo],
    references: [users.id],
  }),
}));

// ========================================
// ADJUSTMENTS RELATIONS
// ========================================
export const adjustmentsRelations = relations(adjustments, ({ one }) => ({
  order: one(jobs, {
    fields: [adjustments.orderId],
    references: [jobs.id],
  }),
  user: one(users, {
    fields: [adjustments.userId],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [adjustments.createdBy],
    references: [users.id],
  }),
}));

// ========================================
// BALANCE LEDGER RELATIONS
// ========================================
export const balanceLedgerRelations = relations(balanceLedger, ({ one }) => ({
  user: one(users, {
    fields: [balanceLedger.userId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [balanceLedger.jobId],
    references: [jobs.id],
  }),
}));

// ========================================
// SYSTEM LOGS RELATIONS
// ========================================
export const systemLogsRelations = relations(systemLogs, ({ one }) => ({
  user: one(users, {
    fields: [systemLogs.userId],
    references: [users.id],
  }),
}));

// ========================================
// BADGES RELATIONS
// ========================================
export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
}));

// ========================================
// USER BADGES RELATIONS
// ========================================
export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
  awarder: one(users, {
    fields: [userBadges.awardedBy],
    references: [users.id],
  }),
}));

// ========================================
// PAYOUT REQUESTS RELATIONS
// ========================================
export const payoutRequestsRelations = relations(payoutRequests, ({ one }) => ({
  writer: one(users, {
    fields: [payoutRequests.writerId],
    references: [users.id],
  }),
  processor: one(users, {
    fields: [payoutRequests.processedBy],
    references: [users.id],
  }),
}));

// ========================================
// ADMIN AUDIT LOGS RELATIONS
// ========================================
export const adminAuditLogsRelations = relations(adminAuditLogs, ({ one }) => ({
  admin: one(users, {
    fields: [adminAuditLogs.adminId],
    references: [users.id],
  }),
}));

// ========================================
// AUDIT LOGS RELATIONS
// ========================================
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [auditLogs.resourceId],
    references: [jobs.id],
  }),
}));

// ========================================
// USER CATEGORIES RELATIONS
// ========================================
export const userCategoriesRelations = relations(userCategories, ({ one }) => ({
  user: one(users, {
    fields: [userCategories.userId],
    references: [users.id],
  }),
  assigner: one(users, {
    fields: [userCategories.assignedBy],
    references: [users.id],
  }),
}));

// ========================================
// PASSWORD RESET TOKENS RELATIONS
// ========================================
export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

// ========================================
// EMAIL VERIFICATION CODES RELATIONS
// ========================================
export const emailVerificationCodesRelations = relations(emailVerificationCodes, ({ one }) => ({
  user: one(users, {
    fields: [emailVerificationCodes.userId],
    references: [users.id],
  }),
}));

// ========================================
// PENDING REGISTRATIONS RELATIONS
// ========================================
export const pendingRegistrationsRelations = relations(pendingRegistrations, ({ one }) => ({
  domain: one(domains, {
    fields: [pendingRegistrations.domainId],
    references: [domains.id],
  }),
}));

// ========================================
// PAYMENT REQUESTS RELATIONS
// ========================================
export const paymentRequestsRelations = relations(paymentRequests, ({ one }) => ({
  client: one(users, {
    fields: [paymentRequests.clientId],
    references: [users.id],
  }),
  confirmer: one(users, {
    fields: [paymentRequests.confirmedBy],
    references: [users.id],
  }),
}));

// ========================================
// EMAIL NOTIFICATIONS RELATIONS
// ========================================
export const emailNotificationsRelations = relations(emailNotifications, ({ one }) => ({
  job: one(jobs, {
    fields: [emailNotifications.jobId],
    references: [jobs.id],
  }),
}));

// ========================================
// JOB STATUS LOGS RELATIONS
// ========================================
export const jobStatusLogsRelations = relations(jobStatusLogs, ({ one }) => ({
  job: one(jobs, {
    fields: [jobStatusLogs.jobId],
    references: [jobs.id],
  }),
  changer: one(users, {
    fields: [jobStatusLogs.changedBy],
    references: [users.id],
  }),
}));

// ========================================
// MANAGER INVITATIONS RELATIONS
// ========================================
export const managerInvitationsRelations = relations(managerInvitations, ({ one }) => ({
  creator: one(users, {
    fields: [managerInvitations.createdBy],
    references: [users.id],
  }),
}));

// ========================================
// BILLING INVOICES RELATIONS
// ========================================
export const billingInvoicesRelations = relations(billingInvoices, ({ one, many }) => ({
  recipient: one(users, {
    fields: [billingInvoices.recipientId],
    references: [users.id],
  }),
  sender: one(users, {
    fields: [billingInvoices.sentBy],
    references: [users.id],
  }),
  confirmer: one(users, {
    fields: [billingInvoices.confirmedBy],
    references: [users.id],
  }),
  items: many(billingInvoiceItems),
}));

// ========================================
// BILLING INVOICE ITEMS RELATIONS
// ========================================
export const billingInvoiceItemsRelations = relations(billingInvoiceItems, ({ one }) => ({
  invoice: one(billingInvoices, {
    fields: [billingInvoiceItems.invoiceId],
    references: [billingInvoices.id],
  }),
  job: one(jobs, {
    fields: [billingInvoiceItems.jobId],
    references: [jobs.id],
  }),
}));

// ========================================
// JOB ATTACHMENTS RELATIONS
// ========================================
export const jobAttachmentsRelations = relations(jobAttachments, ({ one }) => ({
  job: one(jobs, {
    fields: [jobAttachments.jobId],
    references: [jobs.id],
  }),
  uploader: one(users, {
    fields: [jobAttachments.uploadedBy],
    references: [users.id],
  }),
}));

// ========================================
// DOCUMENT PREVIEWS RELATIONS
// ========================================
export const documentPreviewsRelations = relations(documentPreviews, ({ one }) => ({
  order: one(jobs, {
    fields: [documentPreviews.orderId],
    references: [jobs.id],
  }),
  user: one(users, {
    fields: [documentPreviews.userId],
    references: [users.id],
  }),
}));

// ========================================
// FILE UPLOAD AUDIT LOG RELATIONS
// ========================================
export const fileUploadAuditLogRelations = relations(fileUploadAuditLog, ({ one }) => ({
  order: one(jobs, {
    fields: [fileUploadAuditLog.orderId],
    references: [jobs.id],
  }),
  uploader: one(users, {
    fields: [fileUploadAuditLog.uploaderId],
    references: [users.id],
  }),
}));

// ========================================
// ORDER SUBMISSIONS RELATIONS
// ========================================
export const orderSubmissionsRelations = relations(orderSubmissions, ({ one }) => ({
  order: one(jobs, {
    fields: [orderSubmissions.orderId],
    references: [jobs.id],
  }),
  freelancer: one(users, {
    fields: [orderSubmissions.freelancerId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [orderSubmissions.reviewedBy],
    references: [users.id],
  }),
}));

// ========================================
// SETTINGS HISTORY RELATIONS
// ========================================
export const settingsHistoryRelations = relations(settingsHistory, ({ one }) => ({
  changer: one(users, {
    fields: [settingsHistory.changedBy],
    references: [users.id],
  }),
}));

// ========================================
// ORDER TIMELINE EVENTS RELATIONS
// ========================================
export const orderTimelineEventsRelations = relations(orderTimelineEvents, ({ one }) => ({
  order: one(jobs, {
    fields: [orderTimelineEvents.orderId],
    references: [jobs.id],
  }),
  actor: one(users, {
    fields: [orderTimelineEvents.actorId],
    references: [users.id],
  }),
}));

// ========================================
// ORDER CHAT MESSAGES RELATIONS
// ========================================
export const orderChatMessagesRelations = relations(orderChatMessages, ({ one }) => ({
  order: one(jobs, {
    fields: [orderChatMessages.orderId],
    references: [jobs.id],
  }),
  sender: one(users, {
    fields: [orderChatMessages.senderId],
    references: [users.id],
  }),
}));

// ========================================
// SYSTEM SETTINGS RELATIONS
// ========================================
export const systemSettingsRelations = relations(systemSettings, ({ one }) => ({
  updater: one(users, {
    fields: [systemSettings.updatedBy],
    references: [users.id],
  }),
}));

// ========================================
// PRICING MINIMUMS RELATIONS
// ========================================
export const pricingMinimumsRelations = relations(pricingMinimums, () => ({}));

// ========================================
// FREELANCER CPP LEVELS RELATIONS
// ========================================
export const freelancerCPPLevelsRelations = relations(freelancerCPPLevels, () => ({}));

// ========================================
// WRITER TIERS RELATIONS
// ========================================
export const writerTiersRelations = relations(writerTiers, ({ many }) => ({
  freelancerProfiles: many(freelancerProfiles),
}));

// ========================================
// ROLES RELATIONS
// ========================================
export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

// ========================================
// DOMAINS RELATIONS
// ========================================
export const domainsRelations = relations(domains, ({ many }) => ({
  users: many(users),
}));

// ========================================
// ACCOUNTS RELATIONS
// ========================================
export const accountsRelations = relations(accounts, ({ many }) => ({
  users: many(users),
}));

// ========================================
// FREELANCER SUBJECTS RELATIONS
// ========================================
export const freelancerSubjectsRelations = relations(freelancerSubjects, ({ many }) => ({
  maps: many(freelancerSubjectMap),
}));

// ========================================
// FREELANCER SOFTWARE RELATIONS
// ========================================
export const freelancerSoftwareRelations = relations(freelancerSoftware, ({ many }) => ({
  maps: many(freelancerSoftwareMap),
}));

// ========================================
// FREELANCER SERVICES RELATIONS
// ========================================
export const freelancerServicesRelations = relations(freelancerServices, ({ many }) => ({
  maps: many(freelancerServicesMap),
}));

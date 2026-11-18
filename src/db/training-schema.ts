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
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users, payments } from './schema';

// ========================================
// 1. TRAINING CATEGORIES
// ========================================
export const trainingCategories = pgTable('training_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  icon: varchar('icon', { length: 100 }).default('GraduationCap'),
  orderIndex: integer('order_index').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('training_cat_slug_idx').on(table.slug),
]);

// ========================================
// 2. TRAINING TRAINERS
// ========================================
export const trainingTrainers = pgTable('training_trainers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  expertise: jsonb('expertise').$type<string[]>().default([]),
  linkedinUrl: varchar('linkedin_url', { length: 255 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('training_trainers_email_idx').on(table.email),
]);

// ========================================
// 3. TRAINING COURSES
// ========================================
export const trainingCourses = pgTable('training_courses', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  shortDescription: text('short_description'),
  description: text('description').notNull(),
  categoryId: integer('category_id').references(() => trainingCategories.id, { onDelete: 'set null' }),
  level: varchar('level', { length: 50 }).notNull().default('all_levels'), // beginner | intermediate | advanced | all_levels
  durationDays: integer('duration_days').notNull().default(5),
  dailyDurationHours: varchar('daily_duration_hours', { length: 50 }).notNull().default('2–3 hours'),
  targetAudience: text('target_audience').notNull(),
  learningOutcomes: jsonb('learning_outcomes').$type<string[]>().notNull().default([]),
  curriculumOutline: jsonb('curriculum_outline').$type<any[]>().default([]),
  prerequisites: jsonb('prerequisites').$type<string[]>().default([]),
  thumbnailUrl: text('thumbnail_url'),
  bannerUrl: text('banner_url'),
  isPublished: boolean('is_published').notNull().default(true),
  isFeatured: boolean('is_featured').notNull().default(false),
  isArchived: boolean('is_archived').notNull().default(false),
  standardPrice: decimal('standard_price', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  earlyBirdPrice: decimal('early_bird_price', { precision: 12, scale: 2, mode: 'number' }),
  promotionalPrice: decimal('promotional_price', { precision: 12, scale: 2, mode: 'number' }),
  currency: varchar('currency', { length: 10 }).notNull().default('KES'),
  minCompletionPercentage: integer('min_completion_percentage').notNull().default(80),
  requiresAssessment: boolean('requires_assessment').notNull().default(true),
  certificateEnabled: boolean('certificate_enabled').notNull().default(true),
  maxCapacity: integer('max_capacity').notNull().default(50),
  minCapacity: integer('min_capacity').notNull().default(5),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('training_courses_slug_idx').on(table.slug),
  index('training_courses_cat_idx').on(table.categoryId),
  index('training_courses_published_idx').on(table.isPublished),
]);

// ========================================
// 4. TRAINING COHORTS
// ========================================
export const trainingCohorts = pgTable('training_cohorts', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').notNull().references(() => trainingCourses.id, { onDelete: 'cascade' }),
  cohortCode: varchar('cohort_code', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  startDate: timestamp('start_date', { mode: 'string' }).notNull(),
  endDate: timestamp('end_date', { mode: 'string' }).notNull(),
  registrationOpensAt: timestamp('registration_opens_at', { mode: 'string' }).notNull(),
  registrationClosesAt: timestamp('registration_closes_at', { mode: 'string' }).notNull(),
  capacity: integer('capacity').notNull().default(50),
  enrolledCount: integer('enrolled_count').notNull().default(0),
  status: varchar('status', { length: 50 }).notNull().default('registration_open'), // upcoming | registration_open | registration_closed | in_progress | completed | cancelled
  trainerId: integer('trainer_id').references(() => trainingTrainers.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('training_cohorts_course_idx').on(table.courseId),
  index('training_cohorts_status_idx').on(table.status),
  index('training_cohorts_start_idx').on(table.startDate),
]);

// ========================================
// 5. TRAINING MODULES
// ========================================
export const trainingModules = pgTable('training_modules', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').notNull().references(() => trainingCourses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  dayNumber: integer('day_number'),
  orderIndex: integer('order_index').notNull().default(0),
  isPublished: boolean('is_published').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('training_modules_course_idx').on(table.courseId),
  index('training_modules_order_idx').on(table.orderIndex),
]);

// ========================================
// 6. TRAINING LESSONS
// ========================================
export const trainingLessons = pgTable('training_lessons', {
  id: serial('id').primaryKey(),
  moduleId: integer('module_id').notNull().references(() => trainingModules.id, { onDelete: 'cascade' }),
  courseId: integer('course_id').notNull().references(() => trainingCourses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  description: text('description'),
  content: text('content'),
  orderIndex: integer('order_index').notNull().default(0),
  lessonType: varchar('lesson_type', { length: 50 }).notNull().default('video'), // video | live_session | reading | assessment | mixed
  durationMinutes: integer('duration_minutes').notNull().default(60),
  isFreePreview: boolean('is_free_preview').notNull().default(false),
  isReleased: boolean('is_released').notNull().default(false),
  releaseType: varchar('release_type', { length: 50 }).notNull().default('immediate'), // immediate | scheduled | prerequisite | manual
  scheduledReleaseAt: timestamp('scheduled_release_at', { mode: 'string' }),
  prerequisiteLessonId: integer('prerequisite_lesson_id'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('training_lessons_mod_idx').on(table.moduleId),
  index('training_lessons_course_idx').on(table.courseId),
  index('training_lessons_released_idx').on(table.isReleased),
]);

// ========================================
// 7. TRAINING SESSIONS (Live & Scheduled)
// ========================================
export const trainingSessions = pgTable('training_sessions', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').notNull().references(() => trainingCourses.id, { onDelete: 'cascade' }),
  cohortId: integer('cohort_id').notNull().references(() => trainingCohorts.id, { onDelete: 'cascade' }),
  lessonId: integer('lesson_id').references(() => trainingLessons.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  dayNumber: integer('day_number'),
  sessionDate: timestamp('session_date', { mode: 'string' }).notNull(),
  startTime: varchar('start_time', { length: 20 }).notNull().default('18:00'),
  endTime: varchar('end_time', { length: 20 }).notNull().default('20:30'),
  trainerId: integer('trainer_id').references(() => trainingTrainers.id, { onDelete: 'set null' }),
  meetingProvider: varchar('meeting_provider', { length: 50 }).notNull().default('manual'), // google_meet | zoom | teams | manual
  meetingUrl: text('meeting_url'),
  meetingId: varchar('meeting_id', { length: 255 }),
  meetingPassword: varchar('meeting_password', { length: 255 }),
  recordingStatus: varchar('recording_status', { length: 50 }).notNull().default('none'), // none | scheduled | processing | available
  recordingUrl: text('recording_url'),
  status: varchar('status', { length: 50 }).notNull().default('scheduled'), // scheduled | live | completed | cancelled
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('training_sessions_course_idx').on(table.courseId),
  index('training_sessions_cohort_idx').on(table.cohortId),
  index('training_sessions_date_idx').on(table.sessionDate),
]);

// ========================================
// 8. TRAINING VIDEOS (YouTube & TaskLynk-hosted)
// ========================================
export const trainingVideos = pgTable('training_videos', {
  id: serial('id').primaryKey(),
  lessonId: integer('lesson_id').references(() => trainingLessons.id, { onDelete: 'set null' }),
  courseId: integer('course_id').notNull().references(() => trainingCourses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 50 }).notNull().default('youtube'), // youtube | tasklynk_hosted | cloudflare_stream | bunny_stream
  videoUrl: text('video_url').notNull(),
  externalVideoId: varchar('external_video_id', { length: 255 }),
  durationSeconds: integer('duration_seconds').notNull().default(0),
  thumbnailUrl: text('thumbnail_url'),
  playbackQuality: jsonb('playback_quality'),
  captionsUrl: text('captions_url'),
  status: varchar('status', { length: 50 }).notNull().default('ready'), // uploading | processing | ready | failed
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('training_videos_lesson_idx').on(table.lessonId),
  index('training_videos_course_idx').on(table.courseId),
]);

// ========================================
// 9. TRAINING RECORDINGS
// ========================================
export const trainingRecordings = pgTable('training_recordings', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').notNull().references(() => trainingSessions.id, { onDelete: 'cascade' }),
  cohortId: integer('cohort_id').notNull().references(() => trainingCohorts.id, { onDelete: 'cascade' }),
  courseId: integer('course_id').notNull().references(() => trainingCourses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  videoUrl: text('video_url').notNull(),
  provider: varchar('provider', { length: 50 }).notNull().default('youtube'),
  durationSeconds: integer('duration_seconds').notNull().default(0),
  isPublished: boolean('is_published').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('training_rec_session_idx').on(table.sessionId),
  index('training_rec_cohort_idx').on(table.cohortId),
]);

// ========================================
// 10. TRAINING MATERIALS & RESOURCES
// ========================================
export const trainingMaterials = pgTable('training_materials', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').notNull().references(() => trainingCourses.id, { onDelete: 'cascade' }),
  moduleId: integer('module_id').references(() => trainingModules.id, { onDelete: 'set null' }),
  lessonId: integer('lesson_id').references(() => trainingLessons.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }).notNull(),
  materialType: varchar('material_type', { length: 50 }).notNull().default('pdf'), // pdf | document | spreadsheet | slide | link | zip
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size'),
  orderIndex: integer('order_index').notNull().default(0),
  isDownloadable: boolean('is_downloadable').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('training_mat_course_idx').on(table.courseId),
  index('training_mat_lesson_idx').on(table.lessonId),
]);

// ========================================
// 11. TRAINING DISCOUNTS & COUPONS
// ========================================
export const trainingDiscounts = pgTable('training_discounts', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  discountType: varchar('discount_type', { length: 50 }).notNull().default('percentage'), // percentage | fixed
  amount: decimal('amount', { precision: 10, scale: 2, mode: 'number' }).notNull(),
  courseId: integer('course_id').references(() => trainingCourses.id, { onDelete: 'set null' }),
  maxUses: integer('max_uses'),
  usedCount: integer('used_count').notNull().default(0),
  validFrom: timestamp('valid_from', { mode: 'string' }),
  validUntil: timestamp('valid_until', { mode: 'string' }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('training_discounts_code_idx').on(table.code),
]);

// ========================================
// 12. TRAINING BOOKINGS
// ========================================
export const trainingBookings = pgTable('training_bookings', {
  id: serial('id').primaryKey(),
  bookingReference: varchar('booking_reference', { length: 100 }).notNull().unique(), // TLK-TRN-YYYYMMDD-XXXX
  courseId: integer('course_id').notNull().references(() => trainingCourses.id, { onDelete: 'cascade' }),
  cohortId: integer('cohort_id').notNull().references(() => trainingCohorts.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  organization: varchar('organization', { length: 255 }),
  jobTitle: varchar('job_title', { length: 255 }),
  registrationType: varchar('registration_type', { length: 50 }).notNull().default('individual'), // individual | group | sponsored | complimentary
  groupSize: integer('group_size').notNull().default(1),
  agreedPrice: decimal('agreed_price', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  discountCode: varchar('discount_code', { length: 50 }),
  discountAmount: decimal('discount_amount', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  amountPaid: decimal('amount_paid', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  currency: varchar('currency', { length: 10 }).notNull().default('KES'),
  bookingStatus: varchar('booking_status', { length: 50 }).notNull().default('pending'), // pending | confirmed | cancelled | waitlisted | refunded
  paymentStatus: varchar('payment_status', { length: 50 }).notNull().default('unpaid'), // unpaid | initiated | paid | complimentary | sponsored | refunded
  paymentMethod: varchar('payment_method', { length: 50 }).notNull().default('mpesa'), // mpesa | complimentary | sponsored | manual_admin
  paymentId: integer('payment_id').references(() => payments.id, { onDelete: 'set null' }),
  confirmedAt: timestamp('confirmed_at', { mode: 'string' }),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('training_bookings_ref_idx').on(table.bookingReference),
  index('training_bookings_course_idx').on(table.courseId),
  index('training_bookings_cohort_idx').on(table.cohortId),
  index('training_bookings_user_idx').on(table.userId),
  index('training_bookings_email_idx').on(table.email),
  index('training_bookings_status_idx').on(table.bookingStatus),
]);

// ========================================
// 13. TRAINING ENROLLMENTS (Learner Course Access)
// ========================================
export const trainingEnrollments = pgTable('training_enrollments', {
  id: serial('id').primaryKey(),
  bookingId: integer('booking_id').notNull().references(() => trainingBookings.id, { onDelete: 'cascade' }),
  courseId: integer('course_id').notNull().references(() => trainingCourses.id, { onDelete: 'cascade' }),
  cohortId: integer('cohort_id').notNull().references(() => trainingCohorts.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessStatus: varchar('access_status', { length: 50 }).notNull().default('active'), // active | suspended | completed | revoked
  enrolledAt: timestamp('enrolled_at', { mode: 'string' }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { mode: 'string' }),
  progressPercentage: decimal('progress_percentage', { precision: 5, scale: 2, mode: 'number' }).notNull().default(0),
  isCertificateIssued: boolean('is_certificate_issued').notNull().default(false),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('training_enroll_user_cohort_idx').on(table.userId, table.cohortId),
  index('training_enroll_user_idx').on(table.userId),
  index('training_enroll_course_idx').on(table.courseId),
  index('training_enroll_status_idx').on(table.accessStatus),
]);

// ========================================
// 14. TRAINING PAYMENTS
// ========================================
export const trainingPayments = pgTable('training_payments', {
  id: serial('id').primaryKey(),
  bookingId: integer('booking_id').notNull().references(() => trainingBookings.id, { onDelete: 'cascade' }),
  paymentId: integer('payment_id').references(() => payments.id, { onDelete: 'set null' }),
  amount: decimal('amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('KES'),
  phoneNumber: varchar('phone_number', { length: 50 }).notNull(),
  checkoutRequestId: varchar('checkout_request_id', { length: 255 }),
  merchantRequestId: varchar('merchant_request_id', { length: 255 }),
  mpesaReceipt: varchar('mpesa_receipt', { length: 255 }),
  paymentStatus: varchar('payment_status', { length: 50 }).notNull().default('pending'), // pending | completed | failed
  rawCallback: jsonb('raw_callback'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('training_pay_booking_idx').on(table.bookingId),
  index('training_pay_checkout_idx').on(table.checkoutRequestId),
  index('training_pay_receipt_idx').on(table.mpesaReceipt),
]);

// ========================================
// 15. TRAINING VIDEO PROGRESS (Persistent Playback)
// ========================================
export const trainingVideoProgress = pgTable('training_video_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: integer('course_id').notNull().references(() => trainingCourses.id, { onDelete: 'cascade' }),
  lessonId: integer('lesson_id').notNull().references(() => trainingLessons.id, { onDelete: 'cascade' }),
  videoId: integer('video_id').notNull().references(() => trainingVideos.id, { onDelete: 'cascade' }),
  lastPositionSeconds: decimal('last_position_seconds', { precision: 10, scale: 2, mode: 'number' }).notNull().default(0),
  watchedDurationSeconds: decimal('watched_duration_seconds', { precision: 10, scale: 2, mode: 'number' }).notNull().default(0),
  totalDurationSeconds: decimal('total_duration_seconds', { precision: 10, scale: 2, mode: 'number' }).notNull().default(0),
  percentageWatched: decimal('percentage_watched', { precision: 5, scale: 2, mode: 'number' }).notNull().default(0),
  isCompleted: boolean('is_completed').notNull().default(false),
  completedAt: timestamp('completed_at', { mode: 'string' }),
  lastHeartbeatAt: timestamp('last_heartbeat_at', { mode: 'string' }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('training_vid_prog_user_video_idx').on(table.userId, table.videoId),
  index('training_vid_prog_user_idx').on(table.userId),
  index('training_vid_prog_lesson_idx').on(table.lessonId),
]);

// ========================================
// 16. TRAINING LESSON PROGRESS
// ========================================
export const trainingLessonProgress = pgTable('training_lesson_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: integer('course_id').notNull().references(() => trainingCourses.id, { onDelete: 'cascade' }),
  moduleId: integer('module_id').notNull().references(() => trainingModules.id, { onDelete: 'cascade' }),
  lessonId: integer('lesson_id').notNull().references(() => trainingLessons.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).notNull().default('not_started'), // not_started | in_progress | completed
  timeSpentSeconds: integer('time_spent_seconds').notNull().default(0),
  completedAt: timestamp('completed_at', { mode: 'string' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('training_les_prog_user_lesson_idx').on(table.userId, table.lessonId),
  index('training_les_prog_user_idx').on(table.userId),
  index('training_les_prog_course_idx').on(table.courseId),
]);

// ========================================
// 17. TRAINING COURSE PROGRESS (Aggregate)
// ========================================
export const trainingCourseProgress = pgTable('training_course_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: integer('course_id').notNull().references(() => trainingCourses.id, { onDelete: 'cascade' }),
  cohortId: integer('cohort_id').notNull().references(() => trainingCohorts.id, { onDelete: 'cascade' }),
  completedLessonsCount: integer('completed_lessons_count').notNull().default(0),
  totalLessonsCount: integer('total_lessons_count').notNull().default(0),
  progressPercentage: decimal('progress_percentage', { precision: 5, scale: 2, mode: 'number' }).notNull().default(0),
  totalTimeSpentSeconds: integer('total_time_spent_seconds').notNull().default(0),
  lastAccessedLessonId: integer('last_accessed_lesson_id'),
  lastAccessedAt: timestamp('last_accessed_at', { mode: 'string' }).notNull().defaultNow(),
  isEligibleForCertificate: boolean('is_eligible_for_certificate').notNull().default(false),
  isCompleted: boolean('is_completed').notNull().default(false),
  completedAt: timestamp('completed_at', { mode: 'string' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('training_crs_prog_user_cohort_idx').on(table.userId, table.cohortId),
  index('training_crs_prog_user_idx').on(table.userId),
  index('training_crs_prog_course_idx').on(table.courseId),
]);

// ========================================
// 18. TRAINING LEARNING ACTIVITY (Audit Trail)
// ========================================
export const trainingLearningActivity = pgTable('training_learning_activity', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: integer('course_id').notNull().references(() => trainingCourses.id, { onDelete: 'cascade' }),
  lessonId: integer('lesson_id'),
  activityType: varchar('activity_type', { length: 100 }).notNull(), // video_play | video_pause | video_seek | lesson_view | lesson_complete | quiz_attempt | assignment_submit
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('training_act_user_idx').on(table.userId),
  index('training_act_course_idx').on(table.courseId),
  index('training_act_type_idx').on(table.activityType),
]);

// ========================================
// 19. TRAINING ASSESSMENTS (Quizzes / Exams)
// ========================================
export const trainingAssessments = pgTable('training_assessments', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').notNull().references(() => trainingCourses.id, { onDelete: 'cascade' }),
  moduleId: integer('module_id').references(() => trainingModules.id, { onDelete: 'set null' }),
  lessonId: integer('lesson_id').references(() => trainingLessons.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  assessmentType: varchar('assessment_type', { length: 50 }).notNull().default('quiz'), // quiz | practical_assignment | final_exam
  passingScore: integer('passing_score').notNull().default(70),
  totalQuestions: integer('total_questions').notNull().default(0),
  questionsData: jsonb('questions_data').$type<any[]>().default([]),
  dueDay: integer('due_day'),
  isMandatory: boolean('is_mandatory').notNull().default(true),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('training_assess_course_idx').on(table.courseId),
]);

// ========================================
// 20. TRAINING ASSIGNMENTS (Practical Work)
// ========================================
export const trainingAssignments = pgTable('training_assignments', {
  id: serial('id').primaryKey(),
  assessmentId: integer('assessment_id').references(() => trainingAssessments.id, { onDelete: 'cascade' }),
  courseId: integer('course_id').notNull().references(() => trainingCourses.id, { onDelete: 'cascade' }),
  lessonId: integer('lesson_id').references(() => trainingLessons.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }).notNull(),
  instructions: text('instructions').notNull(),
  attachmentUrl: text('attachment_url'),
  maxScore: integer('max_score').notNull().default(100),
  dueDate: timestamp('due_date', { mode: 'string' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('training_assign_course_idx').on(table.courseId),
]);

// ========================================
// 21. TRAINING SUBMISSIONS
// ========================================
export const trainingSubmissions = pgTable('training_submissions', {
  id: serial('id').primaryKey(),
  assignmentId: integer('assignment_id').references(() => trainingAssignments.id, { onDelete: 'cascade' }),
  assessmentId: integer('assessment_id').references(() => trainingAssessments.id, { onDelete: 'cascade' }),
  courseId: integer('course_id').notNull().references(() => trainingCourses.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  submissionText: text('submission_text'),
  fileUrl: text('file_url'),
  fileName: varchar('file_name', { length: 255 }),
  fileSize: integer('file_size'),
  status: varchar('status', { length: 50 }).notNull().default('submitted'), // submitted | graded | revision_requested
  score: decimal('score', { precision: 5, scale: 2, mode: 'number' }),
  feedback: text('feedback'),
  gradedBy: integer('graded_by').references(() => users.id, { onDelete: 'set null' }),
  gradedAt: timestamp('graded_at', { mode: 'string' }),
  submittedAt: timestamp('submitted_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('training_sub_assign_idx').on(table.assignmentId),
  index('training_sub_user_idx').on(table.userId),
]);

// ========================================
// 22. TRAINING RESULTS (Quiz Scores)
// ========================================
export const trainingResults = pgTable('training_results', {
  id: serial('id').primaryKey(),
  assessmentId: integer('assessment_id').notNull().references(() => trainingAssessments.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: integer('course_id').notNull().references(() => trainingCourses.id, { onDelete: 'cascade' }),
  score: decimal('score', { precision: 5, scale: 2, mode: 'number' }).notNull(),
  totalScore: decimal('total_score', { precision: 5, scale: 2, mode: 'number' }).notNull(),
  percentage: decimal('percentage', { precision: 5, scale: 2, mode: 'number' }).notNull(),
  passed: boolean('passed').notNull(),
  answersData: jsonb('answers_data'),
  attemptNumber: integer('attempt_number').notNull().default(1),
  completedAt: timestamp('completed_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('training_results_user_idx').on(table.userId),
  index('training_results_assess_idx').on(table.assessmentId),
]);

// ========================================
// 23. TRAINING ATTENDANCE
// ========================================
export const trainingAttendance = pgTable('training_attendance', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').notNull().references(() => trainingSessions.id, { onDelete: 'cascade' }),
  cohortId: integer('cohort_id').notNull().references(() => trainingCohorts.id, { onDelete: 'cascade' }),
  courseId: integer('course_id').notNull().references(() => trainingCourses.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).notNull().default('present'), // present | absent | excused | late
  joinedAt: timestamp('joined_at', { mode: 'string' }),
  leftAt: timestamp('left_at', { mode: 'string' }),
  durationMinutes: integer('duration_minutes').notNull().default(0),
  markedBy: integer('marked_by').references(() => users.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('training_att_user_session_idx').on(table.userId, table.sessionId),
  index('training_att_session_idx').on(table.sessionId),
  index('training_att_user_idx').on(table.userId),
]);

// ========================================
// 24. TRAINING CERTIFICATES
// ========================================
export const trainingCertificates = pgTable('training_certificates', {
  id: serial('id').primaryKey(),
  certificateNumber: varchar('certificate_number', { length: 100 }).notNull().unique(), // TLK-CERT-YYYY-XXXXXX
  courseId: integer('course_id').notNull().references(() => trainingCourses.id, { onDelete: 'cascade' }),
  cohortId: integer('cohort_id').notNull().references(() => trainingCohorts.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  enrollmentId: integer('enrollment_id').notNull().references(() => trainingEnrollments.id, { onDelete: 'cascade' }),
  learnerName: varchar('learner_name', { length: 255 }).notNull(),
  courseName: varchar('course_name', { length: 255 }).notNull(),
  completionDate: timestamp('completion_date', { mode: 'string' }).notNull(),
  issuingOrganization: varchar('issuing_organization', { length: 255 }).notNull().default('TaskLynk Training Academy'),
  authorizedSignatory: varchar('authorized_signatory', { length: 255 }).notNull().default('Dr. David Mwangi'),
  signatoryTitle: varchar('signatory_title', { length: 255 }).notNull().default('Director of Academic Affairs, TaskLynk Academy'),
  verificationUrl: varchar('verification_url', { length: 255 }).notNull(),
  qrCodeData: text('qr_code_data'),
  pdfUrl: text('pdf_url'),
  isRevoked: boolean('is_revoked').notNull().default(false),
  revocationReason: text('revocation_reason'),
  issuedAt: timestamp('issued_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('training_cert_number_idx').on(table.certificateNumber),
  index('training_cert_user_idx').on(table.userId),
  index('training_cert_course_idx').on(table.courseId),
]);

// ========================================
// 25. TRAINING AUDIT LOGS
// ========================================
export const trainingAuditLogs = pgTable('training_audit_logs', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id'),
  userId: integer('user_id'),
  action: varchar('action', { length: 100 }).notNull(),
  actorId: integer('actor_id'),
  actorRole: varchar('actor_role', { length: 50 }).notNull().default('system'),
  details: jsonb('details'),
  ipAddress: varchar('ip_address', { length: 50 }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('training_audit_course_idx').on(table.courseId),
  index('training_audit_user_idx').on(table.userId),
  index('training_audit_action_idx').on(table.action),
]);

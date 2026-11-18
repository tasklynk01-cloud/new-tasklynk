import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

const databaseUrl = (process.env.DATABASE_URL || '').trim().split('?')[0];

if (!databaseUrl) {
  console.error('DATABASE_URL is not set!');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('supabase') ? { rejectUnauthorized: false } : undefined,
});

async function run() {
  const client = await pool.connect();
  console.log('🚀 Setting up TaskLynk Training Academy database schema & seed data...');

  try {
    await client.query('BEGIN');

    // 1. Categories
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        icon VARCHAR(100) DEFAULT 'GraduationCap',
        order_index INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS training_cat_slug_idx ON training_categories(slug);
    `);

    // 2. Trainers
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_trainers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        bio TEXT,
        avatar_url TEXT,
        expertise JSONB DEFAULT '[]'::jsonb,
        linkedin_url VARCHAR(255),
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS training_trainers_email_idx ON training_trainers(email);
    `);

    // 3. Courses
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_courses (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        short_description TEXT,
        description TEXT NOT NULL,
        category_id INTEGER REFERENCES training_categories(id) ON DELETE SET NULL,
        level VARCHAR(50) NOT NULL DEFAULT 'all_levels',
        duration_days INTEGER NOT NULL DEFAULT 5,
        daily_duration_hours VARCHAR(50) NOT NULL DEFAULT '2–3 hours',
        target_audience TEXT NOT NULL,
        learning_outcomes JSONB NOT NULL DEFAULT '[]'::jsonb,
        curriculum_outline JSONB DEFAULT '[]'::jsonb,
        prerequisites JSONB DEFAULT '[]'::jsonb,
        thumbnail_url TEXT,
        banner_url TEXT,
        is_published BOOLEAN NOT NULL DEFAULT true,
        is_featured BOOLEAN NOT NULL DEFAULT false,
        is_archived BOOLEAN NOT NULL DEFAULT false,
        standard_price DECIMAL(12, 2) NOT NULL,
        early_bird_price DECIMAL(12, 2),
        promotional_price DECIMAL(12, 2),
        currency VARCHAR(10) NOT NULL DEFAULT 'KES',
        min_completion_percentage INTEGER NOT NULL DEFAULT 80,
        requires_assessment BOOLEAN NOT NULL DEFAULT true,
        certificate_enabled BOOLEAN NOT NULL DEFAULT true,
        max_capacity INTEGER NOT NULL DEFAULT 50,
        min_capacity INTEGER NOT NULL DEFAULT 5,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS training_courses_slug_idx ON training_courses(slug);
      CREATE INDEX IF NOT EXISTS training_courses_cat_idx ON training_courses(category_id);
      CREATE INDEX IF NOT EXISTS training_courses_published_idx ON training_courses(is_published);
    `);

    // 4. Cohorts
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_cohorts (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
        cohort_code VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        registration_opens_at TIMESTAMP NOT NULL,
        registration_closes_at TIMESTAMP NOT NULL,
        capacity INTEGER NOT NULL DEFAULT 50,
        enrolled_count INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'registration_open',
        trainer_id INTEGER REFERENCES training_trainers(id) ON DELETE SET NULL,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS training_cohorts_course_idx ON training_cohorts(course_id);
      CREATE INDEX IF NOT EXISTS training_cohorts_status_idx ON training_cohorts(status);
      CREATE INDEX IF NOT EXISTS training_cohorts_start_idx ON training_cohorts(start_date);
    `);

    // 5. Modules
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_modules (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        day_number INTEGER,
        order_index INTEGER NOT NULL DEFAULT 0,
        is_published BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS training_modules_course_idx ON training_modules(course_id);
      CREATE INDEX IF NOT EXISTS training_modules_order_idx ON training_modules(order_index);
    `);

    // 6. Lessons
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_lessons (
        id SERIAL PRIMARY KEY,
        module_id INTEGER NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
        course_id INTEGER NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        description TEXT,
        content TEXT,
        order_index INTEGER NOT NULL DEFAULT 0,
        lesson_type VARCHAR(50) NOT NULL DEFAULT 'video',
        duration_minutes INTEGER NOT NULL DEFAULT 60,
        is_free_preview BOOLEAN NOT NULL DEFAULT false,
        is_released BOOLEAN NOT NULL DEFAULT false,
        release_type VARCHAR(50) NOT NULL DEFAULT 'immediate',
        scheduled_release_at TIMESTAMP,
        prerequisite_lesson_id INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS training_lessons_mod_idx ON training_lessons(module_id);
      CREATE INDEX IF NOT EXISTS training_lessons_course_idx ON training_lessons(course_id);
      CREATE INDEX IF NOT EXISTS training_lessons_released_idx ON training_lessons(is_released);
    `);

    // 7. Sessions
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_sessions (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
        cohort_id INTEGER NOT NULL REFERENCES training_cohorts(id) ON DELETE CASCADE,
        lesson_id INTEGER REFERENCES training_lessons(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        day_number INTEGER,
        session_date TIMESTAMP NOT NULL,
        start_time VARCHAR(20) NOT NULL DEFAULT '18:00',
        end_time VARCHAR(20) NOT NULL DEFAULT '20:30',
        trainer_id INTEGER REFERENCES training_trainers(id) ON DELETE SET NULL,
        meeting_provider VARCHAR(50) NOT NULL DEFAULT 'manual',
        meeting_url TEXT,
        meeting_id VARCHAR(255),
        meeting_password VARCHAR(255),
        recording_status VARCHAR(50) NOT NULL DEFAULT 'none',
        recording_url TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS training_sessions_course_idx ON training_sessions(course_id);
      CREATE INDEX IF NOT EXISTS training_sessions_cohort_idx ON training_sessions(cohort_id);
      CREATE INDEX IF NOT EXISTS training_sessions_date_idx ON training_sessions(session_date);
    `);

    // 8. Videos
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_videos (
        id SERIAL PRIMARY KEY,
        lesson_id INTEGER REFERENCES training_lessons(id) ON DELETE SET NULL,
        course_id INTEGER NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        provider VARCHAR(50) NOT NULL DEFAULT 'youtube',
        video_url TEXT NOT NULL,
        external_video_id VARCHAR(255),
        duration_seconds INTEGER NOT NULL DEFAULT 0,
        thumbnail_url TEXT,
        playback_quality JSONB,
        captions_url TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'ready',
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS training_videos_lesson_idx ON training_videos(lesson_id);
      CREATE INDEX IF NOT EXISTS training_videos_course_idx ON training_videos(course_id);
    `);

    // 9. Recordings
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_recordings (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
        cohort_id INTEGER NOT NULL REFERENCES training_cohorts(id) ON DELETE CASCADE,
        course_id INTEGER NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        video_url TEXT NOT NULL,
        provider VARCHAR(50) NOT NULL DEFAULT 'youtube',
        duration_seconds INTEGER NOT NULL DEFAULT 0,
        is_published BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS training_rec_session_idx ON training_recordings(session_id);
      CREATE INDEX IF NOT EXISTS training_rec_cohort_idx ON training_recordings(cohort_id);
    `);

    // 10. Materials
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_materials (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
        module_id INTEGER REFERENCES training_modules(id) ON DELETE SET NULL,
        lesson_id INTEGER REFERENCES training_lessons(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        material_type VARCHAR(50) NOT NULL DEFAULT 'pdf',
        file_url TEXT NOT NULL,
        file_size INTEGER,
        order_index INTEGER NOT NULL DEFAULT 0,
        is_downloadable BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS training_mat_course_idx ON training_materials(course_id);
      CREATE INDEX IF NOT EXISTS training_mat_lesson_idx ON training_materials(lesson_id);
    `);

    // 11. Discounts
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_discounts (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        discount_type VARCHAR(50) NOT NULL DEFAULT 'percentage',
        amount DECIMAL(10, 2) NOT NULL,
        course_id INTEGER REFERENCES training_courses(id) ON DELETE SET NULL,
        max_uses INTEGER,
        used_count INTEGER NOT NULL DEFAULT 0,
        valid_from TIMESTAMP,
        valid_until TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS training_discounts_code_idx ON training_discounts(code);
    `);

    // 12. Bookings
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_bookings (
        id SERIAL PRIMARY KEY,
        booking_reference VARCHAR(100) NOT NULL UNIQUE,
        course_id INTEGER NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
        cohort_id INTEGER NOT NULL REFERENCES training_cohorts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        organization VARCHAR(255),
        job_title VARCHAR(255),
        registration_type VARCHAR(50) NOT NULL DEFAULT 'individual',
        group_size INTEGER NOT NULL DEFAULT 1,
        agreed_price DECIMAL(12, 2) NOT NULL,
        discount_code VARCHAR(50),
        discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
        amount_paid DECIMAL(12, 2) NOT NULL DEFAULT 0,
        currency VARCHAR(10) NOT NULL DEFAULT 'KES',
        booking_status VARCHAR(50) NOT NULL DEFAULT 'pending',
        payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid',
        payment_method VARCHAR(50) NOT NULL DEFAULT 'mpesa',
        payment_id INTEGER REFERENCES payments(id) ON DELETE SET NULL,
        confirmed_at TIMESTAMP,
        admin_notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS training_bookings_ref_idx ON training_bookings(booking_reference);
      CREATE INDEX IF NOT EXISTS training_bookings_course_idx ON training_bookings(course_id);
      CREATE INDEX IF NOT EXISTS training_bookings_cohort_idx ON training_bookings(cohort_id);
      CREATE INDEX IF NOT EXISTS training_bookings_user_idx ON training_bookings(user_id);
      CREATE INDEX IF NOT EXISTS training_bookings_email_idx ON training_bookings(email);
      CREATE INDEX IF NOT EXISTS training_bookings_status_idx ON training_bookings(booking_status);
    `);

    // 13. Enrollments
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_enrollments (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER NOT NULL REFERENCES training_bookings(id) ON DELETE CASCADE,
        course_id INTEGER NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
        cohort_id INTEGER NOT NULL REFERENCES training_cohorts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        access_status VARCHAR(50) NOT NULL DEFAULT 'active',
        enrolled_at TIMESTAMP NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMP,
        progress_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
        is_certificate_issued BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT training_enroll_user_cohort_uniq UNIQUE (user_id, cohort_id)
      );
      CREATE INDEX IF NOT EXISTS training_enroll_user_idx ON training_enrollments(user_id);
      CREATE INDEX IF NOT EXISTS training_enroll_course_idx ON training_enrollments(course_id);
      CREATE INDEX IF NOT EXISTS training_enroll_status_idx ON training_enrollments(access_status);
    `);

    // 14. Payments
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_payments (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER NOT NULL REFERENCES training_bookings(id) ON DELETE CASCADE,
        payment_id INTEGER REFERENCES payments(id) ON DELETE SET NULL,
        amount DECIMAL(12, 2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'KES',
        phone_number VARCHAR(50) NOT NULL,
        checkout_request_id VARCHAR(255),
        merchant_request_id VARCHAR(255),
        mpesa_receipt VARCHAR(255),
        payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
        raw_callback JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS training_pay_booking_idx ON training_payments(booking_id);
      CREATE INDEX IF NOT EXISTS training_pay_checkout_idx ON training_payments(checkout_request_id);
      CREATE INDEX IF NOT EXISTS training_pay_receipt_idx ON training_payments(mpesa_receipt);
    `);

    // 15. Video Progress
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_video_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id INTEGER NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
        lesson_id INTEGER NOT NULL REFERENCES training_lessons(id) ON DELETE CASCADE,
        video_id INTEGER NOT NULL REFERENCES training_videos(id) ON DELETE CASCADE,
        last_position_seconds DECIMAL(10, 2) NOT NULL DEFAULT 0,
        watched_duration_seconds DECIMAL(10, 2) NOT NULL DEFAULT 0,
        total_duration_seconds DECIMAL(10, 2) NOT NULL DEFAULT 0,
        percentage_watched DECIMAL(5, 2) NOT NULL DEFAULT 0,
        is_completed BOOLEAN NOT NULL DEFAULT false,
        completed_at TIMESTAMP,
        last_heartbeat_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT training_vid_prog_user_video_uniq UNIQUE (user_id, video_id)
      );
      CREATE INDEX IF NOT EXISTS training_vid_prog_user_idx ON training_video_progress(user_id);
      CREATE INDEX IF NOT EXISTS training_vid_prog_lesson_idx ON training_video_progress(lesson_id);
    `);

    // 16. Lesson Progress
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_lesson_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id INTEGER NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
        module_id INTEGER NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
        lesson_id INTEGER NOT NULL REFERENCES training_lessons(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'not_started',
        time_spent_seconds INTEGER NOT NULL DEFAULT 0,
        completed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT training_les_prog_user_lesson_uniq UNIQUE (user_id, lesson_id)
      );
      CREATE INDEX IF NOT EXISTS training_les_prog_user_idx ON training_lesson_progress(user_id);
      CREATE INDEX IF NOT EXISTS training_les_prog_course_idx ON training_lesson_progress(course_id);
    `);

    // 17. Course Progress
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_course_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id INTEGER NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
        cohort_id INTEGER NOT NULL REFERENCES training_cohorts(id) ON DELETE CASCADE,
        completed_lessons_count INTEGER NOT NULL DEFAULT 0,
        total_lessons_count INTEGER NOT NULL DEFAULT 0,
        progress_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
        total_time_spent_seconds INTEGER NOT NULL DEFAULT 0,
        last_accessed_lesson_id INTEGER,
        last_accessed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        is_eligible_for_certificate BOOLEAN NOT NULL DEFAULT false,
        is_completed BOOLEAN NOT NULL DEFAULT false,
        completed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT training_crs_prog_user_cohort_uniq UNIQUE (user_id, cohort_id)
      );
      CREATE INDEX IF NOT EXISTS training_crs_prog_user_idx ON training_course_progress(user_id);
      CREATE INDEX IF NOT EXISTS training_crs_prog_course_idx ON training_course_progress(course_id);
    `);

    // 18. Learning Activity
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_learning_activity (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id INTEGER NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
        lesson_id INTEGER,
        activity_type VARCHAR(100) NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS training_act_user_idx ON training_learning_activity(user_id);
      CREATE INDEX IF NOT EXISTS training_act_course_idx ON training_learning_activity(course_id);
      CREATE INDEX IF NOT EXISTS training_act_type_idx ON training_learning_activity(activity_type);
    `);

    // 19. Assessments
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_assessments (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
        module_id INTEGER REFERENCES training_modules(id) ON DELETE SET NULL,
        lesson_id INTEGER REFERENCES training_lessons(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        assessment_type VARCHAR(50) NOT NULL DEFAULT 'quiz',
        passing_score INTEGER NOT NULL DEFAULT 70,
        total_questions INTEGER NOT NULL DEFAULT 0,
        questions_data JSONB DEFAULT '[]'::jsonb,
        due_day INTEGER,
        is_mandatory BOOLEAN NOT NULL DEFAULT true,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS training_assess_course_idx ON training_assessments(course_id);
    `);

    // 20. Assignments
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_assignments (
        id SERIAL PRIMARY KEY,
        assessment_id INTEGER REFERENCES training_assessments(id) ON DELETE CASCADE,
        course_id INTEGER NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
        lesson_id INTEGER REFERENCES training_lessons(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        instructions TEXT NOT NULL,
        attachment_url TEXT,
        max_score INTEGER NOT NULL DEFAULT 100,
        due_date TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS training_assign_course_idx ON training_assignments(course_id);
    `);

    // 21. Submissions
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_submissions (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER REFERENCES training_assignments(id) ON DELETE CASCADE,
        assessment_id INTEGER REFERENCES training_assessments(id) ON DELETE CASCADE,
        course_id INTEGER NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        submission_text TEXT,
        file_url TEXT,
        file_name VARCHAR(255),
        file_size INTEGER,
        status VARCHAR(50) NOT NULL DEFAULT 'submitted',
        score DECIMAL(5, 2),
        feedback TEXT,
        graded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        graded_at TIMESTAMP,
        submitted_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS training_sub_assign_idx ON training_submissions(assignment_id);
      CREATE INDEX IF NOT EXISTS training_sub_user_idx ON training_submissions(user_id);
    `);

    // 22. Results
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_results (
        id SERIAL PRIMARY KEY,
        assessment_id INTEGER NOT NULL REFERENCES training_assessments(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id INTEGER NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
        score DECIMAL(5, 2) NOT NULL,
        total_score DECIMAL(5, 2) NOT NULL,
        percentage DECIMAL(5, 2) NOT NULL,
        passed BOOLEAN NOT NULL,
        answers_data JSONB,
        attempt_number INTEGER NOT NULL DEFAULT 1,
        completed_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS training_results_user_idx ON training_results(user_id);
      CREATE INDEX IF NOT EXISTS training_results_assess_idx ON training_results(assessment_id);
    `);

    // 23. Attendance
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_attendance (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
        cohort_id INTEGER NOT NULL REFERENCES training_cohorts(id) ON DELETE CASCADE,
        course_id INTEGER NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'present',
        joined_at TIMESTAMP,
        left_at TIMESTAMP,
        duration_minutes INTEGER NOT NULL DEFAULT 0,
        marked_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT training_att_user_session_uniq UNIQUE (user_id, session_id)
      );
      CREATE INDEX IF NOT EXISTS training_att_session_idx ON training_attendance(session_id);
      CREATE INDEX IF NOT EXISTS training_att_user_idx ON training_attendance(user_id);
    `);

    // 24. Certificates
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_certificates (
        id SERIAL PRIMARY KEY,
        certificate_number VARCHAR(100) NOT NULL UNIQUE,
        course_id INTEGER NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
        cohort_id INTEGER NOT NULL REFERENCES training_cohorts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        enrollment_id INTEGER NOT NULL REFERENCES training_enrollments(id) ON DELETE CASCADE,
        learner_name VARCHAR(255) NOT NULL,
        course_name VARCHAR(255) NOT NULL,
        completion_date TIMESTAMP NOT NULL,
        issuing_organization VARCHAR(255) NOT NULL DEFAULT 'TaskLynk Training Academy',
        authorized_signatory VARCHAR(255) NOT NULL DEFAULT 'Dr. David Mwangi',
        signatory_title VARCHAR(255) NOT NULL DEFAULT 'Director of Academic Affairs, TaskLynk Academy',
        verification_url VARCHAR(255) NOT NULL,
        qr_code_data TEXT,
        pdf_url TEXT,
        is_revoked BOOLEAN NOT NULL DEFAULT false,
        revocation_reason TEXT,
        issued_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS training_cert_number_idx ON training_certificates(certificate_number);
      CREATE INDEX IF NOT EXISTS training_cert_user_idx ON training_certificates(user_id);
      CREATE INDEX IF NOT EXISTS training_cert_course_idx ON training_certificates(course_id);
    `);

    // 25. Audit Logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_audit_logs (
        id SERIAL PRIMARY KEY,
        course_id INTEGER,
        user_id INTEGER,
        action VARCHAR(100) NOT NULL,
        actor_id INTEGER,
        actor_role VARCHAR(50) NOT NULL DEFAULT 'system',
        details JSONB,
        ip_address VARCHAR(50),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS training_audit_course_idx ON training_audit_logs(course_id);
      CREATE INDEX IF NOT EXISTS training_audit_user_idx ON training_audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS training_audit_action_idx ON training_audit_logs(action);
    `);

    await client.query('COMMIT');
    console.log('✅ All 25 Training Academy tables and indexes created successfully!');

    // =========================================================================
    // SEED INITIAL PROGRAMS & CALENDAR
    // =========================================================================
    console.log('🌱 Seeding initial categories, trainers, and the 5 training programs...');

    // Categories
    const categories = [
      { name: 'Academic & Research', slug: 'academic-research', description: 'Master research methodologies, scholarly writing, SPSS, and academic publishing.', icon: 'BookOpen', order: 1 },
      { name: 'Software & Technology', slug: 'software-technology', description: 'Practical modern web development, programming, and software engineering.', icon: 'Code', order: 2 },
      { name: 'Business & Marketing', slug: 'business-marketing', description: 'Digital marketing, SEO, content growth, and digital business operations.', icon: 'TrendingUp', order: 3 },
      { name: 'Artificial Intelligence', slug: 'artificial-intelligence', description: 'Cross-cutting AI skills, workflow automation, and productivity for professionals.', icon: 'Sparkles', order: 4 },
    ];

    for (const cat of categories) {
      await client.query(`
        INSERT INTO training_categories (name, slug, description, icon, order_index)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          icon = EXCLUDED.icon,
          order_index = EXCLUDED.order_index;
      `, [cat.name, cat.slug, cat.description, cat.icon, cat.order]);
    }

    // Trainers
    const trainers = [
      {
        name: 'Dr. David Mwangi, PhD',
        email: 'david.mwangi@tasklynk.co.ke',
        title: 'Lead Academic Researcher & Research Fellow',
        bio: 'Senior academic consultant with over 12 years of experience guiding doctoral candidates, institutional researchers, and peer-reviewed journal publications.',
        expertise: JSON.stringify(['Academic Writing', 'APA 7th Edition', 'Peer Review', 'Dissertation Supervision']),
      },
      {
        name: 'Prof. Grace Wanjiku',
        email: 'grace.wanjiku@tasklynk.co.ke',
        title: 'Senior Statistician & Research Methodology Lead',
        bio: 'Specialist in quantitative and qualitative research designs, statistical modeling, SPSS, Excel data wrangling, and empirical reporting.',
        expertise: JSON.stringify(['Research Design', 'SPSS & Excel', 'Descriptive & Inferential Stats', 'Data Cleaning']),
      },
      {
        name: 'Alex Otieno',
        email: 'alex.otieno@tasklynk.co.ke',
        title: 'Principal Software Engineer & Technical Architect',
        bio: 'Full-stack software architect with a track record building high-traffic cloud applications, modern web systems, and mentoring 500+ developers.',
        expertise: JSON.stringify(['Web Development', 'TypeScript & React', 'Node.js & Databases', 'Cloud Deployment']),
      },
      {
        name: 'Faith Chebet',
        email: 'faith.chebet@tasklynk.co.ke',
        title: 'Head of Growth & Digital Strategy',
        bio: 'Digital marketing strategist having driven performance campaigns across East Africa with deep expertise in technical SEO, social media funnels, and marketing automation.',
        expertise: JSON.stringify(['SEO & SEM', 'Social Media Marketing', 'Email Automation', 'Analytics & ROI']),
      },
      {
        name: 'Brian Kipkorir',
        email: 'brian.kipkorir@tasklynk.co.ke',
        title: 'AI Systems Specialist & Enterprise Productivity Consultant',
        bio: 'Passionate AI practitioner helping cross-functional professionals in education, law, research, healthcare, and enterprise leverage generative AI safely and productively.',
        expertise: JSON.stringify(['Generative AI', 'Prompt Engineering', 'Workflow Automation', 'AI Ethics & Evaluation']),
      },
    ];

    for (const t of trainers) {
      await client.query(`
        INSERT INTO training_trainers (name, email, title, bio, expertise)
        VALUES ($1, $2, $3, $4, $5::jsonb)
        ON CONFLICT (id) DO NOTHING;
      `, [t.name, t.email, t.title, t.bio, t.expertise]);
    }

    // Fetch trainer IDs & Category IDs
    const catRes = await client.query(`SELECT id, slug FROM training_categories`);
    const catMap = Object.fromEntries(catRes.rows.map(r => [r.slug, r.id]));

    const trainerRes = await client.query(`SELECT id, email FROM training_trainers`);
    const trainerMap = Object.fromEntries(trainerRes.rows.map(r => [r.email, r.id]));

    // =========================================================================
    // 5 INITIAL TRAINING PROGRAMS
    // =========================================================================
    const programs = [
      {
        slug: 'academic-writing-and-research',
        title: 'Academic Writing and Research',
        shortDescription: 'Master the principles of scholarly inquiry, research structuring, credible source evaluation, APA referencing, and rigorous academic editing.',
        description: `Develop high-level academic competence in structuring, researching, writing, referencing, and editing research papers, theses, dissertations, and professional reports. 
        
This comprehensive five-day intensive training is led by seasoned academic consultants and fellows. Participants will transition from fundamental academic voice and argumentation to practical peer-review exercises, addressing common pitfalls like unintended plagiarism, flawed citation synthesis, and incoherent section transitions.`,
        categorySlug: 'academic-research',
        trainerEmail: 'david.mwangi@tasklynk.co.ke',
        level: 'all_levels',
        durationDays: 5,
        dailyDurationHours: '2–3 hours',
        standardPrice: 1500,
        targetAudience: 'University students, undergraduate and postgraduate researchers, graduates, faculty members, and academic professionals.',
        learningOutcomes: [
          'Structure and draft rigorous academic assignments, research papers, and thesis chapters.',
          'Formulate precise research questions, objectives, and problem statements.',
          'Critically locate, evaluate, and synthesize credible peer-reviewed academic literature.',
          'Apply APA referencing principles seamlessly for in-text citations and reference lists.',
          'Eliminate plagiarism, enhance coherence, and execute high-standard academic proofreading.',
        ],
        prerequisites: ['Basic reading and writing proficiency', 'Access to a computer with an active internet connection'],
        cohortCode: 'ACAD-WRT-NOV26',
        cohortName: 'November 2026 Cohort',
        startDate: '2026-11-23T18:00:00+03:00',
        endDate: '2026-11-27T21:00:00+03:00',
        regOpen: '2026-11-14T00:00:00+03:00',
        regClose: '2026-11-21T18:00:00+03:00', // 48h before start
        days: [
          {
            dayNumber: 1,
            date: '2026-11-23T18:00:00+03:00',
            title: 'Foundations of Academic Writing',
            desc: 'Understanding academic writing; academic language and tone; types of academic assignments; structuring academic work.',
            lessons: [
              { title: 'Understanding Academic Writing Conventions', type: 'video', duration: 45, free: true },
              { title: 'Scholarly Language, Tone & Objective Voice', type: 'reading', duration: 30, free: false },
              { title: 'Structuring Academic Work: Anatomy of a Paper', type: 'video', duration: 55, free: false },
            ]
          },
          {
            dayNumber: 2,
            date: '2026-11-24T18:00:00+03:00',
            title: 'Research and Source Evaluation',
            desc: 'Identifying research topics; research questions and objectives; finding credible academic sources; evaluating sources and avoiding unreliable information.',
            lessons: [
              { title: 'Topic Selection & Problem Formulation', type: 'video', duration: 50, free: false },
              { title: 'Navigating Academic Databases & Google Scholar', type: 'video', duration: 45, free: false },
              { title: 'Evaluating Source Credibility & Peer-Review Status', type: 'reading', duration: 35, free: false },
            ]
          },
          {
            dayNumber: 3,
            date: '2026-11-25T18:00:00+03:00',
            title: 'Academic Referencing and Citation',
            desc: 'APA referencing principles; in-text citations; reference lists; plagiarism and academic integrity.',
            lessons: [
              { title: 'APA 7th Edition In-Text Citations (Direct & Paraphrase)', type: 'video', duration: 50, free: false },
              { title: 'Crafting Complete Reference Lists & Dealing with Tricky Sources', type: 'video', duration: 45, free: false },
              { title: 'Academic Integrity & Turnitin Plagiarism Avoidance', type: 'reading', duration: 35, free: false },
            ]
          },
          {
            dayNumber: 4,
            date: '2026-11-26T18:00:00+03:00',
            title: 'Academic Structure and Editing',
            desc: 'Introduction, literature review and methodology; findings and discussion; academic coherence; editing and proofreading.',
            lessons: [
              { title: 'Drafting Coherent Literature Reviews & Methodologies', type: 'video', duration: 60, free: false },
              { title: 'Presenting Findings, Analysis & Balanced Discussion', type: 'video', duration: 45, free: false },
              { title: 'Cohesion, Transition Words & Self-Proofreading Rubric', type: 'reading', duration: 30, free: false },
            ]
          },
          {
            dayNumber: 5,
            date: '2026-11-27T18:00:00+03:00',
            title: 'Practical Application and Assessment',
            desc: 'Practical academic writing exercise; referencing exercise; reviewing and correcting academic work; final assessment and feedback.',
            lessons: [
              { title: 'Hands-on Writing & Referencing Workshop', type: 'live_session', duration: 90, free: false },
              { title: 'Final Comprehensive Academic Assessment', type: 'assessment', duration: 60, free: false },
            ]
          },
        ]
      },
      {
        slug: 'research-methods-and-data-analysis',
        title: 'Research Methods and Data Analysis',
        shortDescription: 'From qualitative/quantitative research design to descriptive statistics, SPSS/Excel data cleaning, and analytical report presentation.',
        description: `A systematic five-day workshop designed to equip researchers, analysts, and postgraduate scholars with robust methodology design and empirical analytical skills. 
        
Learn how to choose sampling techniques, design valid questionnaires, clean messy survey datasets, run statistical tests, interpret SPSS and Excel outputs, and synthesize findings into high-impact academic and policy reports.`,
        categorySlug: 'academic-research',
        trainerEmail: 'grace.wanjiku@tasklynk.co.ke',
        level: 'all_levels',
        durationDays: 5,
        dailyDurationHours: '2–3 hours',
        standardPrice: 2000,
        targetAudience: 'Students, researchers, postgraduates, corporate analysts, and development professionals.',
        learningOutcomes: [
          'Design sound qualitative, quantitative, and mixed-methods research frameworks.',
          'Construct reliable data collection instruments and ensure ethical compliance.',
          'Clean, code, and manage raw datasets in Excel and SPSS without data loss.',
          'Compute and interpret descriptive and inferential statistics accurately.',
          'Produce publication-grade tables, charts, and research analytical reports.',
        ],
        prerequisites: ['Basic familiarity with Microsoft Excel or Google Sheets', 'Computer running Windows or macOS'],
        cohortCode: 'RES-MTH-NOV26',
        cohortName: 'Nov–Dec 2026 Cohort',
        startDate: '2026-11-30T18:00:00+03:00',
        endDate: '2026-12-04T21:00:00+03:00',
        regOpen: '2026-11-14T00:00:00+03:00',
        regClose: '2026-11-28T18:00:00+03:00', // 48h before start
        days: [
          {
            dayNumber: 1,
            date: '2026-11-30T18:00:00+03:00',
            title: 'Research Foundations',
            desc: 'Research concepts and approaches; qualitative and quantitative research; research problems and objectives; research design.',
            lessons: [
              { title: 'Qualitative vs Quantitative Paradigms', type: 'video', duration: 45, free: true },
              { title: 'Aligning Research Problems with Methodological Design', type: 'reading', duration: 40, free: false },
              { title: 'Constructing Theoretical & Conceptual Frameworks', type: 'video', duration: 50, free: false },
            ]
          },
          {
            dayNumber: 2,
            date: '2026-12-01T18:00:00+03:00',
            title: 'Research Methodology and Data Collection',
            desc: 'Sampling techniques; questionnaires and interviews; data collection methods; data quality and ethical considerations.',
            lessons: [
              { title: 'Probability vs Non-Probability Sampling Strategies', type: 'video', duration: 50, free: false },
              { title: 'Designing High-Yield Questionnaires & Interview Guides', type: 'video', duration: 45, free: false },
              { title: 'Data Quality, Reliability, Validity & Ethical Consent', type: 'reading', duration: 35, free: false },
            ]
          },
          {
            dayNumber: 3,
            date: '2026-12-02T18:00:00+03:00',
            title: 'Data Management and Statistical Analysis',
            desc: 'Data coding and cleaning; descriptive statistics; frequency distributions; mean, median and standard deviation; introduction to statistical analysis.',
            lessons: [
              { title: 'Data Entry, Variable Coding & Outlier Detection', type: 'video', duration: 55, free: false },
              { title: 'Mastering Measures of Central Tendency & Dispersion', type: 'video', duration: 50, free: false },
              { title: 'Frequency Distributions & Cross-Tabulations', type: 'reading', duration: 30, free: false },
            ]
          },
          {
            dayNumber: 4,
            date: '2026-12-03T18:00:00+03:00',
            title: 'Practical Data Analysis',
            desc: 'Introduction to SPSS, Excel and relevant analytical tools; data visualization; interpreting statistical outputs; tables and charts.',
            lessons: [
              { title: 'Hands-on SPSS & Excel Analysis Walkthrough', type: 'video', duration: 65, free: false },
              { title: 'Building Clean Visualization Charts & Summary Tables', type: 'video', duration: 45, free: false },
              { title: 'Interpreting P-values, Confidence Intervals & Output Summaries', type: 'reading', duration: 30, free: false },
            ]
          },
          {
            dayNumber: 5,
            date: '2026-12-04T18:00:00+03:00',
            title: 'Research Reporting and Assessment',
            desc: 'Interpreting results; presenting research findings; writing analytical reports; practical assessment.',
            lessons: [
              { title: 'Writing the Results & Discussion Chapter (APA Style)', type: 'video', duration: 50, free: false },
              { title: 'Practical Data Analysis Assessment & Defense', type: 'assessment', duration: 70, free: false },
            ]
          },
        ]
      },
      {
        slug: 'web-development-and-software-engineering',
        title: 'Web Development and Software Engineering',
        shortDescription: 'Build modern responsive websites from scratch using HTML5, modern CSS, JavaScript fundamentals, backend APIs, and web deployment.',
        description: `A hands-on, beginner-friendly five-day engineering bootcamp designed to take learners from web basics to publishing a live responsive web project.
        
Understand web architecture, craft semantic HTML, design responsive modern UI layouts with CSS Flexbox and Grid, add interactive dynamic behaviour with JavaScript, connect to APIs, and deploy your site to the cloud with version control fundamentals.`,
        categorySlug: 'software-technology',
        trainerEmail: 'alex.otieno@tasklynk.co.ke',
        level: 'beginner',
        durationDays: 5,
        dailyDurationHours: '2–3 hours',
        standardPrice: 2000,
        targetAudience: 'Beginners, university students, entrepreneurs, career transitioners, and aspiring software developers.',
        learningOutcomes: [
          'Understand how the internet, DNS, HTTP, browsers, and servers interact.',
          'Write semantic, accessible HTML5 and build clean webpage structures.',
          'Create modern responsive, mobile-first layouts using CSS, Flexbox, and Grid.',
          'Program interactive features with JavaScript functions, events, and DOM manipulation.',
          'Understand backend fundamentals, APIs, databases, and publish a live website project.',
        ],
        prerequisites: ['A computer (laptop/desktop) with internet', 'VS Code installed (guidance provided on Day 1)'],
        cohortCode: 'WEB-DEV-DEC26',
        cohortName: 'December 2026 Cohort',
        startDate: '2026-12-07T18:00:00+03:00',
        endDate: '2026-12-11T21:00:00+03:00',
        regOpen: '2026-11-14T00:00:00+03:00',
        regClose: '2026-12-05T18:00:00+03:00', // 48h before start
        days: [
          {
            dayNumber: 1,
            date: '2026-12-07T18:00:00+03:00',
            title: 'Introduction to Web Development',
            desc: 'How websites work; HTML fundamentals; website structure; practical webpage creation.',
            lessons: [
              { title: 'How the Web Works: Clients, Servers & Protocols', type: 'video', duration: 40, free: true },
              { title: 'HTML5 Semantic Elements & Document Hierarchy', type: 'video', duration: 50, free: false },
              { title: 'Hands-on: Building Your First Profile Page', type: 'reading', duration: 35, free: false },
            ]
          },
          {
            dayNumber: 2,
            date: '2026-12-08T18:00:00+03:00',
            title: 'CSS and Responsive Design',
            desc: 'Styling websites; layouts and typography; responsive design; practical website styling.',
            lessons: [
              { title: 'CSS Box Model, Colors, Typography & Selectors', type: 'video', duration: 45, free: false },
              { title: 'Modern Flexbox & CSS Grid for Rock-Solid Layouts', type: 'video', duration: 55, free: false },
              { title: 'Media Queries & Mobile-First Responsive Design', type: 'reading', duration: 30, free: false },
            ]
          },
          {
            dayNumber: 3,
            date: '2026-12-09T18:00:00+03:00',
            title: 'JavaScript Fundamentals',
            desc: 'Variables and functions; events and interactions; DOM manipulation; practical interactive features.',
            lessons: [
              { title: 'JavaScript Data Types, Variables, Logic & Control Flow', type: 'video', duration: 50, free: false },
              { title: 'Functions, Event Listeners & Interactive DOM Manipulation', type: 'video', duration: 55, free: false },
              { title: 'Building an Interactive Calculator / Form Validator', type: 'reading', duration: 35, free: false },
            ]
          },
          {
            dayNumber: 4,
            date: '2026-12-10T18:00:00+03:00',
            title: 'Modern Web Development',
            desc: 'Frontend development concepts; APIs and backend fundamentals; databases; introduction to modern development frameworks.',
            lessons: [
              { title: 'APIs, JSON & Fetching Live Data in Web Applications', type: 'video', duration: 55, free: false },
              { title: 'Backend Fundamentals, Node.js & Database Architecture', type: 'video', duration: 50, free: false },
              { title: 'Introduction to Modern Frameworks (React & Next.js Overview)', type: 'reading', duration: 30, free: false },
            ]
          },
          {
            dayNumber: 5,
            date: '2026-12-11T18:00:00+03:00',
            title: 'Building and Publishing a Project',
            desc: 'Developing a practical website; testing and debugging; deployment fundamentals; final project presentation.',
            lessons: [
              { title: 'End-to-End Capstone Project Development', type: 'video', duration: 60, free: false },
              { title: 'Git, GitHub & Free Cloud Hosting Deployment (Vercel/Netlify)', type: 'video', duration: 40, free: false },
              { title: 'Capstone Website Submission & Practical Assessment', type: 'assessment', duration: 60, free: false },
            ]
          },
        ]
      },
      {
        slug: 'digital-marketing-and-seo',
        title: 'Digital Marketing and SEO',
        shortDescription: 'Formulate high-conversion marketing strategies, master search engine optimization, content funnels, social media, and campaign analytics.',
        description: `An intensive five-day practical course designed for business owners, freelancers, and marketers seeking measurable customer acquisition and brand visibility.
        
Learn how to build digital marketing funnels, rank organically on Google with technical and on-page SEO, execute high-converting campaigns across LinkedIn, Instagram, Facebook, and WhatsApp, automate customer communication, and measure exact ROI using modern analytics tools.`,
        categorySlug: 'business-marketing',
        trainerEmail: 'faith.chebet@tasklynk.co.ke',
        level: 'all_levels',
        durationDays: 5,
        dailyDurationHours: '2–3 hours',
        standardPrice: 1500,
        targetAudience: 'Entrepreneurs, business owners, freelancers, corporate marketers, sales professionals, and consultants.',
        learningOutcomes: [
          'Formulate comprehensive digital marketing strategies and customer journey funnels.',
          'Execute targeted social media campaigns on Facebook, Instagram, and LinkedIn.',
          'Conduct keyword research and implement on-page and technical SEO to gain search ranking.',
          'Leverage AI tools, marketing calendars, and WhatsApp/Email automation for lead generation.',
          'Analyze campaign metrics, track return on ad spend (ROAS), and optimize conversions.',
        ],
        prerequisites: ['Basic internet and social media usage', 'A business, product, or freelance service idea to work on'],
        cohortCode: 'DIG-MKT-DEC26',
        cohortName: 'December 2026 Cohort',
        startDate: '2026-12-14T18:00:00+03:00',
        endDate: '2026-12-18T21:00:00+03:00',
        regOpen: '2026-11-14T00:00:00+03:00',
        regClose: '2026-12-12T18:00:00+03:00', // 48h before start
        days: [
          {
            dayNumber: 1,
            date: '2026-12-14T18:00:00+03:00',
            title: 'Digital Marketing Foundations',
            desc: 'Digital marketing principles; understanding target audiences; marketing strategies; building an online business presence.',
            lessons: [
              { title: 'Marketing Funnels & Customer Persona Mapping', type: 'video', duration: 45, free: true },
              { title: 'Audience Research & Competitive Landscape Analysis', type: 'video', duration: 40, free: false },
              { title: 'Setting Up an Optimized Online Business Presence', type: 'reading', duration: 35, free: false },
            ]
          },
          {
            dayNumber: 2,
            date: '2026-12-15T18:00:00+03:00',
            title: 'Social Media Marketing',
            desc: 'Facebook and Instagram marketing; LinkedIn marketing; content planning; engagement and audience growth.',
            lessons: [
              { title: 'Facebook & Instagram Paid & Organic Strategies', type: 'video', duration: 50, free: false },
              { title: 'LinkedIn B2B Lead Generation & Thought Leadership', type: 'video', duration: 45, free: false },
              { title: 'Creating High-Converting Visual Content & Hooks', type: 'reading', duration: 30, free: false },
            ]
          },
          {
            dayNumber: 3,
            date: '2026-12-16T18:00:00+03:00',
            title: 'Search Engine Optimization',
            desc: 'SEO fundamentals; keyword research; on-page SEO; technical SEO basics; search visibility.',
            lessons: [
              { title: 'How Google Ranks Websites & Intent-Based Keyword Research', type: 'video', duration: 55, free: false },
              { title: 'On-Page SEO Checklist: Meta Tags, Headers & Content', type: 'video', duration: 45, free: false },
              { title: 'Technical SEO, Site Speed & Google Search Console Setup', type: 'reading', duration: 35, free: false },
            ]
          },
          {
            dayNumber: 4,
            date: '2026-12-17T18:00:00+03:00',
            title: 'Content and Marketing Automation',
            desc: 'Content creation; AI-assisted marketing; marketing calendars; email and WhatsApp marketing; introduction to automation.',
            lessons: [
              { title: 'AI-Powered Copywriting for Ads, Blogs & Email Campaigns', type: 'video', duration: 50, free: false },
              { title: 'WhatsApp Business & Email Sequences That Convert', type: 'video', duration: 45, free: false },
              { title: 'Building a 30-Day Automated Marketing Calendar', type: 'reading', duration: 35, free: false },
            ]
          },
          {
            dayNumber: 5,
            date: '2026-12-18T18:00:00+03:00',
            title: 'Campaign Development and Analytics',
            desc: 'Building a marketing campaign; measuring campaign performance; website analytics; reporting and optimization; practical assessment.',
            lessons: [
              { title: 'Executing a Live Multi-Channel Ad Campaign', type: 'video', duration: 55, free: false },
              { title: 'Google Analytics 4 & Conversion Tracking Breakdown', type: 'video', duration: 40, free: false },
              { title: 'Practical Digital Campaign Strategy Assessment', type: 'assessment', duration: 60, free: false },
            ]
          },
        ]
      },
      {
        slug: 'ai-for-professional-productivity',
        title: 'Artificial Intelligence for Professional Productivity',
        shortDescription: 'A cross-cutting 4-day professional program to transform daily document drafting, research synthesis, problem-solving, and workflow efficiency with AI.',
        description: `Artificial Intelligence for Professional Productivity is an intensive, 4-consecutive-day masterclass designed for professionals across all sectors—NOT restricted to tech specialists or programmers!
        
Whether you are a university lecturer, corporate manager, legal administrator, researcher, healthcare professional, accountant, or business owner, discover how generative AI can supercharge your daily writing, reports, presentations, data synthesis, and workflow operations safely, ethically, and with high precision.
        
Includes practical hands-on workflows and a final real-world professional assessment on December 30, 2026.`,
        categorySlug: 'artificial-intelligence',
        trainerEmail: 'brian.kipkorir@tasklynk.co.ke',
        level: 'all_levels',
        durationDays: 4,
        dailyDurationHours: '2–3 hours',
        standardPrice: 1500,
        targetAudience: 'Students, educators, researchers, business owners, administrators, legal & healthcare professionals, managers, freelancers, and professionals across all industries.',
        learningOutcomes: [
          'Master modern Generative AI principles, capabilities, and prompt engineering frameworks.',
          'Accelerate daily professional communication, email drafting, document synthesis, and report creation.',
          'Apply AI ethically across diverse professions: education, business, law, research, administration, and finance.',
          'Build practical automated productivity workflows that save 10+ hours per week.',
          'Critically evaluate, verify, and refine AI outputs to guarantee accuracy and professional compliance.',
        ],
        prerequisites: ['No programming or technical background required', 'Computer or tablet with internet access'],
        cohortCode: 'AI-PROD-DEC26',
        cohortName: 'End-Year Intensive 2026 Cohort',
        startDate: '2026-12-27T18:00:00+03:00',
        endDate: '2026-12-30T21:00:00+03:00',
        regOpen: '2026-11-14T00:00:00+03:00',
        regClose: '2026-12-25T18:00:00+03:00', // 48h before start
        days: [
          {
            dayNumber: 1,
            date: '2026-12-27T18:00:00+03:00',
            title: 'Understanding and Using Artificial Intelligence',
            desc: 'Introduction to modern AI; generative AI concepts; understanding AI tools; effective prompting; responsible AI use.',
            lessons: [
              { title: 'The Generative AI Landscape: Models, Capabilities & Limits', type: 'video', duration: 45, free: true },
              { title: 'Mastering Prompt Engineering: Role, Context, Task & Output Formats', type: 'video', duration: 55, free: false },
              { title: 'Data Privacy, Security & Responsible Corporate AI Usage', type: 'reading', duration: 30, free: false },
            ]
          },
          {
            dayNumber: 2,
            date: '2026-12-28T18:00:00+03:00',
            title: 'AI in Everyday Professional Work',
            desc: 'AI-assisted writing and communication; research and information processing; document preparation; data analysis assistance; productivity and workflow improvements.',
            lessons: [
              { title: 'Speed-Drafting Professional Reports, Memos & Proposals', type: 'video', duration: 50, free: false },
              { title: 'Synthesizing 50+ Page PDFs, Complex Research & Summaries in Minutes', type: 'video', duration: 50, free: false },
              { title: 'Excel & Data Analysis with Natural Language Prompts', type: 'reading', duration: 35, free: false },
            ]
          },
          {
            dayNumber: 3,
            date: '2026-12-29T18:00:00+03:00',
            title: 'AI Across Professional Fields',
            desc: 'AI in education; AI in research; AI in business and entrepreneurship; AI in marketing; AI in administration and other professions; practical professional use cases.',
            lessons: [
              { title: 'AI for Educators, Researchers & Academics', type: 'video', duration: 45, free: false },
              { title: 'AI for Business Leaders, Marketers & Operations Managers', type: 'video', duration: 45, free: false },
              { title: 'AI for Legal, Administrative & Healthcare Professionals', type: 'reading', duration: 40, free: false },
            ]
          },
          {
            dayNumber: 4,
            date: '2026-12-30T18:00:00+03:00',
            title: 'Practical AI Projects and Assessment',
            desc: 'Building practical AI-assisted workflows; solving real-world professional problems; evaluating AI-generated results; responsible and ethical use; final practical assessment.',
            lessons: [
              { title: 'Building Your End-to-End Professional AI Workflow', type: 'live_session', duration: 75, free: false },
              { title: 'Final Capstone Practical AI Assessment (December 30)', type: 'assessment', duration: 65, free: false },
            ]
          },
        ]
      },
    ];

    for (const prog of programs) {
      const categoryId = catMap[prog.categorySlug];
      const trainerId = trainerMap[prog.trainerEmail];

      // Upsert Course
      const courseUpsert = await client.query(`
        INSERT INTO training_courses (
          slug, title, short_description, description, category_id, level, duration_days,
          daily_duration_hours, target_audience, learning_outcomes, prerequisites,
          standard_price, is_published, is_featured, min_completion_percentage
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12, true, true, 80)
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          short_description = EXCLUDED.short_description,
          description = EXCLUDED.description,
          category_id = EXCLUDED.category_id,
          level = EXCLUDED.level,
          duration_days = EXCLUDED.duration_days,
          daily_duration_hours = EXCLUDED.daily_duration_hours,
          target_audience = EXCLUDED.target_audience,
          learning_outcomes = EXCLUDED.learning_outcomes,
          prerequisites = EXCLUDED.prerequisites,
          standard_price = EXCLUDED.standard_price,
          is_published = true
        RETURNING id;
      `, [
        prog.slug,
        prog.title,
        prog.shortDescription,
        prog.description,
        categoryId,
        prog.level,
        prog.durationDays,
        prog.dailyDurationHours,
        prog.targetAudience,
        JSON.stringify(prog.learningOutcomes),
        JSON.stringify(prog.prerequisites),
        prog.standardPrice,
      ]);

      const courseId = courseUpsert.rows[0].id;

      // Upsert Cohort
      const cohortUpsert = await client.query(`
        INSERT INTO training_cohorts (
          course_id, cohort_code, name, start_date, end_date, registration_opens_at,
          registration_closes_at, capacity, enrolled_count, status, trainer_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 50, 0, 'registration_open', $8)
        ON CONFLICT (cohort_code) DO UPDATE SET
          name = EXCLUDED.name,
          start_date = EXCLUDED.start_date,
          end_date = EXCLUDED.end_date,
          registration_opens_at = EXCLUDED.registration_opens_at,
          registration_closes_at = EXCLUDED.registration_closes_at,
          trainer_id = EXCLUDED.trainer_id,
          status = 'registration_open'
        RETURNING id;
      `, [
        courseId,
        prog.cohortCode,
        prog.cohortName,
        prog.startDate,
        prog.endDate,
        prog.regOpen,
        prog.regClose,
        trainerId,
      ]);

      const cohortId = cohortUpsert.rows[0].id;

      // Upsert Modules, Lessons, Sessions & Sample Videos
      for (const day of prog.days) {
        // Module
        const modRes = await client.query(`
          INSERT INTO training_modules (course_id, title, description, day_number, order_index, is_published)
          VALUES ($1, $2, $3, $4, $5, true)
          RETURNING id;
        `, [
          courseId,
          `Day ${day.dayNumber}: ${day.title}`,
          day.desc,
          day.dayNumber,
          day.dayNumber,
        ]);
        const moduleId = modRes.rows[0].id;

        // Session
        await client.query(`
          INSERT INTO training_sessions (
            course_id, cohort_id, title, description, day_number, session_date,
            start_time, end_time, trainer_id, meeting_provider, status
          )
          VALUES ($1, $2, $3, $4, $5, $6, '18:00', '20:30', $7, 'manual', 'scheduled');
        `, [
          courseId,
          cohortId,
          `Day ${day.dayNumber} Live Workshop: ${day.title}`,
          day.desc,
          day.dayNumber,
          day.date,
          trainerId,
        ]);

        // Lessons
        let lessonOrder = 1;
        for (const les of day.lessons) {
          const lessonSlug = `${prog.slug}-day${day.dayNumber}-lesson${lessonOrder}`;
          // First day's lessons are released immediately, subsequent lessons locked for progressive delivery!
          const isReleased = day.dayNumber === 1 || les.free;

          const lesRes = await client.query(`
            INSERT INTO training_lessons (
              module_id, course_id, title, slug, description, content,
              order_index, lesson_type, duration_minutes, is_free_preview,
              is_released, release_type
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id;
          `, [
            moduleId,
            courseId,
            les.title,
            lessonSlug,
            les.title,
            `# ${les.title}\n\nWelcome to Day ${day.dayNumber} of **${prog.title}**.\n\n### Learning Objectives\n- Master key concepts covered in this module.\n- Apply practical exercises in your study or professional workspace.\n- Prepare for the session assessment.`,
            lessonOrder,
            les.type,
            les.duration,
            les.free,
            isReleased,
            isReleased ? 'immediate' : 'scheduled',
          ]);
          const lessonId = lesRes.rows[0].id;

          // Video
          if (les.type === 'video') {
            await client.query(`
              INSERT INTO training_videos (
                lesson_id, course_id, title, provider, video_url, external_video_id,
                duration_seconds, status, order_index
              )
              VALUES ($1, $2, $3, 'youtube', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ', $4, 'ready', 1);
            `, [
              lessonId,
              courseId,
              les.title,
              les.duration * 60,
            ]);
          }

          // Assessment
          if (les.type === 'assessment') {
            await client.query(`
              INSERT INTO training_assessments (
                course_id, module_id, lesson_id, title, description, assessment_type,
                passing_score, total_questions, questions_data, due_day, is_mandatory
              )
              VALUES ($1, $2, $3, $4, $5, 'quiz', 70, 3, $6::jsonb, $7, true);
            `, [
              courseId,
              moduleId,
              lessonId,
              `Day ${day.dayNumber} Practical Assessment: ${prog.title}`,
              `Comprehensive evaluation of concepts mastered throughout ${prog.title}. A score of 70% or higher is required for certificate eligibility.`,
              JSON.stringify([
                {
                  id: 1,
                  question: `What is the primary objective of ${prog.title}?`,
                  options: [
                    'Theoretical memorization without practical application',
                    'Empirical competence, professional structuring, and real-world execution',
                    'Bypassing institutional quality standards',
                    'None of the above'
                  ],
                  correctIndex: 1,
                  points: 30
                },
                {
                  id: 2,
                  question: 'Which standard threshold is configured for progressive course completion?',
                  options: [
                    '10% superficial skimming',
                    '80% minimum video viewing & learning progress',
                    'No viewing required if fees are paid',
                    'Zero assessment completion'
                  ],
                  correctIndex: 1,
                  points: 35
                },
                {
                  id: 3,
                  question: 'How are TaskLynk Training Academy certificates officially validated?',
                  options: [
                    'Unverified screenshot',
                    'Unique certificate serial number & online QR verification system',
                    'Social media hashtag',
                    'Informal verbal confirmation'
                  ],
                  correctIndex: 1,
                  points: 35
                }
              ]),
              day.dayNumber,
            ]);
          }

          lessonOrder++;
        }
      }

      console.log(`✓ Seeded program: "${prog.title}" (Cohort: ${prog.cohortCode}, Price: KSh ${prog.standardPrice})`);
    }

    console.log('🎉 Training Academy setup and database seeding complete!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Database migration error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

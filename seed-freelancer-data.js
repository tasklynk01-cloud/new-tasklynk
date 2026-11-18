import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';

dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

const databaseUrl = (process.env.DATABASE_URL || '').trim();
if (!databaseUrl) {
  console.error('❌ DATABASE_URL is not set');
  process.exit(1);
}

// Same connection-string handling as src/db/index.ts: strip query params
// (drizzle/pg's SSL negotiation needs the explicit `ssl` option below rather
// than a `sslmode` query param against Supabase's pooler).
const connectionStringForPool = databaseUrl.split('?')[0];
const pool = new Pool({
  connectionString: connectionStringForPool,
  ssl: databaseUrl.includes('supabase') ? { rejectUnauthorized: false } : undefined,
});

console.log('\n🌱 SEEDING FREELANCER DATA (Subjects, Software, Services)\n');
console.log('='.repeat(70));

// ✅ 1. Academic Subjects (Main Categories)
const SUBJECTS = [
  // A. Humanities & Social Sciences
  'English Literature', 'Philosophy', 'History', 'Sociology', 'Anthropology',
  'Psychology', 'Criminology', 'Gender Studies', 'Cultural Studies',
  'Political Science', 'International Relations', 'Religious Studies', 'Ethics',

  // B. Business & Management
  'Business Administration', 'Management', 'Marketing', 'Human Resource Management',
  'Operations Management', 'Supply Chain & Logistics', 'Strategic Management',
  'Entrepreneurship', 'Organizational Behavior', 'Business Law',
  'Corporate Governance', 'Hospitality & Tourism Management', 'Project Management',

  // C. Accounting & Finance
  'Accounting', 'Financial Management', 'Auditing', 'Taxation',
  'Investment & Portfolio Management', 'Financial Analysis', 'Banking & Finance',
  'Forensic Accounting',

  // D. Economics
  'Microeconomics', 'Macroeconomics', 'Econometrics', 'Development Economics',
  'Health Economics', 'International Economics', 'Agricultural Economics',

  // E. Law
  'Commercial Law', 'Criminal Law', 'Tort Law', 'Contract Law',
  'Constitutional Law', 'Employment Law', 'Family Law', 'Environmental Law',
  'International Law',

  // F. Nursing & Medical Sciences
  'Nursing', 'Public Health', 'Medicine', 'Health Care Administration',
  'Midwifery', 'Pathophysiology', 'Epidemiology', 'Pharmacology',
  'Anatomy & Physiology', 'Evidence-Based Practice', 'Mental Health Nursing',
  'Clinical Case Studies',

  // G. Education
  'Early Childhood Education', 'Special Needs Education', 'Educational Psychology',
  'Curriculum Development', 'Instructional Design', 'Teaching & Learning',
  'Classroom Management',

  // H. Computer Science & IT
  'Computer Science', 'Information Technology', 'Software Engineering',
  'Cybersecurity', 'Networking', 'Database Management', 'Web Development',
  'Cloud Computing', 'AI & Machine Learning', 'Algorithms',
  'Mobile App Development', 'Systems Analysis',

  // I. Engineering & Technical Fields
  'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
  'Chemical Engineering', 'Aerospace Engineering', 'Industrial Engineering',
  'Environmental Engineering', 'Mechatronics', 'Architecture',
  'Technical Drawings', 'AutoCAD Tasks',

  // J. Mathematics & Statistics
  'Pure Mathematics', 'Applied Mathematics', 'Statistics', 'Probability',
  'Calculus', 'Geometry', 'Financial Mathematics', 'Mathematical Modeling',

  // K. Sciences
  'Biology', 'Chemistry', 'Physics', 'Environmental Science', 'Geology',
  'Biotechnology', 'Genetics',
];

// ✅ 2. Software & Tools
const SOFTWARE = [
  // Statistical Analysis
  'SPSS', 'STATA', 'R Programming', 'Python (Data Science)', 'Excel (Advanced)',
  'SAS', 'EViews', 'JASP', 'JAMOVI', 'MATLAB',

  // Design, AutoCAD & Architecture
  'AutoCAD', 'ArchiCAD', 'SolidWorks', 'SketchUp', 'Revit', 'MATLAB (Engineering)',
  'ANSYS',

  // Programming Languages
  'Python', 'Java', 'C++', 'C#', 'JavaScript', 'PHP', 'SQL', 'R', 'HTML/CSS', 'MATLAB',

  // Project Management
  'MS Project', 'Trello', 'Notion', 'Asana', 'Jira',

  // Graphic Design & Media
  'Adobe Photoshop', 'Adobe Illustrator', 'Adobe Premiere', 'Canva', 'Figma',
];

// ✅ 3. Writing Services / Order Types
const SERVICES = [
  // Academic Writing
  'Essays', 'Research Papers', 'Term Papers', 'Literature Reviews',
  'Annotated Bibliographies', 'Case Studies', 'Thesis Writing',
  'Dissertation Writing', 'Capstone Projects', 'Discussion Posts',
  'Online Classes & Modules', 'Reports', 'Reflection Papers',
  'Coursework', 'Critical Analysis', 'Reaction Papers',

  // Technical & STEM Services
  'Lab Reports', 'Data Analysis', 'Coding Tasks', 'Engineering Calculations',
  'Technical Reports', 'Algorithms', 'Simulation Tasks',

  // Business Writing
  'Business Plans', 'Business Proposals', 'Feasibility Studies',
  'Market Research', 'Project Charters', 'Financial Forecasting',
  'Pitch Decks', 'SWOT Analysis', 'Business Reports', 'Policy Briefs',

  // Professional Services
  'Resume Writing', 'Cover Letters', 'LinkedIn Optimization',
  'Personal Statements', 'Statement of Purpose (SOP)', 'Grant Proposals',

  // Creative Services
  'Creative Writing', 'Speeches', 'Presentations (PowerPoint)',
  'Infographics', 'Scripts',
];

async function seedTable(table, names) {
  let inserted = 0;
  let skipped = 0;
  for (const name of names) {
    const existing = await pool.query(`SELECT id FROM ${table} WHERE name = $1`, [name]);
    if (existing.rows.length > 0) {
      skipped++;
      continue;
    }
    await pool.query(
      `INSERT INTO ${table} (name, status, created_at, updated_at) VALUES ($1, 'active', now(), now())`,
      [name]
    );
    inserted++;
  }
  return { inserted, skipped, total: names.length };
}

async function seedData() {
  try {
    console.log('\n📚 Step 1: Seeding Subjects...');
    const subjects = await seedTable('freelancer_subjects', SUBJECTS);
    console.log(`✅ Subjects: ${subjects.inserted} new, ${subjects.skipped} existing, ${subjects.total} total`);

    console.log('\n💻 Step 2: Seeding Software/Tools...');
    const software = await seedTable('freelancer_software', SOFTWARE);
    console.log(`✅ Software: ${software.inserted} new, ${software.skipped} existing, ${software.total} total`);

    console.log('\n📝 Step 3: Seeding Services/Work Types...');
    const services = await seedTable('freelancer_services', SERVICES);
    console.log(`✅ Services: ${services.inserted} new, ${services.skipped} existing, ${services.total} total`);

    console.log('\n' + '='.repeat(70));
    console.log('📊 SEEDING SUMMARY');
    console.log('='.repeat(70));
    console.log(`Subjects: ${subjects.inserted} new + ${subjects.skipped} existing = ${subjects.total} total`);
    console.log(`Software: ${software.inserted} new + ${software.skipped} existing = ${software.total} total`);
    console.log(`Services: ${services.inserted} new + ${services.skipped} existing = ${services.total} total`);
    console.log('Skills: static checklist in /api/freelancer/skills/options, no DB storage needed');
    console.log('\n🎯 Freelancer onboarding data is ready!');
    console.log('='.repeat(70) + '\n');
  } catch (error) {
    console.error('\n❌ SEEDING FAILED:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seedData();

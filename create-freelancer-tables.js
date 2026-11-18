const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function createTables() {
  console.log('Creating freelancer onboarding tables...');

  const queries = [
    // Add skills_completed column to users table if not exists
    `ALTER TABLE users ADD COLUMN skills_completed INTEGER DEFAULT 0`,
    
    // Create freelancer_subjects table
    `CREATE TABLE IF NOT EXISTS freelancer_subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,

    // Create freelancer_software table
    `CREATE TABLE IF NOT EXISTS freelancer_software (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,

    // Create freelancer_services table
    `CREATE TABLE IF NOT EXISTS freelancer_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,

    // Create freelancer_subject_map table
    `CREATE TABLE IF NOT EXISTS freelancer_subject_map (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      freelancer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject_id INTEGER NOT NULL REFERENCES freelancer_subjects(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL
    )`,

    // Create freelancer_software_map table
    `CREATE TABLE IF NOT EXISTS freelancer_software_map (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      freelancer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      software_id INTEGER NOT NULL REFERENCES freelancer_software(id) ON DELETE CASCADE,
      other_software TEXT,
      created_at TEXT NOT NULL
    )`,

    // Create freelancer_services_map table
    `CREATE TABLE IF NOT EXISTS freelancer_services_map (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      freelancer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      service_id INTEGER NOT NULL REFERENCES freelancer_services(id) ON DELETE CASCADE,
      other_service TEXT,
      created_at TEXT NOT NULL
    )`,
  ];

  for (const query of queries) {
    try {
      await client.execute(query);
      console.log('✓ Executed:', query.substring(0, 60) + '...');
    } catch (error) {
      if (error.message.includes('duplicate column') || error.message.includes('already exists')) {
        console.log('⚠ Skipped (already exists):', query.substring(0, 60) + '...');
      } else {
        console.error('✗ Error:', error.message);
      }
    }
  }

  // Seed initial subjects
  const subjects = [
    'Accounting', 'Finance', 'Economics', 'Statistics', 'Mathematics',
    'Computer Science', 'Information Technology', 'Nursing', 'Medicine', 'Public Health',
    'Biology', 'Chemistry', 'Physics', 'Environmental Science', 'Business Studies',
    'Human Resource Management', 'Marketing', 'Project Management', 'Sociology', 'Psychology',
    'Philosophy', 'Education', 'History', 'Political Science', 'Law',
    'Criminology', 'Engineering (Civil)', 'Engineering (Electrical)', 'Engineering (Mechanical)', 'Engineering (Software)',
    'Architecture', 'Art & Design', 'Literature', 'Communication', 'Supply Chain & Logistics'
  ];

  const software = [
    'SPSS', 'STATA', 'R', 'Python', 'MATLAB',
    'EViews', 'Excel', 'PowerPoint', 'Word', 'Tableau',
    'PowerBI', 'AutoCAD', 'ArcGIS', 'RevMan', 'NVIVO',
    'Zotero', 'EndNote', 'LaTeX', 'Adobe Photoshop', 'Adobe Illustrator',
    'Canva'
  ];

  const services = [
    'Essay Writing', 'Research Papers', 'Case Studies', 'Reports', 'Business Plans',
    'Coursework', 'Technical Work', 'Coding Assignments', 'Data Analysis', 'Proofreading & Editing',
    'Literature Reviews', 'Annotated Bibliographies', 'Capstone Projects', 'Theses & Dissertations', 'Presentations',
    'Lab Reports', 'Marketing Plans', 'CV/Resume Writing', 'Personal Statements'
  ];

  const now = new Date().toISOString();

  // Seed subjects
  console.log('\nSeeding subjects...');
  for (const name of subjects) {
    try {
      await client.execute({
        sql: 'INSERT INTO freelancer_subjects (name, status, created_at, updated_at) VALUES (?, ?, ?, ?)',
        args: [name, 'active', now, now]
      });
      console.log('✓ Added subject:', name);
    } catch (error) {
      if (error.message.includes('UNIQUE')) {
        console.log('⚠ Subject exists:', name);
      } else {
        console.error('✗ Error adding subject:', name, error.message);
      }
    }
  }

  // Seed software
  console.log('\nSeeding software...');
  for (const name of software) {
    try {
      await client.execute({
        sql: 'INSERT INTO freelancer_software (name, status, created_at, updated_at) VALUES (?, ?, ?, ?)',
        args: [name, 'active', now, now]
      });
      console.log('✓ Added software:', name);
    } catch (error) {
      if (error.message.includes('UNIQUE')) {
        console.log('⚠ Software exists:', name);
      } else {
        console.error('✗ Error adding software:', name, error.message);
      }
    }
  }

  // Seed services
  console.log('\nSeeding services...');
  for (const name of services) {
    try {
      await client.execute({
        sql: 'INSERT INTO freelancer_services (name, status, created_at, updated_at) VALUES (?, ?, ?, ?)',
        args: [name, 'active', now, now]
      });
      console.log('✓ Added service:', name);
    } catch (error) {
      if (error.message.includes('UNIQUE')) {
        console.log('⚠ Service exists:', name);
      } else {
        console.error('✗ Error adding service:', name, error.message);
      }
    }
  }

  console.log('\n✅ Freelancer onboarding tables and seed data complete!');
}

createTables().catch(console.error);

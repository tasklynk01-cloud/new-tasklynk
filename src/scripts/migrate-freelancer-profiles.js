const { Client } = require('pg');
require('dotenv').config();

const url = (process.env.DATABASE_URL || '').trim().split('?')[0];
const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

async function migrate() {
  await client.connect();
  console.log('Connected to DB for migration...');

  const sqlStatements = [
    `ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS public_slug VARCHAR(255) UNIQUE;`,
    `ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS profile_headline VARCHAR(255);`,
    `ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS profile_status VARCHAR(50) NOT NULL DEFAULT 'draft';`,
    `ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]'::jsonb;`,
    `ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS experience JSONB DEFAULT '[]'::jsonb;`,
    `ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS portfolio_screenshots JSONB DEFAULT '[]'::jsonb;`,
    `ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);`,
    `ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS seo_description TEXT;`,
    `ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;`,
    `ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL;`,
    `ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS review_notes TEXT;`,
  ];

  for (const sql of sqlStatements) {
    try {
      await client.query(sql);
      console.log('Executed:', sql);
    } catch (err) {
      console.error('Error on statement:', sql, err.message);
    }
  }

  console.log('Migration complete!');
  await client.end();
}

migrate().catch(console.error);

const bcrypt = require('bcrypt');
const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function updateAdminPasswords() {
  const newPassword = 'kemoda2026';
  const saltRounds = 10;
  
  try {
    console.log('🔐 Generating new password hash...');
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    console.log('✅ Hash generated:', hashedPassword);
    
    console.log('\n�� Fetching all admin users...');
    const admins = await client.execute('SELECT id, email, name FROM users WHERE role = "admin"');
    
    console.log(`\n👥 Found ${admins.rows.length} admin users:`);
    admins.rows.forEach(admin => {
      console.log(`   - ${admin.email} (${admin.name})`);
    });
    
    console.log('\n🔄 Updating passwords...');
    const result = await client.execute({
      sql: 'UPDATE users SET password = ? WHERE role = "admin"',
      args: [hashedPassword]
    });
    
    console.log(`✅ Updated ${result.rowsAffected} admin password(s)`);
    
    console.log('\n✅ All admin passwords updated to: kemoda2026');
    console.log('\n📝 Admin accounts:');
    admins.rows.forEach(admin => {
      console.log(`   - ${admin.email} / kemoda2026`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateAdminPasswords();

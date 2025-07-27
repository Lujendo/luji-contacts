#!/usr/bin/env node

const bcrypt = require('bcryptjs');

async function generatePasswordHashes() {
  console.log('🔐 Generating correct password hashes...');
  
  const password = 'password123';
  const saltRounds = 10;
  
  // Generate hash for password123
  const hash = await bcrypt.hash(password, saltRounds);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  
  // Verify the hash works
  const isValid = await bcrypt.compare(password, hash);
  console.log(`Verification: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
  
  // Generate SQL to update the database
  const sql = `
-- Update user passwords with correct hash
UPDATE users SET password = '${hash}' WHERE username = 'admin';
UPDATE users SET password = '${hash}' WHERE username = 'demo_user';
`;
  
  console.log('\n📝 SQL to update passwords:');
  console.log(sql);
  
  // Save to file
  const fs = require('fs').promises;
  await fs.writeFile('fix-passwords.sql', sql.trim());
  console.log('\n💾 SQL saved to fix-passwords.sql');
}

generatePasswordHashes().catch(console.error);

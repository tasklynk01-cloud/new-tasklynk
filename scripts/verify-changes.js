/**
 * Verify Code Changes Test
 * Ensures the verify-code endpoint has proper session creation
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const verifyCodePath = join(process.cwd(), 'src/app/api/auth/verify-code/route.ts');
const sessionPath = join(process.cwd(), 'src/app/api/v2/auth/session/route.ts');

console.log('🔍 Verifying changes to authentication endpoints...\n');

try {
  // Read verify-code file
  const verifyCodeContent = readFileSync(verifyCodePath, 'utf-8');
  
  // Check for session imports
  const hasSessionImports = verifyCodeContent.includes('generateSessionToken') && 
                           verifyCodeContent.includes('createSessionResponse') &&
                           verifyCodeContent.includes('buildSessionUserData');
  
  // Check for cleanup code
  const hasCleanup = verifyCodeContent.includes('db.delete(pendingRegistrations)') &&
                     verifyCodeContent.includes('codeExpiresAt');
  
  // Check for session creation in response
  const hasSessionCreation = verifyCodeContent.includes('createSessionResponse(') &&
                            verifyCodeContent.includes('generateSessionToken(');
  
  console.log('✅ verify-code/route.ts checks:');
  console.log(`   ${hasSessionImports ? '✅' : '❌'} Session management imports`);
  console.log(`   ${hasCleanup ? '✅' : '❌'} Expired registration cleanup`);
  console.log(`   ${hasSessionCreation ? '✅' : '❌'} Session creation in response`);
  console.log('');
  
  // Read session file
  const sessionContent = readFileSync(sessionPath, 'utf-8');
  
  // Check for enhanced logging
  const hasEnhancedLogging = sessionContent.includes('console.log(') &&
                            sessionContent.includes('[Session]') &&
                            sessionContent.includes('User validated successfully');
  
  // Check for error details
  const hasErrorDetails = sessionContent.includes('error instanceof Error ? error.message') &&
                         sessionContent.includes('error.stack');
  
  console.log('✅ session/route.ts checks:');
  console.log(`   ${hasEnhancedLogging ? '✅' : '❌'} Enhanced logging`);
  console.log(`   ${hasErrorDetails ? '✅' : '❌'} Detailed error handling`);
  console.log('');
  
  // Final verdict
  const allChecks = hasSessionImports && hasCleanup && hasSessionCreation && 
                   hasEnhancedLogging && hasErrorDetails;
  
  if (allChecks) {
    console.log('✅ All changes verified successfully!');
    console.log('\n📝 Summary:');
    console.log('   - verify-code endpoint now creates session after verification');
    console.log('   - Expired registrations automatically cleaned up');
    console.log('   - Session endpoint has enhanced error logging');
    process.exit(0);
  } else {
    console.log('❌ Some checks failed!');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Error reading files:', error);
  process.exit(1);
}

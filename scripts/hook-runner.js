const { execSync } = require('child_process');
const path = require('path');

const repoPath = process.cwd();

function detectChanges(from, to) {
  try {
    const diff = execSync(`git diff --name-only ${from} ${to}`, { cwd: repoPath, encoding: 'utf8' });
    const files = diff.split('\n').filter(Boolean);
    
    const migrations = files.filter(f => f.includes('prisma/migrations') || f.includes('db/migrations') || f.endsWith('migration.sql'));
    const shared = files.filter(f => f.includes('shared/') || f.includes('packages/shared/') || f.includes('libs/shared/'));
    const pkg = files.some(f => f.endsWith('package.json'));
    
    const critical = [...migrations, ...shared];
    if (pkg) critical.push('package.json');
    
    return { migrations, shared, packageJson: pkg, critical };
  } catch(e) {
    return { migrations: [], shared: [], packageJson: false, critical: [] };
  }
}

function runPostMerge() {
  console.log('\n🔍 Checking for critical changes after pull...\n');
  try {
    const log = execSync('git log --oneline -2', { cwd: repoPath, encoding: 'utf8' });
    const commits = log.trim().split('\n');
    const from = commits[1]?.split(' ')[0] || 'HEAD~1';
    const to = commits[0]?.split(' ')[0];
    
    if (from && to) {
      const changes = detectChanges(from, to);
      
      if (changes.critical.length > 0) {
        console.log('⚠️ CRITICAL CHANGES DETECTED AFTER PULL ⚠️\n');
        if (changes.migrations.length) {
          console.log('📦 Migrations:', changes.migrations.join(', '));
          console.log('   → Run: npx prisma migrate deploy\n');
        }
        if (changes.shared.length) {
          console.log('🔄 Shared:', changes.shared.join(', '));
          console.log('   → May need rebuild\n');
        }
        if (changes.packageJson) {
          console.log('📝 package.json changed');
          console.log('   → Run: npm install\n');
        }
      } else {
        console.log('✅ No critical changes detected.');
      }
    }
  } catch(e) {
    console.error('⚠️ Error checking changes:', e.message);
  }
}

function runPostCheckout(prev, next) {
  process.stderr.write(`\n🔍 Checking for critical changes (switching to ${next})...\n`);
  try {
    // Get the merge-base to compare changes between branches
    const changes = detectChanges(prev, next);
    
    if (changes.critical.length > 0) {
      console.error('⚠️ CRITICAL CHANGES DETECTED ⚠️');
      if (changes.migrations.length) {
        console.error('📦 Migrations:', changes.migrations.join(', '));
        console.error('   → Run: npx prisma migrate deploy');
      }
      if (changes.shared.length) {
        console.error('🔄 Shared:', changes.shared.join(', '));
        console.error('   → May need rebuild');
      }
      if (changes.packageJson) {
        console.error('📝 package.json changed');
        console.error('   → Run: npm install');
      }
      console.error('✅ Branch switched. Run commands above if needed!');
    } else {
      console.error('✅ No critical changes detected.');
    }
  } catch(e) {
    console.error('⚠️ Error checking changes:', e.message);
  }
}

const hook = process.argv[2];
if (hook === 'post-merge') runPostMerge();
else if (hook === 'post-checkout') runPostCheckout(process.argv[3], process.argv[4]);

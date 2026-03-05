#!/bin/bash
# Install hooks to current repository

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOKS_DIR="$(pwd)/.git/hooks"

echo "Installing branch watcher hooks..."

# Install post-merge hook
cat > "$HOOKS_DIR/post-merge" << 'EOF'
#!/bin/sh
# Post-merge hook - runs after git pull
npx ts-node --esm node_modules/branch-watcher/src/hooks/branch-check.ts post-merge 2>/dev/null || node -e "
const { execSync } = require('child_process');
const git = require('simple-git')();
(async () => {
  try {
    const prev = await git.log({ maxCount: 2 });
    const from = prev.all[1]?.hash || 'HEAD~1';
    const to = prev.all[0]?.hash;
    const diff = await git.diff(['--name-only', from, to]);
    const files = diff.split('\n').filter(Boolean);
    const migrations = files.filter(f => f.includes('prisma/migrations') || f.includes('db/migrations') || f.endsWith('migration.sql'));
    const shared = files.filter(f => f.includes('shared/') || f.includes('packages/shared/') || f.includes('libs/shared/'));
    const pkg = files.some(f => f.endsWith('package.json'));
    const critical = [...migrations, ...shared];
    if (pkg) critical.push('package.json');
    if (critical.length) {
      console.log('\n⚠️ CRITICAL CHANGES DETECTED AFTER PULL ⚠️\n');
      if (migrations.length) { console.log('📦 Migrations:', migrations.join(', '), '\n→ Run: npx prisma migrate deploy\n'); }
      if (shared.length) { console.log('🔄 Shared:', shared.join(', '), '\n→ May need rebuild\n'); }
      if (pkg) console.log('📝 package.json changed\n→ Run: npm install\n');
    }
  } catch(e) {}
})();
"
EOF

# Install post-checkout hook
cat > "$HOOKS_DIR/post-checkout" << 'EOF'
#!/bin/sh
PREV="$1"
NEW="$2"
TYPE="$3"
[ "$TYPE" = "1" ] && npx ts-node --esm node_modules/branch-watcher/src/hooks/branch-check.ts post-checkout "$PREV" "$NEW" 2>/dev/null || node -e "
const { execSync } = require('child_process');
const git = require('simple-git')();
(async () => {
  try {
    const diff = await git.diff(['--name-only', process.argv[2], process.argv[3]]);
    const files = diff.split('\n').filter(Boolean);
    const migrations = files.filter(f => f.includes('prisma/migrations') || f.includes('db/migrations') || f.endsWith('migration.sql'));
    const shared = files.filter(f => f.includes('shared/') || f.includes('packages/shared/') || f.includes('libs/shared/'));
    const pkg = files.some(f => f.endsWith('package.json'));
    const critical = [...migrations, ...shared];
    if (pkg) critical.push('package.json');
    if (critical.length) {
      console.log('\n⚠️ CRITICAL CHANGES DETECTED ⚠️\n');
      if (migrations.length) { console.log('📦 Migrations:', migrations.join(', '), '\n→ Run: npx prisma migrate deploy\n'); }
      if (shared.length) { console.log('🔄 Shared:', shared.join(', '), '\n→ May need rebuild\n'); }
      if (pkg) console.log('📝 package.json changed\n→ Run: npm install\n');
    } else console.log('✅ No critical changes');
  } catch(e) {}
})();
" -- "$PREV" "$NEW"
EOF

chmod +x "$HOOKS_DIR/post-merge" "$HOOKS_DIR/post-checkout"
echo "✅ Hooks installed! Run 'git pull' or 'git checkout' to test."

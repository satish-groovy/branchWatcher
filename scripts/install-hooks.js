const fs = require('fs');
const path = require('path');

const hookCode = fs.readFileSync(path.join(__dirname, 'hook-runner.js'), 'utf8');

function installHooks() {
  const hooksDir = path.join(process.cwd(), '.git', 'hooks');
  
  if (!fs.existsSync(hooksDir)) {
    console.log('❌ Not a git repository');
    return;
  }

  const shebang = '#!/usr/bin/env node\n';
  
  fs.writeFileSync(path.join(hooksDir, 'post-merge'), shebang + hookCode);
  fs.writeFileSync(path.join(hooksDir, 'post-checkout'), shebang + hookCode);

  fs.chmodSync(path.join(hooksDir, 'post-merge'), '755');
  fs.chmodSync(path.join(hooksDir, 'post-checkout'), '755');
  
  console.log('✅ branch-watcher hooks installed!');
  console.log('   - post-merge: runs after git pull');
  console.log('   - post-checkout: runs after git checkout/switch');
}

installHooks();

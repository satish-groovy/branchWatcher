#!/usr/bin/env node
import { simpleGit } from "simple-git";
import path from "path";

const repoPath = process.cwd();
const git = simpleGit(repoPath);

interface BranchChanges {
  migrations: string[];
  shared: string[];
  packageJson: boolean;
  critical: string[];
  allFiles: string[];
}

async function detectBranchChanges(from: string, to: string): Promise<BranchChanges> {
  try {
    const diff = await git.diff(["--name-only", from, to]);
    const files = diff.split("\n").filter(Boolean);

    const migrations = files.filter(f => 
      f.includes("prisma/migrations") || 
      f.includes("db/migrations") ||
      f.endsWith("migration.sql")
    );

    const shared = files.filter(f => 
      f.includes("shared/") || 
      f.includes("packages/shared/") ||
      f.includes("libs/shared/")
    );

    const packageJson = files.some(f => f.endsWith("package.json"));

    const critical = [...migrations, ...shared];
    if (packageJson) critical.push("package.json");

    return { migrations, shared, packageJson, critical, allFiles: files };
  } catch (error) {
    console.error("Error detecting changes:", error);
    return { migrations: [], shared: [], packageJson: false, critical: [], allFiles: [] };
  }
}

async function runPostMerge() {
  console.log("\n🔍 Checking for critical changes after pull...\n");
  
  const status = await git.status();
  const branches = await git.branch();
  const currentBranch = status.current || "HEAD";
  
  const lastMergeCommit = await git.log({ maxCount: 1, format: "%H" });
  const previousCommit = await git.log({ maxCount: 2 });
  
  const fromCommit = previousCommit.all[1]?.hash || "HEAD^";
  const toCommit = previousCommit.all[0]?.hash;

  if (fromCommit && toCommit) {
    const changes = await detectBranchChanges(fromCommit, toCommit);
    
    if (changes.critical.length > 0) {
      console.log("⚠️ CRITICAL CHANGES DETECTED AFTER PULL ⚠️\n");
      
      if (changes.migrations.length > 0) {
        console.log("📦 Migrations:");
        changes.migrations.forEach(f => console.log(`   - ${f}`));
        console.log("   → Run: npx prisma migrate deploy\n");
      }
      
      if (changes.shared.length > 0) {
        console.log("🔄 Shared code changes:");
        changes.shared.forEach(f => console.log(`   - ${f}`));
        console.log("   → May need rebuild\n");
      }
      
      if (changes.packageJson) {
        console.log("📝 package.json changed");
        console.log("   → Run: npm install\n");
      }
    } else {
      console.log("✅ No critical changes detected.");
    }
  }
}

async function runPostCheckout(prevBranch: string, newBranch: string) {
  console.log(`\n🔍 Checking for critical changes while switching to ${newBranch}...\n`);
  
  try {
    const diff = await git.diff([`${prevBranch}...${newBranch}`, "--name-only"]);
    const files = diff.split("\n").filter(Boolean);

    const migrations = files.filter(f => 
      f.includes("prisma/migrations") || 
      f.includes("db/migrations") ||
      f.endsWith("migration.sql")
    );

    const shared = files.filter(f => 
      f.includes("shared/") || 
      f.includes("packages/shared/") ||
      f.includes("libs/shared/")
    );

    const packageJson = files.some(f => f.endsWith("package.json"));

    const critical = [...migrations, ...shared];
    if (packageJson) critical.push("package.json");

    if (critical.length > 0) {
      console.log("⚠️ CRITICAL CHANGES DETECTED ⚠️\n");

      if (migrations.length > 0) {
        console.log("📦 Migrations:");
        migrations.forEach(f => console.log(`   - ${f}`));
        console.log("   → Run: npx prisma migrate deploy\n");
      }

      if (shared.length > 0) {
        console.log("🔄 Shared code changes:");
        shared.forEach(f => console.log(`   - ${f}`));
        console.log("   → May need rebuild\n");
      }

      if (packageJson) {
        console.log("📝 package.json changed");
        console.log("   → Run: npm install\n");
      }

      console.log("✅ Switched branch. Don't forget to run necessary commands above!\n");
    } else {
      console.log("✅ No critical changes detected.");
    }
  } catch (error) {
    console.log("⚠️ Could not detect changes:", error);
  }
}

const hookType = process.argv[2];

if (hookType === "post-merge") {
  runPostMerge();
} else if (hookType === "post-checkout") {
  const prevBranch = process.argv[3];
  const newBranch = process.argv[4];
  runPostCheckout(prevBranch, newBranch);
}

import { GitTool } from "./tools/git";
import { PrismaTool } from "./tools/prisma";
import { FSTool } from "./tools/fs";
import { GeminiAI } from "./ai/gemini";
import { Planner } from "./agent/planner";
import { Executor } from "./agent/executor";
import { AgentLoop } from "./agent/loop";
import { DecisionEngine } from "./agent/decision";
import { MemoryStore } from "./agent/memory";
import { SafetyLayer } from "./tools/safety";

export async function runGuardian(repoPath: string, apiKey: string) {
  const git = new GitTool(repoPath);
  const prisma = new PrismaTool();
  const fs = new FSTool();
  const ai = new GeminiAI(apiKey);
  const planner = new Planner(ai);
  const executor = new Executor(git, prisma, fs);
  const agent = new AgentLoop(planner, executor);
  const decisionEngine = new DecisionEngine();
  const memory = new MemoryStore(repoPath);

  const currentBranch = await git.getCurrentBranch();
  const prevCommit = await git.getPreviousCommit();
  const changedFiles = await git.getDiffNames(prevCommit, "HEAD");

  // Check for critical changes before any operation
  const warningCheck = await git.pullWithWarningCheck(prevCommit, "HEAD");

  if (warningCheck.warning) {
    console.log("\n⚠️ CRITICAL CHANGES DETECTED ⚠️");
    console.log(warningCheck.warning);
  }

  // 1. Deterministic Safety Layer First
  const dangerousFindings: string[] = [];
  for (const file of changedFiles) {
    if (file.endsWith(".sql") || file.includes("prisma/schema")) {
      const content = await fs.readFile(file);
      dangerousFindings.push(...SafetyLayer.detectDangerousSQL(content));
    }
  }

  if (dangerousFindings.length > 0) {
    console.log("⚠️ DETERMINISTIC SAFETY ALERT ⚠️");
    dangerousFindings.forEach((f) => console.log(`- ${f}`));
  }

  // 2. AI Agent Analysis
  console.log(`🧠 AI Guardian analyzing branch: ${currentBranch}...`);
  const initialContext = {
    branch: currentBranch,
    changedFiles,
    memories: await memory.load(),
    deterministicFindings: dangerousFindings,
    criticalChanges: warningCheck.changes,
    hasWarning: !!warningCheck.warning,
  };

  const aiResult = await agent.run(initialContext);
  const finalDecision = decisionEngine.evaluate(aiResult);

  // 3. Execution based on Decision
  console.log("\n--- GUARDIAN DECISION ---");
  console.log(`Risk: ${finalDecision.risk ? "YES" : "NO"}`);
  console.log(`Severity: ${finalDecision.severity.toUpperCase()}`);
  console.log(`Decision: ${finalDecision.decision.toUpperCase()}`);
  console.log(`Explanation: ${finalDecision.explanation}`);

  if (finalDecision.warnings.length > 0) {
    console.log("Warnings:");
    finalDecision.warnings.forEach((w) => console.log(`- ${w}`));
  }

  if (finalDecision.decision === "require_confirmation") {
    const inquirer = (await import("inquirer")).default;
    const { proceed } = await inquirer.prompt([
      {
        type: "confirm",
        name: "proceed",
        message:
          "The AI Guardian suggests review. Do you want to continue anyway?",
        default: false,
      },
    ]);
    if (!proceed) {
      console.log("Aborted by user.");
      process.exit(0);
    }
  }

  if (finalDecision.decision === "block") {
    console.error("\n❌ BLOCKING START: High risk detected.");
    process.exit(1);
  }

  // Save to memory
  await memory.save({
    lastBranch: currentBranch,
    previousRisks: finalDecision.risk ? [finalDecision] : [],
    recentMigrations: changedFiles.filter((f) => f.includes("migrations/")),
  });
}

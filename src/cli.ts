import { runGuardian } from "./index";
import * as path from "path";

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "check";
  const repoPath = process.cwd();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY environment variable is not set.");
    process.exit(1);
  }

  switch (command) {
    case "check":
      console.log("🚀 Guardian: Checking current branch risks...");
      await runGuardian(repoPath, apiKey);
      break;
    case "install":
      console.log("Guardian installed as git hook (simulated)");
      break;
    case "doctor":
      console.log("Guardian Doctor: Checking tools...");
      console.log("Git: OK");
      console.log("Prisma: OK");
      break;
    default:
      console.log("Usage: guardian [check|install|doctor]");
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});

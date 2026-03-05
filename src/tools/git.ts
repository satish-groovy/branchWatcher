import { simpleGit, SimpleGit, CleanOptions } from "simple-git";

export interface BranchChanges {
  migrations: string[];
  shared: string[];
  packageJson: boolean;
  critical: string[];
  allFiles: string[];
}

export class GitTool {
  private git: SimpleGit;

  constructor(repoPath: string) {
    this.git = simpleGit(repoPath);
  }

  async getCurrentBranch(): Promise<string> {
    const status = await this.git.status();
    return status.current || "unknown";
  }

  async getDiffNames(from: string, to: string): Promise<string[]> {
    const diff = await this.git.diff(["--name-only", from, to]);
    return diff.split("\n").filter(Boolean);
  }

  async getFullDiff(from: string, to: string): Promise<string> {
    return await this.git.diff([from, to]);
  }

  async getPreviousCommit(): Promise<string> {
    const log = await this.git.log({ maxCount: 2 });
    return log.all[1]?.hash || "HEAD^";
  }

  async detectBranchChanges(from: string, to: string): Promise<BranchChanges> {
    const diff = await this.git.diff(["--name-only", from, to]);
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

    return {
      migrations,
      shared,
      packageJson,
      critical,
      allFiles: files,
    };
  }

  async pullWithWarningCheck(fromBranch: string, toBranch: string): Promise<{
    canPull: boolean;
    warning?: string;
    changes: BranchChanges;
  }> {
    const changes = await this.detectBranchChanges(fromBranch, toBranch);

    if (changes.critical.length === 0) {
      return { canPull: true, changes };
    }

    const warningParts: string[] = [];
    if (changes.migrations.length > 0) {
      warningParts.push(`⚠️ Migrations detected: ${changes.migrations.join(", ")}`);
    }
    if (changes.shared.length > 0) {
      warningParts.push(`⚠️ Shared code changes: ${changes.shared.join(", ")}`);
    }
    if (changes.packageJson) {
      warningParts.push("⚠️ package.json changed - run npm install after pull");
    }

    return {
      canPull: true,
      warning: warningParts.join("\n"),
      changes,
    };
  }
}

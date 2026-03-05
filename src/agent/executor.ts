import { GitTool } from "../tools/git";
import { PrismaTool } from "../tools/prisma";
import { FSTool } from "../tools/fs";

export class Executor {
  constructor(
    private git: GitTool,
    private prisma: PrismaTool,
    private fs: FSTool,
  ) {}

  async execute(action: string, input: any): Promise<any> {
    switch (action) {
      case "git_diff_names":
        return await this.git.getDiffNames(input.from, input.to);
      case "git_diff_full":
        return await this.git.getFullDiff(input.from, input.to);
      case "git_branch_changes":
        return await this.git.detectBranchChanges(input.from, input.to);
      case "git_pull_warning_check":
        return await this.git.pullWithWarningCheck(input.from, input.to);
      case "prisma_status":
        return await this.prisma.runPrismaStatus();
      case "read_file":
        return await this.fs.readFile(input.path);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
}

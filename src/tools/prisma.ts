import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class PrismaTool {
  async runPrismaStatus(): Promise<{ success: boolean; output: string }> {
    try {
      // Check if prisma is available and get status
      const { stdout } = await execAsync("npx prisma validate");
      return { success: true, output: stdout };
    } catch (error: any) {
      return { success: false, output: error.stdout || error.message };
    }
  }

  async checkMigrationFolder(migrationsPath: string): Promise<string[]> {
    try {
      // Simple check for migration files
      const { stdout } = await execAsync(`ls -R ${migrationsPath}`);
      return stdout.split("\n").filter((line: string) => line.includes(".sql"));
    } catch {
      return [];
    }
  }
}

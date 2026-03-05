import * as fs from "fs/promises";
import * as path from "path";

export class FSTool {
  async readFile(filePath: string): Promise<string> {
    return await fs.readFile(filePath, "utf-8");
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  filterRiskyFiles(files: string[]): string[] {
    const riskyPatterns = [
      /prisma\/schema\.prisma/i,
      /migrations\//i,
      /\.env/i,
      /src\/api\//i,
      /config\//i,
      /\.sql$/i,
    ];

    return files.filter((file) =>
      riskyPatterns.some((pattern) => pattern.test(file)),
    );
  }
}

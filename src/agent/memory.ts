import * as fs from "fs/promises";
import * as path from "path";

export interface MemoryData {
  lastBranch: string;
  previousRisks: any[];
  recentMigrations: string[];
}

export class MemoryStore {
  private filePath: string;

  constructor(repoPath: string) {
    this.filePath = path.join(repoPath, ".guardian-memory.json");
  }

  async load(): Promise<MemoryData> {
    try {
      const content = await fs.readFile(this.filePath, "utf-8");
      return JSON.parse(content);
    } catch {
      return {
        lastBranch: "",
        previousRisks: [],
        recentMigrations: [],
      };
    }
  }

  async save(data: MemoryData): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
  }
}

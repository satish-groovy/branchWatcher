export class SafetyLayer {
  static detectDangerousSQL(content: string): string[] {
    const dangerousPatterns = [
      { pattern: /DROP\s+TABLE/i, message: "Detected DROP TABLE statement" },
      { pattern: /DROP\s+COLUMN/i, message: "Detected DROP COLUMN statement" },
      { pattern: /TRUNCATE\s+TABLE/i, message: "Detected TRUNCATE statement" },
      {
        pattern: /ALTER\s+TABLE.*DROP/i,
        message: "Detected ALTER TABLE DROP statement",
      },
    ];

    const findings: string[] = [];
    for (const { pattern, message } of dangerousPatterns) {
      if (pattern.test(content)) {
        findings.push(message);
      }
    }
    return findings;
  }

  static isDestructiveMigration(fileName: string): boolean {
    // Basic heuristic: migrations ending in _drop or _delete
    return /_drop|_delete/i.test(fileName);
  }
}

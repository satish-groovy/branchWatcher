import { GeminiAI } from "../ai/gemini";

export interface Action {
  action: string;
  reason: string;
  input: any;
}

export class Planner {
  constructor(private ai: GeminiAI) {}

  async createPlan(context: any): Promise<Action> {
    const systemPrompt = `
     You are a senior DevOps assistant.

A developer switched git branches.

Previous commit: {{prev}}
New commit: {{new}}

You can execute these commands:

- git diff {{prev}} {{new}}
- git diff --name-only {{prev}} {{new}}

Tasks:

1. Use git diff --name-only to identify changed files.
2. If relevant files changed, use git diff to analyze content.
3. Detect:
   - database migrations
   - prisma/schema changes
   - shared folder changes
   - env/config changes
   - dependency changes
   - breaking API changes
   - destructive SQL (DROP TABLE, DROP COLUMN, ALTER type changes)

4. If risky changes exist, return structured JSON in this format:

{
  "risk": true | false,
  "severity": "low" | "medium" | "high",
  "warnings": [
    {
      "type": "migration | schema | shared | config | api",
      "message": "short explanation",
      "impact": "what may break",
      "recommended_action": "what developer should do"
    }
  ]
}

If no risk found:

{
  "risk": false,
  "severity": "low",
  "warnings": []
}
    `;

    return await this.ai.analyze(systemPrompt, context);
  }
}

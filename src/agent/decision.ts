export type RiskSeverity = "low" | "medium" | "high";
export type DecisionType =
  | "safe"
  | "warn_only"
  | "require_confirmation"
  | "block";

export interface FinalDecision {
  risk: boolean;
  severity: RiskSeverity;
  decision: DecisionType;
  warnings: string[];
  explanation: string;
}

export class DecisionEngine {
  evaluate(aiResult: any): FinalDecision {
    // If AI fails to provide proper structure, default to high risk/block
    if (!aiResult || typeof aiResult !== "object") {
      return {
        risk: true,
        severity: "high",
        decision: "block",
        warnings: ["Failed to process AI decision"],
        explanation:
          "The agent encountered an error while evaluating the risks.",
      };
    }

    return {
      risk: aiResult.risk ?? false,
      severity: aiResult.severity ?? "low",
      decision: aiResult.decision ?? "safe",
      warnings: aiResult.warnings ?? [],
      explanation: aiResult.explanation ?? "No specific risk detected.",
    };
  }
}

import { Planner, Action } from "./planner";
import { Executor } from "./executor";

export class AgentLoop {
  constructor(
    private planner: Planner,
    private executor: Executor,
  ) {}

  async run(initialContext: any): Promise<any> {
    const context = { ...initialContext, history: [] as any[] };
    let finished = false;
    let iterations = 0;
    const MAX_ITERATIONS = 5;

    while (!finished && iterations < MAX_ITERATIONS) {
      iterations++;
      const plan: Action = await this.planner.createPlan(context);

      if (plan.action === "final_decision") {
        finished = true;
        return plan.input;
      }

      const result = await this.executor.execute(plan.action, plan.input);
      context.history.push({
        thought: plan.reason,
        action: plan.action,
        input: plan.input,
        result,
      });
    }

    return { error: "Reached max iterations" };
  }
}

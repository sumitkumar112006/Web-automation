import type { Stagehand } from "@browserbasehq/stagehand";

type AgentResultLike = {
  success?: boolean;
  message?: string;
  completed?: boolean;
};

type AgentCapableStagehand = Stagehand & {
  agent?: () => {
    execute?: (instruction: string) => Promise<AgentResultLike>;
  };
};

export async function agent({
  stagehand,
  instruction,
}: {
  stagehand: Stagehand;
  instruction: string;
}) {
  const sh = stagehand as AgentCapableStagehand;
  if (typeof sh.agent === "function") {
    const agentInstance = sh.agent();
    const result =
      typeof agentInstance?.execute === "function"
        ? await agentInstance.execute(instruction)
        : undefined;

    return {
      success: result?.success ?? true,
      message: result?.message ?? "",
      completed: result?.completed ?? result?.success ?? true,
    };
  }

  const result = await stagehand.act(instruction);

  return {
    success: result.data.success,
    message: result.data.message,
    completed: result.data.success,
  };
}


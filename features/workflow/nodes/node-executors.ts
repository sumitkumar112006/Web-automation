import type { Stagehand } from "@browserbasehq/stagehand";

import type {
  ActionNodeType,
  NodeType,
} from "@/features/workflow/nodes/node-registry";
import { openUrl } from "./open-url";
import { act } from "./act";

export type NodeContext = {
  values: Record<string, string>;
  getStagehand: () => Promise<Stagehand>;
};

export type NodeExecutor = (ctx: NodeContext) => Promise<unknown>;

export const nodeExecutors: Partial<Record<NodeType, NodeExecutor>> = {
  "open-url": async ({ values, getStagehand }) =>
    openUrl({ stagehand: await getStagehand(), url: values.url }),
  act: async ({ values, getStagehand }) =>
    act({ stagehand: await getStagehand(), instruction: values.instruction }),
} satisfies Record<ActionNodeType, NodeExecutor>;
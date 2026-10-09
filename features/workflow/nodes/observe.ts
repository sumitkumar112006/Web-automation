import type { Stagehand } from "@browserbasehq/stagehand";

export async function observe({
    stagehand,
    instruction,
}: {
    stagehand: Stagehand;
    instruction: string;
}) {
    const { data: actions } = await stagehand.observe(instruction);
    const first = actions?.[0];

    return {
        matches: actions ?? [],
        selector: first?.selector ?? "",
        description: first?.description ?? "",
    };
}

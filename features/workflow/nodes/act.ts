import type { Stagehand } from "@browserbasehq/stagehand";

export async function act({
    stagehand,
    instruction,
}: {
    stagehand: Stagehand;
    instruction: string;
}) {
    const result = await stagehand.act(instruction);
    const pages = await stagehand.browser.context.pages();
    const page = pages[0];
    const url = page ? await page.url() : "";

    return {
        success: result.data.success,
        message: result.data.message,
        url,
    };
}

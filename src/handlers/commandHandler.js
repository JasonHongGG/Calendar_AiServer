import { createAiClient } from '../ai/AiClientFactory.js';

function withTimeout(promise, timeoutMs) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`AI request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

export async function handleCommand(body) {
  const input = body?.input?.trim();
  const toolResults = Array.isArray(body?.toolResults) ? body.toolResults : [];
  if (!input) {
    return { actions: [], message: '請提供指令內容' };
  }

  const client = createAiClient({ provider: process.env.AI_PROVIDER });
  const timeoutMsRaw = process.env.COPILOT_TIMEOUT_MS;
  const timeoutMs = Number.isFinite(Number(timeoutMsRaw))
    ? Number(timeoutMsRaw)
    : 180_000;
  const response = await withTimeout(
    client.generateActions(input, toolResults),
    timeoutMs,
  );
  const actions = Array.isArray(response.actions) ? response.actions : [];

  return {
    actions,
    message:
      response.message ||
      (actions.length ? '已接收指令' : '未解析到可執行指令'),
  };
}

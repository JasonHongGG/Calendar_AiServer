import { createAiClient } from '../ai/AiClientFactory.js';

export async function handleCommand(body) {
  const input = body?.input?.trim();
  if (!input) {
    return { actions: [], message: '請提供指令內容' };
  }

  const client = createAiClient({ provider: process.env.AI_PROVIDER });
  const response = await client.generateActions(input);
  const actions = Array.isArray(response.actions) ? response.actions : [];

  return {
    actions,
    message:
      response.message ||
      (actions.length ? '已接收指令' : '未解析到可執行指令'),
  };
}

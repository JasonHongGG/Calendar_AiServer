import { CopilotClient } from '@github/copilot-sdk';
import { IAIClient } from './IAIClient.js';
import { promptConfig } from '../config/promptConfig.js';
import { parseJsonFromText } from '../utils/aiUtils.js';

export class CopilotAiClient extends IAIClient {
  constructor({ sdkClient } = {}) {
    super();
    this.sdkClient = sdkClient;
    this.systemPrompt = promptConfig.systemPrompt;
    this.client = null;
    this.session = null;
  }

  async generateActions(input) {
    await this.#ensureSession();

    const timeoutMsRaw = process.env.COPILOT_TIMEOUT_MS;
    const timeoutMs = Number.isFinite(Number(timeoutMsRaw))
      ? Number(timeoutMsRaw)
      : 180_000;

    const response = await this.session.sendAndWait(
      {
        prompt: input,
      },
      timeoutMs,
    );

    const content = response?.data?.content ?? '';
    const parsed = parseJsonFromText(content);
    if (!parsed) {
      throw new Error('Invalid AI response format');
    }

    return parsed;
  }

  async #ensureSession() {
    if (this.session) return;

    if (!this.client) {
      const githubToken =
        process.env.COPILOT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;

      this.client =
        this.sdkClient ??
        new CopilotClient({
          githubToken: githubToken || undefined,
          logLevel: process.env.COPILOT_LOG_LEVEL || 'info',
        });
    }

    const model = process.env.COPILOT_MODEL || 'gpt-4.1';
    this.session = await this.client.createSession({
      model,
      systemMessage: {
        mode: 'replace',
        content: this.systemPrompt,
      },
    });
  }
}

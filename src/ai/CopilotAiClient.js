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
    this.selectedModel = null;
  }

  async generateActions(input, toolResults) {
    // eslint-disable-next-line no-console
    console.log('[copilot] generateActions start');
    await this.#ensureSession();

    const timeoutMsRaw = process.env.COPILOT_TIMEOUT_MS;
    const timeoutMs = Number.isFinite(Number(timeoutMsRaw))
      ? Number(timeoutMsRaw)
      : 180_000;

    // eslint-disable-next-line no-console
    console.log('[copilot] sendAndWait start', { timeoutMs });
    const prompt = toolResults && toolResults.length
      ? `TOOL_RESULTS:\n${JSON.stringify(toolResults)}\n\nUSER_INPUT:\n${input}`
      : input;

    const response = await this.session.sendAndWait(
      {
        prompt,
      },
      timeoutMs,
    );
    // eslint-disable-next-line no-console
    console.log('[copilot] sendAndWait done');

    const content = response?.data?.content ?? '';
    const parsed = parseJsonFromText(content);
    if (!parsed) {
      throw new Error('Invalid AI response format');
    }

    console.log('[copilot] generateActions done');
    return parsed;
  }

  async #ensureSession() {
    if (this.session) return;

    if (!this.client) {
      const githubToken =
        process.env.COPILOT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;

      // eslint-disable-next-line no-console
      console.log('[copilot] create client', {
        hasGithubToken: Boolean(githubToken),
      });
      this.client =
        this.sdkClient ??
        new CopilotClient({
          githubToken: githubToken || undefined,
          logLevel: process.env.COPILOT_LOG_LEVEL || 'info',
        });
    }

    const model = process.env.COPILOT_MODEL || 'gpt-4.1';
    // eslint-disable-next-line no-console
    console.log('[copilot] create session start', { model });
    this.session = await this.client.createSession({
      model,
      systemMessage: {
        mode: 'replace',
        content: this.systemPrompt,
      },
    });

    this.#attachSessionModelLogging({ requestedModel: model });
    await this.#logSelectedModelFromHistory({ requestedModel: model });

    // eslint-disable-next-line no-console
    console.log('[copilot] create session done');
  }

  #attachSessionModelLogging({ requestedModel }) {
    if (!this.session) return;

    // Capture what the CLI actually selected. This is the most reliable way to
    // detect silent fallback when an unknown/unsupported model ID is requested.
    this.session.on('session.start', (event) => {
      const selectedModel = event?.data?.selectedModel;
      if (selectedModel) this.selectedModel = selectedModel;

      // eslint-disable-next-line no-console
      console.log('[copilot] session.start', {
        requestedModel,
        selectedModel: selectedModel || null,
      });
    });

    this.session.on('session.model_change', (event) => {
      const newModel = event?.data?.newModel;
      if (newModel) this.selectedModel = newModel;

      // eslint-disable-next-line no-console
      console.log('[copilot] session.model_change', {
        previousModel: event?.data?.previousModel || null,
        newModel: newModel || null,
      });
    });
  }

  async #logSelectedModelFromHistory({ requestedModel }) {
    if (!this.session) return;

    try {
      const events = await this.session.getMessages();
      const startEvent = Array.isArray(events)
        ? [...events].reverse().find((e) => e?.type === 'session.start')
        : null;

      const selectedModel = startEvent?.data?.selectedModel;
      if (selectedModel) this.selectedModel = selectedModel;

      // eslint-disable-next-line no-console
      console.log('[copilot] session.selectedModel', {
        requestedModel,
        selectedModel: selectedModel || null,
        effectiveModel: this.selectedModel || requestedModel,
        matched: Boolean(selectedModel && selectedModel === requestedModel),
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('[copilot] session.selectedModel read failed', {
        message: error?.message || String(error),
      });
    }
  }
}

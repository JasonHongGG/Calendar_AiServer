import { CopilotAiClient } from './CopilotAiClient.js';

export function createAiClient({ provider = 'copilot', sdkClient } = {}) {
  switch (provider) {
    case 'copilot':
      return new CopilotAiClient({ sdkClient });
    default:
      return new CopilotAiClient({ sdkClient });
  }
}

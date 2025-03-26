
/**
 * Service for managing API keys
 */

// Hardcoded API key
const OPENAI_API_KEY = "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";

export const getOpenAIApiKey = (): string => {
  return OPENAI_API_KEY;
};

export const hasValidApiKey = (): boolean => {
  return true; // Always return true since we have a hardcoded key
};

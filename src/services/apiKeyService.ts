
/**
 * Service for managing API keys - simplified version that doesn't require keys
 */

// This is kept as a stub to prevent breaking existing code that imports this
export const DEFAULT_OPENAI_API_KEY = "not-used";

// Stub functions that always return valid results
export const getOpenAIApiKey = (): string => DEFAULT_OPENAI_API_KEY;

export const setOpenAIApiKey = (apiKey: string): void => {
  // No-op function
  console.log("API key setting is disabled");
};

export const clearOpenAIApiKey = (): void => {
  // No-op function
  console.log("API key clearing is disabled");
};

export const hasCustomApiKey = (): boolean => false;

export const hasValidApiKey = (): boolean => true;

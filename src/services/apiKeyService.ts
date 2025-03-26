
/**
 * Service for managing API keys
 */

// Default API key (fallback)
export const DEFAULT_OPENAI_API_KEY = "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";

// Get API key from localStorage or use the default one
export const getOpenAIApiKey = (): string => {
  const userKey = localStorage.getItem('openai_api_key');
  return userKey || DEFAULT_OPENAI_API_KEY;
};

// Set API key in localStorage
export const setOpenAIApiKey = (apiKey: string): void => {
  localStorage.setItem('openai_api_key', apiKey);
};

// Clear API key from localStorage and revert to default
export const clearOpenAIApiKey = (): void => {
  localStorage.removeItem('openai_api_key');
};

// Check if there's a custom API key (not using default)
export const hasCustomApiKey = (): boolean => {
  return !!localStorage.getItem('openai_api_key');
};

// Check if there's a valid API key (either in localStorage or the default one)
export const hasValidApiKey = (): boolean => {
  const key = getOpenAIApiKey();
  return !!key && key.length > 0 && key.startsWith('sk-');
};

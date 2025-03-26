
/**
 * Service for managing API keys
 */

// Default API key (fallback)
const OPENAI_API_KEY = "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";

// Get API key from localStorage or use the default one
export const getOpenAIApiKey = (): string => {
  const userKey = localStorage.getItem('openai_api_key');
  return userKey || OPENAI_API_KEY;
};

// Set API key in localStorage
export const setOpenAIApiKey = (apiKey: string): void => {
  localStorage.setItem('openai_api_key', apiKey);
};

// Check if there's a valid API key (either in localStorage or the default one)
export const hasValidApiKey = (): boolean => {
  const key = getOpenAIApiKey();
  return !!key && key.length > 0;
};

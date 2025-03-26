
/**
 * Service for managing API keys
 */

export const getOpenAIApiKey = (): string => {
  // Try to get from window.ENV first (set via localStorage)
  if ((window as any).ENV?.VITE_OPENAI_API_KEY) {
    return (window as any).ENV.VITE_OPENAI_API_KEY;
  }
  
  // Then try localStorage directly
  const localStorageKey = localStorage.getItem('openai_api_key');
  if (localStorageKey) {
    return localStorageKey;
  }
  
  // Finally try import.meta.env (if set during build)
  if (import.meta.env.VITE_OPENAI_API_KEY) {
    return import.meta.env.VITE_OPENAI_API_KEY;
  }
  
  return '';
};

export const hasValidApiKey = (): boolean => {
  return !!getOpenAIApiKey();
};

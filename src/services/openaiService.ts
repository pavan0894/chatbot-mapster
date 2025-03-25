
/**
 * Service for communicating with OpenAI API
 */

export interface ChatMessageData {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessageData[];
}

export interface ChatCompletionResponse {
  text: string;
  error?: string;
}

export const getAIResponse = async (messages: ChatMessageData[]): Promise<ChatCompletionResponse> => {
  try {
    // Replace this with your actual API endpoint if connected to a backend
    // Currently simulating a delayed response from OpenAI
    const systemPrompt = "You are a helpful map assistant. You can provide information about locations, directions, and places. Keep responses concise and focused on map-related questions.";
    
    // Add system message if not already included
    if (!messages.some(msg => msg.role === 'system')) {
      messages = [{ role: 'system', content: systemPrompt }, ...messages];
    }
    
    console.log("Sending to AI:", messages);
    
    // Simulate API call with shorter timeout for a more responsive feel
    return new Promise((resolve) => {
      setTimeout(() => {
        // This is where you would actually call the OpenAI API
        // For now, we're simulating responses based on input
        const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content.toLowerCase() || '';
        
        let responseText = '';
        
        if (lastUserMessage.includes('hello') || lastUserMessage.includes('hi')) {
          responseText = "Hello! I'm your AI map assistant. How can I help you navigate or find locations today?";
        } else if (lastUserMessage.includes('dallas')) {
          responseText = "Dallas is a major city in Texas, located at coordinates -96.7970, 32.7767. It's known for its modern skyline, museums, and vibrant culture. The map is currently centered on this area.";
        } else if (lastUserMessage.includes('direction') || lastUserMessage.includes('how to get')) {
          responseText = "To get directions between two points, you can specify your starting location and destination. Would you like me to show you a route to a specific place from your current location?";
        } else if (lastUserMessage.includes('restaurant') || lastUserMessage.includes('food') || lastUserMessage.includes('eat')) {
          responseText = "Dallas has many excellent restaurants. Popular areas include Deep Ellum, Uptown, and Bishop Arts District. Would you like me to suggest some highly-rated places near the city center?";
        } else if (lastUserMessage.includes('attraction') || lastUserMessage.includes('visit') || lastUserMessage.includes('see')) {
          responseText = "Some popular attractions in Dallas include Reunion Tower, the Dallas Museum of Art, Klyde Warren Park, and the Sixth Floor Museum. Would you like more information about any of these?";
        } else if (lastUserMessage.includes('weather')) {
          responseText = "I don't have real-time weather data, but Dallas typically has hot summers and mild winters. The best times to visit are spring and fall when temperatures are more moderate.";
        } else {
          responseText = "I'm here to help with map-related questions about locations, directions, or places of interest. How can I assist you with navigation or finding places today?";
        }
        
        resolve({ text: responseText });
      }, 500); // Reduced delay for more responsive feel
    });
  } catch (error) {
    console.error("Error getting AI response:", error);
    return {
      text: "",
      error: "Sorry, I encountered an error. Please try again later."
    };
  }
};

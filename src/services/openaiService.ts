
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

// FedEx and Property location data for generating dynamic questions
const LOCATION_AREAS = [
  "Dallas", "North Dallas", "South Dallas", "Irving", "Plano", 
  "Richardson", "Addison", "Garland", "Mesquite", "Carrollton",
  "Lewisville", "Arlington", "Grand Prairie", "Farmers Branch",
  "Grapevine", "Frisco", "McKinney", "Rockwall", "Denton"
];

const PROPERTY_TYPES = [
  "logistics facilities", "warehouse complexes", "manufacturing facilities",
  "distribution centers", "industrial districts", "technology parks",
  "shipping hubs", "logistics hubs", "business parks", "commercial warehousing"
];

const FEDEX_SERVICE_TYPES = [
  "Ship Centers", "Office locations", "Ground facilities", 
  "Express shipping centers", "Freight terminals", "Business service centers",
  "Package sorting facilities", "Package delivery hubs"
];

// Generate a dynamic question about properties near FedEx
const generatePropertyNearFedExQuestion = (): string => {
  const area = LOCATION_AREAS[Math.floor(Math.random() * LOCATION_AREAS.length)];
  const propertyType = PROPERTY_TYPES[Math.floor(Math.random() * PROPERTY_TYPES.length)];
  const radius = Math.floor(Math.random() * 5) + 1; // 1-5 miles radius

  return `Can you show me ${propertyType} within ${radius} miles of FedEx locations in the ${area} area?`;
};

// Generate a dynamic question about FedEx near properties
const generateFedExNearPropertyQuestion = (): string => {
  const area = LOCATION_AREAS[Math.floor(Math.random() * LOCATION_AREAS.length)];
  const fedexType = FEDEX_SERVICE_TYPES[Math.floor(Math.random() * FEDEX_SERVICE_TYPES.length)];
  const radius = Math.floor(Math.random() * 5) + 1; // 1-5 miles radius

  return `Where are the closest FedEx ${fedexType} to industrial properties in ${area}? Show within ${radius} miles.`;
};

// Generate a list of suggested dynamic questions
export const generateSuggestedQuestions = (): string[] => {
  return [
    generatePropertyNearFedExQuestion(),
    generateFedExNearPropertyQuestion(),
    generatePropertyNearFedExQuestion(),
    `What's the closest FedEx location to Dallas Logistics Hub?`,
    `Show me all FedEx Ground facilities within 3 miles of industrial parks.`
  ];
};

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
          // Include suggested questions in the greeting
          const suggestions = generateSuggestedQuestions();
          responseText = "Hello! I'm your AI map assistant. How can I help you navigate or find locations today? Here are some questions you might want to ask:\n\n" + 
            suggestions.map(q => `- ${q}`).join('\n');
        } else if (lastUserMessage.includes('dallas')) {
          responseText = "Dallas is a major city in Texas, located at coordinates -96.7970, 32.7767. It's known for its modern skyline, museums, and vibrant culture. The map is currently centered on this area. Would you like to know about:\n\n" +
            "- FedEx locations in downtown Dallas?\n" +
            "- Industrial properties near North Dallas?\n" +
            "- Distribution centers within 2 miles of FedEx Ground facilities?";
        } else if (lastUserMessage.includes('direction') || lastUserMessage.includes('how to get')) {
          responseText = "To get directions between two points, you can specify your starting location and destination. Would you like me to show you a route to a specific place from your current location? For example:\n\n" +
            "- What's the route from Dallas Logistics Hub to the nearest FedEx Express center?\n" +
            "- How do I get from Southport Logistics Park to FedEx Ground in Garland?";
        } else if (lastUserMessage.includes('suggest') || lastUserMessage.includes('what can')) {
          const suggestions = generateSuggestedQuestions();
          responseText = "Here are some questions you can ask about FedEx locations and industrial properties:\n\n" + 
            suggestions.map(q => `- ${q}`).join('\n');
        } else if (lastUserMessage.includes('thank')) {
          responseText = "You're welcome! Feel free to ask any other questions about FedEx locations or industrial properties on the map. Would you like to see:\n\n" +
            `- ${generatePropertyNearFedExQuestion()}\n` +
            `- ${generateFedExNearPropertyQuestion()}`;
        } else {
          // Default response with dynamic suggestions
          const suggestions = generateSuggestedQuestions().slice(0, 2);
          responseText = "I'm here to help with map-related questions about FedEx locations and industrial properties. You might want to try asking:\n\n" + 
            suggestions.map(q => `- ${q}`).join('\n') + 
            "\n\nOr you can ask about specific properties or FedEx centers in the Dallas area.";
        }
        
        resolve({ text: responseText });
      }, 300); // Reduced delay for more responsive feel
    });
  } catch (error) {
    console.error("Error getting AI response:", error);
    return {
      text: "",
      error: "Sorry, I encountered an error. Please try again later."
    };
  }
};

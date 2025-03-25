
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

// Generate a follow-up question based on previous messages
const generateFollowUpQuestion = (messages: ChatMessageData[]): string => {
  // Get the last few user and assistant messages to understand context
  const recentMessages = messages.slice(-4);
  
  // Extract location information from recent messages
  let mentionedArea = '';
  let mentionedRadius = 0;
  let mentionedFedEx = false;
  let mentionedProperties = false;
  
  for (const msg of recentMessages) {
    const content = msg.content.toLowerCase();
    
    // Check for locations
    for (const area of LOCATION_AREAS) {
      if (content.includes(area.toLowerCase())) {
        mentionedArea = area;
        break;
      }
    }
    
    // Check for radius
    const radiusMatch = content.match(/(\d+)\s*(mile|miles|mi)/);
    if (radiusMatch) {
      mentionedRadius = parseInt(radiusMatch[1]);
    }
    
    // Check for FedEx and properties
    if (content.includes('fedex')) mentionedFedEx = true;
    if (content.includes('propert')) mentionedProperties = true;
  }
  
  // Use extracted context to generate relevant follow-up
  if (mentionedArea && mentionedFedEx) {
    const newRadius = mentionedRadius ? Math.min(mentionedRadius + 2, 10) : 3;
    return `What about distribution centers within ${newRadius} miles of FedEx Ground facilities in ${mentionedArea}?`;
  } else if (mentionedArea) {
    return `Are there any FedEx Express shipping centers in the ${mentionedArea} area?`;
  } else if (mentionedFedEx && mentionedProperties) {
    const newRadius = mentionedRadius ? Math.min(mentionedRadius + 1, 5) : 2;
    const randomArea = LOCATION_AREAS[Math.floor(Math.random() * LOCATION_AREAS.length)];
    return `Can you compare with industrial properties within ${newRadius} miles of FedEx in ${randomArea}?`;
  }
  
  // Default to a random question if no specific context found
  return Math.random() > 0.5 ? generatePropertyNearFedExQuestion() : generateFedExNearPropertyQuestion();
};

// Generate a list of suggested dynamic questions including follow-ups
export const generateSuggestedQuestions = (messages: ChatMessageData[] = []): string[] => {
  const suggestions = [
    generatePropertyNearFedExQuestion(),
    generateFedExNearPropertyQuestion()
  ];
  
  // Add follow-up questions if there's conversation history
  if (messages.length > 2) {
    suggestions.push(generateFollowUpQuestion(messages));
    suggestions.push(generateFollowUpQuestion([...messages].reverse()));
  } else {
    // Add more random questions if there's no conversation history
    suggestions.push(generatePropertyNearFedExQuestion());
    suggestions.push(generateFedExNearPropertyQuestion());
  }
  
  // Add a generic question
  suggestions.push(`What's the closest FedEx location to Dallas Logistics Hub?`);
  
  return suggestions;
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
        const userMessages = messages.filter(m => m.role === 'user').map(m => m.content.toLowerCase());
        const isFollowUp = userMessages.length > 1;
        
        let responseText = '';
        
        // Check if this is a follow-up question
        if (isFollowUp && lastUserMessage.length < 60 && !lastUserMessage.includes('hello') && !lastUserMessage.includes('hi')) {
          // Handle as a follow-up
          const previousContext = userMessages.slice(-3, -1).join(' ');
          const suggestions = generateSuggestedQuestions(messages);
          
          if (lastUserMessage.includes('more') || lastUserMessage.includes('other') || lastUserMessage.includes('another')) {
            // User asking for more options or alternatives
            responseText = "Here are some alternative locations I found based on your previous questions:\n\n" +
              "- Several FedEx Ground facilities are located near major highways for easy access\n" +
              "- Industrial properties in North Dallas have more FedEx Express centers nearby\n" +
              "- The Mesquite area has a growing number of logistics hubs within 3 miles of FedEx locations\n\n" +
              "Would you like to explore any of these areas in more detail?";
          } else if (lastUserMessage.includes('detail') || lastUserMessage.includes('tell me more')) {
            // User asking for more details
            responseText = "Looking at the details of locations shown on the map:\n\n" +
              "- Most FedEx facilities in this area operate 24/7 for package processing\n" +
              "- The industrial properties near FedEx locations typically have better highway access\n" +
              "- Recent development has increased warehouse availability within 3 miles of FedEx centers\n\n" +
              "Is there a specific aspect of these locations you'd like to know more about?";
          } else {
            // Generic follow-up handling
            responseText = "Based on your questions, I've updated the map to show the requested locations. " +
              "You might also be interested in these related questions:\n\n" + 
              suggestions.slice(0, 3).map(q => `- ${q}`).join('\n');
          }
        } else if (lastUserMessage.includes('hello') || lastUserMessage.includes('hi')) {
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
          const suggestions = generateSuggestedQuestions(messages);
          responseText = "Here are some questions you can ask about FedEx locations and industrial properties:\n\n" + 
            suggestions.map(q => `- ${q}`).join('\n');
        } else if (lastUserMessage.includes('thank')) {
          responseText = "You're welcome! Feel free to ask any other questions about FedEx locations or industrial properties on the map. Would you like to see:\n\n" +
            `- ${generatePropertyNearFedExQuestion()}\n` +
            `- ${generateFedExNearPropertyQuestion()}`;
        } else {
          // Default response with dynamic suggestions based on conversation history
          const suggestions = generateSuggestedQuestions(messages).slice(0, 3);
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

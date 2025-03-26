
/**
 * Service for providing responses without relying on OpenAI API
 */
import { getOpenAIApiKey } from './apiKeyService';

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

const STARBUCKS_TYPES = [
  "cafes", "coffee shops", "stores", "drive-thru locations",
  "Reserve bars", "24-hour locations", "university locations",
  "mall locations", "downtown locations", "with outdoor seating"
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

// Generate a dynamic question about Starbucks locations
const generateStarbucksQuestion = (): string => {
  const area = LOCATION_AREAS[Math.floor(Math.random() * LOCATION_AREAS.length)];
  const starbucksType = STARBUCKS_TYPES[Math.floor(Math.random() * STARBUCKS_TYPES.length)];
  
  const questionTypes = [
    `Where can I find Starbucks ${starbucksType} in ${area}?`,
    `Show me Starbucks ${starbucksType} near ${area}.`,
    `Are there any Starbucks ${starbucksType} in ${area}?`
  ];
  
  return questionTypes[Math.floor(Math.random() * questionTypes.length)];
};

// Generate a dynamic question about locations near Starbucks
const generateNearStarbucksQuestion = (): string => {
  const area = LOCATION_AREAS[Math.floor(Math.random() * LOCATION_AREAS.length)];
  const radius = Math.floor(Math.random() * 5) + 1; // 1-5 miles radius
  
  const targetType = Math.random() > 0.5 ? 'FedEx locations' : 'industrial properties';
  
  const questionTypes = [
    `Are there any ${targetType} within ${radius} miles of Starbucks in ${area}?`,
    `Show me ${targetType} near Starbucks in the ${area} area within ${radius} miles.`,
    `Which Starbucks have ${targetType} within ${radius} miles in ${area}?`
  ];
  
  return questionTypes[Math.floor(Math.random() * questionTypes.length)];
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
  let mentionedStarbucks = false;
  
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
    
    // Check for location types
    if (content.includes('fedex')) mentionedFedEx = true;
    if (content.includes('propert')) mentionedProperties = true;
    if (content.includes('starbucks') || content.includes('coffee')) mentionedStarbucks = true;
  }
  
  // Use extracted context to generate relevant follow-up
  if (mentionedStarbucks && mentionedArea) {
    if (mentionedFedEx || mentionedProperties) {
      const newRadius = mentionedRadius ? Math.min(mentionedRadius + 2, 10) : 3;
      return `What about other ${mentionedFedEx ? 'FedEx locations' : 'industrial properties'} within ${newRadius} miles of different Starbucks in ${mentionedArea}?`;
    } else {
      return `Are there any FedEx locations near the Starbucks in ${mentionedArea}?`;
    }
  } else if (mentionedArea && mentionedFedEx) {
    const newRadius = mentionedRadius ? Math.min(mentionedRadius + 2, 10) : 3;
    return `Are there any Starbucks cafes within ${newRadius} miles of FedEx facilities in ${mentionedArea}?`;
  } else if (mentionedArea && mentionedProperties) {
    return `Are there any Starbucks coffee shops near industrial properties in the ${mentionedArea} area?`;
  } else if (mentionedFedEx && mentionedProperties) {
    const newRadius = mentionedRadius ? Math.min(mentionedRadius + 1, 5) : 2;
    const randomArea = LOCATION_AREAS[Math.floor(Math.random() * LOCATION_AREAS.length)];
    return `Can you compare with Starbucks locations within ${newRadius} miles of industrial properties in ${randomArea}?`;
  } else if (mentionedStarbucks) {
    const randomArea = LOCATION_AREAS[Math.floor(Math.random() * LOCATION_AREAS.length)];
    return `Can you show me all industrial properties near Starbucks in ${randomArea}?`;
  }
  
  // Default to a random question if no specific context found
  const questionType = Math.floor(Math.random() * 4);
  switch (questionType) {
    case 0: return generatePropertyNearFedExQuestion();
    case 1: return generateFedExNearPropertyQuestion();
    case 2: return generateStarbucksQuestion();
    case 3: return generateNearStarbucksQuestion();
    default: return generateStarbucksQuestion();
  }
};

// Generate a list of suggested dynamic questions including follow-ups
export const generateSuggestedQuestions = (messages: ChatMessageData[] = []): string[] => {
  const suggestions = [
    generatePropertyNearFedExQuestion(),
    generateFedExNearPropertyQuestion(),
    generateStarbucksQuestion(),
    generateNearStarbucksQuestion()
  ];
  
  // Add follow-up questions if there's conversation history
  if (messages.length > 2) {
    suggestions.push(generateFollowUpQuestion(messages));
    suggestions.push(generateFollowUpQuestion([...messages].reverse()));
  } else {
    // Add more random questions if there's no conversation history
    suggestions.push(generateStarbucksQuestion());
    suggestions.push(generateNearStarbucksQuestion());
  }
  
  // Add generic questions
  suggestions.push(`What's the closest FedEx location to Dallas Logistics Hub?`);
  suggestions.push(`Show me all Starbucks in downtown Dallas.`);
  suggestions.push(`How many Starbucks locations have drive-thrus?`);
  suggestions.push(`Which area has the most FedEx locations?`);
  
  // Shuffle and return a subset of suggestions
  return suggestions
    .sort(() => 0.5 - Math.random())
    .slice(0, 6);
};

// Predefined responses for different query types
const PREDEFINED_RESPONSES = [
  "I've found several locations matching your criteria. They are now displayed on the map.",
  "The map now shows the results based on your request. You can click on markers for more details.",
  "I've highlighted the locations you asked about on the map. There are several options in that area.",
  "Your search results are now displayed. The markers show the exact locations you requested.",
  "I've updated the map with the locations you asked about. You can zoom in for more detail.",
  "The map now displays the results of your query. I found several matches in that area.",
  "I've loaded the locations you requested onto the map. You can see them as highlighted markers.",
  "Your search is complete and the results are now visible on the map. Let me know if you need anything else.",
  "I've found and displayed the locations you were looking for. You can interact with the markers for more information.",
  "The map has been updated to show the locations you requested. There are several options to explore."
];

// Response specifically for FedEx queries
const FEDEX_RESPONSES = [
  "I've found several FedEx locations in that area. They're now displayed on the map as markers.",
  "The map now shows FedEx locations based on your request. There are several options available.",
  "I've highlighted the FedEx locations you asked about. You can click on them for more details.",
  "Your search for FedEx locations is complete. The results are displayed on the map.",
  "I've updated the map with the FedEx locations in that area. They're marked with the FedEx logo."
];

// Response specifically for Starbucks queries
const STARBUCKS_RESPONSES = [
  "I've found several Starbucks cafes in that area. They're now displayed on the map.",
  "The map now shows Starbucks locations based on your request. There are quite a few options.",
  "I've highlighted the Starbucks cafes you asked about. You can click on them for more information.",
  "Your search for Starbucks locations is complete. The results are displayed on the map.",
  "I've updated the map with the Starbucks cafes in that area. Enjoy your coffee!"
];

// Response specifically for property queries
const PROPERTY_RESPONSES = [
  "I've found several industrial properties in that area. They're now displayed on the map.",
  "The map now shows industrial properties based on your request. There are several options to explore.",
  "I've highlighted the industrial properties you asked about. You can click on them for more details.",
  "Your search for industrial properties is complete. The results are displayed on the map.",
  "I've updated the map with the industrial properties in that area. There are some good options available."
];

export const getAIResponse = async (messages: ChatMessageData[]): Promise<ChatCompletionResponse> => {
  try {
    // Get user's last message
    const userMessage = messages.filter(msg => msg.role === 'user').pop();
    
    if (!userMessage) {
      return {
        text: "I'm ready to help you find locations on the map. What would you like to search for?",
      };
    }
    
    const messageContent = userMessage.content.toLowerCase();
    
    // Simple response selection based on message content
    let responseText;
    
    if (messageContent.includes('fedex')) {
      responseText = FEDEX_RESPONSES[Math.floor(Math.random() * FEDEX_RESPONSES.length)];
    } else if (messageContent.includes('starbucks') || messageContent.includes('coffee')) {
      responseText = STARBUCKS_RESPONSES[Math.floor(Math.random() * STARBUCKS_RESPONSES.length)];
    } else if (messageContent.includes('propert') || messageContent.includes('industrial') || messageContent.includes('warehouse')) {
      responseText = PROPERTY_RESPONSES[Math.floor(Math.random() * PROPERTY_RESPONSES.length)];
    } else {
      responseText = PREDEFINED_RESPONSES[Math.floor(Math.random() * PREDEFINED_RESPONSES.length)];
    }
    
    console.log("Providing local response without API call");
    return { text: responseText };
    
  } catch (error) {
    console.error("Error in local response generation:", error);
    return {
      text: "I understand what you're looking for. Check the map for relevant locations.",
      error: "Local processing error"
    };
  }
};

// Helper function to extract location types from context message
function extractLocationsFromContext(contextMessage: string): string[] {
  if (contextMessage.includes('Currently displayed on the map:')) {
    const match = contextMessage.match(/Currently displayed on the map: (.*?)\./) || [];
    if (match[1]) {
      return match[1].split(', ').map(loc => loc.trim());
    }
  }
  return [];
}

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

// Enhanced predefined responses for different query types
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
  "The map has been updated to show the locations you requested. There are several options to explore.",
  "I've processed your search and the results are now on the map. Is there anything specific you'd like to know about these locations?",
  "The map is now showing the locations you inquired about. The table below shows additional details.",
  "I've found what you're looking for. Check the map for visual representation and the table for details.",
  "Results are now displayed on the map based on your criteria. Feel free to ask for more specific information."
];

// Enhanced responses for FedEx queries
const FEDEX_RESPONSES = [
  "I've found several FedEx locations in that area. They're now displayed on the map as markers.",
  "The map now shows FedEx locations based on your request. There are several options available.",
  "I've highlighted the FedEx locations you asked about. You can click on them for more details.",
  "Your search for FedEx locations is complete. The results are displayed on the map.",
  "I've updated the map with the FedEx locations in that area. They're marked with the FedEx logo.",
  "The FedEx locations are now shown on the map. Would you like to know which ones offer specific services?",
  "I've found FedEx locations that match your criteria. Are you looking for any particular shipping service?",
  "FedEx locations are now displayed. Is there anything specific you'd like to know about these facilities?",
  "The map now shows all relevant FedEx locations. Each marker represents a FedEx facility in the area."
];

// Enhanced responses for Starbucks queries
const STARBUCKS_RESPONSES = [
  "I've found several Starbucks cafes in that area. They're now displayed on the map.",
  "The map now shows Starbucks locations based on your request. There are quite a few options.",
  "I've highlighted the Starbucks cafes you asked about. You can click on them for more information.",
  "Your search for Starbucks locations is complete. The results are displayed on the map.",
  "I've updated the map with the Starbucks cafes in that area. Enjoy your coffee!",
  "Starbucks locations are now visible on the map. Most of these locations offer the full menu of drinks and food.",
  "I've found Starbucks cafes that match your criteria. Some of these locations have drive-thru service.",
  "The map now displays Starbucks locations in the area. Is there a specific feature you're looking for, like wifi or outdoor seating?",
  "Starbucks cafes are now shown on the map. Each marker represents a Starbucks location."
];

// Enhanced responses for property queries
const PROPERTY_RESPONSES = [
  "I've found several industrial properties in that area. They're now displayed on the map.",
  "The map now shows industrial properties based on your request. There are several options to explore.",
  "I've highlighted the industrial properties you asked about. You can click on them for more details.",
  "Your search for industrial properties is complete. The results are displayed on the map.",
  "I've updated the map with the industrial properties in that area. There are some good options available.",
  "Industrial properties matching your criteria are now shown on the map. The table below contains additional information.",
  "I've found properties that might interest you. These industrial locations vary in size and functionality.",
  "The map now displays relevant industrial properties. Would you like more information about any specific property?",
  "Properties are now shown on the map. Each marker represents an industrial property with unique characteristics."
];

// New section for proximity/comparison responses
const PROXIMITY_RESPONSES = [
  "I've mapped the locations based on your proximity request. You can see how they relate to each other.",
  "The map now shows the relationship between the locations you asked about. Notice the clustering pattern.",
  "I've displayed the locations with your specified proximity criteria. The table shows additional details.",
  "Your proximity search is complete. You can see how these different location types are distributed relative to each other.",
  "The map now shows how these locations are positioned relative to each other within your specified radius.",
  "I've mapped out the spatial relationship you asked about. Is there any specific aspect of this distribution you'd like to know more about?",
  "The proximity analysis you requested is now displayed on the map. This shows potential synergies between these location types."
];

// New informational responses for when no map locations are changed
const INFORMATIONAL_RESPONSES = [
  "Based on available data, most properties in this area are industrial warehouses ranging from 50,000 to 200,000 square feet.",
  "FedEx typically operates both Express and Ground services from different facilities, with larger sorting centers on the outskirts of urban areas.",
  "Starbucks locations are strategically positioned near commercial centers, office complexes, and high-traffic retail areas.",
  "The industrial property market in Dallas has been growing steadily, with vacancy rates around 5-7% depending on the specific submarket.",
  "FedEx facilities typically operate from early morning until late evening, with sorting centers often running 24 hours a day.",
  "Most Starbucks locations open early, around 5:30 AM, to accommodate morning commuters and close between 8-10 PM depending on location.",
  "Industrial properties near highways and interstates generally command higher leasing rates due to improved logistics access.",
  "A typical FedEx distribution center employs between 75-200 people depending on the size and function of the facility.",
  "Starbucks strategically places drive-thru locations on commuter routes and near office parks to maximize morning business.",
  "The most valuable industrial properties tend to be those with rail access, high ceilings, and proximity to major transportation hubs."
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
    
    // Enhanced response selection based on message content
    let responseText;
    
    // Check for proximity/comparison questions
    const hasProximityTerms = /near|close\s+to|within|around|nearby|proximity|closest|nearest|adjacent|between/i.test(messageContent);
    const hasComparisonTerms = /compare|comparison|versus|vs\.|relationship|correlation|together|both/i.test(messageContent);
    
    // Check for question words and informational patterns
    const isInformationalQuery = /how\s+many|which\s+ones|tell\s+me\s+about|what\s+is|where\s+is|when\s+is|who\s+is|why\s+is|can\s+you|could\s+you/i.test(messageContent) &&
      !messageContent.includes('show') && !messageContent.includes('find') && !messageContent.includes('display');
    
    if (isInformationalQuery) {
      responseText = INFORMATIONAL_RESPONSES[Math.floor(Math.random() * INFORMATIONAL_RESPONSES.length)];
    } else if (hasProximityTerms || hasComparisonTerms) {
      responseText = PROXIMITY_RESPONSES[Math.floor(Math.random() * PROXIMITY_RESPONSES.length)];
    } else if (messageContent.includes('fedex')) {
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

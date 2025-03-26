
/**
 * Service for communicating with OpenAI API
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

export const getAIResponse = async (messages: ChatMessageData[]): Promise<ChatCompletionResponse> => {
  try {
    // Get the API key
    const apiKey = getOpenAIApiKey();
    
    if (!apiKey) {
      return {
        text: "Please provide an OpenAI API key to enable AI responses.",
        error: "No API key provided"
      };
    }
    
    // Add the system prompt if not already included
    const systemPrompt = "You are a helpful map assistant specializing in FedEx locations, industrial properties, and Starbucks cafes. Provide concise information about locations, distances between different points of interest, and answer questions about different areas in Dallas. When users ask about specific areas or distances, I will highlight relevant points on the map. Use the provided context about what's currently displayed on the map to give more accurate and relevant answers.";
    
    if (!messages.some(msg => msg.role === 'system')) {
      messages = [{ role: 'system', content: systemPrompt }, ...messages];
    }
    
    console.log("Sending to OpenAI:", messages);

    // Make the actual API call to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Using the latest recommended model
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    return { text: assistantMessage };
  } catch (error) {
    console.error("Error getting AI response:", error);
    return {
      text: "I encountered an error when trying to process your request. Please check your API key or try again later.",
      error: error instanceof Error ? error.message : "Unknown error"
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

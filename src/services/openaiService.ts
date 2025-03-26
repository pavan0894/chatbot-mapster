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
  
  // Shuffle and return a subset of suggestions
  return suggestions
    .sort(() => 0.5 - Math.random())
    .slice(0, 6);
};

export const getAIResponse = async (messages: ChatMessageData[]): Promise<ChatCompletionResponse> => {
  try {
    // Replace this with your actual API endpoint if connected to a backend
    // Currently simulating a delayed response from OpenAI
    const systemPrompt = "You are a helpful map assistant specializing in FedEx locations, industrial properties, and Starbucks cafes. Provide concise information about locations, distances between different points of interest, and answer questions about different areas in Dallas. When users ask about specific areas or distances, I will highlight relevant points on the map.";
    
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
        
        // Analyze the user's query to understand what they're looking for
        const hasFedEx = lastUserMessage.includes('fedex');
        const hasProperty = lastUserMessage.includes('propert') || lastUserMessage.includes('warehouse') || 
                          lastUserMessage.includes('industrial') || lastUserMessage.includes('logistics');
        const hasStarbucks = lastUserMessage.includes('starbucks') || lastUserMessage.includes('coffee') || 
                           lastUserMessage.includes('cafe');
        const hasDistance = lastUserMessage.includes('mile') || lastUserMessage.includes('within') || 
                          lastUserMessage.includes('near') || lastUserMessage.includes('close');
        const hasQuestion = lastUserMessage.includes('?') || lastUserMessage.includes('where') || 
                          lastUserMessage.includes('show') || lastUserMessage.includes('find');
        
        // Extract location information
        let mentionedArea = '';
        for (const area of LOCATION_AREAS) {
          if (lastUserMessage.includes(area.toLowerCase())) {
            mentionedArea = area;
            break;
          }
        }
        
        // Extract radius information
        let mentionedRadius = 5; // Default radius
        const radiusMatch = lastUserMessage.match(/(\d+)\s*(mile|miles|mi)/);
        if (radiusMatch) {
          mentionedRadius = parseInt(radiusMatch[1]);
        }
        
        // Check if this is a follow-up question
        if (isFollowUp && lastUserMessage.length < 60 && !lastUserMessage.includes('hello') && !lastUserMessage.includes('hi')) {
          // ... keep existing code (follow-up handling)
        } else if (lastUserMessage.includes('hello') || lastUserMessage.includes('hi')) {
          // Include suggested questions in the greeting
          const suggestions = generateSuggestedQuestions();
          responseText = "Hello! I'm your AI map assistant for FedEx locations, industrial properties, and Starbucks cafes. I can help you find:\n\n" + 
            "- FedEx locations in specific areas\n" +
            "- Industrial properties near FedEx centers or Starbucks\n" +
            "- Starbucks cafes throughout Dallas\n" +
            "- Distance relationships between different location types\n\n" +
            "Here are some questions you might want to ask:\n\n" + 
            suggestions.slice(0, 3).map(q => `- ${q}`).join('\n');
        } else if (hasStarbucks && !hasFedEx && !hasProperty && !hasDistance) {
          // Simple Starbucks location query
          responseText = "I've updated the map to show all Starbucks locations" + 
            (mentionedArea ? ` in the ${mentionedArea} area.` : " in the Dallas area.") +
            "\n\nThe map includes various Starbucks cafes with different amenities like drive-thru and outdoor seating. " +
            "You can click on any marker for more details about that location." +
            "\n\nWould you like to see FedEx locations or industrial properties near these Starbucks cafes as well?";
        } else if (hasFedEx && !hasProperty && !hasStarbucks && !hasDistance) {
          // Simple FedEx location query
          responseText = "I've updated the map to show all FedEx locations" + 
            (mentionedArea ? ` in the ${mentionedArea} area.` : " in the Dallas area.") +
            "\n\nThe map includes FedEx Ship Centers, Office locations, and Ground facilities. " +
            "You can click on any marker for more details about that location." +
            "\n\nWould you like to see industrial properties or Starbucks cafes near these FedEx locations as well?";
        } else if (!hasFedEx && hasProperty && !hasStarbucks && !hasDistance) {
          // Simple property location query
          responseText = "I've updated the map to show industrial properties" + 
            (mentionedArea ? ` in the ${mentionedArea} area.` : " in the Dallas area.") +
            "\n\nThe map includes logistics facilities, warehouses, and distribution centers. " +
            "You can click on any marker for more details about that property." +
            "\n\nWould you like to see FedEx locations or Starbucks cafes near these properties as well?";
        } else if (hasDistance && (
                  (hasStarbucks && hasFedEx) || 
                  (hasStarbucks && hasProperty) || 
                  (hasFedEx && hasProperty))) {
          // Relationship queries between different location types
          let sourceType = '';
          let targetType = '';
          
          if (hasStarbucks && hasFedEx) {
            const starbucksFirst = lastUserMessage.indexOf('starbucks') < lastUserMessage.indexOf('fedex');
            sourceType = starbucksFirst ? 'Starbucks cafes' : 'FedEx locations';
            targetType = starbucksFirst ? 'FedEx locations' : 'Starbucks cafes';
          } else if (hasStarbucks && hasProperty) {
            const starbucksFirst = lastUserMessage.indexOf('starbucks') < lastUserMessage.indexOf('propert');
            sourceType = starbucksFirst ? 'Starbucks cafes' : 'industrial properties';
            targetType = starbucksFirst ? 'industrial properties' : 'Starbucks cafes';
          } else if (hasFedEx && hasProperty) {
            const fedExFirst = lastUserMessage.indexOf('fedex') < lastUserMessage.indexOf('propert');
            sourceType = fedExFirst ? 'FedEx locations' : 'industrial properties';
            targetType = fedExFirst ? 'industrial properties' : 'FedEx locations';
          }
          
          responseText = `I've updated the map to show ${sourceType} within ${mentionedRadius} miles of ${targetType}${mentionedArea ? ' in the ' + mentionedArea + ' area' : ''}.\n\n` +
            "The connected lines show the distance between each matched pair. You can click on any marker for more details.";
        } else if (lastUserMessage.includes('dallas')) {
          // Location-specific query for Dallas
          responseText = "Dallas is a major city in Texas with numerous industrial properties, FedEx facilities, and Starbucks cafes. The map is currently showing the Dallas area. You can ask about:\n\n" +
            "- FedEx locations in downtown Dallas\n" +
            "- Industrial properties in North Dallas\n" +
            "- Starbucks cafes within 2 miles of FedEx Ground facilities\n" +
            "- Warehouses near Starbucks in Uptown Dallas";
        } else if (lastUserMessage.includes('suggest') || lastUserMessage.includes('what can')) {
          // Suggestions request
          const suggestions = generateSuggestedQuestions(messages);
          responseText = "Here are some questions you can ask about locations on the map:\n\n" + 
            suggestions.map(q => `- ${q}`).join('\n');
        } else if (lastUserMessage.includes('thank')) {
          // Thank you response
          responseText = "You're welcome! Feel free to ask any other questions about FedEx locations, industrial properties, or Starbucks cafes on the map. Would you like to see:\n\n" +
            `- ${generateStarbucksQuestion()}\n` +
            `- ${generateNearStarbucksQuestion()}\n` +
            `- ${generatePropertyNearFedExQuestion()}`;
        } else if (hasQuestion) {
          // General question handling
          responseText = "I'm analyzing your question about " + 
            (hasFedEx ? "FedEx locations" : "") + 
            (hasFedEx && hasProperty ? " and " : "") + 
            (hasFedEx && hasStarbucks && !hasProperty ? " and " : "") +
            (hasProperty ? "industrial properties" : "") +
            (hasProperty && hasStarbucks ? " and " : "") +
            (hasStarbucks ? "Starbucks cafes" : "") +
            (mentionedArea ? ` in the ${mentionedArea} area` : "") + 
            ".\n\n" +
            "The map has been updated to show the relevant locations. You can zoom in/out or click on markers for more details." +
            "\n\nCan I help you refine this search or answer specific questions about the displayed locations?";
        } else {
          // Default response with dynamic suggestions
          const suggestions = generateSuggestedQuestions(messages).slice(0, 3);
          responseText = "I can help you find FedEx locations, industrial properties, and Starbucks cafes on the map. Try asking:\n\n" + 
            suggestions.map(q => `- ${q}`).join('\n') + 
            "\n\nYou can specify locations, distances, and relationship types in your questions.";
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


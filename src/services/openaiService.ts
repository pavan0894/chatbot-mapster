
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
    const systemPrompt = "You are a helpful map assistant specializing in FedEx locations and industrial properties. Provide concise information about locations, distances between FedEx centers and properties, and answer questions about different areas in Dallas. When users ask about specific areas or distances, I will highlight relevant points on the map.";
    
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
          // Handle as a follow-up
          const suggestions = generateSuggestedQuestions(messages);
          
          if (lastUserMessage.includes('more') || lastUserMessage.includes('other') || lastUserMessage.includes('another')) {
            // User asking for more options or alternatives
            responseText = "Here are some alternative locations I found based on your search:\n\n" +
              `- There are ${mentionedRadius > 3 ? 'several' : 'a few'} FedEx Ground facilities near major highways for easy access\n` +
              `- ${mentionedArea ? mentionedArea : 'The Dallas area'} has ${Math.floor(Math.random() * 5) + 2} industrial properties near FedEx Express centers\n` +
              "- Would you like to see the specific locations on the map?";
          } else if (lastUserMessage.includes('detail') || lastUserMessage.includes('tell me more')) {
            // User asking for more details
            responseText = `Looking at the details of the ${hasFedEx ? 'FedEx locations' : 'industrial properties'} on the map:\n\n` +
              `- Most ${hasFedEx ? 'FedEx facilities' : 'industrial properties'} in this area have excellent highway access\n` +
              `- The industrial properties near FedEx locations typically offer larger warehouse spaces\n` +
              `- Recent development has increased availability within ${mentionedRadius} miles of the major transportation hubs\n\n` +
              "Would you like me to highlight a specific type of property or FedEx service?";
          } else if (hasFedEx && hasProperty && hasDistance) {
            // Specific relationship query
            responseText = `I've updated the map to show the relationship between ${hasProperty ? 'industrial properties' : ''} ${hasProperty && hasFedEx ? 'and' : ''} ${hasFedEx ? 'FedEx locations' : ''} within ${mentionedRadius} miles${mentionedArea ? ' in the ' + mentionedArea + ' area' : ''}.\n\n` +
                          "You can see the connections between locations and the distances displayed on the map. Would you like to adjust the search radius or focus on a different area?";
          } else {
            // Generic follow-up handling with contextual awareness
            responseText = "I've updated the map based on your request. " +
              "You might also be interested in these related questions:\n\n" + 
              suggestions.slice(0, 3).map(q => `- ${q}`).join('\n') + 
              "\n\nOr you can ask me to adjust the current view by specifying a different radius or location area.";
          }
        } else if (lastUserMessage.includes('hello') || lastUserMessage.includes('hi')) {
          // Include suggested questions in the greeting
          const suggestions = generateSuggestedQuestions();
          responseText = "Hello! I'm your AI map assistant for FedEx and industrial property locations. I can help you find:\n\n" + 
            "- FedEx locations in specific areas\n" +
            "- Industrial properties near FedEx centers\n" +
            "- Distance relationships between properties and FedEx locations\n\n" +
            "Here are some questions you might want to ask:\n\n" + 
            suggestions.slice(0, 3).map(q => `- ${q}`).join('\n');
        } else if (hasFedEx && !hasProperty && !hasDistance) {
          // Simple FedEx location query
          responseText = "I've updated the map to show all FedEx locations" + 
            (mentionedArea ? ` in the ${mentionedArea} area.` : " in the Dallas area.") +
            "\n\nThe map includes FedEx Ship Centers, Office locations, and Ground facilities. " +
            "You can click on any marker for more details about that location." +
            "\n\nWould you like to see industrial properties near these FedEx locations as well?";
        } else if (!hasFedEx && hasProperty && !hasDistance) {
          // Simple property location query
          responseText = "I've updated the map to show industrial properties" + 
            (mentionedArea ? ` in the ${mentionedArea} area.` : " in the Dallas area.") +
            "\n\nThe map includes logistics facilities, warehouses, and distribution centers. " +
            "You can click on any marker for more details about that property." +
            "\n\nWould you like to see FedEx locations near these properties as well?";
        } else if (hasFedEx && hasProperty && hasDistance) {
          // Relationship query between FedEx and properties
          const isPropertyNearFedEx = lastUserMessage.includes('propert') && 
                                    lastUserMessage.indexOf('propert') < lastUserMessage.indexOf('fedex');
          
          responseText = `I've updated the map to show ${isPropertyNearFedEx ? 
            'industrial properties' : 'FedEx locations'} within ${mentionedRadius} miles of ${isPropertyNearFedEx ? 
            'FedEx locations' : 'industrial properties'}${mentionedArea ? ' in the ' + mentionedArea + ' area' : ''}.\n\n` +
            "The connected lines show the distance between each matched pair. You can click on any marker for more details.";
        } else if (lastUserMessage.includes('dallas')) {
          // Location-specific query for Dallas
          responseText = "Dallas is a major city in Texas with numerous industrial properties and FedEx facilities. The map is currently showing the Dallas area. You can ask about:\n\n" +
            "- FedEx locations in downtown Dallas\n" +
            "- Industrial properties in North Dallas\n" +
            "- Distribution centers within 2 miles of FedEx Ground facilities\n" +
            "- Warehouses near FedEx Express centers in Dallas";
        } else if (lastUserMessage.includes('direction') || lastUserMessage.includes('how to get')) {
          // Directions query
          responseText = "To get directions between locations, you can specify your starting point and destination. For example:\n\n" +
            "- How do I get from Dallas Logistics Hub to the nearest FedEx Express center?\n" +
            "- What's the route from Southport Logistics Park to FedEx Ground in Garland?\n\n" +
            "You can also specify if you're looking for the fastest route or want to avoid highways.";
        } else if (lastUserMessage.includes('suggest') || lastUserMessage.includes('what can')) {
          // Suggestions request
          const suggestions = generateSuggestedQuestions(messages);
          responseText = "Here are some questions you can ask about FedEx locations and industrial properties:\n\n" + 
            suggestions.map(q => `- ${q}`).join('\n');
        } else if (lastUserMessage.includes('thank')) {
          // Thank you response
          responseText = "You're welcome! Feel free to ask any other questions about FedEx locations or industrial properties on the map. Would you like to see:\n\n" +
            `- ${generatePropertyNearFedExQuestion()}\n` +
            `- ${generateFedExNearPropertyQuestion()}`;
        } else if (hasQuestion) {
          // General question handling
          responseText = "I'm analyzing your question about " + 
            (hasFedEx ? "FedEx locations" : "") + 
            (hasFedEx && hasProperty ? " and " : "") + 
            (hasProperty ? "industrial properties" : "") +
            (mentionedArea ? ` in the ${mentionedArea} area` : "") + 
            ".\n\n" +
            "The map has been updated to show the relevant locations. You can zoom in/out or click on markers for more details." +
            "\n\nCan I help you refine this search or answer specific questions about the displayed locations?";
        } else {
          // Default response with dynamic suggestions
          const suggestions = generateSuggestedQuestions(messages).slice(0, 3);
          responseText = "I can help you find FedEx locations and industrial properties on the map. Try asking:\n\n" + 
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

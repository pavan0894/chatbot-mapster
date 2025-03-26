
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
  suggestions.push(`How many Starbucks locations have drive-thrus?`);
  suggestions.push(`Which area has the most FedEx locations?`);
  
  // Shuffle and return a subset of suggestions
  return suggestions
    .sort(() => 0.5 - Math.random())
    .slice(0, 6);
};

export const getAIResponse = async (messages: ChatMessageData[]): Promise<ChatCompletionResponse> => {
  try {
    // Replace this with your actual API endpoint if connected to a backend
    // Currently simulating a delayed response from OpenAI
    const systemPrompt = "You are a helpful map assistant specializing in FedEx locations, industrial properties, and Starbucks cafes. Provide concise information about locations, distances between different points of interest, and answer questions about different areas in Dallas. When users ask about specific areas or distances, I will highlight relevant points on the map. Use the provided context about what's currently displayed on the map to give more accurate and relevant answers.";
    
    // Add system message if not already included
    if (!messages.some(msg => msg.role === 'system')) {
      messages = [{ role: 'system', content: systemPrompt }, ...messages];
    }
    
    console.log("Sending to AI:", messages);
    
    // Extract map context from messages
    const contextMessages = messages.filter(msg => 
      msg.role === 'system' && 
      (msg.content.includes('Currently displayed on the map') || 
       msg.content.includes('The last user query'))
    );
    
    const hasMapContext = contextMessages.length > 0;
    const displayedLocationTypes = hasMapContext ? 
      extractLocationsFromContext(contextMessages[0]?.content || '') : 
      [];
    
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
        const hasHowMany = lastUserMessage.includes('how many') || lastUserMessage.includes('count');
        const hasWhich = lastUserMessage.includes('which') || lastUserMessage.includes('what');
        
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
        
        // Handle questions about what's currently displayed on the map
        if (hasHowMany && displayedLocationTypes.length > 0) {
          if (displayedLocationTypes.includes('starbucks') && hasStarbucks) {
            responseText = "Based on the current map view, there are 25 Starbucks locations shown. They're distributed throughout the Dallas area, with several in downtown Dallas and the surrounding neighborhoods.\n\nSome of these Starbucks locations have special features like drive-thru services, outdoor seating, and extended hours. Would you like more specific information about any particular Starbucks location?";
          } else if (displayedLocationTypes.includes('fedex') && hasFedEx) {
            responseText = "The map currently shows 20 FedEx locations across the Dallas area. These include various service types such as Ship Centers, Office locations, Ground facilities, and Express shipping centers.\n\nThese locations are strategically positioned throughout Dallas to provide convenient access to shipping and business services. Is there a specific area or type of FedEx facility you're interested in?";
          } else if (displayedLocationTypes.includes('property') && hasProperty) {
            responseText = "The map is displaying 40 industrial properties in the Dallas area. These include logistics facilities, warehouse complexes, manufacturing facilities, and distribution centers.\n\nThese properties are concentrated in several industrial districts across Dallas, with significant clusters in South Dallas near the logistics hub and in the northern commercial areas. Would you like more details about any specific industrial area?";
          } else {
            // General count question
            const displayedTypes = displayedLocationTypes.join(' and ');
            responseText = `The map is currently showing ${displayedTypes} locations in the Dallas area. I can help you filter or find specific locations if you'd like. What type of information are you looking for?`;
          }
        }
        // Handle questions about specific attributes
        else if (hasWhich && displayedLocationTypes.length > 0) {
          if (displayedLocationTypes.includes('starbucks') && hasStarbucks) {
            if (lastUserMessage.includes('drive') || lastUserMessage.includes('drive-thru')) {
              responseText = "Looking at the Starbucks locations on the map, approximately 8 of them have drive-thru service. These are mostly located in suburban areas including:\n\n- Starbucks - Knox Henderson\n- Starbucks - Casa Linda\n- Starbucks - Lovers Lane\n- Starbucks - Skillman & Abrams\n- Starbucks - Mockingbird Station\n\nWould you like me to filter the map to show only drive-thru locations?";
            } else if (lastUserMessage.includes('outdoor') || lastUserMessage.includes('patio') || lastUserMessage.includes('seating')) {
              responseText = "Several Starbucks locations on the map have outdoor seating options. The ones with the best outdoor areas include:\n\n- Starbucks - Downtown Dallas (full-service cafe with outdoor seating)\n- Starbucks - West Village (urban cafe with patio seating)\n- Starbucks - Lower Greenville (neighborhood cafe with outdoor tables)\n- Starbucks - White Rock Lake (scenic view with outdoor seating)\n\nThe White Rock Lake location is particularly nice as it offers views of the lake while you enjoy your coffee.";
            } else if (lastUserMessage.includes('downtown') || lastUserMessage.includes('uptown')) {
              responseText = "The map shows several Starbucks locations in the downtown and uptown Dallas areas:\n\n- Starbucks - Downtown Dallas\n- Starbucks - Uptown\n- Starbucks - West Village\n\nThe Downtown Dallas location offers full-service cafe with outdoor seating, while the Uptown location features modern design with mobile ordering capabilities. The West Village location is an urban cafe with patio seating that's popular with local professionals.";
            } else {
              responseText = "Based on the Starbucks locations displayed on the map, they vary in features and services. Some notable locations include:\n\n- Starbucks in Downtown Dallas has outdoor seating\n- The Mockingbird Station location is transit-friendly\n- SMU Campus Starbucks offers extended hours\n- Several locations including Knox Henderson have drive-thru service\n\nIs there a specific feature or area you're interested in?";
            }
          } else if (displayedLocationTypes.includes('fedex') && hasFedEx) {
            if (lastUserMessage.includes('express') || lastUserMessage.includes('shipping')) {
              responseText = "Looking at the FedEx locations on the map, there are several Express shipping centers including:\n\n- FedEx Express - Addison\n- FedEx Express - Mesquite\n- FedEx Express - Grand Prairie\n- FedEx Express - Rockwall\n\nThese locations specialize in time-sensitive shipments and offer more delivery options than standard FedEx Ground facilities.";
            } else if (lastUserMessage.includes('freight') || lastUserMessage.includes('large')) {
              responseText = "For freight shipping, the map shows these FedEx Freight terminals:\n\n- FedEx Freight - South Dallas\n- FedEx Freight - Arlington\n\nThese locations handle larger shipments and palletized freight. They're strategically positioned to serve the industrial areas of Dallas.";
            } else {
              responseText = "The FedEx locations currently shown on the map include several types of facilities:\n\n- Ship Centers: Downtown, Irving, Lewisville\n- Office locations: Uptown, Richardson, Plano, Las Colinas, Frisco, Grapevine\n- Express shipping: Addison, Mesquite, Grand Prairie, Rockwall\n- Ground facilities: North Dallas, Garland, Carrollton, Denton\n- Freight terminals: South Dallas, Arlington\n\nDifferent locations offer different services. Is there a specific service you're looking for?";
            }
          } else if (displayedLocationTypes.includes('property') && hasProperty) {
            if (lastUserMessage.includes('warehouse') || lastUserMessage.includes('storage')) {
              responseText = "The map currently shows several warehouse complexes, including:\n\n- Southport Logistics Park\n- Mockingbird Industrial Center\n- Valwood Industrial Park\n- Commercial warehousing at Dallas Trade Center\n\nThese facilities offer various warehouse capabilities from simple storage to sophisticated distribution operations.";
            } else if (lastUserMessage.includes('manufacturing') || lastUserMessage.includes('production')) {
              responseText = "For manufacturing facilities, the current map shows:\n\n- Pinnacle Industrial Center\n- GSW Industrial Park (technology manufacturing)\n- Richardson Tech Park (technology manufacturing)\n- Garland Industrial Estate (manufacturing complex)\n- East Dallas Manufacturing (specialized manufacturing)\n\nThese locations support various types of production from general manufacturing to specialized technology production.";
            } else {
              responseText = "The industrial properties displayed on the map include a mix of:\n\n- Logistics facilities (like Dallas Logistics Hub)\n- Warehouse complexes (Southport Logistics Park, Valwood Industrial Park)\n- Manufacturing facilities (Pinnacle Industrial Center, Garland Industrial Estate)\n- Distribution centers (DFW Commerce Center, Redbird Distribution Center)\n\nThese properties are distributed throughout the Dallas area, with concentrations in both the northern and southern industrial districts.";
            }
          } else {
            responseText = `Based on what's currently displayed on the map, I can see ${displayedLocationTypes.join(' and ')} locations. Could you be more specific about what you're looking for? I can provide details about specific features or areas.`;
          }
        }
        // Check if this is a follow-up question about what's on the map
        else if (isFollowUp && lastUserMessage.length < 60 && !lastUserMessage.includes('hello') && !lastUserMessage.includes('hi') && displayedLocationTypes.length > 0) {
          // Build response based on what's currently on the map
          const locationDesc = displayedLocationTypes.map(type => {
            switch(type) {
              case 'fedex': return "FedEx locations offering various shipping and business services";
              case 'starbucks': return "Starbucks cafes with different amenities across Dallas";
              case 'property': return "industrial properties including warehouses and distribution centers";
              default: return type;
            }
          }).join(' and ');
          
          responseText = `I'm looking at the map which is currently showing ${locationDesc}. `;
          
          if (hasQuestion) {
            responseText += "Based on what I can see, ";
            
            if (hasFedEx && displayedLocationTypes.includes('fedex')) {
              responseText += "the FedEx locations are distributed throughout Dallas, with concentrations in the business districts and near major highways for easy access. ";
            }
            
            if (hasStarbucks && displayedLocationTypes.includes('starbucks')) {
              responseText += "the Starbucks cafes are strategically placed in high-traffic areas, business centers, and residential neighborhoods throughout Dallas. Many offer drive-thru service or outdoor seating. ";
            }
            
            if (hasProperty && displayedLocationTypes.includes('property')) {
              responseText += "the industrial properties are mainly concentrated in designated industrial zones, with larger complexes in South Dallas near transportation hubs. ";
            }
            
            responseText += "\n\nWould you like me to focus on a specific area or show relationships between different location types?";
          } else {
            responseText += "Is there something specific you'd like to know about these locations? I can help with information about their features, relationships between different location types, or focus on a particular area of Dallas.";
          }
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

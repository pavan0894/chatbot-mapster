
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { getAIResponse, ChatMessageData, generateSuggestedQuestions } from '@/services/openaiService';
import ChatMessage, { MessageType } from './ChatMessage';

export type LocationSourceTarget = 'fedex' | 'property';

export interface LocationQuery {
  source: LocationSourceTarget;
  target?: LocationSourceTarget;
  radius: number;
  isDallasQuery?: boolean; // Added field to track if this is a Dallas area query
}

export const LOCATION_QUERY_EVENT = 'location-query';

// Emit a location query event
export function emitLocationQuery(query: LocationQuery) {
  console.log("Emitting location query:", query);
  const event = new CustomEvent(LOCATION_QUERY_EVENT, { detail: query });
  window.dispatchEvent(event);
}

// Enhanced function to determine if a message is a location query with better Dallas area detection
function isLocationQuery(message: string): LocationQuery | null {
  message = message.toLowerCase();
  
  // Dallas area detection patterns
  const dallasPatterns = [
    /\bdallas\b/i,
    /\bdallas\s+area\b/i,
    /\bdallas\s+region\b/i,
    /\bin\s+dallas\b/i,
    /\bnear\s+dallas\b/i,
    /\baround\s+dallas\b/i,
    /\bdfw\b/i,
    /\bdallas-fort\s+worth\b/i
  ];
  
  // Check if message mentions Dallas area
  const isDallasQuery = dallasPatterns.some(pattern => pattern.test(message));
  
  // More comprehensive FedEx detection patterns
  const fedExPatterns = [
    // Direct mentions
    /\bfedex\b/i, 
    /\bfed\s*ex\b/i, 
    /\bfederal\s*express\b/i,
    
    // Service-related
    /shipping\s+(center|location|service)/i,
    /delivery\s+service/i,
    /package\s+(service|delivery)/i,
    /express\s+(shipping|delivery)/i,
    
    // Query patterns
    /where\s+(?:are|is)\s+(?:the\s+)?fedex/i,
    /show\s+(?:me\s+)?(?:all\s+)?fedex/i,
    /find\s+(?:me\s+)?(?:all\s+)?fedex/i,
    /locate\s+(?:all\s+)?fedex/i,
    /display\s+(?:all\s+)?fedex/i,
    /fedex\s+locations/i,
    /fedex\s+(?:near|close|around)/i,
    /about\s+fedex/i,
    /fedex.+\?/i
  ];
  
  const propertyPatterns = [
    // Direct mentions
    /\bproperty\b/i, 
    /\bproperties\b/i, 
    /\bindustrial\b/i,
    /\bwarehouse[s]?\b/i,
    /\blogistics\b/i,
    /\bdistribution\b/i,
    /\bmanufacturing\b/i,
    /\bfacility\b/i,
    /\bindustrial\s+park\b/i,
    /\bbusiness\s+park\b/i,
    
    // Query patterns
    /where\s+(?:are|is)\s+(?:the\s+)?(?:industrial\s+)?properties/i,
    /show\s+(?:me\s+)?(?:all\s+)?(?:industrial\s+)?properties/i,
    /about\s+(?:industrial\s+)?properties/i,
    /properties.+\?/i
  ];
  
  // Check for show/display/where keywords that indicate a user wants to see something
  const showPatterns = [
    /\bshow\b/i,
    /\bdisplay\b/i,
    /\bwhere\b/i,
    /\bfind\b/i,
    /\blocate\b/i
  ];
  
  const isShowingRequest = showPatterns.some(pattern => pattern.test(message));
  
  // Check for FedEx mentions
  const hasFedEx = fedExPatterns.some(pattern => pattern.test(message));
  
  // Check for property mentions
  const hasProperty = propertyPatterns.some(pattern => pattern.test(message));
  
  // Determine radius (default to 5 miles)
  let radius = 5;
  const radiusMatch = message.match(/(\d+)(?:\s+)?(?:mile|mi|miles)/i);
  if (radiusMatch) {
    radius = parseInt(radiusMatch[1], 10);
  }
  
  // Check for questions about "all" FedEx or properties
  const askingForAll = /show\s+(?:me\s+)?all|where\s+(?:are|is)\s+all|find\s+all|display\s+all|list\s+all/i.test(message);
  
  // Check for distance/proximity terms
  const hasProximity = /near|close\s+to|within|around|nearby|proximity|closest|nearest/i.test(message);
  
  // Special case for Dallas property queries
  if (hasProperty && isDallasQuery && isShowingRequest) {
    console.log("Detected request for properties in Dallas area");
    return { 
      source: 'property' as LocationSourceTarget, 
      radius,
      isDallasQuery: true 
    };
  }
  
  // If explicitly asking for all FedEx locations
  if (hasFedEx && (askingForAll || !hasProximity) && !hasProperty) {
    console.log("Detected request for FedEx locations");
    return { 
      source: 'fedex' as LocationSourceTarget, 
      radius,
      isDallasQuery 
    };
  }
  
  // If explicitly asking for all properties (but not Dallas-specific)
  if (hasProperty && (askingForAll || !hasProximity) && !hasFedEx) {
    console.log("Detected request for property locations");
    return { 
      source: 'property' as LocationSourceTarget, 
      radius,
      isDallasQuery 
    };
  }
  
  // If both FedEx and properties are mentioned
  if (hasFedEx && hasProperty) {
    // If proximity terms found, determine relationship direction
    if (hasProximity) {
      // Check which entity is being asked about in relation to the other
      const fedExNearProperty = /fedex\s+(?:near|close\s+to|within|around|nearby|proximity|closest|nearest)\s+.*(?:propert|warehouse|industrial|facilit)/i.test(message) ||
                              /(?:near|close\s+to|within|around|nearby|proximity|closest|nearest)\s+.*(?:propert|warehouse|industrial|facilit).*fedex/i.test(message);
      
      const propertyNearFedEx = /(?:propert|warehouse|industrial|facilit).*\s+(?:near|close\s+to|within|around|nearby|proximity|closest|nearest)\s+.*fedex/i.test(message) ||
                              /(?:near|close\s+to|within|around|nearby|proximity|closest|nearest)\s+.*fedex.*(?:propert|warehouse|industrial|facilit)/i.test(message);
      
      if (fedExNearProperty) {
        console.log("Detected request for FedEx locations near properties");
        return {
          source: 'fedex' as LocationSourceTarget,
          target: 'property' as LocationSourceTarget,
          radius,
          isDallasQuery
        };
      } else if (propertyNearFedEx) {
        console.log("Detected request for properties near FedEx locations");
        return {
          source: 'property' as LocationSourceTarget,
          target: 'fedex' as LocationSourceTarget,
          radius,
          isDallasQuery
        };
      }
    }
    
    // Default relationship when both are mentioned but relationship is unclear
    console.log("Detected both FedEx and properties, defaulting to properties near FedEx");
    return {
      source: 'property' as LocationSourceTarget,
      target: 'fedex' as LocationSourceTarget,
      radius,
      isDallasQuery
    };
  }
  
  // If no strong location query is detected but FedEx is mentioned, assume basic FedEx query
  if (hasFedEx) {
    return { 
      source: 'fedex' as LocationSourceTarget, 
      radius,
      isDallasQuery
    };
  }
  
  // If no strong location query is detected but property is mentioned, assume basic property query
  if (hasProperty) {
    return { 
      source: 'property' as LocationSourceTarget, 
      radius,
      isDallasQuery
    };
  }
  
  // If it's not a location query we recognize
  return null;
}

interface ChatbotProps {
  className?: string;
}

const Chatbot: React.FC<ChatbotProps> = ({ className = '' }) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Welcome message
  useEffect(() => {
    const welcomeMessage: MessageType = {
      id: 'welcome',
      text: "Welcome to MapChat! I can help you find FedEx locations and industrial properties. Try asking questions like:\n\n- Show me all FedEx locations\n- Where are industrial properties in Dallas?\n- Show properties within 3 miles of FedEx locations\n- Which FedEx locations are near warehouses?",
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);
  
  // Auto-scroll to the latest message
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isProcessing) return;
    
    setIsProcessing(true);
    
    // Generate unique ID for message
    const msgId = Date.now().toString();
    
    // Add user message
    const userMessage: MessageType = {
      id: msgId,
      text: input,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);

    // Check if the message is a location query
    const locationQuery = isLocationQuery(input);
    console.log("Location query detected in Chatbot:", locationQuery);

    // Create a temporary processing message
    const processingMessage: MessageType = {
      id: `processing-${msgId}`,
      text: locationQuery ? 
        (locationQuery.source === 'fedex' ? 
          "Searching for FedEx locations..." : 
          "Searching for industrial properties...") :
        "Processing your request...",
      sender: 'bot',
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, processingMessage]);

    // Convert messages to format expected by AI service
    const messageHistory: ChatMessageData[] = messages
      .filter(msg => msg.id !== `processing-${msgId}`)
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));
    
    // Add current user message
    messageHistory.push({
      role: 'user',
      content: input
    });
    
    try {
      // If this is a location query, trigger the map update event
      if (locationQuery) {
        // Log the query details before dispatching the event
        console.log("About to emit location query event with details:", JSON.stringify(locationQuery));
        
        // Create and dispatch the custom event with proper detail
        const event = new CustomEvent(LOCATION_QUERY_EVENT, { 
          detail: locationQuery,
          bubbles: true,
          cancelable: true
        });
        
        // Explicitly dispatch event from window
        window.dispatchEvent(event);
        console.log("Location query event dispatched");
      }
      
      // Get AI response
      const response = await getAIResponse(messageHistory);
      
      // Replace processing message with actual response
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === `processing-${msgId}` 
            ? { ...msg, id: `response-${msgId}`, text: response.text } 
            : msg
        )
      );
      
      if (response.error) {
        toast({
          title: "Error",
          description: "Sorry, I couldn't process your request. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      
      // Replace processing message with error message
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === `processing-${msgId}` 
            ? { 
                ...msg, 
                id: `error-${msgId}`, 
                text: "I encountered an error processing your request. Please try a different question." 
              } 
            : msg
        )
      );
      
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive"
      });
    }

    // Clear input and reset processing state
    setInput('');
    setIsProcessing(false);
  }, [input, messages, isProcessing, toast]);

  // Handle Enter key press
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  // Function to handle suggestion clicks
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => sendMessage(), 100);
  };

  return (
    <Card className={cn("w-full h-full rounded-none flex flex-col", className)}>
      <CardContent className="flex flex-col h-full p-0">
        {/* Chat Messages */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          <div className="flex flex-col space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isProcessing && (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="text-sm">Thinking...</span>
              </div>
            )}
            
            {/* Suggestions (shown after user gets replies from the bot) */}
            {messages.length > 1 && !isProcessing && (
              <div className="flex flex-wrap gap-2 mt-4">
                {generateSuggestedQuestions(messages.filter(m => m.id !== 'welcome').map(m => ({
                  role: m.sender === 'user' ? 'user' : 'assistant',
                  content: m.text
                }))).slice(0, 3).map((suggestion, index) => (
                  <Button 
                    key={`suggestion-${index}`} 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion.length > 60 ? suggestion.substring(0, 57) + '...' : suggestion}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-border mt-auto">
          <div className="flex items-center space-x-2">
            <Input
              id="chat-input"
              type="text"
              placeholder="Ask me about locations..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
              disabled={isProcessing}
            />
            <Button 
              onClick={sendMessage} 
              disabled={isProcessing || !input.trim()}
            >
              Send
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Chatbot;

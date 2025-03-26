
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { getAIResponse, ChatMessageData } from '@/services/openaiService';
import ChatMessage, { MessageType } from './ChatMessage';

export type LocationSourceTarget = 'fedex' | 'property';

export interface LocationQuery {
  source: LocationSourceTarget;
  target?: LocationSourceTarget;
  radius: number;
}

export const LOCATION_QUERY_EVENT = 'location-query';

// Emit a location query event
export function emitLocationQuery(query: LocationQuery) {
  console.log("Emitting location query:", query);
  const event = new CustomEvent(LOCATION_QUERY_EVENT, { detail: query });
  window.dispatchEvent(event);
}

// Function to determine if a message is a location query
function isLocationQuery(message: string): LocationQuery | null {
  message = message.toLowerCase();
  
  // Check for fedex and property mentions
  const hasFedEx = message.includes('fedex');
  const hasProperty = message.includes('property') || message.includes('industrial') || message.includes('warehouse');
  
  // If no location types are mentioned, return null
  if (!hasFedEx && !hasProperty) {
    return null;
  }
  
  // Determine radius (default to 5 miles)
  let radius = 5;
  const radiusMatch = message.match(/(\d+)(?:\s+)?(?:mile|mi|miles)/i);
  if (radiusMatch) {
    radius = parseInt(radiusMatch[1], 10);
  }
  
  // Simple queries for showing all locations of a type
  if (message.match(/show\s+(?:all\s+)?fedex/i) || message.match(/where\s+(?:are|is)\s+(?:all\s+)?fedex/i)) {
    return { source: 'fedex' as LocationSourceTarget, radius };
  }
  
  if (message.match(/show\s+(?:all\s+)?(?:properties|property|industrial|warehouses)/i) || 
      message.match(/where\s+(?:are|is)\s+(?:all\s+)?(?:properties|property|industrial|warehouses)/i)) {
    return { source: 'property' as LocationSourceTarget, radius };
  }
  
  // Analyze for relationship queries
  if (hasFedEx && hasProperty) {
    // Determine if FedEx is the source or target
    if ((message.includes('fedex near') || message.includes('fedex close to') || 
        message.includes('fedex within') || message.includes('fedex around')) && hasProperty) {
      return {
        source: 'fedex' as LocationSourceTarget,
        target: 'property' as LocationSourceTarget,
        radius
      };
    } else if ((message.includes('property near') || message.includes('properties near') || 
               message.includes('warehouse near') || message.includes('warehouses near') || 
               message.includes('industrial near') || message.includes('properties close to') || 
               message.includes('properties within') || message.includes('properties around')) && hasFedEx) {
      return {
        source: 'property' as LocationSourceTarget,
        target: 'fedex' as LocationSourceTarget,
        radius
      };
    } else {
      // Default relationship when both are mentioned but relationship is unclear
      return {
        source: 'property' as LocationSourceTarget,
        target: 'fedex' as LocationSourceTarget,
        radius
      };
    }
  }
  
  // If we've detected only one location type, make it the source
  if (hasFedEx) {
    return { source: 'fedex' as LocationSourceTarget, radius };
  }
  
  if (hasProperty) {
    return { source: 'property' as LocationSourceTarget, radius };
  }
  
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
      text: "Welcome to MapChat! I can help you find FedEx locations and industrial properties. Try asking questions like:\n\n- Show all FedEx locations\n- Where are industrial properties in Dallas?\n- Show properties within 3 miles of FedEx locations\n- Which FedEx locations are near warehouses?",
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
      text: locationQuery ? "Searching for locations..." : "Processing your request...",
      sender: 'bot',
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, processingMessage]);

    if (locationQuery) {
      // Explicitly emit the location query event
      emitLocationQuery(locationQuery);
      
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
    } else {
      // For non-location queries, provide a helpful message
      const helpMessage: MessageType = {
        id: `help-${msgId}`,
        text: "I can help with location-based questions about FedEx centers and industrial properties. Try asking about:\n\n- FedEx locations in a specific area\n- Industrial properties near FedEx centers\n- Properties within a certain distance of FedEx\n- Specific FedEx services or property types",
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === `processing-${msgId}` ? helpMessage : msg
        )
      );
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

import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"

export type LocationSourceTarget = 'fedex' | 'property';

export interface LocationQuery {
  source: LocationSourceTarget;
  target?: LocationSourceTarget;
  radius: number;
}

export const LOCATION_QUERY_EVENT = 'location-query';

// Emit a location query event
export function emitLocationQuery(query: LocationQuery) {
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
    if (message.includes('fedex near') || message.includes('fedex close to') || 
        message.includes('fedex within') || message.includes('fedex around')) {
      return {
        source: 'fedex' as LocationSourceTarget,
        target: 'property' as LocationSourceTarget,
        radius
      };
    } else {
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
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState<string>('');
  const { toast } = useToast();

  const sendMessage = useCallback(() => {
    if (!input.trim()) return;

    // Add user message
    setMessages(prevMessages => [...prevMessages, `You: ${input}`]);

    // Check if the message is a location query
    const locationQuery = isLocationQuery(input);

    if (locationQuery) {
      // Emit the location query event
      emitLocationQuery(locationQuery);
      setMessages(prevMessages => [...prevMessages, `MapChat: Searching for locations...`]);
    } else {
      // Handle non-location query messages
      setMessages(prevMessages => [...prevMessages, `MapChat: I can only help with location-based questions about properties and FedEx locations.`]);
    }

    // Clear input
    setInput('');
  }, [input, setMessages, toast]);

  // Handle Enter key press
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  // Auto-focus on the input field on component mount
  useEffect(() => {
    const inputElement = document.getElementById('chat-input');
    if (inputElement) {
      inputElement.focus();
    }
  }, []);

  return (
    <Card className={cn("w-full h-full rounded-none", className)}>
      <CardContent className="flex flex-col h-full p-0">
        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="flex flex-col space-y-2">
            {messages.map((message, index) => (
              <p key={index} className="text-sm">
                {message}
              </p>
            ))}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-2">
            <Input
              id="chat-input"
              type="text"
              placeholder="Ask me about locations..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button onClick={sendMessage}>Send</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Chatbot;

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { getAIResponse, ChatMessageData, generateSuggestedQuestions } from '@/services/openaiService';
import ChatMessage, { MessageType } from './ChatMessage';
import { STARBUCKS_LOCATIONS } from '@/data/starbucksLocations';
import { parseComplexSpatialQuery, parseMultiTargetQuery, parseAnyMultiLocationQuery } from '@/utils/mapUtils';
import { setupDebugEventListener, verifyEventCreation } from '@/utils/debugUtils';

export type LocationSourceTarget = 'property' | 'fedex' | 'starbucks';

export interface LocationQuery {
  source: LocationSourceTarget;
  target?: LocationSourceTarget;
  radius: number;
  isDallasQuery?: boolean;
  queryText?: string;
  complexQuery?: {
    includeType: LocationSourceTarget;
    excludeType: LocationSourceTarget;
    includeRadius: number;
    excludeRadius: number;
  };
  multiTargetQuery?: {
    targetTypes: {
      type: LocationSourceTarget;
      radius: number;
    }[];
  };
  dynamicQuery?: {
    primaryType: LocationSourceTarget;
    targetTypes: {
      [key in LocationSourceTarget]?: {
        radius: number;
      };
    };
  };
}

export const LOCATION_QUERY_EVENT = 'location-query';
export const API_QUERY_EVENT = 'api-query-event';
export const COMPLEX_QUERY_EVENT = 'complex-query-event';
export const MULTI_TARGET_QUERY_EVENT = 'multi-target-query-event';
export const DYNAMIC_QUERY_EVENT = 'dynamic-query-event';

export function emitLocationQuery(query: LocationQuery) {
  console.log("Emitting location query:", query);
  const event = new CustomEvent(LOCATION_QUERY_EVENT, { 
    detail: query,
    bubbles: true,
    cancelable: true 
  });
  console.log("Created location query event:", event);
  window.dispatchEvent(event);
  console.log("Dispatched location query event");
}

export function emitComplexQueryEvent(query: LocationQuery) {
  console.log("Emitting complex query event:", query);
  const event = new CustomEvent(COMPLEX_QUERY_EVENT, { 
    detail: query,
    bubbles: true,
    cancelable: true 
  });
  window.dispatchEvent(event);
  console.log("Complex query event dispatched");
}

export function emitMultiTargetQueryEvent(query: LocationQuery) {
  console.log("Emitting multi-target query event:", query);
  const event = new CustomEvent(MULTI_TARGET_QUERY_EVENT, { detail: query });
  window.dispatchEvent(event);
}

export function emitDynamicQueryEvent(query: LocationQuery) {
  console.log("Emitting dynamic query event:", query);
  const event = new CustomEvent(DYNAMIC_QUERY_EVENT, { detail: query });
  window.dispatchEvent(event);
}

export function emitApiQueryEvent(query: string) {
  console.log("Emitting API query event:", query);
  const event = new CustomEvent(API_QUERY_EVENT, { detail: { query } });
  window.dispatchEvent(event);
}

function isLocationQuery(message: string): LocationQuery | null {
  message = message.toLowerCase();
  
  const anyMultiLocationQuery = parseAnyMultiLocationQuery(message);
  if (anyMultiLocationQuery) {
    console.log("Detected flexible multi-location query:", anyMultiLocationQuery);
    return {
      source: 'property' as LocationSourceTarget,
      radius: 5,
      isDallasQuery: message.includes('dallas') || message.includes('dfw'),
      queryText: message,
      dynamicQuery: {
        primaryType: anyMultiLocationQuery.primaryType,
        targetTypes: anyMultiLocationQuery.targetTypes
      }
    };
  }
  
  const multiTargetQuery = parseMultiTargetQuery(message);
  if (multiTargetQuery) {
    console.log("Detected multi-target proximity query:", multiTargetQuery);
    return {
      source: 'property' as LocationSourceTarget,
      radius: 5,
      isDallasQuery: message.includes('dallas') || message.includes('dfw'),
      queryText: message,
      multiTargetQuery
    };
  }
  
  const complexQuery = parseComplexSpatialQuery(message);
  if (complexQuery) {
    console.log("Detected complex spatial query:", complexQuery);
    return { 
      source: 'property' as LocationSourceTarget, 
      radius: complexQuery.includeRadius,
      isDallasQuery: message.includes('dallas') || message.includes('dfw'),
      queryText: message,
      complexQuery: {
        includeType: complexQuery.includeType,
        excludeType: complexQuery.excludeType,
        includeRadius: complexQuery.includeRadius,
        excludeRadius: complexQuery.excludeRadius
      }
    };
  }
  
  const nearFarPattern = /(properties|warehouses|industrial).*?(near|close to).*?(fedex).*?(far from|away from|not near).*?(starbucks)|.*?(fedex).*?(properties|warehouses|industrial).*?(not near|far from|away from).*?(starbucks)/i;
  const farNearPattern = /(properties|warehouses|industrial).*?(near|close to).*?(starbucks).*?(far from|away from|not near).*?(fedex)|.*?(starbucks).*?(properties|warehouses|industrial).*?(not near|far from|away from).*?(fedex)/i;
  
  if (nearFarPattern.test(message)) {
    console.log("Detected complex spatial query using pattern matching (near FedEx, far from Starbucks)");
    let includeRadius = 2;
    let excludeRadius = 3;
    
    const nearRadiusMatch = message.match(/(\d+)\s*miles?\s*(?:of|from|to|near)\s*fedex/i);
    const farRadiusMatch = message.match(/(\d+)\s*miles?\s*(?:away|far)\s*(?:from)\s*starbucks/i);
    
    if (nearRadiusMatch && nearRadiusMatch[1]) {
      includeRadius = parseInt(nearRadiusMatch[1], 10);
    }
    
    if (farRadiusMatch && farRadiusMatch[1]) {
      excludeRadius = parseInt(farRadiusMatch[1], 10);
    }
    
    return {
      source: 'property' as LocationSourceTarget,
      radius: includeRadius,
      isDallasQuery: message.includes('dallas') || message.includes('dfw'),
      queryText: message,
      complexQuery: {
        includeType: 'fedex',
        excludeType: 'starbucks', 
        includeRadius,
        excludeRadius
      }
    };
  }
  
  if (farNearPattern.test(message)) {
    console.log("Detected complex spatial query using pattern matching (near Starbucks, far from FedEx)");
    let includeRadius = 2;
    let excludeRadius = 3;
    
    const nearRadiusMatch = message.match(/(\d+)\s*miles?\s*(?:of|from|to|near)\s*starbucks/i);
    const farRadiusMatch = message.match(/(\d+)\s*miles?\s*(?:away|far)\s*(?:from)\s*fedex/i);
    
    if (nearRadiusMatch && nearRadiusMatch[1]) {
      includeRadius = parseInt(nearRadiusMatch[1], 10);
    }
    
    if (farRadiusMatch && farRadiusMatch[1]) {
      excludeRadius = parseInt(farRadiusMatch[1], 10);
    }
    
    return {
      source: 'property' as LocationSourceTarget,
      radius: includeRadius,
      isDallasQuery: message.includes('dallas') || message.includes('dfw'),
      queryText: message,
      complexQuery: {
        includeType: 'starbucks',
        excludeType: 'fedex',
        includeRadius,
        excludeRadius
      }
    };
  }
  
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
  
  const isDallasQuery = dallasPatterns.some(pattern => pattern.test(message));
  
  const fedExPatterns = [
    /\bfedex\b/i, 
    /\bfed\s*ex\b/i, 
    /\bfederal\s*express\b/i,
    
    /shipping\s+(center|location|service)/i,
    /delivery\s+service/i,
    /package\s+(service|delivery)/i,
    /express\s+(shipping|delivery)/i,
    
    /where\s+(?:are|is|can\s+i\s+find)\s+(?:the\s+)?fedex/i,
    /show\s+(?:me\s+)?(?:all\s+)?fedex/i,
    /find\s+(?:me\s+)?(?:all\s+)?fedex/i,
    /locate\s+(?:all\s+)?fedex/i,
    /display\s+(?:all\s+)?fedex/i,
    /fedex\s+locations/i,
    /fedex\s+(?:near|close|around)/i,
    /about\s+fedex/i,
    /fedex.+\?/i,
    /shipping\s+locat/i,
    /express\s+service/i,
    /courier\s+service/i,
    /parcel\s+service/i
  ];
  
  const starbucksPatterns = [
    /\bstarbucks\b/i,
    /\bstarbuck's\b/i,
    /\bcoffee\s+shop[s]?\b/i,
    /\bcafe[s]?\b/i,
    
    /coffee/i,
    /latte/i,
    /espresso/i,
    /cappuccino/i,
    /frappuccino/i,
    
    /where\s+(?:are|is|can\s+i\s+find)\s+(?:the\s+)?starbucks/i,
    /show\s+(?:me\s+)?(?:all\s+)?starbucks/i,
    /find\s+(?:me\s+)?(?:all\s+)?starbucks/i,
    /locate\s+(?:all\s+)?starbucks/i,
    /display\s+(?:all\s+)?starbucks/i,
    /starbucks\s+locations/i,
    /starbucks\s+(?:near|close|around)/i,
    /about\s+starbucks/i,
    /starbucks.+\?/i,
    /buy\s+coffee/i,
    /get\s+coffee/i,
    /drink\s+coffee/i,
    /coffee\s+near/i
  ];
  
  const propertyPatterns = [
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
    
    /where\s+(?:are|is|can\s+i\s+find)\s+(?:the\s+)?(?:industrial\s+)?properties/i,
    /show\s+(?:me\s+)?(?:all\s+)?(?:industrial\s+)?properties/i,
    /about\s+(?:industrial\s+)?properties/i,
    /properties.+\?/i,
    /commercial\s+space/i,
    /commercial\s+property/i,
    /industrial\s+space/i,
    /industrial\s+building/i,
    /warehouse\s+space/i,
    /storage\s+facilit/i
  ];
  
  const showPatterns = [
    /\bshow\b/i,
    /\bdisplay\b/i,
    /\bwhere\b/i,
    /\bfind\b/i,
    /\blocate\b/i,
    /\bsee\b/i,
    /\bview\b/i,
    /\bget\b/i,
    /\blist\b/i,
    /\bspot\b/i,
    /\bidentify\b/i
  ];
  
  const hasFedEx = fedExPatterns.some(pattern => pattern.test(message));
  const hasStarbucks = starbucksPatterns.some(pattern => pattern.test(message));
  const hasProperty = propertyPatterns.some(pattern => pattern.test(message));
  
  let radius = 5;
  const radiusMatch = message.match(/(\d+)(?:\s+)?(?:mile|mi|miles|m)/i);
  if (radiusMatch) {
    radius = parseInt(radiusMatch[1], 10);
  }
  
  const askingForAll = /show\s+(?:me\s+)?all|where\s+(?:are|is)\s+all|find\s+all|display\s+all|list\s+all|view\s+all/i.test(message);
  
  const hasProximity = /near|close\s+to|within|around|nearby|proximity|closest|nearest|adjacent|neighbor/i.test(message);
  
  const isShowRequest = showPatterns.some(pattern => pattern.test(message));
  
  if (hasStarbucks && (askingForAll || isShowRequest || !hasProximity) && !hasProperty && !hasFedEx) {
    console.log("Detected request for Starbucks locations");
    return { 
      source: 'starbucks' as LocationSourceTarget, 
      radius,
      isDallasQuery,
      queryText: message
    };
  }
  
  if (hasFedEx && (askingForAll || isShowRequest || !hasProximity) && !hasProperty && !hasStarbucks) {
    console.log("Detected request for FedEx locations");
    return { 
      source: 'fedex' as LocationSourceTarget, 
      radius,
      isDallasQuery,
      queryText: message
    };
  }
  
  if (isDallasQuery && hasProperty) {
    console.log("Detected request for properties in Dallas area");
    return { 
      source: 'property' as LocationSourceTarget, 
      radius,
      isDallasQuery: true,
      queryText: message 
    };
  }
  
  if (hasProperty && (askingForAll || isShowRequest || !hasProximity) && !hasFedEx && !hasStarbucks) {
    console.log("Detected request for property locations");
    return { 
      source: 'property' as LocationSourceTarget, 
      radius,
      isDallasQuery,
      queryText: message
    };
  }
  
  if (hasProximity) {
    if (hasStarbucks && hasProperty && !hasFedEx) {
      const starbucksNearProperty = /starbucks\s+(?:near|close\s+to|within|around|nearby|proximity|closest|nearest)\s+.*(?:propert|warehouse|industrial|facilit)/i.test(message);
      
      if (starbucksNearProperty) {
        console.log("Detected request for Starbucks locations near properties");
        return {
          source: 'starbucks' as LocationSourceTarget,
          target: 'property' as LocationSourceTarget,
          radius,
          isDallasQuery,
          queryText: message
        };
      } else {
        console.log("Detected request for properties near Starbucks locations");
        return {
          source: 'property' as LocationSourceTarget,
          target: 'starbucks' as LocationSourceTarget,
          radius,
          isDallasQuery,
          queryText: message
        };
      }
    }
    
    if (hasStarbucks && hasFedEx && !hasProperty) {
      const starbucksNearFedEx = /starbucks\s+(?:near|close\s+to|within|around|nearby|proximity|closest|nearest)\s+.*fedex/i.test(message);
      
      if (starbucksNearFedEx) {
        console.log("Detected request for Starbucks locations near FedEx");
        return {
          source: 'starbucks' as LocationSourceTarget,
          target: 'fedex' as LocationSourceTarget,
          radius,
          isDallasQuery,
          queryText: message
        };
      } else {
        console.log("Detected request for FedEx locations near Starbucks");
        return {
          source: 'fedex' as LocationSourceTarget,
          target: 'starbucks' as LocationSourceTarget,
          radius,
          isDallasQuery,
          queryText: message
        };
      }
    }
    
    if (hasFedEx && hasProperty && !hasStarbucks) {
      const fedExNearProperty = /fedex\s+(?:near|close\s+to|within|around|nearby|proximity|closest|nearest)\s+.*(?:propert|warehouse|industrial|facilit)/i.test(message) ||
                              /(?:near|close\s+to|within|around|nearby|proximity|closest|nearest)\s+.*(?:propert|warehouse|industrial|facilit).*fedex/i.test(message);
      
      if (fedExNearProperty) {
        console.log("Detected request for FedEx locations near properties");
        return {
          source: 'fedex' as LocationSourceTarget,
          target: 'property' as LocationSourceTarget,
          radius,
          isDallasQuery,
          queryText: message
        };
      } else {
        console.log("Detected request for properties near FedEx locations");
        return {
          source: 'property' as LocationSourceTarget,
          target: 'fedex' as LocationSourceTarget,
          radius,
          isDallasQuery,
          queryText: message
        };
      }
    }
  }
  
  if (hasStarbucks && hasFedEx && hasProperty) {
    const firstMentioned = 
      message.indexOf('starbucks') < message.indexOf('fedex') && message.indexOf('starbucks') < message.indexOf('propert') ? 'starbucks' :
      message.indexOf('fedex') < message.indexOf('starbucks') && message.indexOf('fedex') < message.indexOf('propert') ? 'fedex' :
      'property';
    
    const secondMentioned = 
      firstMentioned !== 'starbucks' && 
        (message.indexOf('starbucks') < message.indexOf('fedex') || firstMentioned === 'fedex') && 
        (message.indexOf('starbucks') < message.indexOf('propert') || firstMentioned === 'property') ? 'starbucks' :
      firstMentioned !== 'fedex' && 
        (message.indexOf('fedex') < message.indexOf('starbucks') || firstMentioned === 'starbucks') && 
        (message.indexOf('fedex') < message.indexOf('propert') || firstMentioned === 'property') ? 'fedex' :
      'property';
    
    console.log(`Detected multiple location types, prioritizing ${firstMentioned} near ${secondMentioned}`);
    
    return {
      source: firstMentioned as LocationSourceTarget,
      target: secondMentioned as LocationSourceTarget,
      radius,
      isDallasQuery,
      queryText: message
    };
  }
  
  if (hasStarbucks) {
    return { 
      source: 'starbucks' as LocationSourceTarget, 
      radius,
      isDallasQuery,
      queryText: message
    };
  }
  
  if (hasFedEx) {
    return { 
      source: 'fedex' as LocationSourceTarget, 
      radius,
      isDallasQuery,
      queryText: message
    };
  }
  
  if (hasProperty) {
    return { 
      source: 'property' as LocationSourceTarget, 
      radius,
      isDallasQuery,
      queryText: message
    };
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
  const [mapContext, setMapContext] = useState<{
    visibleLocations?: LocationSourceTarget[];
    lastQuery?: LocationQuery;
  }>({});

  useEffect(() => {
    console.log("Setting up debug listeners in Chatbot");
    setupDebugEventListener(LOCATION_QUERY_EVENT);
    setupDebugEventListener(COMPLEX_QUERY_EVENT);
    setupDebugEventListener(API_QUERY_EVENT);
    setupDebugEventListener(MULTI_TARGET_QUERY_EVENT);
    setupDebugEventListener(DYNAMIC_QUERY_EVENT);
    
    setTimeout(() => {
      const event = verifyEventCreation('chatbot-loaded', { status: 'ready' });
      window.dispatchEvent(event);
    }, 500);
  }, []);

  useEffect(() => {
    const welcomeMessage: MessageType = {
      id: 'welcome',
      text: "Welcome to MapChat! I can help you find FedEx locations, industrial properties, and Starbucks cafes. Try asking questions like:\n\n- Show me all FedEx locations\n- Where are industrial properties in Dallas?\n- Show properties within 3 miles of FedEx locations\n- Show me all Starbucks cafes in Dallas\n- Which Starbucks are near warehouses?\n- Show me properties within 2 miles of FedEx and 4 miles away from Starbucks\n- Find properties within 3 miles of FedEx and 2 miles of Starbucks",
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    const handleMapUpdate = (e: CustomEvent<any>) => {
      if (e.detail && e.detail.visibleLocations) {
        setMapContext(prev => ({
          ...prev,
          visibleLocations: e.detail.visibleLocations
        }));
      }
      
      if (e.detail && e.detail.query) {
        setMapContext(prev => ({
          ...prev,
          lastQuery: e.detail.query
        }));
      }
    };
    
    window.addEventListener('map-context-update', handleMapUpdate as EventListener);
    
    return () => {
      window.removeEventListener('map-context-update', handleMapUpdate as EventListener);
    };
  }, []);

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
    
    const msgId = Date.now().toString();
    
    const userMessage: MessageType = {
      id: msgId,
      text: input,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);

    let locationQuery = isLocationQuery(input);
    console.log("Location query detected in Chatbot:", locationQuery);
    
    if (!locationQuery && input.toLowerCase().includes('starbucks')) {
      console.log("Failsafe: Detected Starbucks query that wasn't caught by isLocationQuery");
      locationQuery = {
        source: 'starbucks' as LocationSourceTarget,
        radius: 5,
        isDallasQuery: input.toLowerCase().includes('dallas'),
        queryText: input
      };
    }

    const processingMessage: MessageType = {
      id: `processing-${msgId}`,
      text: locationQuery ? 
        (locationQuery.multiTargetQuery ? 
          "Processing multi-target proximity query..." :
          locationQuery.complexQuery ? 
            "Processing complex spatial query..." :
            locationQuery.source === 'fedex' ? 
              "Searching for FedEx locations..." : 
              locationQuery.source === 'starbucks' ?
                "Searching for Starbucks locations..." :
                "Searching for industrial properties...") :
        "Processing your request...",
      sender: 'bot',
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, processingMessage]);

    const messageHistory: ChatMessageData[] = messages
      .filter(msg => msg.id !== `processing-${msgId}`)
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));
    
    messageHistory.push({
      role: 'user',
      content: input
    });
    
    if (mapContext.visibleLocations && mapContext.visibleLocations.length > 0) {
      messageHistory.push({
        role: 'system',
        content: `Currently displayed on the map: ${mapContext.visibleLocations.join(', ')} locations.`
      });
    }
    
    if (mapContext.lastQuery) {
      messageHistory.push({
        role: 'system',
        content: `The last user query that affected the map was about ${mapContext.lastQuery.source} ${mapContext.lastQuery.target ? `near ${mapContext.lastQuery.target}` : ''} with radius ${mapContext.lastQuery.radius} miles.`
      });
    }
    
    try {
      if (locationQuery) {
        console.log("About to emit query event with details:", JSON.stringify(locationQuery));
        
        if (locationQuery.multiTargetQuery) {
          emitMultiTargetQueryEvent(locationQuery);
        } else if (locationQuery.complexQuery) {
          emitComplexQueryEvent(locationQuery);
        } else if (locationQuery.dynamicQuery) {
          emitDynamicQueryEvent(locationQuery);
        } else {
          emitLocationQuery(locationQuery);
        }
      } else {
        if (input.includes("?") || 
            /how\s+many|which\s+ones|tell\s+me\s+about|what\s+is|where\s+is|when\s+is|who\s+is|why\s+is|can\s+you|could\s+you/i.test(input)) {
          emitApiQueryEvent(input);
        }
      }
      
      const response = await getAIResponse(messageHistory);
      
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

    setInput('');
    setIsProcessing(false);
  }, [input, messages, isProcessing, toast, mapContext]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => sendMessage(), 100);
  };

  return (
    <Card className={cn("w-full h-full rounded-none flex flex-col", className)}>
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-lg">Survey Agent</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-full p-0 overflow-hidden">
        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea ref={scrollAreaRef} className="flex-grow p-4 pb-28">
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
        </div>

        <div className="p-4 border-t border-border w-full bg-background sticky bottom-0 z-10">
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

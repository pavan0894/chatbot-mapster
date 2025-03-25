import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, Loader2 } from 'lucide-react';
import ChatMessage, { MessageType } from './ChatMessage';
import { cn } from '@/lib/utils';
import { getAIResponse, ChatMessageData, generateSuggestedQuestions } from '@/services/openaiService';
import { toast } from 'sonner';

interface ChatbotProps {
  className?: string;
}

// Define a union type for location sources/targets to avoid comparison errors
type LocationSourceTarget = 'fedex' | 'property' | 'starbucks';

export interface LocationQuery {
  type: 'location_search';
  source: LocationSourceTarget;
  target?: LocationSourceTarget;
  radius: number;
  targetLocation?: [number, number]; // [longitude, latitude]
}

// Define a custom event for location queries
export const LOCATION_QUERY_EVENT = 'location-query-event';

const initialMessages: MessageType[] = [
  {
    id: '1',
    text: "Hello! I'm your map assistant. Ask me anything about locations, directions, or places you'd like to explore.",
    sender: 'bot',
    timestamp: new Date(),
  },
];

const Chatbot: React.FC<ChatbotProps> = ({ className = '' }) => {
  const [messages, setMessages] = useState<MessageType[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Focus the input on component mount
    inputRef.current?.focus();
    
    // Generate initial suggested questions
    setSuggestedQuestions(generateSuggestedQuestions().slice(0, 3));
  }, []);

  const getMessageHistory = (): ChatMessageData[] => {
    return messages.map(msg => ({
      role: msg.sender === 'bot' ? 'assistant' as const : 'user' as const,
      content: msg.text
    }));
  };

  const isLocationQuery = (message: string): LocationQuery | null => {
    const lowerMsg = message.toLowerCase();
    
    if (
      (lowerMsg.includes('properties') || lowerMsg.includes('property')) && 
      lowerMsg.includes('fedex') && 
      (lowerMsg.includes('near') || lowerMsg.includes('close') || lowerMsg.includes('around') || lowerMsg.includes('radius') || lowerMsg.includes('within') || lowerMsg.includes('miles'))
    ) {
      let radius = 3; // Default radius in miles
      const radiusMatch = lowerMsg.match(/(\d+)\s*(mile|miles|mi)/);
      if (radiusMatch) {
        radius = parseInt(radiusMatch[1]);
      }
      
      return {
        type: 'location_search',
        source: 'fedex',
        target: 'property',
        radius: radius
      };
    }
    
    if (
      lowerMsg.includes('fedex') && 
      (
        (lowerMsg.includes('properties') || lowerMsg.includes('property')) || 
        lowerMsg.includes('industrial') || 
        lowerMsg.includes('warehouse') || 
        lowerMsg.includes('distribution')
      ) && 
      (lowerMsg.includes('near') || lowerMsg.includes('close') || lowerMsg.includes('around') || lowerMsg.includes('radius') || lowerMsg.includes('within') || lowerMsg.includes('miles'))
    ) {
      let radius = 3; // Default radius in miles
      const radiusMatch = lowerMsg.match(/(\d+)\s*(mile|miles|mi)/);
      if (radiusMatch) {
        radius = parseInt(radiusMatch[1]);
      }
      
      return {
        type: 'location_search',
        source: 'property',
        target: 'fedex',
        radius: radius
      };
    }
    
    if (
      lowerMsg.includes('starbucks') &&
      (lowerMsg.includes('near') || lowerMsg.includes('close') || lowerMsg.includes('around') || lowerMsg.includes('radius') || lowerMsg.includes('within') || lowerMsg.includes('miles'))
    ) {
      let radius = 3; // Default radius in miles
      const radiusMatch = lowerMsg.match(/(\d+)\s*(mile|miles|mi)/);
      if (radiusMatch) {
        radius = parseInt(radiusMatch[1]);
      }
      
      let source: LocationSourceTarget = 'starbucks';
      let target: LocationSourceTarget | undefined = 'property';
      
      if (lowerMsg.includes('fedex')) {
        if (lowerMsg.indexOf('starbucks') < lowerMsg.indexOf('fedex')) {
          source = 'starbucks';
          target = 'fedex';
        } else {
          source = 'fedex';
          target = 'starbucks';
        }
      } else if (lowerMsg.includes('property') || lowerMsg.includes('properties')) {
        if (lowerMsg.indexOf('starbucks') < lowerMsg.indexOf('propert')) {
          source = 'starbucks';
          target = 'property';
        } else {
          source = 'property';
          target = 'starbucks';
        }
      }
      
      return {
        type: 'location_search',
        source,
        target,
        radius
      };
    }
    
    if (
      (lowerMsg.includes('properties') || lowerMsg.includes('property') || lowerMsg.includes('fedex')) &&
      lowerMsg.includes('starbucks') &&
      (lowerMsg.includes('near') || lowerMsg.includes('close') || lowerMsg.includes('around') || lowerMsg.includes('radius') || lowerMsg.includes('within') || lowerMsg.includes('miles'))
    ) {
      let radius = 3; // Default radius in miles
      const radiusMatch = lowerMsg.match(/(\d+)\s*(mile|miles|mi|radius)/);
      if (radiusMatch) {
        radius = parseInt(radiusMatch[1]);
      }
      
      let source: LocationSourceTarget;
      let target: LocationSourceTarget;
      
      if (lowerMsg.includes('fedex')) {
        if (lowerMsg.indexOf('fedex') < lowerMsg.indexOf('starbucks')) {
          source = 'fedex';
          target = 'starbucks';
        } else {
          source = 'starbucks';
          target = 'fedex';
        }
      } else {
        if (lowerMsg.indexOf('propert') < lowerMsg.indexOf('starbucks')) {
          source = 'property';
          target = 'starbucks';
        } else {
          source = 'starbucks';
          target = 'property';
        }
      }
      
      return {
        type: 'location_search',
        source,
        target,
        radius
      };
    }
    
    if (
      (lowerMsg.includes('fedex') || lowerMsg.includes('properties') || lowerMsg.includes('property') || lowerMsg.includes('starbucks')) &&
      (lowerMsg.includes('mile') || lowerMsg.includes('miles') || lowerMsg.includes('radius'))
    ) {
      let radius = 3; // Default radius in miles
      const radiusMatch = lowerMsg.match(/(\d+)\s*(mile|miles|mi|radius)/);
      if (radiusMatch) {
        radius = parseInt(radiusMatch[1]);
      }
      
      let source: LocationSourceTarget = 'property';
      let target: LocationSourceTarget | undefined;
      
      if (lowerMsg.includes('starbucks') && lowerMsg.includes('fedex')) {
        if (lowerMsg.indexOf('starbucks') < lowerMsg.indexOf('fedex')) {
          source = 'starbucks' as LocationSourceTarget;
          target = 'fedex' as LocationSourceTarget;
        } else {
          source = 'fedex' as LocationSourceTarget;
          target = 'starbucks' as LocationSourceTarget;
        }
      } else if (lowerMsg.includes('starbucks') && (lowerMsg.includes('property') || lowerMsg.includes('properties'))) {
        if (lowerMsg.indexOf('starbucks') < lowerMsg.indexOf('propert')) {
          source = 'starbucks' as LocationSourceTarget;
          target = 'property' as LocationSourceTarget;
        } else {
          source = 'property' as LocationSourceTarget;
          target = 'starbucks' as LocationSourceTarget;
        }
      } else if (lowerMsg.includes('fedex')) {
        source = 'fedex' as LocationSourceTarget;
        if (lowerMsg.includes('property') || lowerMsg.includes('properties')) {
          target = 'property' as LocationSourceTarget;
        }
      } else if (lowerMsg.includes('starbucks')) {
        source = 'starbucks' as LocationSourceTarget;
      }
      
      return {
        type: 'location_search',
        source,
        target,
        radius
      };
    }
    
    if (lowerMsg.includes('starbucks') && 
        (lowerMsg.includes('show') || lowerMsg.includes('display') || lowerMsg.includes('where') || 
         lowerMsg.includes('find') || lowerMsg.includes('locate') || lowerMsg.includes('search'))) {
      return {
        type: 'location_search',
        source: 'starbucks' as LocationSourceTarget,
        radius: 10 // Larger default radius for general searches
      };
    }
    
    return null;
  };

  const handleLocationQuery = (locationQuery: LocationQuery) => {
    const locationEvent = new CustomEvent(LOCATION_QUERY_EVENT, { 
      detail: locationQuery 
    });
    window.dispatchEvent(locationEvent);
    
    let responseText = '';
    
    if (locationQuery.target) {
      responseText = `Showing ${locationQuery.target === 'fedex' ? 'FedEx locations' : 
                     locationQuery.target === 'starbucks' ? 'Starbucks locations' : 
                     'industrial properties'} within ${locationQuery.radius} miles of ${
                     locationQuery.source === 'fedex' ? 'FedEx locations' : 
                     locationQuery.source === 'starbucks' ? 'Starbucks locations' : 
                     'industrial properties'} on the map.`;
    } else {
      if (locationQuery.source === 'starbucks') {
        responseText = `Showing all Starbucks locations on the map.`;
      } else {
        responseText = `Showing ${locationQuery.source === 'fedex' ? 'FedEx locations' : 
                       locationQuery.source === 'starbucks' ? 'Starbucks locations' : 
                       'industrial properties'} within ${locationQuery.radius} miles on the map.`;
      }
    }
    
    const botMessage: MessageType = {
      id: Date.now().toString(),
      text: responseText,
      sender: 'bot',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, botMessage]);
    setIsLoading(false);
    
    const updatedHistory = [
      ...getMessageHistory(),
      { role: 'assistant' as const, content: responseText }
    ];
    setSuggestedQuestions(generateSuggestedQuestions(updatedHistory).slice(0, 3));
  };

  const handleSuggestedQuestionClick = (question: string) => {
    const userMessage: MessageType = {
      id: Date.now().toString(),
      text: question,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    processMessage(question);
  };

  const processMessage = async (message: string) => {
    try {
      const locationQuery = isLocationQuery(message);
      
      if (locationQuery) {
        handleLocationQuery(locationQuery);
      } else {
        const aiMessages: ChatMessageData[] = getMessageHistory()
          .concat({
            role: 'user' as const,
            content: message
          });
        
        const response = await getAIResponse(aiMessages);
        
        if (response.error) {
          toast.error(response.error);
          setIsLoading(false);
          return;
        }
        
        const botMessage: MessageType = {
          id: Date.now().toString(),
          text: response.text,
          sender: 'bot',
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
        
        const updatedHistory = [
          ...aiMessages,
          { role: 'assistant' as const, content: response.text }
        ];
        setSuggestedQuestions(generateSuggestedQuestions(updatedHistory).slice(0, 3));
      }
    } catch (error) {
      console.error("Error in chat:", error);
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage: MessageType = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    await processMessage(inputValue);
  };

  return (
    <div className={cn("flex flex-col h-full bg-background/80 backdrop-blur-sm", className)}>
      <div className="p-3 border-b border-border">
        <h2 className="text-lg font-medium">Chat Assistant</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="flex items-center space-x-2 animate-fade-in">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-primary">AI</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {!isLoading && suggestedQuestions.length > 0 && (
        <div className="px-3 py-2 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground mb-2">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedQuestionClick(question)}
                className="text-xs bg-background/50 hover:bg-background border border-border rounded-full px-3 py-1 text-foreground/70 hover:text-foreground transition-colors"
              >
                {question.length > 60 ? `${question.substring(0, 57)}...` : question}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-transparent py-2 px-3 rounded-full border border-border focus:border-primary/30 focus:ring-0 outline-none transition-colors text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            className={cn(
              "w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center transition-colors",
              (isLoading || !inputValue.trim()) ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/90 focus:bg-primary/90"
            )}
            disabled={isLoading || !inputValue.trim()}
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <SendIcon size={18} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chatbot;

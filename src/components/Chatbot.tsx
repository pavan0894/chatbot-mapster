import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, Loader2 } from 'lucide-react';
import ChatMessage, { MessageType } from './ChatMessage';
import { cn } from '@/lib/utils';
import { getAIResponse, ChatMessageData, generateSuggestedQuestions } from '@/services/openaiService';
import { toast } from 'sonner';

interface ChatbotProps {
  className?: string;
}

export interface LocationQuery {
  type: 'location_search';
  source: 'fedex' | 'property' | 'starbucks';
  target?: 'fedex' | 'property' | 'starbucks'; // Add target property as optional
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

  // Convert message history to ChatMessageData format for the AI service
  const getMessageHistory = (): ChatMessageData[] => {
    return messages.map(msg => ({
      role: msg.sender === 'bot' ? 'assistant' as const : 'user' as const,
      content: msg.text
    }));
  };

  // Function to check if message is asking about locations
  const isLocationQuery = (message: string): LocationQuery | null => {
    const lowerMsg = message.toLowerCase();
    
    // Check for properties near FedEx query
    if (
      (lowerMsg.includes('properties') || lowerMsg.includes('property')) && 
      lowerMsg.includes('fedex') && 
      (lowerMsg.includes('near') || lowerMsg.includes('close') || lowerMsg.includes('around') || lowerMsg.includes('radius') || lowerMsg.includes('within') || lowerMsg.includes('miles'))
    ) {
      // Extract radius if mentioned
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
    
    // Check for FedEx locations near properties query
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
      // Extract radius if mentioned
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
    
    // Check for Starbucks related queries
    if (
      lowerMsg.includes('starbucks') &&
      (lowerMsg.includes('near') || lowerMsg.includes('close') || lowerMsg.includes('around') || lowerMsg.includes('radius') || lowerMsg.includes('within') || lowerMsg.includes('miles'))
    ) {
      // Extract radius if mentioned
      let radius = 3; // Default radius in miles
      const radiusMatch = lowerMsg.match(/(\d+)\s*(mile|miles|mi)/);
      if (radiusMatch) {
        radius = parseInt(radiusMatch[1]);
      }
      
      // Determine target based on query
      let target: 'property' | 'fedex' = 'property';
      if (lowerMsg.includes('fedex')) {
        target = 'fedex';
      }
      
      return {
        type: 'location_search',
        source: 'starbucks',
        target,
        radius
      };
    }
    
    // Check for properties or FedEx near Starbucks
    if (
      (lowerMsg.includes('properties') || lowerMsg.includes('property') || lowerMsg.includes('fedex')) &&
      lowerMsg.includes('starbucks') &&
      (lowerMsg.includes('near') || lowerMsg.includes('close') || lowerMsg.includes('around') || lowerMsg.includes('radius') || lowerMsg.includes('within') || lowerMsg.includes('miles'))
    ) {
      // Extract radius if mentioned
      let radius = 3; // Default radius in miles
      const radiusMatch = lowerMsg.match(/(\d+)\s*(mile|miles|mi)/);
      if (radiusMatch) {
        radius = parseInt(radiusMatch[1]);
      }
      
      // Determine source based on what comes first in the query
      const source = lowerMsg.includes('fedex') ? 'fedex' : 'property';
      
      return {
        type: 'location_search',
        source,
        target: 'starbucks',
        radius
      };
    }

    // Simplified location queries with just radius
    if (
      (lowerMsg.includes('fedex') || lowerMsg.includes('properties') || lowerMsg.includes('property') || lowerMsg.includes('starbucks')) &&
      (lowerMsg.includes('mile') || lowerMsg.includes('miles') || lowerMsg.includes('radius'))
    ) {
      let radius = 3; // Default radius in miles
      const radiusMatch = lowerMsg.match(/(\d+)\s*(mile|miles|mi|radius)/);
      if (radiusMatch) {
        radius = parseInt(radiusMatch[1]);
      }
      
      // Determine source and target based on query
      let source: 'fedex' | 'property' | 'starbucks' = 'property';
      let target: 'fedex' | 'property' | 'starbucks' | undefined;
      
      if (lowerMsg.includes('starbucks') && lowerMsg.includes('fedex')) {
        if (lowerMsg.indexOf('starbucks') < lowerMsg.indexOf('fedex')) {
          source = 'starbucks';
          target = 'fedex';
        } else {
          source = 'fedex';
          target = 'starbucks';
        }
      } else if (lowerMsg.includes('starbucks') && (lowerMsg.includes('property') || lowerMsg.includes('properties'))) {
        if (lowerMsg.indexOf('starbucks') < lowerMsg.indexOf('propert')) {
          source = 'starbucks';
          target = 'property';
        } else {
          source = 'property';
          target = 'starbucks';
        }
      } else if (lowerMsg.includes('fedex')) {
        source = 'fedex';
        if (lowerMsg.includes('property') || lowerMsg.includes('properties')) {
          target = 'property';
        }
      } else if (lowerMsg.includes('starbucks')) {
        source = 'starbucks';
      }
      
      return {
        type: 'location_search',
        source,
        target,
        radius
      };
    }
    
    return null;
  };

  // Function to handle location queries immediately
  const handleLocationQuery = (locationQuery: LocationQuery) => {
    // Dispatch custom event for map component to listen to
    const locationEvent = new CustomEvent(LOCATION_QUERY_EVENT, { 
      detail: locationQuery 
    });
    window.dispatchEvent(locationEvent);
    
    // Generate response text based on query
    let responseText = '';
    
    if (locationQuery.target) {
      responseText = `Showing ${locationQuery.target === 'fedex' ? 'FedEx locations' : 
                     locationQuery.target === 'starbucks' ? 'Starbucks locations' : 
                     'industrial properties'} within ${locationQuery.radius} miles of ${
                     locationQuery.source === 'fedex' ? 'FedEx locations' : 
                     locationQuery.source === 'starbucks' ? 'Starbucks locations' : 
                     'industrial properties'} on the map.`;
    } else {
      responseText = `Showing locations within ${locationQuery.radius} miles on the map.`;
    }
    
    const botMessage: MessageType = {
      id: Date.now().toString(),
      text: responseText,
      sender: 'bot',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, botMessage]);
    setIsLoading(false);
    
    // Generate new suggested questions based on updated conversation history
    const updatedHistory = [
      ...getMessageHistory(),
      { role: 'assistant' as const, content: responseText }
    ];
    setSuggestedQuestions(generateSuggestedQuestions(updatedHistory).slice(0, 3));
  };

  const handleSuggestedQuestionClick = (question: string) => {
    // Add the clicked question as a user message
    const userMessage: MessageType = {
      id: Date.now().toString(),
      text: question,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    // Process the question
    processMessage(question);
  };

  const processMessage = async (message: string) => {
    try {
      // Check if this is a location query
      const locationQuery = isLocationQuery(message);
      
      if (locationQuery) {
        // Handle location query immediately
        handleLocationQuery(locationQuery);
      } else {
        // Convert our messages to the format expected by OpenAI
        const aiMessages: ChatMessageData[] = getMessageHistory()
          .concat({
            role: 'user' as const,
            content: message
          });
        
        // Get response from AI service
        const response = await getAIResponse(aiMessages);
        
        if (response.error) {
          toast.error(response.error);
          setIsLoading(false);
          return;
        }
        
        // Add bot response
        const botMessage: MessageType = {
          id: Date.now().toString(),
          text: response.text,
          sender: 'bot',
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
        
        // Generate new suggested questions based on updated conversation history
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
    
    // Add user message
    const userMessage: MessageType = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    // Process the message
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
      
      {/* Suggested Questions */}
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


import React, { useState, useRef, useEffect } from 'react';
import { SendIcon } from 'lucide-react';
import ChatMessage, { MessageType } from './ChatMessage';
import { cn } from '@/lib/utils';

interface ChatbotProps {
  className?: string;
}

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
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage: MessageType = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    
    // Simulate bot response after a delay
    setTimeout(() => {
      const botMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(inputValue),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  const getBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('hello') || input.includes('hi')) {
      return "Hello there! How can I help you with the map today?";
    } else if (input.includes('direction') || input.includes('how to get')) {
      return "To get directions, you can click on any location on the map and select 'Directions'. Where would you like to go?";
    } else if (input.includes('zoom')) {
      return "You can zoom in and out using the mouse wheel, pinch gesture, or the controls in the top-right corner of the map.";
    } else if (input.includes('where is') || input.includes('find')) {
      return "I can help you find places on the map. Could you specify the name of the location you're looking for?";
    } else {
      return "I'm not sure I understand. Could you rephrase your question about the map or location you're interested in?";
    }
  };

  return (
    <div className={cn("chatbot-container", className)}>
      <div className="message-list">
        {messages.map(message => (
          <ChatMessage key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="input-container">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-transparent py-2 px-3 rounded-full border border-border focus:border-primary/30 focus:ring-0 outline-none transition-colors text-sm"
          />
          <button
            type="submit"
            className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 focus:bg-primary/90 transition-colors"
            disabled={!inputValue.trim()}
          >
            <SendIcon size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chatbot;


import React from 'react';
import { cn } from '@/lib/utils';

export type MessageType = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

interface ChatMessageProps {
  message: MessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  
  return (
    <div
      className={cn(
        "message-bubble flex flex-col",
        isUser ? "items-end" : "items-start",
        "animate-slide-up"
      )}
      style={{ 
        animationDelay: `${Math.random() * 0.2}s`,
        opacity: 0,
        animation: `slide-up 0.3s ease-out ${Math.random() * 0.2}s forwards`
      }}
    >
      <div className={cn(
        "flex items-start gap-2 max-w-[85%] rounded-2xl p-3",
        isUser 
          ? "bg-primary text-primary-foreground rounded-tr-none ml-auto" 
          : "bg-muted rounded-tl-none mr-auto"
      )}>
        {!isUser && (
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-primary">AI</span>
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        </div>
      </div>
      <div className="text-[10px] text-muted-foreground mt-1 mb-2 mx-2">
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
};

export default ChatMessage;

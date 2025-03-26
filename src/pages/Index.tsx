
import React, { useEffect } from 'react';
import { Card } from "@/components/ui/card";
import Chatbot from "@/components/Chatbot";
import Map from "@/components/Map";
import ApiKeyInput from "@/components/ApiKeyInput";

declare global {
  interface Window {
    setOpenAIKey?: (key: string) => void;
  }
}

const Index = () => {
  useEffect(() => {
    // Add a global function to set the OpenAI key
    window.setOpenAIKey = (key: string) => {
      (window as any).ENV = {
        ...(window as any).ENV || {},
        VITE_OPENAI_API_KEY: key
      };
    };

    // Initialize from localStorage if available
    const storedKey = localStorage.getItem('openai_api_key');
    if (storedKey) {
      window.setOpenAIKey(storedKey);
    }
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-[100dvh]">
      <ApiKeyInput />
      <Card className="rounded-none h-full border-r">
        <Chatbot />
      </Card>
      <Card className="rounded-none h-full border-l">
        <Map />
      </Card>
    </div>
  );
};

export default Index;

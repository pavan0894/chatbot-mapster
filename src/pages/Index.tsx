
import React from 'react';
import { Card } from "@/components/ui/card";
import Chatbot from "@/components/Chatbot";
import Map from "@/components/Map";

const Index = () => {
  return (
    <div className="flex flex-col lg:flex-row h-[100dvh] w-full overflow-hidden">
      <div className="w-full lg:w-1/2 h-full border-r border-border">
        <Chatbot />
      </div>
      <div className="w-full lg:w-1/2 h-full border-l border-border">
        <Map />
      </div>
    </div>
  );
};

export default Index;

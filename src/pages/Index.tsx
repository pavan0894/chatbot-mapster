
import React from 'react';
import { Card } from "@/components/ui/card";
import Chatbot from "@/components/Chatbot";
import Map from "@/components/Map";

const Index = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-[100dvh]">
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

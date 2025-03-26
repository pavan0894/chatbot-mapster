
import React, { useEffect } from 'react';
import { Card } from "@/components/ui/card";
import Chatbot from "@/components/Chatbot";
import Map from "@/components/Map";
import PropertyTable from "@/components/PropertyTable";

const Index = () => {
  // Add debugging to track event handling
  useEffect(() => {
    const handleLocationQuery = (e: any) => {
      console.log("Index page received location query event:", e.detail);
    };
    
    window.addEventListener('location-query', handleLocationQuery);
    
    return () => {
      window.removeEventListener('location-query', handleLocationQuery);
    };
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden">
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <div className="w-full lg:w-1/2 h-full border-r border-border overflow-hidden">
          <Chatbot />
        </div>
        <div className="w-full lg:w-1/2 h-full border-l border-border overflow-hidden flex flex-col">
          <div className="flex-1 overflow-hidden">
            <Map />
          </div>
          <PropertyTable className="h-auto max-h-[40%] overflow-auto" />
        </div>
      </div>
    </div>
  );
};

export default Index;

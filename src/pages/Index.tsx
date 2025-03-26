
import React, { useEffect } from 'react';
import { Card } from "@/components/ui/card";
import Chatbot from "@/components/Chatbot";
import Map, { DYNAMIC_QUERY_EVENT } from "@/components/Map";
import { setupDebugEventListener } from '@/utils/debugUtils';
import { LOCATION_QUERY_EVENT, API_QUERY_EVENT, COMPLEX_QUERY_EVENT, MULTI_TARGET_QUERY_EVENT } from '@/components/Chatbot';

const Index = () => {
  // Add debugging to track event handling
  useEffect(() => {
    // Set up event listeners for debugging
    setupDebugEventListener(LOCATION_QUERY_EVENT);
    setupDebugEventListener(API_QUERY_EVENT);
    setupDebugEventListener(COMPLEX_QUERY_EVENT);
    setupDebugEventListener(MULTI_TARGET_QUERY_EVENT);
    setupDebugEventListener(DYNAMIC_QUERY_EVENT);
    
    const handleLocationQuery = (e: Event) => {
      console.log("Index page received location query event:", (e as CustomEvent).detail);
    };
    
    const handleComplexQuery = (e: Event) => {
      console.log("Index page received complex query event:", (e as CustomEvent).detail);
    };
    
    const handleMultiTargetQuery = (e: Event) => {
      console.log("Index page received multi-target query event:", (e as CustomEvent).detail);
    };
    
    const handleDynamicQuery = (e: Event) => {
      console.log("Index page received dynamic query event:", (e as CustomEvent).detail);
    };
    
    window.addEventListener(LOCATION_QUERY_EVENT, handleLocationQuery);
    window.addEventListener(COMPLEX_QUERY_EVENT, handleComplexQuery);
    window.addEventListener(MULTI_TARGET_QUERY_EVENT, handleMultiTargetQuery);
    window.addEventListener(DYNAMIC_QUERY_EVENT, handleDynamicQuery);
    
    // Enhanced global error handling for event-related issues
    window.addEventListener('error', (e) => {
      console.error("Global error caught:", e.message, e.error);
    });
    
    return () => {
      window.removeEventListener(LOCATION_QUERY_EVENT, handleLocationQuery);
      window.removeEventListener(COMPLEX_QUERY_EVENT, handleComplexQuery);
      window.removeEventListener(MULTI_TARGET_QUERY_EVENT, handleMultiTargetQuery);
      window.removeEventListener(DYNAMIC_QUERY_EVENT, handleDynamicQuery);
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
        </div>
      </div>
    </div>
  );
};

export default Index;

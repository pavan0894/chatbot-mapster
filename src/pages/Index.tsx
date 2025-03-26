
import React from 'react';
import PageTransition from '@/components/PageTransition';
import Map from '@/components/Map';
import Chatbot from '@/components/Chatbot';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

const Index = () => {
  return (
    <PageTransition>
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        {/* Header */}
        <header className="w-full py-3 px-6 md:px-8 border-b border-border shrink-0">
          <div className="max-w-full mx-auto flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">M</span>
              </div>
              <h1 className="text-lg font-medium ml-3">MapChat</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-sm text-foreground/70 hover:text-foreground transition-colors">About</a>
              <a href="#" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Features</a>
              <a href="#" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Contact</a>
            </nav>
          </div>
        </header>

        {/* Main Content - Full height map and chatbot */}
        <div className="flex-1 w-full overflow-hidden">
          <ResizablePanelGroup
            direction="horizontal"
            className="h-full"
          >
            <ResizablePanel defaultSize={40} minSize={30} className="h-full">
              <Chatbot className="h-full rounded-none" />
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={60} minSize={40} className="h-full">
              <Map className="h-full rounded-none" />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Minimal Footer */}
        <footer className="w-full py-2 px-6 border-t border-border text-center text-xs text-muted-foreground shrink-0">
          © {new Date().getFullYear()} MapChat
        </footer>
      </div>
    </PageTransition>
  );
};

export default Index;

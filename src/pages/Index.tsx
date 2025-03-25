
import React from 'react';
import PageTransition from '@/components/PageTransition';
import Map from '@/components/Map';
import Chatbot from '@/components/Chatbot';

const Index = () => {
  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header */}
        <header className="w-full py-6 px-6 md:px-10">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">M</span>
              </div>
              <h1 className="text-xl font-medium ml-3">MapChat</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-sm text-foreground/70 hover:text-foreground transition-colors">About</a>
              <a href="#" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Features</a>
              <a href="#" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Contact</a>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-10 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
            <div className="h-full">
              <Chatbot className="h-full" />
            </div>
            <div className="h-full">
              <Map className="h-full" />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full py-6 border-t border-border">
          <div className="max-w-7xl mx-auto px-6 md:px-10 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} MapChat. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-xs text-foreground/70 hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="text-xs text-foreground/70 hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="text-xs text-foreground/70 hover:text-foreground transition-colors">Help</a>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
};

export default Index;

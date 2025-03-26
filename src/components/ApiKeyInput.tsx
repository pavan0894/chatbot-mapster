
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { setOpenAIApiKey, hasValidApiKey, clearOpenAIApiKey, DEFAULT_OPENAI_API_KEY, hasCustomApiKey } from '@/services/apiKeyService';
import { Info, AlertCircle } from 'lucide-react';

export const ApiKeyInput: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const { toast } = useToast();

  // Check if API key is already set
  useEffect(() => {
    const keyValid = hasValidApiKey();
    setIsVisible(!keyValid);
    setShowOptions(hasCustomApiKey());
  }, []);

  const handleSaveKey = () => {
    if (!apiKey.trim() || !apiKey.startsWith('sk-')) {
      toast({
        title: "Error",
        description: "Please enter a valid OpenAI API key starting with 'sk-'",
        variant: "destructive"
      });
      return;
    }

    // Save API key to localStorage
    setOpenAIApiKey(apiKey);
    setIsVisible(false);
    setShowOptions(true);
    
    toast({
      title: "Success",
      description: "API key saved successfully",
    });

    // Reload the page to ensure all components use the new key
    window.location.reload();
  };

  const handleUseDefaultKey = () => {
    clearOpenAIApiKey();
    toast({
      title: "Default Key Activated",
      description: "Using the built-in API key",
    });
    setShowOptions(false);
    
    // Reload the page to ensure all components use the default key
    window.location.reload();
  };

  const handleShowApiKeyForm = () => {
    setIsVisible(true);
  };

  if (!isVisible && !showOptions) return null;

  return (
    <Card className="w-full max-w-md mx-auto my-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle size={18} className="text-amber-500" />
          OpenAI API Key
        </CardTitle>
        <CardDescription>
          {showOptions 
            ? "You're using a custom API key" 
            : "Enter your OpenAI API key to enable AI responses. Your key is stored locally and never sent to our servers."}
        </CardDescription>
      </CardHeader>
      
      {isVisible ? (
        <CardContent>
          <div className="flex flex-col space-y-4">
            <Input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Your API key is stored only in your browser and never sent to our servers.
              </AlertDescription>
            </Alert>
            <div className="flex justify-between mt-2">
              <Button variant="outline" onClick={() => setIsVisible(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveKey}>Save API Key</Button>
            </div>
          </div>
        </CardContent>
      ) : showOptions ? (
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleShowApiKeyForm}>
            Change API Key
          </Button>
          <Button variant="secondary" onClick={handleUseDefaultKey}>
            Use Default Key
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
};

export default ApiKeyInput;

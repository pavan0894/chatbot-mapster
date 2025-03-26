
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export const ApiKeyInput: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const { toast } = useToast();

  // Check if API key is already set
  useEffect(() => {
    const storedKey = localStorage.getItem('openai_api_key');
    setIsVisible(!storedKey);
  }, []);

  const handleSaveKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem('openai_api_key', apiKey);
    setIsVisible(false);
    toast({
      title: "Success",
      description: "API key saved successfully",
    });

    // Set the key in the environment
    window.setOpenAIKey?.(apiKey);
  };

  if (!isVisible) return null;

  return (
    <Card className="w-full max-w-md mx-auto my-4">
      <CardHeader>
        <CardTitle>OpenAI API Key Required</CardTitle>
        <CardDescription>
          Enter your OpenAI API key to enable AI responses. Your key is stored locally and never sent to our servers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <Input
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <Button onClick={handleSaveKey}>Save API Key</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiKeyInput;

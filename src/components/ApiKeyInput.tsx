
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle } from 'lucide-react';

export const ApiKeyInput: React.FC = () => {
  // Since we're not using OpenAI API anymore, this component is simplified
  return (
    <Card className="w-full max-w-md mx-auto my-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle size={18} className="text-green-500" />
          Location Search Ready
        </CardTitle>
        <CardDescription>
          The map is ready to display locations. Start searching in the chat below.
        </CardDescription>
      </CardHeader>
    </Card>
  );
};

export default ApiKeyInput;

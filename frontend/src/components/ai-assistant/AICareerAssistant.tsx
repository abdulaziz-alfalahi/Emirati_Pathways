import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Settings, 
  Sparkles,
  Target,
  TrendingUp,
  BookOpen,
  Users
} from 'lucide-react';
import { useCareerAdvice, useGroqConfig, useConversationHistory, CVData } from '@/integrations/groq';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  category?: string;
}

interface AICareerAssistantProps {
  cvData?: CVData;
  className?: string;
}

const AICareerAssistant: React.FC<AICareerAssistantProps> = ({
  cvData,
  className = ''
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Use the hooks from groq integration
  const careerAdvice = useCareerAdvice();
  const { config, updateConfig } = useGroqConfig();
  const { history, addMessage, clearHistory } = useConversationHistory();

  const isConfigured = config.apiKey && config.apiKey.length > 0;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    if (!isConfigured) {
      toast({
        title: 'API Key Required',
        description: 'Please configure your Groq API key in the settings tab.',
        variant: 'destructive',
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      category: selectedCategory,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Generate advice using the hook's function
      const generatedAdvice = await careerAdvice.generateAdvice(cvData, inputMessage);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generatedAdvice || 'I apologize, but I was unable to generate advice at this time. Please try again.',
        timestamp: new Date(),
        category: selectedCategory,
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Add to conversation history
      addMessage('user', inputMessage);
      addMessage('assistant', generatedAdvice || 'No response generated');

    } catch (error) {
      console.error('Error generating career advice:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error while generating advice. Please try again.',
        timestamp: new Date(),
        category: selectedCategory,
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: 'Error',
        description: 'Failed to generate career advice. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const categories = [
    { id: 'general', label: 'General Advice', icon: MessageCircle },
    { id: 'career', label: 'Career Path', icon: Target },
    { id: 'skills', label: 'Skill Development', icon: TrendingUp },
    { id: 'education', label: 'Education', icon: BookOpen },
    { id: 'networking', label: 'Networking', icon: Users },
  ];

  const quickPrompts = [
    "How can I improve my CV for the UAE job market?",
    "What skills should I develop for my career?",
    "How do I align with D33 and Talent33?",
    "What are the trending jobs in UAE?",
    "How can I transition to a new career field?",
  ];

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <Tabs defaultValue="chat" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat">AI Career Assistant</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col space-y-4">
          {/* Category Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Advice Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className="flex items-center gap-2"
                    >
                      <Icon className="h-3 w-3" />
                      {category.label}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Chat Messages */}
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Career Guidance
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">
                        Welcome! I'm your AI Career Assistant. Ask me anything about your career development.
                      </p>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Quick prompts:</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {quickPrompts.slice(0, 3).map((prompt, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => setInputMessage(prompt)}
                              className="text-xs"
                            >
                              {prompt}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.type === 'assistant' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Bot className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>

                      {message.type === 'user' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="bg-gray-100 rounded-lg px-4 py-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Message Input */}
              <div className="mt-4 flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about your career..."
                  disabled={!isConfigured || careerAdvice.loading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || !isConfigured || careerAdvice.loading}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {!isConfigured && (
                <p className="text-xs text-red-500 mt-2">
                  Please configure your API key in the Settings tab to start chatting.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                AI Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Groq API Key</label>
                <Input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => updateConfig({ apiKey: e.target.value })}
                  placeholder="Enter your Groq API key"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get your API key from{' '}
                  <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    console.groq.com
                  </a>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Model</label>
                <select
                  value={config.model}
                  onChange={(e) => updateConfig({ model: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="llama-3.1-70b-versatile">Llama 3.1 70B (Recommended)</option>
                  <option value="llama-3.1-8b-instant">Llama 3.1 8B (Faster)</option>
                  <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Temperature: {config.temperature}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) => updateConfig({ temperature: parseFloat(e.target.value) })}
                  className="mt-1 w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lower values = more focused, Higher values = more creative
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="text-sm font-medium">Conversation History</p>
                  <p className="text-xs text-gray-500">{history.length} messages stored</p>
                </div>
                <Button variant="outline" size="sm" onClick={clearHistory}>
                  Clear History
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={isConfigured ? "default" : "destructive"}>
                  {isConfigured ? "Configured" : "Not Configured"}
                </Badge>
                {cvData && (
                  <Badge variant="outline">
                    CV Data Available
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AICareerAssistant;

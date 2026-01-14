import { useState, useRef, useEffect } from 'react';
import api from '@/api/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  Ticket,
  UtensilsCrossed,
  HelpCircle,
  ChevronRight,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';

const quickActions = [
  { icon: Ticket, label: 'Track Order', message: 'I want to track my order' },
  { icon: UtensilsCrossed, label: 'Menu Help', message: 'Show me today\'s menu' },
  { icon: HelpCircle, label: 'Token Query', message: 'What is my token number?' },
  { icon: MessageCircle, label: 'Contact Admin', message: '', special: 'contact_admin' },
];

interface ChatMessage {
  id: number;
  type: 'bot' | 'user';
  message: string;
  timestamp: Date;
}

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    type: 'bot',
    message: 'Hello! 👋 I\'m your CampoBite assistant. How can I help you today?',
    timestamp: new Date(),
  },
];

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [inputValue, setInputValue] = useState('');

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Mode state: 'chat' or 'query_input'
  const [chatMode, setChatMode] = useState<'chat' | 'query_input'>('chat');

  // Initialize Speech Recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        handleSend(transcript); // Auto-send on voice
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Your browser does not support voice input.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speak = (text: string) => {
    if (!isSoundEnabled || !('speechSynthesis' in window)) return;

    // Stop any current speaking
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // Optional: Select a better voice if available
    // const voices = window.speechSynthesis.getVoices();
    // utterance.voice = voices.find(v => v.name.includes("Google US English")) || null;
    utterance.volume = 1;
    utterance.rate = 1;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (messageOverride?: string) => {
    const messageToSend = messageOverride || inputValue;
    if (!messageToSend.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user' as const,
      message: messageToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    if (chatMode === 'query_input') {
      // Handle User Query submission
      try {
        const res = await api.post('/api/chat/query', { query: messageToSend });
        const queryId = res.data; // Expecting Long ID

        const botResponse = {
          id: messages.length + 2,
          type: 'bot' as const,
          message: "Your query has been sent to the admin. I will let you know once they reply.",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botResponse]);
        speak(botResponse.message);

        // Start polling
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await api.get(`/api/chat/query/${queryId}`);
            const queryData = statusRes.data;
            if (queryData && queryData.replied) {
              clearInterval(pollInterval);
              const replyMsg = {
                id: Date.now(),
                type: 'bot' as const,
                message: `Admin replied: "${queryData.replyText}"`,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, replyMsg]);
              speak("You have a new reply from the admin.");
            }
          } catch (e) {
            console.error("Polling error", e);
            // clear interval on strict error? or keep retrying?
            // Let's keep retrying for now, or clear after X attempts.
          }
        }, 5000);

        // Stop polling after 5 minutes to save resources
        setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000);

      } catch (error) {
        console.error("Query submit error", error);
        const errorResponse = {
          id: Date.now(),
          type: 'bot' as const,
          message: "Failed to send query. Please try again later.",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorResponse]);
        speak(errorResponse.message);
      } finally {
        setIsTyping(false);
        setChatMode('chat');
      }
      return;
    }

    // Normal Chat Flow
    try {
      const res = await api.post('/api/chat', { message: userMessage.message });
      const botResponse = {
        id: messages.length + 2,
        type: 'bot' as const,
        message: res.data.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
      speak(botResponse.message); // Speak response
    } catch (error) {
      console.error("Chat error", error);
      const errorResponse = {
        id: Date.now(),
        type: 'bot' as const,
        message: "Sorry, I'm having trouble connecting right now.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
      speak(errorResponse.message);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (action: any) => {
    if (action.special === 'contact_admin') {
      setChatMode('query_input');
      const botMsg = {
        id: Date.now(),
        type: 'bot' as const,
        message: "Please type your query for the admin:",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
      speak(botMsg.message);
      return;
    }
    setInputValue(action.message);
  };

  return (
    <>
      {/* Chatbot Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chatbot-button group"
        aria-label="Open chat assistant"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-primary-foreground transition-transform duration-200 group-hover:rotate-90" />
        ) : (
          <MessageCircle className="h-6 w-6 text-primary-foreground transition-transform duration-200 group-hover:scale-110" />
        )}
        {!isOpen && (
          <span className="notification-dot" />
        )}
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <Card className="chatbot-window">
          {/* Header */}
          <CardHeader className="pb-3 gradient-primary rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-primary-foreground text-base">CampoBite Assistant</CardTitle>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    <span className="text-xs text-primary-foreground/80">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground hover:bg-primary-foreground/20 mr-1"
                  onClick={() => {
                    setIsSoundEnabled(!isSoundEnabled);
                    if (isSoundEnabled) window.speechSynthesis.cancel();
                  }}
                  title={isSoundEnabled ? "Mute Bot" : "Unmute Bot"}
                >
                  {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Messages Area */}
            <div className="h-64 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${msg.type === 'user'
                      ? 'gradient-primary text-primary-foreground rounded-br-md shadow-md'
                      : 'bg-muted text-foreground rounded-bl-md shadow-sm'
                      }`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted text-foreground rounded-2xl rounded-bl-md px-4 py-2.5 text-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-3 border-t border-border/50 bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2">Quick Actions</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleQuickAction(action)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border/50 text-xs font-medium text-foreground hover:border-accent/50 hover:bg-accent/5 transition-all whitespace-nowrap shadow-sm hover:shadow-md"
                  >
                    <action.icon className="h-3.5 w-3.5 text-accent" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border/50 bg-background rounded-b-xl">
              <div className="flex gap-2 items-end">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type or click mic..."
                  className="flex-1 bg-muted/50 border-border/50 focus:border-accent"
                />

                {/* Microphone Button */}
                <Button
                  size="icon"
                  variant={isListening ? "destructive" : "outline"}
                  className={`shrink-0 transition-all ${isListening ? 'animate-pulse' : 'hover:bg-accent/10 border-accent/20'}`}
                  onClick={toggleListening}
                  title="Voice Input"
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 text-accent" />}
                </Button>

                <Button
                  size="icon"
                  onClick={() => handleSend()}
                  className="gradient-primary border-0 hover:opacity-90 shrink-0 shadow-lg"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

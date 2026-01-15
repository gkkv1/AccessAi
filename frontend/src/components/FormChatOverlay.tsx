import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Mic, Send, Bot, User, Volume2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { endpoints } from '@/lib/api';

interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface FormChatOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    formId: string;
    fields: any[];
    onUpdateFields: (updates: Record<string, string>) => void;
}

export function FormChatOverlay({ isOpen, onClose, formId, fields, onUpdateFields }: FormChatOverlayProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    useEffect(() => {
        if (isOpen) {
            setMessages([
                { role: 'assistant', content: `Hello! I can help you fill out the ${formId.replace('_', ' ')} form. What details do you have?` }
            ]);
            setInput('');
            resetTranscript();
        }
    }, [formId, isOpen]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { isListening, transcript, startListening, stopListening, resetTranscript } = useSpeechRecognition();
    const [isSpeaking, setIsSpeaking] = useState(false); // TTS State

    // Auto-scroll to bottom whenever messages or loading state changes
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [messages, isLoading]);

    // Handle Voice Input Sync - Only update if transcript is non-empty and changed
    useEffect(() => {
        if (isListening && transcript) {
            // Replace input with transcript (assuming dictation mode)
            setInput(transcript);
        }
    }, [transcript, isListening]);

    // Speak AI messages
    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        if (!lastMsg) return; // Prevent crash on empty initialization

        if (lastMsg.role === 'assistant') {
            stopListening(); // Stop mic to prevent echo
            speak(lastMsg.content);
        }
    }, [messages]);

    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const speak = (text: string) => {
        window.speechSynthesis.cancel();
        setIsSpeaking(true);

        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance; // Keep reference to prevent GC
        utterance.rate = 1.0;

        utterance.onend = () => {
            setIsSpeaking(false);
            utteranceRef.current = null;
            // Optional: Auto-start mic after AI finishes? 
            // For now, let user manually start to avoid confusion.
        };

        utterance.onerror = (e) => {
            console.error("TTS Error:", e);
            setIsSpeaking(false);
            utteranceRef.current = null;
        };

        window.speechSynthesis.speak(utterance);
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;

        // Stop everything
        window.speechSynthesis.cancel();
        stopListening();

        setInput('');
        resetTranscript(); // Clear voice buffer immediately

        // Optimistic Update
        const newHistory = [...messages, { role: 'user', content: userMsg } as Message];
        setMessages(newHistory);
        setIsLoading(true);

        try {
            const data = await endpoints.chatFormSession(formId, fields, userMsg, newHistory);

            // 1. Update Real Form Fields
            if (data.extracted_updates && Object.keys(data.extracted_updates).length > 0) {
                onUpdateFields(data.extracted_updates);
            }

            // 2. Add AI Response
            setMessages(prev => [...prev, { role: 'assistant', content: data.next_question }]);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting. Could you say that again?" }]);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMic = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }

        if (isListening) {
            stopListening();
        } else {
            resetTranscript(); // CRITICAL: Clear old text before starting
            setInput(''); // Clear input box to accept new speech
            startListening();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in-0">
            <Card className="w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl border-2 border-primary/20">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-muted/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <Bot className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Form Assistant</h3>
                            <p className="text-xs text-muted-foreground">AI Interview Mode</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => {
                        window.speechSynthesis.cancel();
                        stopListening();
                        onClose();
                    }}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Chat Area */}
                <ScrollArea className="flex-1">
                    <div className="space-y-4 p-4">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "flex w-fit max-w-[80%] flex-col gap-2 rounded-lg px-3 py-2 text-sm break-words",
                                    msg.role === 'user'
                                        ? "ml-auto bg-primary text-primary-foreground"
                                        : "bg-muted"
                                )}
                            >
                                {msg.content}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm ml-2">
                                <Sparkles className="h-3 w-3 animate-spin" /> Thinking...
                            </div>
                        )}
                        <div ref={scrollRef} className="h-4" /> {/* Spacer for scroll targeting */}
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t bg-background">
                    <div className="flex gap-2">
                        <Button
                            variant={isListening ? "destructive" : "outline"}
                            size="icon"
                            onClick={toggleMic}
                            className={cn(isListening && "animate-pulse")}
                        >
                            <Mic className="h-4 w-4" />
                        </Button>
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isSpeaking ? "AI is speaking..." : "Type or speak your answer..."}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            autoFocus
                        />
                        <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center h-4">
                        {isListening ? "Listening... (Speak clearly) 🔴" : isSpeaking ? "AI Speaking... 🔊" : "Ready"}
                    </p>
                </div>
            </Card>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    FileText,
    Volume2,
    MessageSquare,
    Loader2,
    Settings,
    Play,
    Pause,
    X,
    Type,
    Maximize2,
    Send,
    Sparkles,
    Minus,
    Plus,
    ChevronLeft,
    ChevronRight,
    Palette,
    Ruler,
    Mic,
    MicOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { endpoints, Document as APIDocument } from '@/lib/api';
import { toast } from 'sonner';

interface SmartReaderProps {
    doc: APIDocument;
    isOpen: boolean;
    onClose: () => void;
    initialPage?: number;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    text: string;
}

export function SmartReader({ doc, isOpen, onClose, initialPage = 1 }: SmartReaderProps) {
    // --- Local Document State ---
    const [fullDoc, setFullDoc] = useState<APIDocument>(doc);

    // Refetch full content on open if needed
    useEffect(() => {
        if (isOpen && doc.id) {
            // logic to ensure we have content_text
            if (!doc.content_text) {
                endpoints.getDocument(doc.id).then(d => setFullDoc(d || doc)).catch(e => console.error(e));
            } else {
                setFullDoc(doc);
            }
        }
    }, [isOpen, doc]);

    // --- Visual Settings ---
    const [textSize, setTextSize] = useState(16);
    const [isDyslexicFont, setIsDyslexicFont] = useState(false);
    const [isHighContrast, setIsHighContrast] = useState(false);
    const [isReadingMask, setIsReadingMask] = useState(false);
    const [overlayColor, setOverlayColor] = useState<string>('none');
    const [mouseY, setMouseY] = useState(0);
    const [isSimplified, setIsSimplified] = useState(false);

    // --- Pagination ---
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState<number>(initialPage);
    const [virtualPages, setVirtualPages] = useState<string[]>([]);

    // Heuristic Pagination Logic
    const paginateContent = (text: string) => {
        if (!text) return [];
        const charsPerPage = 3000;
        const pages: string[] = [];
        let remaining = text;
        while (remaining.length > 0) {
            if (remaining.length <= charsPerPage) { pages.push(remaining); break; }
            let splitIndex = remaining.lastIndexOf('\n\n', charsPerPage);
            if (splitIndex === -1) splitIndex = remaining.lastIndexOf('\n', charsPerPage);
            if (splitIndex === -1) splitIndex = remaining.lastIndexOf('.', charsPerPage);
            if (splitIndex === -1) splitIndex = charsPerPage;
            pages.push(remaining.slice(0, splitIndex + 1));
            remaining = remaining.slice(splitIndex + 1);
        }
        return pages;
    };

    useEffect(() => {
        if (fullDoc.content_text) {
            const pages = paginateContent(fullDoc.content_text);
            setVirtualPages(pages);
            setNumPages(pages.length);
        }
    }, [fullDoc.content_text]);

    // Sync page number if initialPage changes
    useEffect(() => {
        setPageNumber(initialPage);
    }, [initialPage]);

    // --- Simplify Logic ---
    const [simplifiedCache, setSimplifiedCache] = useState<Record<string, string>>({});
    const [isSimplifying, setIsSimplifying] = useState(false);

    useEffect(() => {
        if (isSimplified && fullDoc.id && !simplifiedCache[fullDoc.id]) {
            setIsSimplifying(true);
            const textToSimplify = virtualPages[pageNumber - 1] || fullDoc.content_text || "";

            endpoints.simplify(textToSimplify)
                .then(data => {
                    setSimplifiedCache(prev => ({ ...prev, [fullDoc.id]: data.simplified_text }));
                })
                .catch(err => toast.error("Simplification failed"))
                .finally(() => setIsSimplifying(false));
        }
    }, [isSimplified, fullDoc.id, pageNumber, virtualPages]);

    // --- TTS ---
    const { speak, cancel: cancelSpeech, isSpeaking: isTtsSpeaking } = useTextToSpeech();
    const togglePlay = () => {
        if (isTtsSpeaking) {
            cancelSpeech();
        } else {
            const currentSimplified = fullDoc ? simplifiedCache[fullDoc.id] : '';
            const textToRead = isSimplified ? (currentSimplified || "Simplifying...") : (
                virtualPages[pageNumber - 1] || fullDoc?.content_text || "No content."
            );
            const cleanText = textToRead.replace(/[*•#]/g, '').trim();
            speak(cleanText);
        }
    };

    // --- Chat ---
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);

    const { isListening, transcript, startListening, stopListening } = useSpeechRecognition();
    useEffect(() => { if (transcript) setChatInput(transcript); }, [transcript]);

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !fullDoc) return;
        const userMsg: ChatMessage = { role: 'user', text: chatInput };
        setChatMessages(prev => [...prev, userMsg]);
        setIsChatLoading(true);
        setChatInput('');
        stopListening();
        try {
            const result = await endpoints.chatDocument(fullDoc.id, userMsg.text);
            const aiMsg: ChatMessage = { role: 'assistant', text: result.answer };
            setChatMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            setChatMessages(prev => [...prev, { role: 'assistant', text: "Error connecting to document brain." }]);
        } finally { setIsChatLoading(false); }
    };

    // --- Visual Effects ---
    useEffect(() => {
        if (!isReadingMask) return;
        const handleMouseMove = (e: MouseEvent) => setMouseY(e.clientY);
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isReadingMask]);

    const readerStyles = {
        fontSize: `${textSize}px`,
        fontFamily: isDyslexicFont ? '"OpenDyslexic", "Comic Sans MS", sans-serif' : 'inherit',
        filter: isHighContrast ? 'contrast(1.5)' : 'none',
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden [&>button]:hidden">
                {/* Header Toolbar */}
                <div className="h-16 border-b flex items-center justify-between px-6 bg-muted/20 shrink-0">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="h-5 w-5 text-primary shrink-0" />
                        <DialogTitle className="font-semibold truncate text-lg">{fullDoc?.title}</DialogTitle>
                        <DialogDescription className="sr-only">Document Reader</DialogDescription>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        <Button
                            variant={isTtsSpeaking ? "destructive" : "default"}
                            size="sm"
                            className="rounded-full w-32"
                            onClick={togglePlay}
                        >
                            {isTtsSpeaking ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                            {isTtsSpeaking ? "Pause" : "Listen"}
                        </Button>

                        <Button
                            variant={isSimplified ? "default" : "outline"}
                            size="sm"
                            className={cn("gap-2", isSimplified && "bg-yellow-500 hover:bg-yellow-600 text-white border-transparent")}
                            onClick={() => setIsSimplified(!isSimplified)}
                        >
                            <Sparkles className="h-4 w-4" />
                            {isSimplified ? "Original" : "Simplify"}
                        </Button>

                        <div className="h-4 w-px bg-border mx-2" />

                        <Button
                            variant={isChatOpen ? "default" : "outline"}
                            size="icon"
                            onClick={() => setIsChatOpen(!isChatOpen)}
                            className="relative"
                        >
                            <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-1 min-h-0 relative overflow-hidden">

                    {/* Content Container (Pushes over when Chat is open) */}
                    {/* Added min-w-0 to allow this container to shrink gracefully */}
                    <div className="flex-1 flex flex-col min-h-0 min-w-0">

                        {/* Formatting Toolbar (Horizontal) */}
                        <div className="h-14 border-b flex items-center justify-center gap-4 md:gap-6 px-4 bg-background/95 backdrop-blur z-10 shrink-0 overflow-x-auto no-scrollbar">

                            {/* Text Size */}
                            <div className="flex items-center gap-2 min-w-fit">
                                <Type className="h-4 w-4 text-muted-foreground" />
                                <Slider
                                    value={[textSize]}
                                    onValueChange={(v) => setTextSize(v[0])}
                                    min={12}
                                    max={32}
                                    step={2}
                                    className="w-24 md:w-32"
                                />
                                <span className="text-xs text-muted-foreground w-6 text-center">{textSize}px</span>
                            </div>

                            <div className="h-6 w-px bg-border" />

                            {/* Toggles */}
                            <div className="flex items-center gap-2 min-w-fit">
                                <Label className="text-xs whitespace-nowrap hidden md:block">Dyslexic Font</Label>
                                <Switch checked={isDyslexicFont} onCheckedChange={setIsDyslexicFont} />
                            </div>

                            <div className="h-6 w-px bg-border sm:hidden" />

                            <div className="flex items-center gap-2 min-w-fit">
                                <Label className="text-xs whitespace-nowrap hidden md:block">High Contrast</Label>
                                <Switch checked={isHighContrast} onCheckedChange={setIsHighContrast} />
                            </div>

                            <div className="h-6 w-px bg-border" />

                            {/* Visual Aids */}
                            <div className="flex items-center gap-3 min-w-fit">
                                <Button
                                    variant={isReadingMask ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setIsReadingMask(!isReadingMask)}
                                    title="Reading Ruler"
                                    className="gap-2 h-8"
                                >
                                    <Ruler className="h-4 w-4" />
                                    <span className="sr-only md:not-sr-only text-xs">Ruler</span>
                                </Button>

                                {/* Color Tints */}
                                <div className="flex items-center gap-1">
                                    <Palette className="h-4 w-4 text-muted-foreground mr-1" />
                                    {['none', 'blue', 'yellow', 'green', 'rose'].map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setOverlayColor(color)}
                                            className={cn(
                                                "w-5 h-5 rounded-full border border-border transition-all",
                                                color === 'none' ? "bg-white" : "",
                                                color === 'blue' ? "bg-blue-100" : "",
                                                color === 'yellow' ? "bg-amber-100" : "",
                                                color === 'green' ? "bg-emerald-100" : "",
                                                color === 'rose' ? "bg-rose-100" : "",
                                                overlayColor === color ? "ring-2 ring-primary ring-offset-1 scale-110" : "hover:scale-110"
                                            )}
                                            title={`${color.charAt(0).toUpperCase() + color.slice(1)} Tint`}
                                        >
                                            {color === 'none' && <div className="w-full h-px bg-red-500 rotate-45" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Document Viewport */}
                        <div className="flex-1 flex flex-col items-center bg-slate-100 dark:bg-slate-900/50 p-4 md:p-8 overflow-y-auto relative">
                            {/* Mask Overlay */}
                            {isReadingMask && (
                                <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" style={{ cursor: 'none' }}>
                                    <div className="absolute w-full bg-black/50" style={{ top: 0, height: Math.max(0, mouseY - 60) }} />
                                    <div className="absolute w-full h-32 border-y-2 border-primary/20" style={{ top: mouseY - 60 }} />
                                    <div className="absolute w-full bg-black/50" style={{ top: mouseY + 68, bottom: 0 }} />
                                </div>
                            )}

                            {/* Page Paper */}
                            <div
                                className={cn(
                                    "relative w-full max-w-[850px] min-h-[1000px] bg-white dark:bg-zinc-900 shadow-xl transition-all duration-300 p-8 md:p-12 mb-8",
                                    "focus:outline-none focus:ring-2 focus:ring-primary/50"
                                )}
                                style={{
                                    ...readerStyles,
                                    backgroundColor: isHighContrast ? 'black' : undefined,
                                    color: isHighContrast ? '#facc15' : undefined,
                                }}
                            >
                                {/* Color Overlay */}
                                {overlayColor !== 'none' && (
                                    <div className={cn(
                                        "absolute inset-0 pointer-events-none z-0 mix-blend-multiply rounded-lg",
                                        overlayColor === 'blue' && "bg-blue-100/30",
                                        overlayColor === 'green' && "bg-emerald-100/30",
                                        overlayColor === 'yellow' ? "bg-amber-100/30" : "",
                                        overlayColor === 'rose' && "bg-rose-100/30",
                                    )} />
                                )}

                                {/* Page Content */}
                                <div className="prose prose-slate dark:prose-invert max-w-none leading-loose">
                                    {isSimplified ? (
                                        <>
                                            <div className="flex items-center gap-2 text-yellow-600 mb-6 pb-2 border-b border-yellow-100">
                                                <Sparkles className="h-5 w-5" />
                                                <span className="font-semibold">AI Simplified Version</span>
                                            </div>
                                            {isSimplifying ? <div className="flex gap-2"><Loader2 className="animate-spin" /> Simplifying...</div> :
                                                <div className="whitespace-pre-wrap font-medium">{simplifiedCache[fullDoc.id]}</div>}
                                        </>
                                    ) : (
                                        <div className="whitespace-pre-line">
                                            {virtualPages[pageNumber - 1] ?
                                                virtualPages[pageNumber - 1].replace(/([^\n])\n([^\n])/g, '$1 $2').replace(/\n\n/g, '\n\n').replace(/^• /gm, '• ')
                                                : <span className="text-muted-foreground italic">End of document.</span>}
                                        </div>
                                    )}
                                </div>

                                {/* Page Footer */}
                                {!isSimplified && (
                                    <div className="absolute top-4 right-6 text-xs text-muted-foreground select-none">Page {pageNumber} of {numPages || 1}</div>
                                )}
                                <div className="absolute bottom-4 left-0 w-full text-center text-xs text-muted-foreground opacity-50">{fullDoc?.title}</div>
                            </div>

                            {/* Floating Pagination */}
                            {!isSimplified && (numPages || 0) > 1 && (
                                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-background/90 backdrop-blur border rounded-full px-6 py-3 shadow-lg z-20">
                                    <Button variant="outline" size="icon" onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={pageNumber <= 1} className="rounded-full h-10 w-10"><ChevronLeft className="h-4 w-4" /></Button>
                                    <span className="font-medium min-w-[3rem] text-center">{pageNumber} / {numPages}</span>
                                    <Button variant="outline" size="icon" onClick={() => setPageNumber(p => Math.min(numPages || 1, p + 1))} disabled={pageNumber >= (numPages || 1)} className="rounded-full h-10 w-10"><ChevronRight className="h-4 w-4" /></Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Sidebar (Flex Sibling) */}
                    {/* Added shrink-0 to prevent this container from being squashed */}
                    <div className={cn(
                        "border-l bg-muted/30 flex flex-col transition-all duration-300 shadow-xl overflow-hidden shrink-0",
                        isChatOpen ? "w-80 md:w-96 opacity-100" : "w-0 opacity-0"
                    )}>
                        {/* Fixed Width Inner Container to prevent layout squashing */}
                        <div className="w-80 md:w-96 flex flex-col h-full">
                            <div className="p-4 border-b bg-background flex justify-between items-center shrink-0">
                                <h3 className="font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Chat</h3>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsChatOpen(false)}><X className="h-4 w-4" /></Button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 min-h-0">
                                {chatMessages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground opacity-80 h-full">
                                        <MessageSquare className="h-8 w-8 mb-4 text-primary/50" />
                                        <p className="text-sm">Hi! Ask me anything about this file.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {chatMessages.map((msg, i) => (
                                            <div key={i} className={cn("flex gap-3 text-sm", msg.role === 'user' ? "flex-row-reverse" : "")}>
                                                <Avatar className="h-8 w-8 shrink-0"><AvatarFallback className={msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-green-600 text-white"}>{msg.role === 'user' ? "ME" : "AI"}</AvatarFallback></Avatar>
                                                <div className={cn("p-3 rounded-lg max-w-[85%]", msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-card border shadow-sm")}>{msg.text}</div>
                                            </div>
                                        ))}
                                        {isChatLoading && <div className="flex gap-3"><Loader2 className="h-4 w-4 animate-spin" /> Thinking...</div>}
                                    </div>
                                )}
                            </div>
                            <form onSubmit={handleChatSubmit} className="p-3 bg-background border-t">
                                <div className="relative flex items-center gap-2">
                                    <Input
                                        placeholder={isListening ? "Listening..." : "Ask a question..."}
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        className={cn("pr-10", isListening && "border-red-500 ring-1 ring-red-500")}
                                    />
                                    <button type="button" onClick={isListening ? stopListening : startListening} className={cn("absolute right-2 p-1.5 rounded-full hover:bg-muted transition-colors", isListening ? "text-red-500 animate-pulse" : "text-muted-foreground")} title="Voice Input">
                                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                    </button>
                                </div>
                                <Button type="submit" size="sm" className="w-full mt-2" disabled={!chatInput.trim() || isChatLoading}>Send Message</Button>
                            </form>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

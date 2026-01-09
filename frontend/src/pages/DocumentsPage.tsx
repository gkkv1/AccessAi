import { useState, useRef, useEffect } from 'react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  FileText,
  Upload,
  Search,
  Volume2,
  MessageSquare,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings,
  Play,
  Pause,
  X,
  Type,
  Minimize2,
  Maximize2,
  Send,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { endpoints, Document } from '@/lib/api';
import { toast } from 'sonner';

// --- Mock Data for Simulation ---
const SAMPLE_DOC_CONTENT = `
**1. INTRODUCTION**
The Company is committed to fostering an inclusive workplace where employees of all abilities can thrive. This policy outlines our standards for physical and digital accessibility, ensuring compliance with the Americans with Disabilities Act (ADA) and WCAG 2.2 Level AA.

**2. DIGITAL ACCESSIBILITY STANDARDS**
All internal software, websites, and mobile applications must meet the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA. This includes:
- Providing text alternatives for non-text content.
- Providing captions and other alternatives for multimedia.
- Making all functionality available from a keyboard.
- Giving users enough time to read and use content.
- Using sufficient contrast ratios (at least 4.5:1 for normal text).

**3. REASONABLE ACCOMMODATIONS**
Employees requiring assistive technology (e.g., screen readers, voice recognition software, modified keyboards) should submit a request through the HR Portal. The IT department will fulfill approved equipment requests within 5 business days.

**4. PHYSICAL WORKSPACE**
Pathways must be at least 36 inches wide to accommodate wheelchairs. Desks should be height-adjustable. Quiet zones are available for employees with sensory processing sensitivities.
`;

const SIMPLIFIED_CONTENT = `
• **Our Goal**: We want a workplace where everyone belongs and can work easily.
• **Computers & Apps**: All our apps must be easy to use for everyone. They must work with screen readers, have captions for videos, and work with just a keyboard.
• **Need Help?**: If you need special equipment like a screen reader or special keyboard, ask HR. IT will get it for you in 5 days.
• **Office Space**: Aisles are wide enough for wheelchairs. Desks can go up and down. We have quiet areas if it's too noisy for you.
`;

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // --- Accessibility / Smart View State ---
  const [readingDoc, setReadingDoc] = useState<Document | null>(null);
  const [textSize, setTextSize] = useState(16);
  const [isDyslexicFont, setIsDyslexicFont] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isSimplified, setIsSimplified] = useState(false);


  // --- TTS State ---
  const { speak, cancel: cancelSpeech, isSpeaking: isTtsSpeaking } = useTextToSpeech();

  // --- Chat State ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: endpoints.getDocuments,
    refetchInterval: (data) => {
      return Array.isArray(data) && data.some(d => d.status === 'processing') ? 2000 : false;
    }
  });

  const uploadMutation = useMutation({
    mutationFn: endpoints.uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success("Document uploaded successfully");
      setUploadProgress(null);
    },
    onError: () => {
      toast.error("Failed to upload document");
      setUploadProgress(null);
    }
  });

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Handlers ---
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => { setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };
  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      setUploadProgress(0);
      try {
        await uploadMutation.mutateAsync(file);
        setUploadProgress(100);
      } catch (error) {
        console.error(error);
      }
    }
  };

  // --- Smart Reader Logic ---

  const openSmartReader = (doc: Document) => {
    setReadingDoc(doc);
    setIsSimplified(false);
    setIsChatOpen(false);
    cancelSpeech(); // Stop any previous reading
  };

  const togglePlay = () => {
    if (isTtsSpeaking) {
      cancelSpeech();
    } else {
      const textToRead = isSimplified ? SIMPLIFIED_CONTENT : SAMPLE_DOC_CONTENT;
      const cleanText = textToRead.replace(/[*•]/g, '').trim();
      speak(cleanText);
    }
  };


  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg: ChatMessage = { role: 'user', text: chatInput };
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');
    setIsChatLoading(true);

    // Mock AI Response
    setTimeout(() => {
      const response: ChatMessage = {
        role: 'assistant',
        text: "Based on the policy: Requests for assistive technology (like screen readers) are fulfilled by the IT department within 5 business days after approval."
      };
      setChatMessages(prev => [...prev, response]);
      setIsChatLoading(false);
    }, 1500);
  };

  // Styles dynamically applied based on settings
  const readerStyles = {
    fontSize: `${textSize}px`,
    fontFamily: isDyslexicFont ? '"OpenDyslexic", "Comic Sans MS", sans-serif' : 'inherit',
    filter: isHighContrast ? 'contrast(1.5)' : 'none',
  };

  const containerClass = cn(
    "flex-1 p-6 md:p-10 min-h-[50vh] transition-colors duration-300",
    isHighContrast ? "bg-black text-yellow-400" : "bg-card text-card-foreground"
  );


  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'processing': return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'ready': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  return (
    <main id="main-content" className="container py-8 md:py-12 transition-accessibility">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text- accessible-2xl font-bold text-foreground">Documents</h1>
            <p className="text-muted-foreground mt-1">
              Analyze, Simplify, and Listen to workplace documents.
            </p>
          </div>
        </div>

        {/* Upload Area */}
        <div
          className={cn(
            'relative rounded-2xl border-2 border-dashed p-8 transition-all text-center group cursor-pointer',
            isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileInput}
            accept=".pdf,.docx,.doc,.txt"
            multiple
          />
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 rounded-2xl bg-primary/10 group-hover:scale-110 transition-transform duration-300">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                Drag and drop files here
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse • PDF, DOCX, TXT supported
              </p>
            </div>
          </div>
          {uploadProgress !== null && (
            <div className="mt-6 max-w-xs mx-auto">
              <Progress value={uploadProgress} className="h-1" />
            </div>
          )}
        </div>

        {/* Search */}
        <div className="mt-8 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-label="Search documents"
            />
          </div>
        </div>

        {/* Documents List */}
        <div className="space-y-3">
          {filteredDocuments.map((doc) => (
            <Card
              key={doc.id}
              className={cn(
                'p-4 transition-all hover:shadow-md border-l-4',
                doc.status === 'ready' ? 'border-l-green-500' : 'border-l-transparent'
              )}
            >
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="p-3 rounded-xl bg-muted shrink-0">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="font-medium text-foreground truncate text-lg">
                    {doc.name}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/50 text-xs font-medium">
                      {getStatusIcon(doc.status)}
                      {doc.status.toUpperCase()}
                    </span>
                    {doc.pages && (
                      <span>{doc.pages} pages</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {doc.status === 'ready' && (
                  <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                    <Button onClick={() => openSmartReader(doc)} variant="default" size="sm" className="flex-1 md:flex-none">
                      <Eye className="h-4 w-4 mr-2" />
                      Smart View
                    </Button>
                    <Button onClick={() => openSmartReader(doc)} variant="outline" size="sm" className="flex-1 md:flex-none" title="Listen">
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* --- SMART READER DIALOG --- */}
        <Dialog open={!!readingDoc} onOpenChange={(open) => !open && setReadingDoc(null)}>
          <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">

            {/* Header Toolbar */}
            <div className="h-16 border-b flex items-center justify-between px-6 bg-muted/20 shrink-0">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <h2 className="font-semibold truncate">{readingDoc?.name}</h2>
              </div>

              <div className="flex items-center gap-2 md:gap-4">
                {/* Play Controls */}
                <Button
                  variant={isTtsSpeaking ? "destructive" : "default"}
                  size="sm"
                  className="rounded-full w-32"
                  onClick={togglePlay}
                >
                  {isTtsSpeaking ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {isTtsSpeaking ? "Pause" : "Listen"}
                </Button>

                {/* Divider */}
                <div className="h-6 w-px bg-border" />

                {/* Simplify Toggle */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="simplify-mode" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-yellow-500" /> Simplify
                  </Label>
                  <Switch
                    id="simplify-mode"
                    checked={isSimplified}
                    onCheckedChange={setIsSimplified}
                  />
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-border hidden md:block" />

                {/* Chat Toggle */}
                <Button
                  variant={isChatOpen ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  title="Ask AI"
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 min-h-0 relative">

              {/* Document Reader */}
              <div className={cn("flex-1 flex flex-col min-h-0 transition-all duration-300", isChatOpen ? "mr-80 md:mr-96" : "")}>

                {/* Formatting Toolbar */}
                <div className="h-12 border-b flex items-center justify-center gap-6 px-4 bg-background/95 backdrop-blur z-10 shrink-0">
                  <div className="flex items-center gap-2">
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

                  <div className="flex items-center gap-2 border-l pl-4">
                    <Label className="text-xs">Dyslexic Font</Label>
                    <Switch checked={isDyslexicFont} onCheckedChange={setIsDyslexicFont} />
                  </div>

                  <div className="flex items-center gap-2 border-l pl-4">
                    <Label className="text-xs">High Contrast</Label>
                    <Switch checked={isHighContrast} onCheckedChange={setIsHighContrast} />
                  </div>
                </div>

                {/* Scrollable Text */}
                <ScrollArea className="flex-1">
                  <div className={containerClass} style={readerStyles}>
                    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
                      {isSimplified ? (
                        <div className="prose prose-lg dark:prose-invert max-w-none">
                          <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-lg border border-yellow-200 dark:border-yellow-900 mb-6">
                            <h3 className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 font-semibold m-0">
                              <Sparkles className="h-5 w-5" /> AI Summary
                            </h3>
                            <p className="text-sm text-muted-foreground m-0 mt-1">This document has been simplified for easier reading.</p>
                          </div>
                          <div dangerouslySetInnerHTML={{ __html: SIMPLIFIED_CONTENT.replace(/\n/g, '<br/>') }} />
                        </div>
                      ) : (
                        <div className="prose prose-slate dark:prose-invert max-w-none leading-relaxed">
                          <div dangerouslySetInnerHTML={{ __html: SAMPLE_DOC_CONTENT.replace(/\*\*(.*?)\*\*/g, '<h3>$1</h3>').replace(/\n/g, '<br/>') }} />
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </div>

              {/* Chat Sidebar (Overlay/Slide-in) */}
              <div className={cn(
                "absolute top-0 right-0 bottom-0 w-80 md:w-96 border-l bg-muted/30 flex flex-col transition-transform duration-300 shadow-2xl z-20",
                isChatOpen ? "translate-x-0" : "translate-x-full"
              )}>
                <div className="p-4 border-b bg-background flex justify-between items-center">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Chat with Document
                  </h3>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsChatOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <ScrollArea className="flex-1 p-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10 px-4">
                      <Sparkles className="h-10 w-10 mx-auto text-primary/20 mb-3" />
                      <p className="text-sm">Ask any question about this document. Try asking about <strong>deadlines</strong> or <strong>accommodations</strong>.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={cn("flex gap-3 text-sm", msg.role === 'user' ? "flex-row-reverse" : "")}>
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className={msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-green-600 text-white"}>
                              {msg.role === 'user' ? "ME" : "AI"}
                            </AvatarFallback>
                          </Avatar>
                          <div className={cn(
                            "p-3 rounded-lg max-w-[85%]",
                            msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-card border shadow-sm"
                          )}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                      {isChatLoading && (
                        <div className="flex gap-3 text-sm">
                          <Avatar className="h-8 w-8 shrink-0"><AvatarFallback className="bg-green-600 text-white">AI</AvatarFallback></Avatar>
                          <div className="bg-card border shadow-sm p-3 rounded-lg">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                <form onSubmit={handleChatSubmit} className="p-3 bg-background border-t">
                  <div className="relative">
                    <Input
                      placeholder="Ask a question..."
                      className="pr-10"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                    />
                    <Button size="icon" type="submit" variant="ghost" className="absolute right-0 top-0 h-10 w-10 text-primary hover:bg-transparent" disabled={!chatInput.trim() || isChatLoading}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </div>

            </div>



          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}

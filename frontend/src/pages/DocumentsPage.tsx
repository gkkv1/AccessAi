import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { SmartReader } from '@/components/SmartReader';
import { Card, CardContent } from '@/components/ui/card';
import { AccessLoader } from '@/components/AccessLoader';
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
// React-PDF removed for accessibility reasons
// We will use a custom accessible text renderer with virtual pagination.

// --- Mock Data Removed (Using Real API) ---

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export default function DocumentsPage() {
  console.log("DocumentsPage Loaded - Accessible Version Checks");
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // --- Accessibility / Smart View State ---
  const [readingDoc, setReadingDoc] = useState<APIDocument | null>(null);
  const [textSize, setTextSize] = useState(16);
  const [isDyslexicFont, setIsDyslexicFont] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isReadingMask, setIsReadingMask] = useState(false);
  const [overlayColor, setOverlayColor] = useState<string>('none'); // none, blue, yellow, rose, green
  const [mouseY, setMouseY] = useState(0);
  const [isSimplified, setIsSimplified] = useState(false);

  // --- PDF Viewer State ---
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState(1.0);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  // --- Visual Aids Effects ---
  useEffect(() => {
    if (!isReadingMask) return;
    const handleMouseMove = (e: MouseEvent) => {
      // Offset by scroll if needed, but for fixed overlay clientY is good
      setMouseY(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isReadingMask]);



  // --- TTS State ---
  const { speak, cancel: cancelSpeech, isSpeaking: isTtsSpeaking } = useTextToSpeech();

  // --- Speech Recognition ---
  const { isListening, transcript, startListening, stopListening, isSupported: isSpeechSupported } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setChatInput(transcript);
    }
  }, [transcript]);

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

  const [searchResults, setSearchResults] = useState<import('@/lib/api').SearchResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced Semantic Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await endpoints.search(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 600); // 600ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // If search is active, we don't use filteredDocuments for the main list (unless search fails/empty)
  // But for now let's keep filteredDocuments as a fallback or for initial view.
  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
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
  // --- Parameter Handling (Open from SearchPage) ---
  const [searchParams] = useSearchParams(); // Needs import if not there, wait, check imports.
  // DocumentsPage.tsx imports: line 1-50? No. 
  // Need to add useSearchParams import.

  useEffect(() => {
    const openDocId = searchParams.get('openDocId');
    const paramPage = searchParams.get('page');

    if (openDocId && !readingDoc) {
      // Find valid doc in query cache usually, but safer to fetch
      endpoints.getDocument(openDocId).then(doc => {
        // Auto open
        openSmartReader(doc, Number(paramPage) || 1);
        // Clean URL? Optional.
      }).catch(err => console.error("Auto open failed", err));
    }
  }, [searchParams]);

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

  // --- Virtual Pagination State ---
  const [virtualPages, setVirtualPages] = useState<string[]>([]);

  // Heuristic for splitting text into "pages" roughly
  const paginateContent = (text: string) => {
    if (!text) return [];
    const charsPerPage = 3000; // Adjustable density
    const pages: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      if (remaining.length <= charsPerPage) {
        pages.push(remaining);
        break;
      }

      // Find a safe break point (double newline -> newline -> period -> space)
      let splitIndex = remaining.lastIndexOf('\n\n', charsPerPage);
      if (splitIndex === -1) splitIndex = remaining.lastIndexOf('\n', charsPerPage);
      if (splitIndex === -1) splitIndex = remaining.lastIndexOf('.', charsPerPage);
      if (splitIndex === -1) splitIndex = charsPerPage;

      pages.push(remaining.slice(0, splitIndex + 1));
      remaining = remaining.slice(splitIndex + 1);
    }
    return pages;
  };

  const openSmartReader = async (doc: APIDocument, initialPage: number = 1) => {
    try {
      const fullDoc = await endpoints.getDocument(doc.id);
      const docToUse = fullDoc || doc;
      setReadingDoc(docToUse);

      // Initial Pagination
      const pages = paginateContent(docToUse.content_text || "No content.");
      setVirtualPages(pages);
      setNumPages(pages.length);

    } catch (err) {
      console.error("Failed to fetch document content:", err);
      toast.error("Could not load document content");
      setReadingDoc(doc);
    }
    setIsSimplified(false);
    setIsChatOpen(false);
    setPageNumber(initialPage);
    cancelSpeech();
    setChatMessages([]);
    setChatInput('');
  };

  // --- Simplified Content State (Cached by Doc ID) ---
  const [simplifiedCache, setSimplifiedCache] = useState<Record<string, string>>({});
  const [isSimplifying, setIsSimplifying] = useState(false);

  useEffect(() => {
    const fetchSimplified = async () => {
      if (!readingDoc) return;

      // Check if we already have it in cache
      if (simplifiedCache[readingDoc.id]) {
        return;
      }

      if (isSimplified && readingDoc.content_text) {
        setIsSimplifying(true);
        try {
          // Send first 2000 chars for simplification (MVP limit)
          const textToSimplify = readingDoc.content_text.slice(0, 2000);
          const result = await endpoints.simplify(textToSimplify);

          setSimplifiedCache(prev => ({
            ...prev,
            [readingDoc.id]: result.simplified_text
          }));
        } catch (err) {
          console.error("Simplification error:", err);
          toast.error("Failed to simplify text");
          setIsSimplified(false);
        } finally {
          setIsSimplifying(false);
        }
      }
    };
    fetchSimplified();
  }, [isSimplified, readingDoc, simplifiedCache]);

  const togglePlay = () => {
    if (isTtsSpeaking) {
      cancelSpeech();
    } else {
      // proper fallback to content_text
      const currentSimplified = readingDoc ? simplifiedCache[readingDoc.id] : '';
      const textToRead = isSimplified ? (currentSimplified || "Simplifying...") : (readingDoc?.content_text || "No content available to read.");
      const cleanText = textToRead.replace(/[*•#]/g, '').trim();
      speak(cleanText);
    }
  };


  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !readingDoc) return;

    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);
    setChatInput(''); // Clear input immediately
    stopListening(); // Stop listening if active

    try {
      const result = await endpoints.chatDocument(readingDoc.id, userMsg.text);

      const aiMsg: ChatMessage = {
        role: 'assistant',
        text: result.answer
      };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = { role: 'assistant', text: "I'm having trouble connecting to the document brain right now. Please try again." };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
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


  const getStatusIcon = (status: APIDocument['status']) => {
    switch (status) {
      case 'processing': return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'ready': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <AccessLoader size="xl" text="Loading your documents..." />
      </div>
    );
  }

  return (
    <main id="main-content" className="container py-8 md:py-12 relative min-h-screen">
      {/* Upload Overlay */}
      {uploadMutation.isPending && (
        <AccessLoader overlay size="xl" text="Uploading and processing with AI..." />
      )}
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
          {searchQuery.trim() ? (
            // --- SEARCH RESULTS MODE ---
            <div className="space-y-4">
              {isSearching ? (
                <div className="text-center py-10 text-muted-foreground animate-pulse">
                  Searching content...
                </div>
              ) : searchResults?.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  No relevant documents found.
                </div>
              ) : (
                searchResults?.map((result) => (
                  <Card key={result.id} className="p-4 transition-all hover:shadow-md border-l-4 border-l-blue-500">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-foreground text-lg">{result.title}</h3>
                        <span className={cn(
                          "text-xs font-bold px-2 py-1 rounded-full",
                          result.relevance > 0.8 ? "bg-green-100 text-green-700" :
                            result.relevance > 0.5 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                        )}>
                          {Math.round(result.relevance * 100)}% Match
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2 italic">
                        "...{result.snippet}..."
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">Source: {result.source} (Page {result.page})</span>
                        <Button
                          onClick={() => openSmartReader({
                            id: result.document_id, // Use correct Document ID
                            title: result.title,
                            file_type: 'pdf', // Assumption
                            status: 'ready',
                            created_at: new Date().toISOString(),
                            content_text: '' // fetching in openSmartReader
                          } as APIDocument, result.page || 1)}
                          variant="default"
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Open Smart View
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          ) : (
            // --- STANDARD LIST MODE ---
            filteredDocuments.map((doc) => (
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
                      {doc.title}
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
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {doc.status === 'ready' && (
                    <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                      <Button onClick={() => openSmartReader(doc)} variant="default" size="sm" className="flex-1 md:flex-none">
                        <Eye className="h-4 w-4 mr-2" />
                        Smart View
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>

        {/* --- SMART READER COMPONENT --- */}
        {readingDoc && (
          <SmartReader
            doc={readingDoc}
            isOpen={!!readingDoc}
            onClose={() => {
              setReadingDoc(null);
            }}
            initialPage={pageNumber}
          />
        )}
      </div>
    </main>
  );
}

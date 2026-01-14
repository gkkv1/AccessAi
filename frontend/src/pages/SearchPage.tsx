

import { useState, useEffect } from 'react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { SmartReader } from '@/components/SmartReader';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  FileText,
  Volume2,
  MessageSquare,
  ExternalLink,
  Loader2,
  Mic,
  Check,
  X,
  Sparkles,
  Pause
} from 'lucide-react';
import { endpoints } from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [speaking, setSpeaking] = useState<string | null>(null);

  // Feature 1: Search Modes
  const [searchMode, setSearchMode] = useState<'semantic' | 'fulltext'>('semantic');

  // Feature 1: Voice Search Simulation State
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceStep, setVoiceStep] = useState<'listening' | 'recognized' | 'confirm'>('listening');
  const [recognizedText, setRecognizedText] = useState('');

  // Feature 2: Accessibility UI State
  const [simplifiedItem, setSimplifiedItem] = useState<{ id: string, original: string, simplified: string } | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{ id: string, title: string, content: string } | null>(null);

  const { data: results = [], isLoading, isError } = useQuery({
    queryKey: ['search', query],
    queryFn: () => endpoints.search(query),
    enabled: !!query,
  });

  const simplifyMutation = useMutation({
    mutationFn: endpoints.simplify,
    onSuccess: (data, variables) => {
      // Find the result that was simplified to get its ID/Title if needed
      // For now, we just show the simplified content
      setSimplifiedItem({
        id: "temp-id",
        original: variables, // The snippet sent to be simplified
        simplified: data.simplified_text
      });
    }
  });

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
    }
  }, [searchParams]);

  const handleSearch = (newQuery: string) => {
    setSearchParams({ q: newQuery });
  };

  // --- Voice Simulation Logic ---
  const startVoiceSearch = () => {
    setIsVoiceListening(true);
    setVoiceStep('listening');
    setRecognizedText('');

    // Simulate "Listening..." -> "recognized"
    setTimeout(() => {
      setVoiceStep('recognized');
      setRecognizedText("parental leave eligibility");
    }, 2000);
  };

  const confirmVoiceSearch = () => {
    setIsVoiceListening(false);
    handleSearch(recognizedText);
  };
  // -----------------------------


  const { speak, cancel: cancelSpeech, isSpeaking: isTtsSpeaking } = useTextToSpeech();

  const speakText = (text: string, id: string) => {
    if (speaking === id) {
      cancelSpeech();
      setSpeaking(null);
      return;
    }

    if (text) {
      setSpeaking(id);
      speak(text, () => setSpeaking(null));
    }
  };


  // const navigate = useNavigate(); // Not needed anymore

  const handleReadFull = (result: any) => {
    // Open Smart View Modal in-place
    const docId = result.document_id || result.id;
    const page = result.page || 1;

    // We construct a partial object that SmartReader will use to fetch full content
    setViewingDoc({
      id: docId,
      title: result.title,
      content: "", // will be fetched by SmartReader
      page: page, // Custom info to pass to initialPage
    } as any);
  };

  return (
    <main id="main-content" className="container py-8 md:py-12 transition-accessibility">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-accessible-2xl font-bold text-foreground mb-6">
          Search Documents
        </h1>

        {/* Search Bar & Mode Toggle */}
        <div className="space-y-4 mb-8">
          <div className="flex gap-2">
            <div className="flex-1">
              <SearchBar
                onSearch={handleSearch}
                isLoading={isLoading}
                placeholder="Ask any question about workplace policies..."
                initialQuery={query}
              />
            </div>
            <Button
              size="icon"
              variant="outline"
              className="h-10 w-10 shrink-0"
              onClick={startVoiceSearch}
              aria-label="Start voice search"
            >
              <Mic className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center space-x-4 bg-muted/30 p-2 rounded-lg w-fit">
            <span className="text-sm font-medium pl-2">Search Mode:</span>
            <div className="flex items-center space-x-2">
              <Switch
                id="mode-toggle"
                checked={searchMode === 'fulltext'}
                onCheckedChange={(c) => setSearchMode(c ? 'fulltext' : 'semantic')}
              />
              <Label htmlFor="mode-toggle" className="cursor-pointer">
                {searchMode === 'semantic' ? 'Semantic (AI)' : 'Full-text (Exact)'}
              </Label>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Searching documents...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="text-center py-12 text-destructive">
            <p>Failed to search documents. Please try again.</p>
          </div>
        )}

        {/* Results */}
        {!isLoading && results.length > 0 && (
          <div className="mt-8 space-y-6 animate-in fade-in">
            <h2 className="font-semibold text-lg mb-4">
              Search Results ({results.length})
            </h2>
            <div className="space-y-4">
              {results.map((result) => (
                <Card
                  key={result.id}
                  className="p-5 hover:shadow-md transition-shadow border-l-4 border-l-primary/50"
                  tabIndex={0}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground hover:text-primary cursor-pointer">
                            {result.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {result.source} {result.page && `• Page ${result.page}`}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold">
                            {Math.round(result.relevance * 100)}% Match
                          </span>
                        </div>
                      </div>

                      {/* Snippet */}
                      <div className="mt-3 p-3 bg-muted/50 rounded-md">
                        <p className="text-foreground/80 leading-relaxed italic">
                          "{result.snippet}"
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReadFull(result)}
                          className="h-8"
                        >
                          <ExternalLink className="h-3 w-3 mr-2" />
                          Read Full
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => simplifyMutation.mutate(result.snippet)}
                          disabled={simplifyMutation.isPending}
                        >
                          <MessageSquare className="h-3 w-3 mr-2" />
                          {simplifyMutation.isPending ? 'Simplifying...' : 'Simplify'}
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8"
                          onClick={() => speakText(result.snippet, result.id)}
                        >
                          <Volume2 className={`h-3 w-3 mr-2 ${speaking === result.id ? 'text-primary animate-pulse' : ''}`} />
                          {speaking === result.id ? 'Reading...' : 'Read Aloud'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && query && results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No results found for "{query}"</p>
          </div>
        )}

        {/* Initial state */}
        {!query && !isLoading && (
          <div className="text-center py-12 space-y-4">
            <div className="inline-flex p-4 rounded-2xl bg-muted">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-foreground">Search workplace documents</h2>
              <p className="text-muted-foreground mt-1">
                Ask questions in plain language or use voice input
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {['parental leave eligibility', 'Health insurance coverage', 'Remote work policy'].map((example) => (
                <Button
                  key={example}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSearch(example)}
                  className="rounded-full"
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Voice Search Simulation Dialog */}
      <Dialog open={isVoiceListening} onOpenChange={setIsVoiceListening}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle>Voice Search</DialogTitle>
          </DialogHeader>
          <div className="py-8 flex flex-col items-center justify-center space-y-6">

            {voiceStep === 'listening' && (
              <>
                <div className="relative">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                    <Mic className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute inset-0 rounded-full ring-4 ring-primary/10 animate-[ping_1.5s_ease-in-out_infinite]" />
                </div>
                <p className="text-lg font-medium">Listening...</p>
                <p className="text-sm text-muted-foreground">Say your query...</p>
              </>
            )}

            {(voiceStep === 'recognized' || voiceStep === 'confirm') && (
              <>
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Query Recognized:</p>
                  <p className="text-xl font-bold text-foreground">"{recognizedText}"</p>
                </div>

                <div className="flex gap-3 w-full justify-center pt-2">
                  <Button variant="outline" onClick={() => setIsVoiceListening(false)} className="w-24">
                    <X className="mr-2 h-4 w-4" />
                    No
                  </Button>
                  <Button onClick={confirmVoiceSearch} className="w-24">
                    <Check className="mr-2 h-4 w-4" />
                    Yes
                  </Button>
                </div>
              </>
            )}

          </div>
        </DialogContent>
      </Dialog>

      {/* Feature 2: High-Accessibility Simplify Dialog */}
      <Dialog open={!!simplifiedItem} onOpenChange={(open) => !open && setSimplifiedItem(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b shrink-0 bg-muted/20">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              Simplified Summary
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              AI-generated easy-to-read version of the selected text.
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 bg-background">
            {/* Original (Collapsible/Small) */}
            <div className="mb-6 p-4 bg-muted/30 rounded-lg border text-sm text-foreground/60">
              <h4 className="font-semibold uppercase text-xs tracking-wider mb-2 opacity-70">Original Snippet</h4>
              <p className="italic line-clamp-3">{simplifiedItem?.original}</p>
            </div>

            {/* Simplified Content with Custom Formatter */}
            <div className="prose prose-slate dark:prose-invert max-w-none leading-relaxed space-y-3">
              {simplifiedItem && simplifiedItem.simplified.split('\n').map((line, i) => {
                const cleanLine = line.trim();
                if (!cleanLine) return <br key={i} />;

                // Handle Bullet Points
                if (cleanLine.startsWith('- ') || cleanLine.startsWith('• ')) {
                  const content = cleanLine.substring(2);
                  // Parse Bold in bullets
                  const parts = content.split(/(\*\*.*?\*\*)/g).map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={j} className="text-foreground font-bold">{part.slice(2, -2)}</strong>;
                    }
                    return part;
                  });
                  return (
                    <div key={i} className="flex gap-2 items-start pl-2">
                      <span className="text-primary mt-1.5 shrink-0">•</span>
                      <span>{parts}</span>
                    </div>
                  );
                }

                // Handle Regular Lines (Headers/Paragraphs)
                const parts = cleanLine.split(/(\*\*.*?\*\*)/g).map((part, j) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={j} className="text-foreground font-bold text-lg block mt-4 mb-2 first:mt-0">{part.slice(2, -2)}</strong>;
                  }
                  return part;
                });

                return <p key={i} className="text-foreground/90">{parts}</p>;
              })}
            </div>
          </div>

          <div className="p-4 border-t bg-muted/10 shrink-0 flex justify-between items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => {
              if (simplifiedItem) {
                navigator.clipboard.writeText(simplifiedItem.simplified);
                toast.success("Copied to clipboard");
              }
            }}>Copy Text</Button>

            <div className="flex gap-2">
              <Button
                variant={speaking === 'simplified' ? "default" : "secondary"}
                onClick={() => {
                  if (!simplifiedItem) return;
                  // Clean text for TTS: remove markdown bold and list markers
                  const textToRead = simplifiedItem.simplified
                    .replace(/\*\*/g, '')
                    .replace(/^[-•]\s*/gm, '')
                    .trim();
                  speakText(textToRead, 'simplified');
                }}
              >
                {speaking === 'simplified' ? <Pause className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
                {speaking === 'simplified' ? 'Stop Reading' : 'Read Aloud'}
              </Button>
              <Button onClick={() => setSimplifiedItem(null)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feature 2: High-Accessibility Simplify Dialog */}
      {/* ... keeping simplify dialog as is if needed, or removing if SmartReader covers it ... */}

      {/* Feature 2: Document Preview Dialog (REAL SMART READER) */}
      {viewingDoc && (
        <SmartReader
          doc={viewingDoc as any} // Cast because viewingDoc might be partial, but we will ensure it has id/title
          isOpen={!!viewingDoc}
          onClose={() => setViewingDoc(null)}
          initialPage={viewingDoc ? (viewingDoc as any).page : 1}
        />
      )}

    </main>
  );
}

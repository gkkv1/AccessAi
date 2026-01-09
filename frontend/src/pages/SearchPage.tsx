

import { useState, useEffect } from 'react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
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
  X
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
        simplified: data.simplified
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


  const handleReadFull = (result: any) => {
    // Simulate fetching full document content - LARGE MOCK
    setViewingDoc({
      id: result.id,
      title: result.title,
      content: `
SECTION 1: PURPOSE AND SCOPE
This policy establishes the guidelines and procedures for Parental Leave at [Company Name]. We are committed to supporting employees as they balance their career with the responsibilities of family life. This policy applies to all full-time regular employees who have completed at least 12 months of continuous service.

SECTION 2: DEFINITIONS
2.1 "Parent" is defined as a biological parent on the birth of a child, an adoptive parent on the placement of a child for adoption, or a foster parent on the placement of a child for foster care.
2.2 "Qualifying Event" refers to the birth of a child or the placement of a child for adoption or foster care.

SECTION 3: ELIGIBILITY CRITERIA
Employees are eligible for Paid Parental Leave if they meet the following criteria:
- Must be a full-time regular employee.
- Must have completed 12 months of continuous service prior to the date of the Qualifying Event.
- Must be in good standing with the company at the time of the request.

SECTION 4: LEAVE ENTITLEMENT
4.1 Duration: Eligible employees are entitled to up to six (6) months (26 weeks) of 100% paid leave following a Qualifying Event.
4.2 Schedule: Leave may be taken as a single continuous block or intermittently in increments of no less than two (2) weeks, subject to manager approval and business needs.
4.3 Timing: All leave must be completed within twelve (12) months of the Qualifying Event. Any unused leave remaining after this period will be forfeited.

SECTION 5: COORDINATION WITH OTHER BENEFITS
5.1 Family and Medical Leave Act (FMLA): Paid Parental Leave runs concurrently with FMLA leave.
5.2 Short-Term Disability (STD): For birthing parents, Paid Parental Leave begins after any medically authorized period of Short-Term Disability has concluded.
5.3 State Paid Leave Laws: In states with statutory paid family leave programs, the company will supplement the state benefit to ensure the employee receives 100% of their regular base pay.

SECTION 6: BENEFITS CONTINUATION
During the paid leave period, employees will continue to receive:
- Health, dental, and vision insurance coverage on the same terms as if they were working.
- Accrual of PTO and vacation time.
- Eligibility for annual bonuses (prorated based on active service if applicable).
- 401(k) matching contributions based on the paid leave earnings.

SECTION 7: REQUEST PROCEDURE
7.1 Notice: Employees should provide at least 30 days' advance notice of their intent to take leave, when foreseeable.
7.2 Documentation: Supporting documentation (e.g., birth certificate, adoption decree) may be required within 30 days of the Qualifying Event.
7.3 System entry: Requests must be submitted via the HR Portal under "Time Off > Parental Leave".

SECTION 8: REINSTATEMENT
8.1 Job Protection: Upon return from Parental Leave, employees are entitled to be reinstated to the same position or an equivalent position with equivalent pay, benefits, and other terms and conditions of employment.
8.2 Retaliation Prohibited: The company strictly prohibits retaliation against any employee for requesting or taking Parental Leave.

SECTION 9: EXCEPTIONS
Any exceptions to this policy must be approved in writing by the Chief People Officer. The company reserves the right to modify or terminate this policy at any time.

---
APPENDIX A: FAQ

Q: Can both parents take leave if they both work for the company?
A: Yes, each eligible employee is entitled to their own separate bank of Parental Leave.

Q: Does this cover surrogacy?
A: Yes, parents welcoming a child via surrogacy are covered under the "New Parent" provisions.

[... End of Policy Document ...]`
    });
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
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              Simplified Summary
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="p-4 bg-muted/50 rounded-lg border">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Original Text</h4>
              <p className="text-sm text-foreground/70">{simplifiedItem?.original}</p>
            </div>

            <div className="p-6 bg-primary/5 rounded-xl border border-primary/20 shadow-sm">
              <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                <Check className="h-4 w-4" />
                Easy to Read Version
              </h4>
              <p className="text-lg font-medium leading-relaxed text-foreground">
                {simplifiedItem?.simplified}
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSimplifiedItem(null)}>
                Close
              </Button>
              <Button
                onClick={() => simplifiedItem && speakText(simplifiedItem.simplified, 'simplified')}
              >
                <Volume2 className="h-4 w-4 mr-2" />
                Read Simplified
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feature 2: Document Preview Dialog */}
      <Dialog open={!!viewingDoc} onOpenChange={(open) => !open && setViewingDoc(null)}>
        <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-primary" />
              Document Viewer
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto bg-muted/10 rounded-md mt-0">
            <div className="max-w-3xl mx-auto bg-card shadow-sm min-h-full p-8 md:p-12">
              {/* Document Header Simulation */}
              <div className="mb-8 border-b pb-6">
                <div className="text-sm text-muted-foreground uppercase tracking-widest mb-2 font-semibold">
                  Confidential Internal Document
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                  {viewingDoc?.title}
                </h1>
              </div>

              {/* Document Content */}
              <div className="prose prose-slate dark:prose-invert max-w-none font-serif leading-relaxed whitespace-pre-wrap text-lg">
                {viewingDoc?.content}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t gap-2">
            <Button variant="outline" onClick={() => window.print()}>Print</Button>
            <Button onClick={() => setViewingDoc(null)}>Close Document</Button>
          </div>
        </DialogContent>
      </Dialog>

    </main>
  );
}

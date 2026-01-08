import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  FileText,
  Volume2,
  MessageSquare,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { endpoints } from '@/lib/api';
import { toast } from 'sonner';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [speaking, setSpeaking] = useState<string | null>(null);

  const { data: results = [], isLoading, isError } = useQuery({
    queryKey: ['search', query],
    queryFn: () => endpoints.search(query),
    enabled: !!query,
  });

  const simplifyMutation = useMutation({
    mutationFn: endpoints.simplify,
    onSuccess: (data) => {
      // In a real app we'd show this in a modal or replace content
      toast.success("Simplified text ready", {
        description: data.simplified
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

  const speakText = (text: string, id: string) => {
    if (speaking === id) {
      window.speechSynthesis.cancel();
      setSpeaking(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.onend = () => setSpeaking(null);
    window.speechSynthesis.speak(utterance);
    setSpeaking(id);
  };

  return (
    <main id="main-content" className="container py-8 md:py-12 transition-accessibility">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-accessible-2xl font-bold text-foreground mb-6">
          Search Documents
        </h1>

        <SearchBar
          onSearch={handleSearch}
          isLoading={isLoading}
          placeholder="Ask any question about workplace policies..."
        />

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
          <div className="mt-8 space-y-6">
            {/* Note: AI Summary could be fetched here separately if needed */}

            {/* Search Results */}
            <div>
              <h2 className="font-semibold text-lg mb-4">
                Sources ({results.length} documents)
              </h2>
              <div className="space-y-4">
                {results.map((result) => (
                  <Card
                    key={result.id}
                    className="p-5 hover:shadow-md transition-shadow"
                    tabIndex={0}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-medium text-foreground hover:text-primary cursor-pointer">
                              {result.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {result.source}
                              {result.page && ` • Page ${result.page}`}
                            </p>
                          </div>
                          <span className="shrink-0 px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                            {Math.round(result.relevance * 100)}% match
                          </span>
                        </div>
                        <p className="mt-2 text-foreground/70 leading-relaxed">
                          {result.snippet}
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={() => speakText(result.snippet, result.id)}
                            aria-label={speaking === result.id ? 'Stop reading' : 'Read aloud'}
                          >
                            <Volume2 className={`h-4 w-4 mr-1 ${speaking === result.id ? 'text-primary' : ''}`} />
                            Read
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={() => simplifyMutation.mutate(result.snippet)}
                            disabled={simplifyMutation.isPending}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Simplify
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View Document
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
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
              {['Parental leave eligibility', 'Health insurance coverage', 'Remote work policy'].map((example) => (
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
    </main>
  );
}

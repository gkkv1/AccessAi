import { useState } from 'react';
import { Search, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VoiceInput } from './VoiceInput';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  className?: string;
}

export function SearchBar({ 
  onSearch, 
  placeholder = "Ask a question about workplace policies...", 
  isLoading = false,
  className 
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setQuery(text);
    // Auto-submit after voice input
    if (text.trim()) {
      onSearch(text.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('w-full', className)}>
      <div className={cn(
        'relative flex items-center gap-3 p-2 bg-card rounded-2xl border-2 transition-all duration-200',
        isListening ? 'border-primary shadow-lg' : 'border-border hover:border-primary/50'
      )}>
        <Search className="ml-4 h-5 w-5 text-muted-foreground shrink-0" aria-hidden="true" />
        
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-lg placeholder:text-muted-foreground/70"
          aria-label="Search query"
          disabled={isLoading}
        />

        <div className="flex items-center gap-2 shrink-0">
          <VoiceInput 
            onTranscript={handleVoiceTranscript}
            onListeningChange={setIsListening}
          />
          
          <Button
            type="submit"
            size="icon"
            className="h-12 w-12 rounded-xl"
            disabled={!query.trim() || isLoading}
            aria-label="Search"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ArrowRight className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      <p className="mt-3 text-sm text-muted-foreground text-center" id="search-hint">
        Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Enter</kbd> to search 
        or use voice input
      </p>
    </form>
  );
}

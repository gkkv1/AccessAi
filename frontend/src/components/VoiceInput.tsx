import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  className?: string;
  size?: 'default' | 'lg' | 'xl';
}

export function VoiceInput({ onTranscript, onListeningChange, className, size = 'default' }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    // Check for browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false);
    }
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      onListeningChange?.(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
      
      if (finalTranscript) {
        onTranscript(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      onListeningChange?.(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      onListeningChange?.(false);
    };

    recognition.start();
    
    // Store recognition instance for stopping
    (window as any).__recognition = recognition;
  }, [onTranscript, onListeningChange]);

  const stopListening = useCallback(() => {
    const recognition = (window as any).__recognition;
    if (recognition) {
      recognition.stop();
      delete (window as any).__recognition;
    }
    setIsListening(false);
    onListeningChange?.(false);
  }, [onListeningChange]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Keyboard shortcut: Space to toggle (when focused)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggleListening();
    } else if (e.key === 'Escape' && isListening) {
      stopListening();
    }
  };

  if (!isSupported) {
    return (
      <Button
        variant="outline"
        disabled
        className={cn('opacity-50', className)}
        aria-label="Voice input not supported in this browser"
      >
        <MicOff className="h-5 w-5" />
      </Button>
    );
  }

  const sizeClasses = {
    default: 'h-12 w-12',
    lg: 'h-14 w-14',
    xl: 'h-16 w-16',
  };

  const iconSizes = {
    default: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-7 w-7',
  };

  return (
    <div className="relative">
      <Button
        variant={isListening ? 'default' : 'outline'}
        size="icon"
        className={cn(
          'rounded-full transition-all',
          sizeClasses[size],
          isListening && 'animate-pulse-ring bg-primary',
          className
        )}
        onClick={toggleListening}
        onKeyDown={handleKeyDown}
        aria-label={isListening ? 'Stop listening. Press Space or Escape to stop.' : 'Start voice input. Press Space to start.'}
        aria-pressed={isListening}
      >
        {isListening ? (
          <Mic className={cn(iconSizes[size], 'text-primary-foreground')} />
        ) : (
          <Mic className={cn(iconSizes[size])} />
        )}
      </Button>
      
      {isListening && (
        <div 
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm text-muted-foreground animate-fade-in"
          role="status"
          aria-live="polite"
        >
          Listening...
        </div>
      )}
    </div>
  );
}

// Add type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

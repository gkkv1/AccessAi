import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechRecognitionReturn {
    isListening: boolean;
    transcript: string;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
    isSupported: boolean;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Track listening state in ref to access inside callbacks without dependencies
    const isListeningRef = useRef(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                setIsSupported(true);
                const recognition = new SpeechRecognition();
                recognitionRef.current = recognition;

                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US';

                recognition.onresult = (event: any) => {
                    let finalTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        }
                    }
                    if (finalTranscript) {
                        setTranscript((prev) => prev + (prev ? ' ' : '') + finalTranscript);
                    }
                };

                recognition.onerror = (event: any) => {
                    console.error("Speech recognition error", event.error);
                    // Ignore 'no-speech' errors which happen often
                    if (event.error !== 'no-speech') {
                        setIsListening(false);
                        isListeningRef.current = false;
                    }
                };

                recognition.onend = () => {
                    setIsListening(false);
                    isListeningRef.current = false;
                };
            }
        }
        // Cleanup
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []); // Run ONCE

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListeningRef.current) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
                isListeningRef.current = true;
            } catch (e: any) {
                console.error("Speech Recognition Error:", e);
                // Handle 'already started' by syncing state
                if (e?.message?.includes('already started') || e?.name === 'InvalidStateError') {
                    setIsListening(true);
                    isListeningRef.current = true;
                }
            }
        }
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListeningRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
            isListeningRef.current = false;
        }
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    return { isListening, transcript, startListening, stopListening, resetTranscript, isSupported };
}

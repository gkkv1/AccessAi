import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTextToSpeechReturn {
    speak: (text: string, onEnd?: () => void) => void;
    cancel: () => void;
    isSpeaking: boolean;
    isSupported: boolean;
}

export function useTextToSpeech(): UseTextToSpeechReturn {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            setIsSupported(true);
        }
    }, []);

    const cancel = useCallback(() => {
        if (!isSupported) return;
        window.speechSynthesis.cancel();
        if (utteranceRef.current) {
            utteranceRef.current.onend = null;
            utteranceRef.current.onerror = null;
            utteranceRef.current = null;
        }
        setIsSpeaking(false);
    }, [isSupported]);

    const speak = useCallback((text: string, onEnd?: () => void) => {
        if (!isSupported) return;

        // Cancel any current speech
        cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance; // Prevent garbage collection

        // Attempt to select a good voice (English)
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.startsWith('en') && !v.localService) ||
            voices.find(v => v.lang.startsWith('en'));
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => setIsSpeaking(true);

        utterance.onend = () => {
            setIsSpeaking(false);
            utteranceRef.current = null;
            if (onEnd) onEnd();
        };

        utterance.onerror = (e) => {
            console.error("TTS Error:", e);
            setIsSpeaking(false);
            utteranceRef.current = null;
        };

        window.speechSynthesis.speak(utterance);

    }, [isSupported, cancel]);

    // Handle unmount
    useEffect(() => {
        return () => {
            cancel();
        };
    }, [cancel]);

    return { speak, cancel, isSpeaking, isSupported };
}

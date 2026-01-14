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

    // Queue State
    const chunksRef = useRef<string[]>([]);
    const currentIndexRef = useRef(0);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            setIsSupported(true);
        }
    }, []);

    const speakNextChunk = useCallback(() => {
        if (currentIndexRef.current >= chunksRef.current.length) {
            setIsSpeaking(false);
            return;
        }

        const textMetadata = chunksRef.current[currentIndexRef.current];
        const utterance = new SpeechSynthesisUtterance(textMetadata);
        utteranceRef.current = utterance;

        // Voice selection
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.startsWith('en') && !v.localService) ||
            voices.find(v => v.lang.startsWith('en'));
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.rate = 1.0;
        utterance.onend = () => {
            currentIndexRef.current++;
            speakNextChunk();
        };
        utterance.onerror = (e) => {
            console.error("TTS Chunk Error:", e);
            // Try skip to next if error
            currentIndexRef.current++;
            speakNextChunk();
        };

        window.speechSynthesis.speak(utterance);
    }, []);

    const cancel = useCallback(() => {
        if (!isSupported) return;
        window.speechSynthesis.cancel();
        chunksRef.current = [];
        currentIndexRef.current = 0;
        if (utteranceRef.current) {
            utteranceRef.current.onend = null;
            utteranceRef.current = null;
        }
        setIsSpeaking(false);
    }, [isSupported]);

    const speak = useCallback((text: string, onEnd?: () => void) => {
        if (!isSupported) return;

        cancel();
        setIsSpeaking(true);

        // Advanced Chunking (Sentence based, max 200 chars)
        // Split by punctuation but keep it
        const sentences = text.match(/[^.!?]+[.!?]+[\])'"]*|.+/g) || [text];

        // Group sentences into chunks < 200 chars
        const chunks: string[] = [];
        let currentChunk = "";

        sentences.forEach(s => {
            if (currentChunk.length + s.length < 200) {
                currentChunk += s + " ";
            } else {
                chunks.push(currentChunk.trim());
                currentChunk = s + " ";
            }
        });
        if (currentChunk.trim()) chunks.push(currentChunk.trim());

        chunksRef.current = chunks;
        currentIndexRef.current = 0;

        speakNextChunk();

    }, [isSupported, cancel, speakNextChunk]);

    // Ensure voices are loaded (Chromium quirk)
    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.getVoices();
        }
    }, []);

    // Handle unmount
    useEffect(() => {
        return () => {
            cancel();
        };
    }, [cancel]);

    return { speak, cancel, isSpeaking, isSupported };
}

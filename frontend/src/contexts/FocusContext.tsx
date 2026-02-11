import { createContext, useContext, useState, ReactNode } from 'react';

interface FocusContextType {
    isFocusMode: boolean;
    toggleFocusMode: () => void;
    setFocusMode: (value: boolean) => void;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export function FocusProvider({ children }: { children: ReactNode }) {
    const [isFocusMode, setIsFocusMode] = useState(false);

    const toggleFocusMode = () => setIsFocusMode(prev => !prev);
    const setFocusMode = (value: boolean) => setIsFocusMode(value);

    return (
        <FocusContext.Provider value={{ isFocusMode, toggleFocusMode, setFocusMode }}>
            {children}
        </FocusContext.Provider>
    );
}

export function useFocus() {
    const context = useContext(FocusContext);
    if (context === undefined) {
        throw new Error('useFocus must be used within a FocusProvider');
    }
    return context;
}

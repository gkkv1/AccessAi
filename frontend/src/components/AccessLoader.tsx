import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface AccessLoaderProps {
    /**
     * Size of the loader. 
     * 'sm' for inline buttons, 'md' for cards, 'lg' for page sections, 'xl' for full screen
     */
    size?: 'sm' | 'md' | 'lg' | 'xl';
    /**
     * Custom text to announce to screen readers and display visually.
     * Defaults to "Loading content..."
     */
    text?: string;
    /**
     * If true, renders a backdrop overlay (useful for blocking interaction during critical loads)
     */
    overlay?: boolean;
    className?: string;
}

export function AccessLoader({
    size = 'md',
    text = "Loading...",
    overlay = false,
    className
}: AccessLoaderProps) {

    // Map size to dimensions
    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-8 w-8",
        lg: "h-12 w-12",
        xl: "h-16 w-16"
    };

    const textClasses = {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-lg",
        xl: "text-xl"
    };

    const Content = () => (
        <div className={cn("flex flex-col items-center justify-center animate-in fade-in duration-300", className)}>

            {/* 1. Spinner Circle Container */}
            <div className="relative flex items-center justify-center p-2">
                {/* Decorative Outer Ring (Static) */}
                <div className={cn(
                    "absolute border-4 border-primary/20 rounded-full box-border",
                    size === 'xl' ? "w-24 h-24" : size === 'lg' ? "w-16 h-16" : size === 'md' ? "w-10 h-10" : "hidden"
                )} />

                {/* Animated Spinner (Rotates) */}
                <Loader2
                    className={cn(
                        "text-primary animate-spin relative z-10",
                        sizeClasses[size]
                    )}
                    aria-hidden="true"
                />
            </div>

            {/* 2. Text Container (Vertical Stack with spacing) */}
            <div className="flex flex-col items-center gap-1 mt-4">

                {/* Brand Name - Only for larger sizes */}
                {(size === 'lg' || size === 'xl') && (
                    <div className="text-xs font-bold tracking-[0.2em] text-primary/60 uppercase animate-pulse">
                        Access.AI
                    </div>
                )}

                {/* User Feedback Text */}
                <span className={cn("font-medium text-muted-foreground", textClasses[size])}>
                    {text}
                </span>
            </div>

            <span className="sr-only" role="status" aria-live="polite">
                {text} Please wait.
            </span>
        </div>
    );

    if (overlay) {
        return (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center supports-[backdrop-filter]:bg-background/60">
                <Content />
            </div>
        );
    }

    return <Content />;
}

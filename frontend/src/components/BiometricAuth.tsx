import { useState, useEffect } from 'react';
import { Fingerprint, Loader2, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BiometricAuthProps {
    userName?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function BiometricAuth({ userName = "User", onSuccess, onCancel }: BiometricAuthProps) {
    const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
    const [progress, setProgress] = useState(0);

    const startScan = () => {
        setStatus('scanning');
        setProgress(0);
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'scanning') {
            // Simulate scanning progress
            interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setStatus('success');
                        setTimeout(onSuccess, 1000); // Wait a bit before completing
                        return 100;
                    }
                    return prev + 5; // Finish in ~2 seconds
                });
            }, 100);
        }
        return () => clearInterval(interval);
    }, [status, onSuccess]);

    return (
        <div
            className="flex flex-col items-center justify-center space-y-6 p-6 animate-in fade-in"
            role="dialog"
            aria-labelledby="biometric-title"
            aria-live="polite"
        >
            <h2 id="biometric-title" className="text-xl font-semibold text-center">
                {status === 'idle' && "Fingerprint Login"}
                {status === 'scanning' && "Scanning Fingerprint..."}
                {status === 'success' && "Fingerprint Recognized!"}
                {status === 'failed' && "Not Recognized"}
            </h2>

            <div className="relative flex items-center justify-center w-32 h-32">
                {/* Fingerprint Icon / Animation Area */}
                <div className={cn(
                    "relative z-10 p-4 rounded-full transition-all duration-500",
                    status === 'idle' && "bg-muted text-muted-foreground",
                    status === 'scanning' && "bg-primary/10 text-primary scale-110",
                    status === 'success' && "bg-green-100 text-green-600 dark:bg-green-900/30",
                    status === 'failed' && "bg-red-100 text-red-600 dark:bg-red-900/30"
                )}>
                    {status === 'scanning' ? (
                        <div className="relative">
                            <Fingerprint size={64} className="animate-pulse" />
                            {/* Scanning Line overlay */}
                            <div
                                className="absolute top-0 left-0 w-full h-1 bg-primary/50 blur-[2px] animate-[scan_1.5s_ease-in-out_infinite]"
                                style={{ animationDirection: 'alternate' }}
                            />
                        </div>
                    ) : status === 'success' ? (
                        <CheckCircle2 size={64} className="animate-in zoom-in spin-in-12" />
                    ) : status === 'failed' ? (
                        <XCircle size={64} className="animate-in zoom-in" />
                    ) : (
                        <Fingerprint size={64} onClick={startScan} className="cursor-pointer hover:scale-105 transition-transform" />
                    )}
                </div>

                {/* Ripple Effect for Scanning */}
                {status === 'scanning' && (
                    <>
                        <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
                        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite_200ms]" />
                    </>
                )}
            </div>

            <div className="space-y-4 text-center w-full max-w-xs">
                <p className="text-sm text-muted-foreground min-h-[1.5rem]" aria-live="assertive">
                    {status === 'idle' && "Place your finger on the sensor to continue."}
                    {status === 'scanning' && "Keep your finger still..."}
                    {status === 'success' && `Welcome back, ${userName}!`}
                    {status === 'failed' && "Fingerprint not recognized. Try again."}
                </p>

                {status === 'idle' && (
                    <Button onClick={startScan} size="lg" className="w-full">
                        <Fingerprint className="mr-2 h-5 w-5" />
                        Use Fingerprint
                    </Button>
                )}

                {status === 'failed' && (
                    <Button onClick={startScan} variant="outline" className="w-full">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Try Again
                    </Button>
                )}

                <Button variant="ghost" onClick={onCancel} className="w-full text-muted-foreground">
                    Use Password Instead
                </Button>
            </div>

            {/* Simple keyframe style for scanning line if not provided in tailwind config */}
            <style>{`
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    50% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </div>
    );
}

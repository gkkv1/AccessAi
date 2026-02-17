import { Loader2, Check, Upload, Zap, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UploadProgressProps {
    step: number;
    message: string;
    details: string;
    error?: string | null;
    onClose?: () => void;
}

export function UploadProgressOverlay({ step, message, details, error, onClose }: UploadProgressProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md p-8 bg-card border rounded-lg shadow-2xl space-y-6">

                {/* Error State */}
                {error ? (
                    <div className="space-y-6 text-center animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4 ring-8 ring-destructive/5">
                                <AlertCircle className="w-10 h-10 text-destructive" />
                            </div>
                            <h3 className="text-2xl font-bold text-destructive">Processing Error</h3>
                        </div>

                        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 text-left">
                            <p className="text-sm font-medium text-destructive mb-1">Details:</p>
                            <p className="text-sm text-foreground/80 leading-relaxed font-mono">
                                {error}
                            </p>
                        </div>

                        <div className="pt-2">
                            <Button
                                onClick={onClose}
                                variant="destructive"
                                className="w-full h-11 font-bold tracking-wide transition-all hover:scale-[1.02]"
                            >
                                Close & Remove Failed Record
                            </Button>
                            <p className="text-[10px] text-muted-foreground mt-3 uppercase tracking-tighter">
                                Clicking this will clear the failed entry from your library
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Progress Steps */}
                        <div className="flex justify-between">
                            {[1, 2, 3].map((stepNum) => (
                                <div key={stepNum} className="flex flex-col items-center flex-1">
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-500 ${step > stepNum
                                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                                            : step === stepNum
                                                ? 'bg-primary text-primary-foreground animate-pulse shadow-lg shadow-primary/20'
                                                : 'bg-muted text-muted-foreground'
                                            }`}
                                    >
                                        {step > stepNum ? (
                                            <Check className="w-6 h-6" />
                                        ) : stepNum === 1 ? (
                                            <Upload className="w-6 h-6" />
                                        ) : stepNum === 2 ? (
                                            <Zap className="w-6 h-6" />
                                        ) : (
                                            <Loader2 className="w-6 h-6" />
                                        )}
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-wider",
                                        step === stepNum ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {stepNum === 1 ? 'Upload' : stepNum === 2 ? 'Transcribe' : 'Complete'}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Current Message */}
                        <div className="space-y-4 text-center">
                            <div className="flex items-center justify-center">
                                <Loader2 className="w-7 h-7 mr-3 animate-spin text-primary" />
                                <h3 className="text-xl font-bold tracking-tight">{message}</h3>
                            </div>

                            <p className="text-sm text-muted-foreground break-words px-4 leading-relaxed italic">{details}</p>

                            {step === 2 && (
                                <div className="bg-primary/5 rounded-md p-3 mx-4 border border-primary/10">
                                    <p className="text-xs text-primary font-medium">
                                        ⏱️ Whisper AI is processing. This typically takes 20-60 seconds.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden shadow-inner">
                            <div
                                className="h-full bg-primary transition-all duration-700 ease-in-out"
                                style={{ width: `${(step / 3) * 100}%` }}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// Helper for class names since I used 'cn' above
function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}

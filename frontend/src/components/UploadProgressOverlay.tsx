import { Loader2, Check, Upload, Zap } from 'lucide-react';

interface UploadProgressProps {
    step: number;
    message: string;
    details: string;
}

export function UploadProgressOverlay({ step, message, details }: UploadProgressProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-md p-8 bg-card border rounded-lg shadow-2xl">
                {/* Progress Steps */}
                <div className="flex justify-between mb-8">
                    {[1, 2, 3].map((stepNum) => (
                        <div key={stepNum} className="flex flex-col items-center flex-1">
                            <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${step > stepNum
                                    ? 'bg-green-500 text-white'
                                    : step === stepNum
                                        ? 'bg-primary text-primary-foreground animate-pulse'
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
                            <span className="text-xs text-center text-muted-foreground">
                                {stepNum === 1 ? 'Upload' : stepNum === 2 ? 'Transcribe' : 'Complete'}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Current Message */}
                <div className="space-y-4 text-center">
                    <div className="flex items-center justify-center">
                        <Loader2 className="w-8 h-8 mr-3 animate-spin text-primary" />
                        <h3 className="text-xl font-semibold">{message}</h3>
                    </div>

                    <p className="text-sm text-muted-foreground break-words px-4">{details}</p>

                    {step === 2 && (
                        <p className="text-xs text-muted-foreground mt-4">
                            ⏱️ Whisper AI is processing your audio. This typically takes 20-60 seconds.
                        </p>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="mt-6 w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

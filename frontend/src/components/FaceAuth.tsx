import { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FaceAuthProps {
    userName?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function FaceAuth({ userName = "User", onSuccess, onCancel }: FaceAuthProps) {
    const [status, setStatus] = useState<'starting' | 'detecting' | 'scanning' | 'success' | 'failed'>('starting');
    const [progress, setProgress] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Simulate Camera Startup
    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (status === 'starting') {
            timer = setTimeout(() => {
                setStatus('detecting');
                startVideo();
            }, 1500);
        }

        return () => clearTimeout(timer);
    }, [status]);

    const startVideo = () => {
        // Mock accessing camera - in simulator just show a placeholder or local stream if user allows?
        // For pure simulation without triggering browser permission, stick to placeholder or simple mock.
        // But user asked for "Camera preview". Let's try real getUserMedia but gracefully fallback.
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                    // Auto transition to scanning after a delay
                    setTimeout(() => setStatus('scanning'), 2000);
                })
                .catch(() => {
                    // Fallback if no camera simulation
                    setTimeout(() => setStatus('scanning'), 2000);
                });
        } else {
            setTimeout(() => setStatus('scanning'), 2000);
        }
    };

    // Simulate Scanning Progress
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'scanning') {
            interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setStatus('success');
                        setTimeout(onSuccess, 1000);
                        return 100;
                    }
                    return prev + 5;
                });
            }, 100);
        }
        return () => {
            clearInterval(interval);
            // Cleanup video stream on unmount
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, [status, onSuccess]);

    return (
        <div
            className="flex flex-col items-center justify-center space-y-6 p-6 animate-in fade-in"
            role="dialog"
            aria-labelledby="face-title"
            aria-live="polite"
        >
            <h2 id="face-title" className="text-xl font-semibold text-center">
                {status === 'starting' && "Starting Camera..."}
                {status === 'detecting' && "Position Face in Frame"}
                {status === 'scanning' && "Verifying Face..."}
                {status === 'success' && "Face Recognized!"}
                {status === 'failed' && "Face Not Recognized"}
            </h2>

            <div className="relative w-64 h-64 bg-black rounded-full overflow-hidden shadow-xl border-4 border-muted">
                {/* Video / Placeholder */}
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover mirror-mode"
                    style={{ transform: 'scaleX(-1)' }}
                />

                {/* Fallback visual if video fails or loading */}
                {(!videoRef.current?.srcObject) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-zinc-500">
                        {status === 'starting' ? (
                            <RefreshCw className="h-10 w-10 animate-spin" />
                        ) : (
                            <Camera className="h-16 w-16 opacity-50" />
                        )}
                    </div>
                )}

                {/* Face Detection Box Overlay */}
                {(status === 'detecting' || status === 'scanning') && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-40 h-40 border-2 border-primary rounded-lg relative animate-pulse">
                            {/* Corners */}
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary -mt-1 -ml-1"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary -mt-1 -mr-1"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary -mb-1 -ml-1"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary -mb-1 -mr-1"></div>

                            {/* Scanning Line */}
                            {status === 'scanning' && (
                                <div className="absolute top-0 left-0 w-full h-1 bg-primary/80 blur-sm animate-[scan_1.5s_linear_infinite]" />
                            )}
                        </div>
                    </div>
                )}

                {/* Success Overlay */}
                {status === 'success' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
                        <CheckCircle2 className="h-20 w-20 text-green-500" />
                    </div>
                )}
            </div>

            <div className="space-y-4 text-center w-full max-w-xs">
                <p className="text-sm text-muted-foreground min-h-[1.5rem]" aria-live="assertive">
                    {status === 'starting' && "Please wait while we access your camera..."}
                    {status === 'detecting' && "Look directly at the camera."}
                    {status === 'scanning' && "Keep still, analyzing facial features..."}
                    {status === 'success' && `Welcome back, ${userName}!`}
                </p>

                {status === 'failed' && (
                    <Button onClick={() => setStatus('starting')} variant="outline" className="w-full">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry
                    </Button>
                )}

                <Button variant="ghost" onClick={() => {
                    // Force Stop stream
                    if (videoRef.current && videoRef.current.srcObject) {
                        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                        tracks.forEach(track => track.stop());
                    }
                    onCancel();
                }} className="w-full text-muted-foreground">
                    Use Password Instead
                </Button>
            </div>
            <style>{`
                @keyframes scan {
                    0% { top: 0%; opacity: 0.5; }
                    100% { top: 100%; opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}

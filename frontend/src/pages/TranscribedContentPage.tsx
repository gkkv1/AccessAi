import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Upload,
    Link as LinkIcon,
    FileVideo,
    Play,
    Clock,
    ChevronRight,
    Plus,
    Search,
    AlertCircle,
    Loader2,
    Trash2,
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { endpoints } from '@/lib/api';
import { cn } from '@/lib/utils';
import { UploadProgressOverlay } from '@/components/UploadProgressOverlay';

interface TranscriptionRecord {
    id: string;
    title: string;
    audio_file_path: string;
    processed: boolean;
    created_at: string;
}

export default function TranscribedContentPage() {
    const navigate = useNavigate();
    const [videoUrl, setVideoUrl] = useState('');
    const [videoTitle, setVideoTitle] = useState('');
    const [transcriptions, setTranscriptions] = useState<TranscriptionRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Upload/Progress State
    const [isProcessing, setIsProcessing] = useState(false);
    const [processProgress, setProcessProgress] = useState({
        step: 1,
        message: '',
        details: '',
        error: null as string | null,
        id: null as string | null
    });

    useEffect(() => {
        fetchTranscriptions();
    }, []);

    const fetchTranscriptions = async () => {
        try {
            setIsLoading(true);
            const data = await endpoints.listTranscriptions();
            setTranscriptions(data);
        } catch (error) {
            console.error('Failed to fetch transcriptions:', error);
            toast.error('Failed to load transcriptions');
        } finally {
            setIsLoading(false);
        }
    };

    const startPolling = async (transcriptionId: string, initialStep: number = 2) => {
        let attempts = 0;
        const maxAttempts = 120; // 120 seconds timeout

        const pollInterval = setInterval(async () => {
            try {
                attempts++;
                const result = await endpoints.getTranscription(transcriptionId);

                if (result.processed) {
                    clearInterval(pollInterval);
                    setProcessProgress(prev => ({ ...prev, step: 3, message: 'Processing complete!', details: 'Redirecting to your transcription...' }));

                    await new Promise(resolve => setTimeout(resolve, 1000));
                    setIsProcessing(false);
                    navigate(`/transcribe?id=${transcriptionId}`);
                    toast.success('Transcription Complete!');
                } else if (result.summary?.startsWith("Processing failed:")) {
                    clearInterval(pollInterval);
                    setProcessProgress(prev => ({
                        ...prev,
                        error: result.summary,
                        message: 'Transcription Failed',
                        details: 'Click below to remove this record and try again.'
                    }));
                } else if (attempts >= maxAttempts) {
                    clearInterval(pollInterval);
                    setIsProcessing(false);
                    toast.error('Processing timeout. Check your backend status.');
                } else {
                    setProcessProgress(prev => ({
                        ...prev,
                        step: 2,
                        message: 'Transcribing with AI...',
                        details: `Processing content... ${attempts}/${maxAttempts}s`
                    }));
                }
            } catch (error: any) {
                clearInterval(pollInterval);
                console.error('Polling error:', error);
                setProcessProgress(prev => ({
                    ...prev,
                    error: 'Connection Lost: ' + (error.message || 'The server might be restarting. Please check your network and try again.'),
                    message: 'Connection Failed',
                    details: 'Check if the backend server is running.'
                }));
                // Do NOT set setIsProcessing(false) so the error remains visible
            }
        }, 1000);
    };

    const handleUrlAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!videoUrl) return;

        try {
            setIsProcessing(true);
            setProcessProgress({
                step: 2,
                message: 'Starting transcription...',
                details: 'Validating video URL',
                error: null,
                id: null
            });

            const result = await endpoints.addVideoUrl(videoUrl, videoTitle);
            setProcessProgress(prev => ({ ...prev, id: result.id }));
            setVideoUrl('');
            setVideoTitle('');

            // Start polling immediately at step 2
            startPolling(result.id, 2);
        } catch (error: any) {
            setIsProcessing(false);
            toast.error('Failed to add URL', {
                description: error.response?.data?.detail || error.message
            });
        }
    };

    const handleFileUpload = async (file: File) => {
        try {
            setIsProcessing(true);
            setProcessProgress({
                step: 1,
                message: 'Uploading audio file...',
                details: file.name,
                error: null,
                id: null
            });

            const result = await endpoints.uploadAudioFile(file, file.name);
            setProcessProgress(prev => ({ ...prev, id: result.id }));

            // Start polling after upload (Step 2)
            startPolling(result.id, 2);
        } catch (error: any) {
            setIsProcessing(false);
            toast.error('Upload failed', {
                description: error.response?.data?.detail || error.message
            });
        }
    };

    const handleErrorClose = async () => {
        const idToDelete = processProgress.id;
        setIsProcessing(false);
        setProcessProgress({ step: 1, message: '', details: '', error: null, id: null });

        if (idToDelete) {
            try {
                await endpoints.deleteTranscription(idToDelete);
                fetchTranscriptions(); // Refresh the list
            } catch (err) {
                console.error("Failed to cleanup failed transcription:", err);
            }
        }
    };

    // ... (Other handlers remain the same)
    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => {
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && (file.type.startsWith('video/') || file.type.startsWith('audio/'))) {
            handleFileUpload(file);
        } else {
            toast.error('Invalid file type. Please upload audio or video.');
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this transcription?')) return;

        try {
            await endpoints.deleteTranscription(id);
            toast.success('Transcription deleted');
            setTranscriptions(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const filteredTranscriptions = transcriptions.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="container py-8 max-w-6xl space-y-8 animate-in fade-in duration-500">
            {isProcessing && (
                <UploadProgressOverlay
                    step={processProgress.step}
                    message={processProgress.message}
                    details={processProgress.details}
                    error={processProgress.error}
                    onClose={handleErrorClose}
                />
            )}

            {/* Accessibility Heading */}
            <div className="bg-primary/5 border-l-4 border-primary p-6 rounded-r-lg">
                <h1 className="text-xl md:text-2xl font-bold text-primary flex items-center gap-3">
                    <Zap className="h-6 w-6" />
                    AI-Powered Video Transcription & Intelligent Insights
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Upload videos or provide URLs to generate AI-powered transcripts and accessibility insights.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* URL Input Section */}
                <Card className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <LinkIcon className="h-5 w-5 text-blue-500" />
                            Add via Video URL
                        </CardTitle>
                        <CardDescription>Support for direct MP4, YouTube, or other video links</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUrlAdd} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    placeholder="Paste video URL here..."
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    className="bg-muted/50 focus-visible:ring-blue-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    placeholder="Optional: Video Title"
                                    value={videoTitle}
                                    onChange={(e) => setVideoTitle(e.target.value)}
                                    className="bg-muted/50"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 font-semibold h-11"
                                disabled={!videoUrl || isProcessing}
                            >
                                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
                                Add Video URL
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Drag & Drop Section */}
                <Card
                    className={cn(
                        "shadow-md transition-all border-dashed border-2 flex flex-col justify-center items-center p-8 text-center cursor-pointer",
                        isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-muted-foreground/20 hover:border-primary/50"
                    )}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={onFileChange}
                        accept="video/*,audio/*"
                    />
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 ring-8 ring-primary/5 group-hover:ring-primary/10 transition-all">
                        <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Drag & Drop Video File</CardTitle>
                    <CardDescription className="max-w-[200px] mt-2">
                        Upload local video or audio files directly to transcribe
                    </CardDescription>
                    <Button variant="ghost" className="mt-4 text-primary font-semibold hover:bg-primary/5">
                        Browse Files
                    </Button>
                </Card>
            </div>

            {/* List Section */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <FileVideo className="h-6 w-6 text-primary" />
                        Transcribed Content Library
                    </h2>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by title..."
                            className="pl-9 h-10 bg-muted/30"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                        <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
                        <p className="font-medium">Loading your content library...</p>
                    </div>
                ) : filteredTranscriptions.length === 0 ? (
                    <div className="text-center py-24 bg-muted/10 rounded-2xl border-2 border-dashed border-muted-foreground/20">
                        <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileVideo className="h-10 w-10 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground/80">No transcribed content yet</h3>
                        <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                            Start by pasting a video URL or dragging a file into the sections above.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTranscriptions.map((item) => (
                            <Card
                                key={item.id}
                                className="group overflow-hidden hover:border-primary/50 transition-all cursor-pointer shadow-sm hover:shadow-md border-muted/60"
                                onClick={() => navigate(`/transcribe?id=${item.id}`)}
                            >
                                <div className="aspect-video bg-slate-900 relative flex items-center justify-center overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                                    <FileVideo className="h-12 w-12 text-slate-400 group-hover:scale-110 transition-transform duration-500" />

                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                        <div className="bg-primary text-primary-foreground p-4 rounded-full shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                                            <Play className="h-6 w-6 fill-current" />
                                        </div>
                                    </div>

                                    <div className="absolute bottom-3 right-3">
                                        <Badge className={cn(
                                            "font-bold px-2 py-0.5 border-none",
                                            item.processed ? "bg-green-500/90 text-white" : "bg-amber-500/90 text-white"
                                        )}>
                                            {item.processed ? "READY" : "TRANSCRIPTION IN PROGRESS..."}
                                        </Badge>
                                    </div>
                                </div>
                                <CardHeader className="p-5">
                                    <div className="flex justify-between items-start gap-3">
                                        <CardTitle className="text-base font-bold line-clamp-1 leading-tight group-hover:text-primary transition-colors">
                                            {item.title}
                                        </CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 -mt-1 -mr-1"
                                            onClick={(e) => handleDelete(item.id, e)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-col gap-2 mt-3">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Clock className="h-3.5 w-3.5" />
                                            <span>{formatTime(item.created_at)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {item.audio_file_path.startsWith('http') ? (
                                                <Badge variant="outline" className="text-[10px] font-bold tracking-wider py-0 px-1.5 h-4 uppercase border-blue-500/30 text-blue-600 bg-blue-50/50">
                                                    <LinkIcon className="h-2.5 w-2.5 mr-1" /> URL Source
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] font-bold tracking-wider py-0 px-1.5 h-4 uppercase border-purple-500/30 text-purple-600 bg-purple-50/50">
                                                    <Upload className="h-2.5 w-2.5 mr-1" /> Uploaded File
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

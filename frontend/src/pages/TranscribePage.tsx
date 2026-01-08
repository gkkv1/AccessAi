import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mic,
  Upload,
  Play,
  Pause,
  Download,
  Copy,
  Check,
  Loader2,
  Clock,
  FileAudio,
  Captions,
  ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { endpoints } from '@/lib/api';

interface TranscriptSegment {
  id: string;
  start: number;
  end: number;
  speaker?: string;
  text: string;
}

interface ActionItem {
  id: string;
  text: string;
  assignee?: string;
  completed: boolean;
}

const mockTranscript: TranscriptSegment[] = [
  { id: '1', start: 0, end: 15, speaker: 'System', text: 'This is a demo. Please upload a file for real transcription.' },
];

export default function TranscribePage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const transcribeMutation = useMutation({
    mutationFn: endpoints.transcribe,
    onSuccess: (data) => {
      setTranscript(data.transcript);
      setActionItems(data.action_items || []);
      toast.success('Transcription complete!');
      setUploadProgress(null);
    },
    onError: (error) => {
      console.error(error);
      toast.error('Transcription failed');
      setUploadProgress(null);
    }
  });

  const isProcessing = transcribeMutation.isPending;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(10); // Start progress
    try {
      await transcribeMutation.mutateAsync(file);
    } catch (e) {
      // handled in onError
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    toast.info('Recording started (Demo Mode) - speak clearly');
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    toast.success('Recording saved (Demo Mode)');
    // In real app, we would process the audio blob here
    setTranscript(mockTranscript);
  };

  const handleCopyTranscript = () => {
    const text = transcript.map(s =>
      `[${formatTime(s.start)}] ${s.speaker ? `${s.speaker}: ` : ''}${s.text}`
    ).join('\n\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Transcript copied to clipboard');
  };

  const handleExport = (format: 'txt' | 'srt') => {
    let content = '';

    if (format === 'txt') {
      content = transcript.map(s =>
        `[${formatTime(s.start)}] ${s.speaker ? `${s.speaker}: ` : ''}${s.text}`
      ).join('\n\n');
    } else {
      content = transcript.map((s, i) =>
        `${i + 1}\n${formatTime(s.start)},000 --> ${formatTime(s.end)},000\n${s.text}\n`
      ).join('\n');
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript.${format}`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported as ${format.toUpperCase()}`);
  };

  const toggleActionItem = (id: string) => {
    setActionItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  return (
    <main id="main-content" className="container py-8 md:py-12 transition-accessibility">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-accessible-2xl font-bold text-foreground">
            Meeting Transcription
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload audio files or record live for AI-powered transcription with real-time captions
          </p>
        </div>

        {/* Upload/Record Area */}
        {transcript.length === 0 && !isProcessing && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Upload Card */}
            <Card
              className="p-8 text-center cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/50"
              onClick={() => fileInputRef.current?.click()}
              tabIndex={0}
              role="button"
              aria-label="Upload audio file"
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="audio/*,.mp3,.wav,.m4a,.webm"
                onChange={handleFileUpload}
              />
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-2xl bg-primary/10">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Upload Audio</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    MP3, WAV, M4A, WebM supported
                  </p>
                </div>
              </div>
            </Card>

            {/* Record Card */}
            <Card
              className={cn(
                'p-8 text-center cursor-pointer transition-all border-2',
                isRecording
                  ? 'border-destructive bg-destructive/5'
                  : 'hover:shadow-lg hover:border-primary/50'
              )}
              onClick={() => isRecording ? handleStopRecording() : handleStartRecording()}
              tabIndex={0}
              role="button"
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
              <div className="flex flex-col items-center gap-4">
                <div className={cn(
                  'p-4 rounded-2xl',
                  isRecording ? 'bg-destructive/10 animate-pulse' : 'bg-accent/10'
                )}>
                  <Mic className={cn('h-8 w-8', isRecording ? 'text-destructive' : 'text-accent')} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {isRecording ? 'Recording... Click to Stop' : 'Live Recording'}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isRecording ? 'Speak clearly for best results' : 'Record meetings in real-time'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <Card className="p-8 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <h3 className="font-semibold text-lg mt-4">Processing Audio</h3>
            <p className="text-muted-foreground mt-1">
              Transcribing and extracting action items...
            </p>
            {uploadProgress !== null && (
              <div className="mt-4 max-w-xs mx-auto">
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </Card>
        )}

        {/* Transcript Results */}
        {transcript.length > 0 && !isProcessing && (
          <div className="space-y-6">
            {/* Controls */}
            <Card className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsPlaying(!isPlaying)}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 inline mr-1" />
                    {formatTime(currentTime)} / {formatTime(transcript[transcript.length - 1]?.end || 0)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyTranscript}>
                    {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExport('txt')}>
                    <Download className="h-4 w-4 mr-1" />
                    TXT
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExport('srt')}>
                    <Download className="h-4 w-4 mr-1" />
                    SRT
                  </Button>
                </div>
              </div>
            </Card>

            <Tabs defaultValue="transcript" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="transcript" className="gap-2">
                  <Captions className="h-4 w-4" />
                  Transcript
                </TabsTrigger>
                <TabsTrigger value="actions" className="gap-2">
                  <ListChecks className="h-4 w-4" />
                  Action Items ({actionItems.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="transcript" className="mt-4">
                <Card className="p-6">
                  <div className="space-y-4">
                    {transcript.map((segment) => (
                      <div
                        key={segment.id}
                        className={cn(
                          'p-4 rounded-lg transition-colors',
                          currentTime >= segment.start && currentTime <= segment.end
                            ? 'bg-primary/10 border-l-4 border-primary'
                            : 'bg-muted/50 hover:bg-muted'
                        )}
                        tabIndex={0}
                        role="article"
                        aria-label={`${segment.speaker || 'Speaker'} at ${formatTime(segment.start)}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xs text-muted-foreground font-mono shrink-0 pt-1">
                            {formatTime(segment.start)}
                          </span>
                          <div>
                            {segment.speaker && (
                              <span className="font-semibold text-primary">
                                {segment.speaker}:
                              </span>
                            )}
                            <p className="text-foreground/90 leading-relaxed">
                              {' '}{segment.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="actions" className="mt-4">
                <Card className="p-6">
                  <div className="space-y-3">
                    {actionItems.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          'flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer',
                          item.completed
                            ? 'bg-success/5 border-success/20'
                            : 'bg-card hover:bg-muted/50'
                        )}
                        onClick={() => toggleActionItem(item.id)}
                        role="checkbox"
                        aria-checked={item.completed}
                        tabIndex={0}
                      >
                        <div className={cn(
                          'shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center mt-0.5',
                          item.completed
                            ? 'bg-success border-success'
                            : 'border-muted-foreground'
                        )}>
                          {item.completed && <Check className="h-3 w-3 text-success-foreground" />}
                        </div>
                        <span className={cn(
                          'flex-1',
                          item.completed && 'line-through text-muted-foreground'
                        )}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>

            {/* New Recording Button */}
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => {
                  setTranscript([]);
                  setActionItems([]);
                }}
              >
                <FileAudio className="h-4 w-4 mr-2" />
                New Transcription
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

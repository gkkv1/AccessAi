import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mic,
  Upload,
  Play,
  Pause,
  Download,
  Search,
  Check,
  Clock,
  FileText,
  MessageSquare,
  Users,
  Lightbulb,
  ListTodo,
  MoreVertical,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// --- Types ---
interface TranscriptSegment {
  id: string;
  start: number; // Seconds
  end: number;
  speaker: string;
  text: string;
}

interface ActionItem {
  id: string;
  text: string;
  assignee: string;
  isCompleted: boolean;
}

// --- Mock Data: Q1 Compliance Training ---
const MEETING_METADATA = {
  title: "Q1 Compliance Training & Policy Updates",
  date: "January 9, 2026",
  attendees: ["Sarah (Facilitator)", "John (HR)", "Mike (Dev)", "Emily (Product)"],
  duration: "45:00"
};

const MOCK_SCRIPT: TranscriptSegment[] = [
  { id: '1', start: 0, end: 4, speaker: 'Sarah', text: "Good morning everyone. Thanks for joining today's session on Q1 compliance updates." },
  { id: '2', start: 5, end: 9, speaker: 'Sarah', text: "We have a lot to cover, specifically regarding the new accessibility standards we need to meet by March." },
  { id: '3', start: 10, end: 14, speaker: 'John', text: "Hi Sarah, quick question. Does this include the new WCAG 2.2 guidelines for mobile apps?" },
  { id: '4', start: 15, end: 19, speaker: 'Sarah', text: "Yes, exactly, John. That's actually our first agenda item. Mobile compliance is now mandatory." },
  { id: '5', start: 20, end: 25, speaker: 'Mike', text: "That's going to require some refactoring of the navigation components. I'll need to look into our contrast ratios." },
  { id: '6', start: 26, end: 32, speaker: 'Emily', text: "From a product side, do we have a timeline for when these designs need to be finalized? We have the sprint planning on Tuesday." },
  { id: '7', start: 33, end: 38, speaker: 'Sarah', text: "Great point. Let's aim to have the audit complete by Feb 15th. That gives us two weeks for remediation." },
  { id: '8', start: 39, end: 44, speaker: 'Sarah', text: "Also, please note the new Leave Policy changes effective Feb 1st. Make sure your teams are aware." },
  { id: '9', start: 45, end: 50, speaker: 'John', text: "I'll send out the memo regarding the leave policy tomorrow morning to the whole organization." },
  { id: '10', start: 51, end: 55, speaker: 'Sarah', text: "Perfect. And Mike, can you lead the accessibility audit for the mobile app?" },
  { id: '11', start: 56, end: 60, speaker: 'Mike', text: "Sure, I'll take that update. I'll schedule a review with the design team next week." },
];

const KEY_CONCEPTS = [
  "WCAG 2.2 Compliance",
  "Mobile Accessibility",
  "Leave Policy Update (Feb 1)",
  "Audit Deadline: Feb 15"
];

const INITIAL_ACTION_ITEMS: ActionItem[] = [
  { id: 'a1', text: "Submit Q1 Compliance Report", assignee: "Sarah", isCompleted: false },
  { id: 'a2', text: "Complete Mobile Accessibility Audit", assignee: "Mike", isCompleted: false },
  { id: 'a3', text: "Distribute Leave Policy Memo", assignee: "John", isCompleted: false },
  { id: 'a4', text: "Refactor Navigation Components", assignee: "Dev Team", isCompleted: false },
];

export default function TranscribePage() {
  // Common State
  const [viewMode, setViewMode] = useState<'landing' | 'live' | 'review'>('landing');

  // Transcription Data State
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [currentCaption, setCurrentCaption] = useState<TranscriptSegment | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[]>(INITIAL_ACTION_ITEMS);
  const [searchQuery, setSearchQuery] = useState('');

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---

  // 1. Live Mode
  const startLiveMode = () => {
    setViewMode('live');
    setTranscript([]);
    setElapsedTime(0);
    setIsMeetingActive(true);
    toast.info("Microphone Active", { description: "Listening for speech..." });
  };

  // 2. Upload Mode (Simulation)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadSimulation(file.name);
    }
    // Reset input so same file triggers change again if needed
    e.target.value = '';
  };

  const processUploadSimulation = (fileName: string) => {
    const loadingToast = toast.loading(`Processing ${fileName}...`, {
      description: "Analyzing audio and extracting speakers."
    });

    // Simulate Processing Delay (2s)
    setTimeout(() => {
      toast.dismiss(loadingToast);

      // 1. Switch View
      setViewMode('review');

      // 2. Populate Data (The "Review" View renders based on this)
      setTranscript(MOCK_SCRIPT);
      setElapsedTime(MOCK_SCRIPT[MOCK_SCRIPT.length - 1].end);

      toast.success("Transcription Complete", {
        description: "Generated from demo simulation logic."
      });
    }, 2000);
  };

  const exitToLanding = () => {
    setIsMeetingActive(false);
    setViewMode('landing');
    setTranscript([]);
    setElapsedTime(0);
    setCurrentCaption(null);
  };

  // Timer & Playback Logic (Only for Live Mode)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (viewMode === 'live' && isMeetingActive) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);

        const activeSegment = MOCK_SCRIPT.find(
          s => elapsedTime >= s.start && elapsedTime <= s.end
        );

        setCurrentCaption(activeSegment || null);

        if (activeSegment) {
          setTranscript(prev => {
            if (!prev.find(p => p.id === activeSegment.id)) {
              return [...prev, activeSegment];
            }
            return prev;
          });
        }

        if (elapsedTime > 65) {
          setIsMeetingActive(false);
          toast.success("Meeting Simulation Complete");
        }

      }, 1000);
    }

    return () => clearInterval(interval);
  }, [viewMode, isMeetingActive, elapsedTime]);

  // Search Filter
  const filteredTranscript = useMemo(() => {
    if (!searchQuery) return transcript;
    return transcript.filter(t =>
      t.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.speaker.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [transcript, searchQuery]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExport = (type: 'PDF' | 'TXT' | 'SRT') => {
    toast.success(`Exporting transcript as ${type}...`);
  };

  // --- Render ---

  if (viewMode === 'landing') {
    return (
      <main className="container py-12 flex flex-col items-center justify-center min-h-[80vh] gap-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-4 max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight">AI Meeting Assistant</h1>
          <p className="text-xl text-muted-foreground">
            Transform audio into accessible text. Identify speakers, extract action items, and ensure compliance.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">

          {/* Option 1: Live Meeting */}
          <Card
            className="p-8 hover:border-primary cursor-pointer transition-all hover:shadow-lg group text-center space-y-6"
            onClick={startLiveMode}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && startLiveMode()}
            role="button"
            aria-label="Start Live Captioning"
          >
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
              <Mic className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-2">Live Captioning</h2>
              <p className="text-muted-foreground">
                For ongoing meetings. Listen to the microphone and provide real-time speech-to-text.
              </p>
            </div>
            <Button className="w-full" variant="destructive">Start Listening</Button>
          </Card>

          {/* Option 2: Upload */}
          <Card
            className="p-8 hover:border-primary cursor-pointer transition-all hover:shadow-lg group text-center space-y-6"
            onClick={() => fileInputRef.current?.click()}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            role="button"
            aria-label="Upload Audio Recording"
          >
            <input
              type="file"
              className="hidden"
              accept="audio/*,video/*"
              ref={fileInputRef}
              onChange={handleFileSelect}
            />

            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
              <Upload className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-2">Upload Recording</h2>
              <p className="text-muted-foreground">
                For past meetings. Upload MP3/MP4 files to generate a searchable transcript.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button className="w-full" variant="outline">Select File</Button>
              <Button
                variant="ghost"
                className="text-xs text-muted-foreground hover:text-primary z-20"
                onClick={(e) => {
                  e.stopPropagation(); // prevent card click
                  processUploadSimulation("sample_meeting.mp3");
                }}
              >
                Try with Sample Audio
              </Button>
            </div>
          </Card>
        </div>

        <div className="flex gap-4 text-sm text-muted-foreground">
          <span className="flex items-center"><Check className="h-4 w-4 mr-1 text-green-500" /> WCAG 2.2 Compliant</span>
          <span className="flex items-center"><Check className="h-4 w-4 mr-1 text-green-500" /> Speaker Recognition</span>
          <span className="flex items-center"><Check className="h-4 w-4 mr-1 text-green-500" /> Secure Processing</span>
        </div>
      </main>
    )
  }

  // Live & Review Shared View
  return (
    <main id="main-content" className="container py-6 md:py-8 transition-accessibility h-[calc(100vh-4rem)] flex flex-col">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {viewMode === 'review' && (
              <Button variant="ghost" size="sm" onClick={exitToLanding} className="-ml-2 mr-1">
                <Check className="h-4 w-4 mr-1" /> Finish Review
              </Button>
            )}
            {viewMode === 'live' && (
              <Button variant="ghost" size="sm" onClick={exitToLanding} className="-ml-2 mr-1">
                End Session
              </Button>
            )}

            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              {viewMode === 'live' ? "Live Meeting" : "Analysis: Q1 Compliance Training"}
            </h1>
            {viewMode === 'live' && (
              <Badge variant={isMeetingActive ? "destructive" : "secondary"} className="animate-pulse">
                {isMeetingActive ? "REC" : "PAUSED"}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {viewMode === 'live' && (
            <Button variant={isMeetingActive ? "secondary" : "default"} onClick={() => setIsMeetingActive(!isMeetingActive)}>
              {isMeetingActive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isMeetingActive ? "Pause" : "Resume"}
            </Button>
          )}
          <Button variant="outline" onClick={exitToLanding}>Close</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

        {/* Main Content: Video/Captions & Transcript */}
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">

          {/* 1. Video Mockup / Live Caption Area */}
          <div className="relative bg-black rounded-xl overflow-hidden aspect-video shrink-0 shadow-lg group">
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              {/* Visualizer */}
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={cn(
                    "w-3 bg-primary rounded-full animate-[bounce_1s_infinite]",
                    !isMeetingActive && viewMode === 'live' && "animate-none h-2 opacity-30",
                    viewMode === 'review' && "h-2 opacity-30"
                  )} style={{ height: isMeetingActive ? `${Math.random() * 40 + 20}px` : '10px', animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            </div>

            {/* Live Caption Overlay (Only show if we have a current caption or waiting in live mode) */}
            <div className="absolute bottom-8 left-8 right-8 transition-all duration-300">
              {currentCaption ? (
                <div className="bg-black/80 backdrop-blur-sm p-4 rounded-lg border-l-4 border-primary shadow-2xl">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-primary font-bold text-sm uppercase tracking-wider">{currentCaption.speaker}</span>
                    <span className="text-slate-400 text-xs">{formatTime(currentCaption.start)}</span>
                  </div>
                  <p className="text-white text-lg md:text-xl font-medium leading-relaxed">
                    {currentCaption.text}
                  </p>
                </div>
              ) : (viewMode === 'live' && isMeetingActive) ? (
                <div className="bg-black/60 backdrop-blur-sm p-3 rounded-lg inline-block">
                  <p className="text-slate-300 text-sm flex items-center">
                    <Mic className="h-4 w-4 mr-2 animate-pulse" />
                    Listening...
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {/* 2. Transcript Search & List */}
          <Card className="flex-1 flex flex-col min-h-0 border-t-4 border-t-primary/20">
            <div className="p-4 border-b flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transcript..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" title="Download Text" onClick={() => handleExport('TXT')}>
                  <FileText className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" title="Download SRT" onClick={() => handleExport('SRT')}>
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6">
                {filteredTranscript.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    {transcript.length === 0 ?
                      (viewMode === 'live' ? "Captions will appear here..." : "Empty Transcript")
                      : "No search matches."
                    }
                  </div>
                ) : (
                  filteredTranscript.map((segment) => (
                    <div key={segment.id} className="flex gap-4 group">
                      <div className="w-12 shrink-0 text-xs text-muted-foreground pt-1.5 font-mono text-right">
                        {formatTime(segment.start)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-primary">{segment.speaker}</span>
                        </div>
                        <p className="text-foreground/90 leading-relaxed text-base">
                          {searchQuery ? (
                            segment.text.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) =>
                              part.toLowerCase() === searchQuery.toLowerCase()
                                ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-900 text-inherit px-0.5 rounded">{part}</mark>
                                : part
                            )
                          ) : segment.text}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div id="transcript-end" />
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Sidebar: Insights */}
        <div className="lg:col-span-1 flex flex-col gap-6 min-h-0 overflow-y-auto">

          {/* Key Concepts */}
          <Card className="p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="font-semibold">Key Concepts</h3>
            </div>
            <div className="space-y-3">
              {KEY_CONCEPTS.map((concept, i) => (
                <div key={i} className="flex items-start gap-2 text-sm bg-muted/50 p-2 rounded">
                  <span className="bg-primary/10 text-primary w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{concept}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Action Items */}
          <Card className="p-5 shadow-sm flex-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <ListTodo className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold">Action Items</h3>
            </div>
            <div className="space-y-2">
              {actionItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded border bg-card hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => setActionItems(prev => prev.map(a => a.id === item.id ? { ...a, isCompleted: !a.isCompleted } : a))}
                >
                  <div className={cn(
                    "w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                    item.isCompleted ? "bg-green-500 border-green-500" : "border-muted-foreground"
                  )}>
                    {item.isCompleted && <Check className="h-3.5 w-3.5 text-white" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={cn("text-sm font-medium", item.isCompleted && "line-through text-muted-foreground")}>
                      {item.text}
                    </p>
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
                      Assigned to {item.assignee}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="p-4 bg-muted/30 rounded-lg border text-center">
            <div className="flex gap-2 justify-center">
              <Button size="sm" variant="outline" onClick={() => handleExport('PDF')}>Export PDF</Button>
              <Button size="sm" variant="outline" onClick={() => handleExport('TXT')}>Save Text</Button>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}

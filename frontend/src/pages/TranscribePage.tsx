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
  Maximize2,
  Smile,
  AlertTriangle,
  Zap,
  Hand
} from 'lucide-react';
import { useFocus } from '@/contexts/FocusContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// --- Types ---
interface TranscriptSegment {
  id: string;
  start: number; // Seconds
  end: number;
  speaker: string;
  text: string;
  sentiment?: 'neutral' | 'positive' | 'urgent' | 'question';
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
  { id: '1', start: 0, end: 4, speaker: 'Sarah', text: "Good morning everyone. Thanks for joining today's session on Q1 compliance updates.", sentiment: 'positive' },
  { id: '2', start: 5, end: 9, speaker: 'Sarah', text: "We have a lot to cover, specifically regarding the new accessibility standards we need to meet by March.", sentiment: 'urgent' },
  { id: '3', start: 10, end: 14, speaker: 'John', text: "Hi Sarah, quick question. Does this include the new WCAG 2.2 guidelines for mobile apps?", sentiment: 'question' },
  { id: '4', start: 15, end: 19, speaker: 'Sarah', text: "Yes, exactly, John. That's actually our first agenda item. Mobile compliance is now mandatory.", sentiment: 'neutral' },
  { id: '5', start: 20, end: 25, speaker: 'Mike', text: "That's going to require some refactoring of the navigation components. I'll need to look into our contrast ratios.", sentiment: 'neutral' },
  { id: '6', start: 26, end: 32, speaker: 'Emily', text: "From a product side, do we have a timeline for when these designs need to be finalized? We have the sprint planning on Tuesday.", sentiment: 'question' },
  { id: '7', start: 33, end: 38, speaker: 'Sarah', text: "Great point. Let's aim to have the audit complete by Feb 15th. That gives us two weeks for remediation.", sentiment: 'positive' },
  { id: '8', start: 39, end: 44, speaker: 'Sarah', text: "Also, please note the new Leave Policy changes effective Feb 1st. Make sure your teams are aware.", sentiment: 'urgent' },
  { id: '9', start: 45, end: 50, speaker: 'John', text: "I'll send out the memo regarding the leave policy tomorrow morning to the whole organization.", sentiment: 'positive' },
  { id: '10', start: 51, end: 55, speaker: 'Sarah', text: "Perfect. And Mike, can you lead the accessibility audit for the mobile app?", sentiment: 'neutral' },
  { id: '11', start: 56, end: 60, speaker: 'Mike', text: "Sure, I'll take that update. I'll schedule a review with the design team next week.", sentiment: 'positive' },
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
  const [showSignLanguage, setShowSignLanguage] = useState(false);

  const { isFocusMode } = useFocus();

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
      setElapsedTime(0); // Start from beginning for playback
      setIsMeetingActive(true); // Auto-play

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

  // Timer & Playback Logic (Shared for Live & Review)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if ((viewMode === 'live' || viewMode === 'review') && isMeetingActive) {
      interval = setInterval(() => {
        setElapsedTime(prev => {
          // Loop or stop at end? Let's just stop for now or loop mock script
          const nextTime = prev + 1;
          // If review mode and end reached, stop
          const maxDuration = MOCK_SCRIPT[MOCK_SCRIPT.length - 1].end + 5;
          if (viewMode === 'review' && nextTime > maxDuration) {
            setIsMeetingActive(false);
            return prev;
          }
          return nextTime;
        });

        // Use a functional update to get the LATEST elapsedTime if needed, 
        // but here we rely on the re-render cycle or just check next toggle.
        // Actually best to lookup based on new time.
        // For simplicity in this effect, we read the state next render.
        // But to sync currentCaption perfectly we can do it here if we had the value.
        // Let's keep the find logic but be aware of closure staleness if not careful.
        // relying on dependency array [elapsedTime] which restarts interval every tick is fine but inefficient.
        // Better:
      }, 1000);
    }

    // Separate effect for syncing Caption to Time (efficient)
    const activeSegment = MOCK_SCRIPT.find(
      s => elapsedTime >= s.start && elapsedTime <= s.end
    );
    setCurrentCaption(activeSegment || null);

    // Live Mode specific: Accumulate transcript
    if (viewMode === 'live' && activeSegment) {
      setTranscript(prev => {
        if (!prev.find(p => p.id === activeSegment.id)) {
          return [...prev, activeSegment];
        }
        return prev;
      });
    }

    // Auto-stop for live mode simulation
    if (viewMode === 'live' && elapsedTime > 65) {
      setIsMeetingActive(false);
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
        <div className="flex gap-2 items-center">
          {/* Sign Language Toggle */}
          {viewMode === 'live' && (
            <div className="hidden md:flex items-center space-x-2 mr-2 bg-muted/20 p-1.5 rounded-lg border">
              <Switch id="sign-lang" checked={showSignLanguage} onCheckedChange={setShowSignLanguage} />
              <Label htmlFor="sign-lang" className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                <Hand className="h-3.5 w-3.5" />
                Sign Language
              </Label>
            </div>
          )}

          {(viewMode === 'live' || viewMode === 'review') && (
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
        <div className={cn("flex flex-col gap-4 min-h-0 transition-all duration-500", isFocusMode ? "lg:col-span-3" : "lg:col-span-2")}>

          {/* 1. Video Mockup / Live Caption Area */}
          <div className="relative bg-black rounded-xl overflow-hidden h-64 shrink-0 shadow-lg group">
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

            {/* Live Caption Overlay */}
            <div className="absolute bottom-4 left-4 right-4 transition-all duration-300 flex justify-center">
              {currentCaption ? (
                <div className="bg-black/80 backdrop-blur-sm p-3 rounded-lg border-l-4 border-primary shadow-2xl max-w-3xl w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-primary font-bold text-xs uppercase tracking-wider">{currentCaption.speaker}</span>
                    <span className="text-slate-400 text-[10px]">{formatTime(currentCaption.start)}</span>
                  </div>
                  <p className="text-white text-base md:text-lg font-medium leading-relaxed">
                    {currentCaption.text}
                  </p>
                </div>
              ) : ((viewMode === 'live' || viewMode === 'review') && isMeetingActive) ? (
                <div className="bg-black/60 backdrop-blur-sm p-3 rounded-lg inline-block">
                  <p className="text-slate-300 text-sm flex items-center">
                    <Mic className="h-4 w-4 mr-2 animate-pulse" />
                    {viewMode === 'live' ? "Listening..." : "Playing Simulation..."}
                  </p>
                </div>
              ) : null}
            </div>
            {/* Sign Language Avatar Overlay (PIP) */}
            {showSignLanguage && viewMode === 'live' && (
              <div className="absolute top-2 right-2 w-20 h-28 md:w-28 md:h-36 bg-slate-800 rounded-lg border border-primary shadow-xl overflow-hidden animate-in zoom-in-50 fade-in duration-300 z-20">
                <div className="absolute top-0 left-0 right-0 bg-black/60 p-0.5 text-[8px] text-center text-white font-mono uppercase tracking-wider">
                  Sign Interpreter
                </div>
                {/* Placeholder for 3D Avatar */}
                <img
                  src="/avatar_placeholder.png"
                  alt="AI Sign Language Interpreter"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
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
                    <div
                      key={segment.id}
                      className={cn(
                        "flex gap-4 group p-3 rounded-lg transition-colors border-l-2 border-transparent",
                        currentCaption?.id === segment.id
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <div className="w-12 shrink-0 text-xs text-muted-foreground pt-1.5 font-mono text-right">
                        {formatTime(segment.start)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-primary">{segment.speaker}</span>
                          {/* Sentiment Badge */}
                          {segment.sentiment && (
                            <Badge variant="outline" className={cn(
                              "text-[10px] px-1.5 h-5",
                              segment.sentiment === 'urgent' && "text-red-600 border-red-200 bg-red-50",
                              segment.sentiment === 'positive' && "text-green-600 border-green-200 bg-green-50",
                              segment.sentiment === 'question' && "text-blue-600 border-blue-200 bg-blue-50"
                            )}>
                              {segment.sentiment === 'urgent' && <AlertTriangle className="h-3 w-3 mr-1" />}
                              {segment.sentiment === 'positive' && <Smile className="h-3 w-3 mr-1" />}
                              {segment.sentiment === 'question' && <Lightbulb className="h-3 w-3 mr-1" />}
                              {segment.sentiment}
                            </Badge>
                          )}
                        </div>
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

                  ))
                )}
                <div id="transcript-end" />
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Sidebar: Insights - HIDDEN IN FOCUS MODE */}
        <div className={cn("flex flex-col gap-6 min-h-0 overflow-y-auto transition-all duration-500", isFocusMode ? "hidden w-0 opacity-0" : "lg:col-span-1 border-l pl-6")}>

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
    </main >
  );
}

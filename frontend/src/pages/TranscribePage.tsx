import { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
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
  Hand,
  Loader2
} from 'lucide-react';
import { useFocus } from '@/contexts/FocusContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { endpoints } from '@/lib/api';
import { UploadProgressOverlay } from '@/components/UploadProgressOverlay';

// --- Types ---
interface TranscriptSegment {
  id: string;
  start: number; // Seconds
  end: number;
  speaker: string;
  text: string;
  emotion?: string;
  sentiment?: 'neutral' | 'positive' | 'urgent' | 'question';
}

interface ActionItem {
  id: string;
  text: string;
  assignee: string;
  isCompleted: boolean;
}

interface TranscriptionData {
  id: string;
  title: string;
  audio_file_path: string;
  transcript_text: string;
  segments: TranscriptSegment[];
  summary: string | null;
  action_items: any[];
  key_concepts: any[];
  sentiment_score: number | null;
  processed: boolean;
  created_at: string;
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

const API_BASE_URL = import.meta.env.VITE_API_URL_2 || 'http://localhost:8000';

export default function TranscribePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const transcriptionId = searchParams.get('id');

  // Common State
  const [viewMode, setViewMode] = useState<'landing' | 'live' | 'review'>('landing');

  // Transcription Data State
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [currentCaption, setCurrentCaption] = useState<TranscriptSegment | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[]>(INITIAL_ACTION_ITEMS);
  const [keyConcepts, setKeyConcepts] = useState<string[]>(KEY_CONCEPTS);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSignLanguage, setShowSignLanguage] = useState(false);

  // Upload Progress State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    step: 1,
    message: 'Uploading audio file...',
    details: ''
  });

  // Fetched Transcription Data
  const [transcriptionData, setTranscriptionData] = useState<TranscriptionData | null>(null);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);

  const { isFocusMode } = useFocus();

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Compute unique emotions from transcript
  const uniqueEmotions = useMemo(() => {
    const emotions = transcript
      .map(segment => segment.emotion)
      .filter((emotion): emotion is string => emotion !== undefined && emotion !== null && emotion !== '');

    // Remove duplicates using Set
    return Array.from(new Set(emotions));
  }, [transcript]);

  // --- Handlers ---

  // 1. Live Mode
  const startLiveMode = () => {
    setViewMode('live');
    setTranscript([]);
    setElapsedTime(0);
    setIsMeetingActive(true);
    toast.info("Microphone Active", { description: "Listening for speech..." });
  };

  // 2. Upload Mode (Whisper API - requires OpenAI key)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processUpload(file); // Uses Whisper API for real transcription
    }
    // Reset input so same file triggers change again if needed
    e.target.value = '';
  };

  const processBrowserTranscription = async (file: File) => {
    const loadingToast = toast.loading(`Processing ${file.name}...`, {
      description: "🎯 FREE Browser Transcription - No API cost for audio!"
    });

    try {
      // Step 1: Simulate browser-based transcription
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.dismiss(loadingToast);
      toast.info("Analyzing with AI...", {
        description: "Extracting insights with GPT"
      });

      // Demo transcript (in production, this would come from Web Speech API)
      const demoTranscript = `Hello everyone, thank you for joining today's meeting about accessibility and compliance. We need to discuss our Q1 requirements and WCAG 2.2 standards implementation. First, let's review the guidelines that must be completed by February 15th. John, can you please prepare the accessibility audit report by next week? We also need to schedule a follow-up meeting to review our progress on the new features. Emily, please coordinate with the development team on the keyboard navigation improvements. Does anyone have questions or concerns about these action items? Let's make sure we're all aligned on the timeline.`;

      // Step 2: Send to backend for AI analysis
      const result = await endpoints.analyzeTranscribedText(demoTranscript, file.name);

      // Step 3: Transform and display results
      const transformedSegments = result.segments.map((seg: any) => ({
        id: seg.id,
        start: seg.start,
        end: seg.end,
        speaker: seg.speaker,
        text: seg.text,
        sentiment: 'neutral' as const
      }));

      const transformedActionItems = result.action_items.map((item: any, idx: number) => ({
        id: `ai-${idx}`,
        text: typeof item === 'string' ? item : (item.task || item.text || 'Action item'),
        assignee: typeof item === 'object' ? (item.assignee || 'Unassigned') : 'Unassigned',
        isCompleted: typeof item === 'object' ? (item.status === 'completed') : false
      }));

      setViewMode('review');
      setTranscript(transformedSegments);
      setActionItems(transformedActionItems);
      setElapsedTime(0);
      setIsMeetingActive(true);

      toast.success("✅ Analysis Complete!", {
        description: `FREE browser transcription!\nKey concepts: ${result.key_concepts?.length || 0} | Actions: ${result.action_items?.length || 0}`
      });

    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error("Processing failed", {
        description: error.response?.data?.detail || error.message || "Please try again."
      });
      console.error('Transcription error:', error);
    }
  };

  const processUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress({ step: 1, message: 'Uploading audio file...', details: file.name });

    try {
      // Upload file to backend
      const uploadResult = await endpoints.uploadAudioFile(file, file.name);

      setUploadProgress({ step: 2, message: 'Transcribing with Whisper AI...', details: 'This may take 20-60 seconds' });

      // Poll for completion
      const transcriptionId = uploadResult.id;
      let attempts = 0;
      const maxAttempts = 60; // 60 seconds timeout for Whisper processing

      const pollInterval = setInterval(async () => {
        try {
          attempts++;
          const result = await endpoints.getTranscription(transcriptionId);

          if (result.processed) {
            clearInterval(pollInterval);

            setUploadProgress({ step: 3, message: 'Processing complete!', details: 'Preparing your results...' });

            // Transform API data to UI format
            const transformedSegments = result.segments.map((seg: any) => ({
              id: seg.id,
              start: seg.start,
              end: seg.end,
              speaker: seg.speaker,
              text: seg.text,
              sentiment: 'neutral' as const
            }));

            // Transform action items
            const transformedActionItems = result.action_items.map((item: any, idx: number) => ({
              id: `ai-${idx}`,
              text: typeof item === 'string' ? item : (item.task || item.text || 'Action item'),
              assignee: typeof item === 'object' ? (item.assignee || 'Unassigned') : 'Unassigned',
              isCompleted: typeof item === 'object' ? (item.status === 'completed') : false
            }));

            // Wait a moment to show success message
            await new Promise(resolve => setTimeout(resolve, 800));

            setTranscript(transformedSegments);
            setActionItems(transformedActionItems);
            setElapsedTime(0);
            setIsMeetingActive(true);
            setIsUploading(false);
            setTranscriptionData(result);

            // Update URL with ID so data persists on refresh
            navigate(`?id=${transcriptionId}`, { replace: true });

            // Switch to review mode
            setViewMode('review');

            // Show success toast after loader closes
            setTimeout(() => {
              toast.success('Transcription Complete!', {
                description: `${transformedSegments.length} segments | ${result.key_concepts?.length || 0} concepts | ${result.action_items?.length || 0} actions`
              });
            }, 100);
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            throw new Error('Processing timeout. Make sure OpenAI API key is configured.');
          } else {
            // Update progress
            setUploadProgress({
              step: 2,
              message: 'Transcribing with Whisper AI',
              details: `Processing... ${attempts}/${maxAttempts} seconds`
            });
          }
        } catch (error) {
          clearInterval(pollInterval);
          setIsUploading(false);
          console.error('Polling error:', error);
          throw error;
        }
      }, 1000);

    } catch (error: any) {
      setIsUploading(false);
      const errorMsg = error.response?.data?.detail || error.message || "Upload failed";

      // Show error toast after loader closes
      setTimeout(() => {
        toast.error('Upload Failed', {
          description: errorMsg.includes('401') || errorMsg.includes('API key')
            ? "Invalid OpenAI API key. Please add a valid key to backend/.env"
            : errorMsg
        });
      }, 100);

      console.error('Upload error:', error);
    }
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
    setTranscriptionData(null);
    navigate('?', { replace: true });
  };

  // Fetch transcription from URL parameter
  useEffect(() => {
    if (transcriptionId) {
      // Skip if already loaded this specific ID
      if (transcriptionData?.id === transcriptionId) return;

      setIsLoadingTranscript(true);
      console.log('Fetching transcription ID:', transcriptionId);

      endpoints.getTranscription(transcriptionId)
        .then((data: TranscriptionData) => {
          console.log('Transcription data received:', data);
          console.log('Segments count:', data.segments?.length || 0);

          setTranscriptionData(data);
          setViewMode('review');

          // Transform segments
          if (!data.segments || data.segments.length === 0) {
            console.warn('No segments found in transcription data');
            setTranscript([]);
          } else {
            const transformedSegments = data.segments.map((seg: any) => ({
              id: seg.id || String(Math.random()),
              start: seg.start || 0,
              end: seg.end || 0,
              speaker: seg.speaker || 'Unknown',
              text: seg.text || '',
              emotion: seg.emotion,
              sentiment: 'neutral' as const
            }));

            console.log('Transformed segments:', transformedSegments);
            setTranscript(transformedSegments);
          }

          // Transform action items
          const transformedActionItems = (data.action_items || []).map((item: any, idx: number) => ({
            id: `ai-${idx}`,
            text: typeof item === 'string' ? item : (item.task || item.text || 'Action item'),
            assignee: typeof item === 'object' ? (item.assignee || 'Unassigned') : 'Unassigned',
            isCompleted: typeof item === 'object' ? (item.status === 'completed') : false
          }));

          setActionItems(transformedActionItems);
          setKeyConcepts(data.key_concepts || []);
          setIsLoadingTranscript(false);

          const segmentCount = data.segments?.length || 0;
          toast.success('Transcript loaded!', {
            description: `${segmentCount} segments${segmentCount === 0 ? ' (waiting for processing)' : ''}`
          });
        })
        .catch((error) => {
          console.error('Failed to fetch transcription:', error);
          setIsLoadingTranscript(false);
          toast.error('Failed to load transcript', {
            description: error.response?.data?.detail || 'Transcription not found'
          });
        });
    }
  }, [transcriptionId]);

  // Sync video time with caption
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !transcriptionData) return;

    const handleTimeUpdate = () => {
      setVideoCurrentTime(video.currentTime);

      // Find active segment
      const activeSegment = transcript.find(
        seg => video.currentTime >= seg.start && video.currentTime <= seg.end
      );
      setCurrentCaption(activeSegment || null);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [transcriptionData, transcript]);

  const jumpToVideoTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
    }
  };

  // Generate VTT (WebVTT) file for native video captions
  const generateVTTFile = (segments: TranscriptSegment[]): string => {
    let vtt = 'WEBVTT\n\n';

    segments.forEach((seg, index) => {
      // Format timestamps as HH:MM:SS.mmm
      const formatVTTTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
      };

      vtt += `${index + 1}\n`;
      vtt += `${formatVTTTime(seg.start)} --> ${formatVTTTime(seg.end)}\n`;
      vtt += `<v ${seg.speaker}>${seg.text}\n\n`;
    });

    return vtt;
  };

  // Create VTT blob URL when transcript changes
  const [vttUrl, setVttUrl] = useState<string | null>(null);

  useEffect(() => {
    if (transcript.length > 0 && transcriptionData) {
      const vttContent = generateVTTFile(transcript);
      const blob = new Blob([vttContent], { type: 'text/vtt' });
      const url = URL.createObjectURL(blob);
      setVttUrl(url);

      // Cleanup old URL
      return () => {
        if (vttUrl) URL.revokeObjectURL(vttUrl);
      };
    }
  }, [transcript, transcriptionData, vttUrl]);

  // Sync button state with native video controls
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !transcriptionData) return;

    const handlePlay = () => {
      setIsMeetingActive(true);
    };

    const handlePause = () => {
      setIsMeetingActive(false);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [transcriptionData]);


  // Timer & Playback Logic (ONLY for Live Mode simulations, not for loaded videos)
  useEffect(() => {
    // Skip this entirely if we have real transcription data
    if (transcriptionData) return;

    let interval: NodeJS.Timeout;

    if (viewMode === 'live' && isMeetingActive) {
      interval = setInterval(() => {
        setElapsedTime(prev => {
          const nextTime = prev + 1;
          const maxDuration = MOCK_SCRIPT[MOCK_SCRIPT.length - 1].end + 5;
          if (nextTime > maxDuration) {
            setIsMeetingActive(false);
            return prev;
          }
          return nextTime;
        });
      }, 1000);
    }

    // Separate effect for syncing Caption to Time (for live mode only)
    if (!transcriptionData && viewMode === 'live') {
      const activeSegment = MOCK_SCRIPT.find(
        s => elapsedTime >= s.start && elapsedTime <= s.end
      );
      setCurrentCaption(activeSegment || null);

      // Live Mode specific: Accumulate transcript
      if (activeSegment) {
        setTranscript(prev => {
          if (!prev.find(p => p.id === activeSegment.id)) {
            return [...prev, activeSegment];
          }
          return prev;
        });
      }

      // Auto-stop for live mode simulation
      if (elapsedTime > 65) {
        setIsMeetingActive(false);
      }
    }

    return () => clearInterval(interval);
  }, [viewMode, isMeetingActive, elapsedTime, transcriptionData]);


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
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExport = (type: 'PDF' | 'TXT' | 'SRT') => {
    if (type === 'TXT') {
      // Generate text content with emotions in square brackets
      let textContent = 'TRANSCRIPT\n';
      textContent += '='.repeat(50) + '\n\n';

      transcript.forEach((segment, index) => {
        const timestamp = `[${formatTime(segment.start)} - ${formatTime(segment.end)}]`;
        const emotion = segment.emotion ? ` [${segment.emotion.toUpperCase()}]` : '';
        textContent += `${timestamp}${emotion}\n`;
        textContent += `${segment.speaker}: ${segment.text}\n\n`;
      });

      // Add emotions summary at the end
      if (uniqueEmotions.length > 0) {
        textContent += '\n' + '='.repeat(50) + '\n';
        textContent += 'EMOTIONS DETECTED\n';
        textContent += '='.repeat(50) + '\n';
        uniqueEmotions.forEach((emotion, i) => {
          textContent += `${i + 1}. [${emotion.toUpperCase()}]\n`;
        });
      }

      // Create blob and download
      const blob = new Blob([textContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transcript_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Transcript downloaded!');
    } else if (type === 'PDF') {
      // Generate PDF with formatted transcript
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const lineHeight = 7;
      let yPosition = margin;

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('TRANSCRIPT', margin, yPosition);
      yPosition += lineHeight + 3;

      // Draw separator line
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += lineHeight;

      // Reset font for content
      doc.setFontSize(10);

      // Add transcript segments
      transcript.forEach((segment) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        // Timestamp and emotion
        doc.setFont('helvetica', 'bold');
        const timestamp = `[${formatTime(segment.start)} - ${formatTime(segment.end)}]`;
        const emotion = segment.emotion ? ` [${segment.emotion.toUpperCase()}]` : '';
        doc.text(`${timestamp}${emotion}`, margin, yPosition);
        yPosition += lineHeight;

        // Speaker and text
        doc.setFont('helvetica', 'normal');
        const speakerText = `${segment.speaker}: `;
        doc.setFont('helvetica', 'bold');
        doc.text(speakerText, margin, yPosition);

        // Calculate text width and wrap text
        doc.setFont('helvetica', 'normal');
        const speakerWidth = doc.getTextWidth(speakerText);
        const maxWidth = pageWidth - margin * 2 - speakerWidth;
        const lines = doc.splitTextToSize(segment.text, maxWidth);

        // Draw first line next to speaker
        doc.text(lines[0], margin + speakerWidth, yPosition);
        yPosition += lineHeight;

        // Draw remaining lines
        for (let i = 1; i < lines.length; i++) {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(lines[i], margin, yPosition);
          yPosition += lineHeight;
        }

        yPosition += 3; // Add spacing between segments
      });

      // Add emotions summary on new page if we have emotions
      if (uniqueEmotions.length > 0) {
        doc.addPage();
        yPosition = margin;

        // Title
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('EMOTIONS DETECTED', margin, yPosition);
        yPosition += lineHeight + 3;

        // Draw separator line
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += lineHeight;

        // List emotions
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        uniqueEmotions.forEach((emotion, i) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(`${i + 1}. [${emotion.toUpperCase()}]`, margin + 5, yPosition);
          yPosition += lineHeight;
        });
      }

      // Save PDF
      doc.save(`transcript_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF downloaded!');
    } else {
      toast.success(`Exporting transcript as ${type}...`);
    }
  };

  // --- Render ---
  // Debug logging
  if (transcript.length > 0) {
    console.log('=== SEGMENT TIMING DEBUG ===');
    console.log('Video duration:', document?.querySelector('video')?.duration, 'seconds');
    console.log('Total segments:', transcript.length);
    console.log('First 3 segments:');
    transcript.slice(0, 3).forEach((seg, i) => {
      console.log(`  [${i}] ${seg.start}s-${seg.end}s: "${seg.text.substring(0, 50)}..."`);
    });
    console.log('Last segment:', transcript[transcript.length - 1]?.end, 'seconds');
    console.log('===========================');
  }

  // Loading state when fetching from URL
  if (isLoadingTranscript) {
    return (
      <main className="container py-12 flex flex-col items-center justify-center min-h-[80vh] gap-8">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <h2 className="text-2xl font-semibold">Loading Transcript...</h2>
          <p className="text-muted-foreground">Fetching transcript data from server</p>
        </div>
      </main>
    );
  }

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

        {/* Upload Progress Overlay */}
        {isUploading && (
          <UploadProgressOverlay
            step={uploadProgress.step}
            message={uploadProgress.message}
            details={uploadProgress.details}
          />
        )}
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
            <Button
              variant={isMeetingActive ? "secondary" : "default"}
              onClick={() => {
                // If we have a real video, control it
                if (transcriptionData && videoRef.current) {
                  if (videoRef.current.paused) {
                    videoRef.current.play();
                    setIsMeetingActive(true);
                  } else {
                    videoRef.current.pause();
                    setIsMeetingActive(false);
                  }
                } else {
                  // Fallback for mock/live mode
                  setIsMeetingActive(!isMeetingActive);
                }
              }}
            >
              {isMeetingActive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isMeetingActive ? "Pause" : "Resume"}
            </Button>
          )}
          <Button variant="outline" onClick={exitToLanding}>Close</Button>
        </div>
      </div>

      {/* Main Layout: 2 Rows - Top: Video + Transcript, Bottom: Insights */}
      <div className="flex-1 flex flex-col gap-6">

        {/* Top Row: Video (LEFT) + Transcript (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">

          {/* LEFT: Video Player */}
          <div className="flex flex-col gap-4 h-full">
            {/* 1. Video Player or Live Caption Area */}
            <div className="relative bg-black rounded-xl overflow-hidden h-full shadow-lg group">
              {transcriptionData ? (
                /* Real Video Player */
                <video
                  ref={videoRef}
                  src={`${API_BASE_URL}/${transcriptionData.audio_file_path}`}
                  controls
                  crossOrigin="anonymous"
                  className="w-full h-full object-contain"
                  onLoadedMetadata={() => {
                    // Automatically enable captions when video loads
                    if (videoRef.current) {
                      const tracks = videoRef.current.textTracks;
                      if (tracks && tracks.length > 0) {
                        tracks[0].mode = 'showing'; // Force captions to show
                        console.log('Captions enabled automatically');
                      }
                    }
                  }}
                  onError={(e) => {
                    console.error('Video load error:', e);
                    toast.error('Video failed to load', {
                      description: 'Check that the video file exists on the server'
                    });
                  }}
                >
                  {/* Native Video Subtitles/Captions */}
                  {vttUrl && (
                    <track
                      kind="captions"
                      label="English"
                      srcLang="en"
                      src={vttUrl}
                      default
                    />
                  )}
                  Your browser does not support the video tag.
                </video>
              ) : (
                /* Mock Visualizer for Live/Demo Mode */
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
              )}

              {/* Live Caption Overlay - Only show for live mode, hidden when using native video captions */}
              {!transcriptionData && (
                <div className="absolute bottom-16 left-4 right-4 transition-all duration-300 flex justify-center pointer-events-none">
                  {currentCaption ? (
                    <div className="bg-black/80 backdrop-blur-sm p-3 rounded-lg border-l-4 border-primary shadow-2xl max-w-3xl w-full">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-primary font-bold text-xs uppercase tracking-wider">{currentCaption.speaker}</span>
                        {currentCaption.emotion && (
                          <Badge variant="outline" className="text-[10px] px-1.5 h-5">
                            {currentCaption.emotion}
                          </Badge>
                        )}
                        <span className="text-slate-400 text-[10px]">{formatTime(currentCaption.start)}</span>
                      </div>
                      <p className="text-white text-base md:text-lg font-medium leading-relaxed">
                        {currentCaption.text}
                      </p>
                    </div>
                  ) : ((viewMode === 'live' || viewMode === 'review') && isMeetingActive && !transcriptionData) ? (
                    <div className="bg-black/60 backdrop-blur-sm p-3 rounded-lg inline-block">
                      <p className="text-slate-300 text-sm flex items-center">
                        <Mic className="h-4 w-4 mr-2 animate-pulse" />
                        {viewMode === 'live' ? "Listening..." : "Playing Simulation..."}
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
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
          </div>

          {/* RIGHT: Transcript */}
          <Card className="flex flex-col min-h-0 border-t-4 border-t-primary/20">
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

            <div className="flex-1 overflow-auto p-4 bg-background">
              <div className="space-y-2">
                {filteredTranscript.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground space-y-2">
                    {transcript.length === 0 ? (
                      <>
                        {viewMode === 'live' ? (
                          <p>Captions will appear here...</p>
                        ) : transcriptionData && !transcriptionData.processed ? (
                          <>
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                            <p className="font-semibold">Transcription Processing...</p>
                            <p className="text-sm">This may take 20-60 seconds. Refresh to check status.</p>
                          </>
                        ) : (
                          <p>Empty Transcript</p>
                        )}
                      </>
                    ) : (
                      <p>No search matches.</p>
                    )}
                  </div>
                ) : (
                  filteredTranscript.map((segment) => {
                    const isActive = transcriptionData
                      ? videoCurrentTime >= segment.start && videoCurrentTime <= segment.end
                      : currentCaption?.id === segment.id;

                    return (
                      <div
                        key={segment.id}
                        onClick={() => transcriptionData && jumpToVideoTime(segment.start)}
                        className={cn(
                          "flex gap-4 group p-3 rounded-lg transition-colors border-l-2 border-transparent",
                          isActive
                            ? "bg-primary/10 border-primary"
                            : "hover:bg-muted/50",
                          transcriptionData && "cursor-pointer"
                        )}
                      >
                        <div className="w-12 shrink-0 text-xs text-muted-foreground pt-1.5 font-mono text-right">
                          {formatTime(segment.start)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-primary">{segment.speaker}</span>
                            {/* Emotion Badge */}
                            {segment.emotion && (
                              <Badge variant="outline" className="text-[10px] px-1.5 h-5">
                                {segment.emotion}
                              </Badge>
                            )}
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
                    );
                  })
                )}
                <div id="transcript-end" />
              </div>
            </div>
          </Card>
        </div>

        {/* Bottom Row: Insights (Full Width) */}
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", isFocusMode && "hidden")}>
          {/* Key Concepts */}


        </div>
        <Card className="p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="font-semibold">Key Concepts</h3>
          </div>
          <div className="space-y-3">
            {keyConcepts.length > 0 ? (
              keyConcepts.map((concept: any, i) => (
                <div key={i} className="flex items-start gap-2 text-sm bg-muted/50 p-2 rounded">
                  <span className="bg-primary/10 text-primary w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{typeof concept === 'string' ? concept : (concept?.text || concept?.concept || 'Concept')}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No key concepts identified yet
              </p>
            )}
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
      {/* End Bottom Insights Grid */}

      {/* End Main Layout Wrapper */}

    </main>
  );
}

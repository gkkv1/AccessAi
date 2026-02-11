import { useNavigate } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';
import { UseCaseCard } from '@/components/UseCaseCard';
import { FeatureCard } from '@/components/FeatureCard';
import { StatsCard } from '@/components/StatsCard';
import {
  Eye,
  Hand,
  Ear,
  Brain,
  FileText,
  FormInput,
  Mic,
  FileAudio,
  Sparkles,
  Search,
  MessageSquare,
  Volume2,
  Captions,
  Clock,
  TrendingUp,
  Users,
  Shield,
} from 'lucide-react';

const useCases = [
  {
    name: 'Sarah',
    role: 'Senior Analyst',
    disability: 'Blind',
    task: 'Query parental leave policy',
    timeBefore: '35 min',
    timeAfter: '2 min',
    improvement: '90% faster',
    icon: <Eye className="h-6 w-6" />,
    accentColor: 'blue' as const,
  },
  {
    name: 'Raj',
    role: 'Project Manager',
    disability: 'Motor Disability',
    task: 'Complete 15-field project allocation form',
    timeBefore: '45 min',
    timeAfter: '8 min',
    improvement: '82% faster',
    icon: <Hand className="h-6 w-6" />,
    accentColor: 'green' as const,
  },
  {
    name: 'Priya',
    role: 'Compliance Officer',
    disability: 'Deaf',
    task: 'Attend compliance training webinar',
    timeBefore: 'No access',
    timeAfter: 'Full access',
    improvement: '100% parity',
    icon: <Ear className="h-6 w-6" />,
    accentColor: 'amber' as const,
  },
  {
    name: 'Arjun',
    role: 'HR Specialist',
    disability: 'Dyslexia',
    task: 'Understand 30-page policy document',
    timeBefore: 'Overwhelming',
    timeAfter: 'Clear summary',
    improvement: '80% easier',
    icon: <Brain className="h-6 w-6" />,
    accentColor: 'purple' as const,
  },
];

const inputFeatures = [
  { title: 'PDF Documents', description: 'Upload policies, procedures, and manuals for AI analysis', icon: <FileText className="h-5 w-5" /> },
  { title: 'Web Forms', description: 'Auto-fill complex forms with voice commands', icon: <FormInput className="h-5 w-5" /> },
  { title: 'Voice Input', description: 'Speak naturally to search and navigate', icon: <Mic className="h-5 w-5" /> },
  { title: 'Meeting Audio', description: 'Upload recordings for transcription', icon: <FileAudio className="h-5 w-5" /> },
];

const processingFeatures = [
  { title: 'Vision-Language AI', description: 'Understands documents, tables, and forms', icon: <Sparkles className="h-5 w-5" /> },
  { title: 'Semantic Search', description: 'Find answers based on meaning, not keywords', icon: <Search className="h-5 w-5" /> },
  { title: 'Text Simplification', description: 'Convert complex language to plain English', icon: <MessageSquare className="h-5 w-5" /> },
];

const outputFeatures = [
  { title: 'Voice Interface', description: 'Listen to answers and summaries', icon: <Volume2 className="h-5 w-5" /> },
  { title: 'Real-time Captions', description: 'Live captions with <2s latency', icon: <Captions className="h-5 w-5" /> },
  { title: 'Accessible Forms', description: 'Full keyboard navigation and ARIA', icon: <FormInput className="h-5 w-5" /> },
];

export default function Index() {
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <main id="main-content" className="transition-accessibility">
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero py-16 md:py-24">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Shield className="h-4 w-4" />
              WCAG 2.2 AA Compliant
            </div>
            
            <h1 className="text-accessible-3xl md:text-5xl font-bold text-foreground leading-tight">
              Workplace Documents,{' '}
              <span className="text-primary">Accessible to All</span>
            </h1>
            
            <p className="text-accessible-lg text-muted-foreground max-w-2xl mx-auto">
              AI-powered document portal that enables employees with disabilities 
              to independently access workplace policies, complete forms, and 
              participate fully in meetings.
            </p>

            <div className="pt-4 max-w-2xl mx-auto">
              <SearchBar onSearch={handleSearch} />
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div 
          className="absolute top-1/4 -left-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl"
          aria-hidden="true"
        />
        <div 
          className="absolute bottom-0 -right-20 h-80 w-80 rounded-full bg-accent/5 blur-3xl"
          aria-hidden="true"
        />
      </section>

      {/* Stats Section */}
      <section className="py-12 border-b bg-card/50">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <StatsCard
              value="90%"
              label="Faster Document Lookup"
              icon={<Clock className="h-5 w-5" />}
              trend="up"
            />
            <StatsCard
              value="82%"
              label="Faster Form Completion"
              icon={<TrendingUp className="h-5 w-5" />}
              trend="up"
            />
            <StatsCard
              value="100%"
              label="Meeting Participation"
              icon={<Users className="h-5 w-5" />}
              trend="up"
            />
            <StatsCard
              value="AA"
              label="WCAG Compliance"
              icon={<Shield className="h-5 w-5" />}
            />
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-accessible-2xl font-bold text-foreground mb-3">
              Real-World Impact
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              See how ACCESS.AI transforms the workplace experience for employees with different needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map((useCase) => (
              <UseCaseCard key={useCase.name} {...useCase} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-accessible-2xl font-bold text-foreground mb-3">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A complete AI-powered pipeline for document accessibility
            </p>
          </div>

          <div className="space-y-12">
            {/* Input Layer */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-1 bg-blue-500 rounded-full" />
                <h3 className="font-semibold text-lg">Input Layer</h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {inputFeatures.map((feature) => (
                  <FeatureCard key={feature.title} {...feature} category="input" />
                ))}
              </div>
            </div>

            {/* Processing Layer */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h3 className="font-semibold text-lg">AI Processing</h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {processingFeatures.map((feature) => (
                  <FeatureCard key={feature.title} {...feature} category="processing" />
                ))}
              </div>
            </div>

            {/* Output Layer */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-1 bg-accent rounded-full" />
                <h3 className="font-semibold text-lg">Accessible Output</h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {outputFeatures.map((feature) => (
                  <FeatureCard key={feature.title} {...feature} category="output" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-accessible-2xl font-bold text-foreground">
              Ready to Make Your Workplace Accessible?
            </h2>
            <p className="text-muted-foreground">
              Start by searching any workplace policy or uploading a document to get AI-powered accessibility features.
            </p>
            <div className="max-w-xl mx-auto">
              <SearchBar onSearch={handleSearch} placeholder="Try: When am I eligible for parental leave?" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

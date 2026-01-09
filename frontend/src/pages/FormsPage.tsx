import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext'; // Import AuthContext
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormInput,
  Mic,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  X, // Import X icon
  ChevronRight,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// --- Types ---
interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'date' | 'select' | 'textarea' | 'number';
  value: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  error?: string;
  voiceEnabled?: boolean;
  readOnly?: boolean; // For auto-filled fields like Name/Email
}

interface FormDefinition {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
}

// --- Form Definitions ---
const FORM_DEFINITIONS: Record<string, FormDefinition> = {
  project_allocation: {
    id: 'project_allocation',
    title: 'Project Allocation Request',
    description: 'Request resource allocation for a new or existing project.',
    fields: [
      { id: 'full_name', label: 'Full Name', type: 'text', value: '', required: true, readOnly: true },
      { id: 'email', label: 'Email Address', type: 'email', value: '', required: true, readOnly: true },
      { id: 'department', label: 'Department', type: 'select', value: '', options: ['Technology', 'Product', 'Design', 'Marketing', 'Sales'], required: true },
      { id: 'project_name', label: 'Project Name', type: 'text', value: '', placeholder: 'e.g., Q3 Mobile App Redesign', required: true, voiceEnabled: true },
      { id: 'role', label: 'Role / Designation', type: 'text', value: '', placeholder: 'e.g., Senior Frontend Engineer', required: true },
      { id: 'start_date', label: 'Start Date', type: 'date', value: '', required: true },
      { id: 'allocation_percentage', label: 'Allocation (%)', type: 'select', value: '', options: ['25%', '50%', '75%', '100%'], required: true },
      { id: 'justification', label: 'Business Justification', type: 'textarea', value: '', placeholder: 'Explain why this resource is needed...', required: true, voiceEnabled: true },
    ]
  },
  leave_application: {
    id: 'leave_application',
    title: 'Leave Application',
    description: 'Apply for paid or unpaid time off.',
    fields: [
      { id: 'full_name', label: 'Full Name', type: 'text', value: '', required: true, readOnly: true },
      { id: 'employee_id', label: 'Employee ID', type: 'text', value: '', required: true, readOnly: true },
      { id: 'leave_type', label: 'Leave Type', type: 'select', value: '', options: ['Annual Leave', 'Sick Leave', 'Parental Leave', 'Unpaid Leave'], required: true },
      { id: 'start_date', label: 'From Date', type: 'date', value: '', required: true },
      { id: 'end_date', label: 'To Date', type: 'date', value: '', required: true },
      { id: 'reason', label: 'Reason for Leave', type: 'textarea', value: '', placeholder: 'Optional reason...', voiceEnabled: true },
      { id: 'emergency_contact', label: 'Emergency Contact', type: 'text', value: '', placeholder: 'Name and Phone Number', required: true },
    ]
  },
  expense_reimbursement: {
    id: 'expense_reimbursement',
    title: 'Expense Reimbursement',
    description: 'Submit business-related expenses for approval.',
    fields: [
      { id: 'full_name', label: 'Claimant Name', type: 'text', value: '', required: true, readOnly: true },
      { id: 'report_title', label: 'Report Title', type: 'text', value: '', placeholder: 'e.g., Client Visit - NYC', required: true, voiceEnabled: true },
      { id: 'expense_date', label: 'Expense Date', type: 'date', value: '', required: true },
      { id: 'category', label: 'Category', type: 'select', value: '', options: ['Travel', 'Meals', 'Office Supplies', 'Training', 'Other'], required: true },
      { id: 'amount', label: 'Amount ($)', type: 'number', value: '', placeholder: '0.00', required: true },
      { id: 'description', label: 'Description', type: 'textarea', value: '', placeholder: 'Details of the expense...', required: true, voiceEnabled: true },
    ]
  }
};

export default function FormsPage() {
  const { user } = useAuth(); // Get logged-in user
  const [selectedFormId, setSelectedFormId] = useState<string>('project_allocation');
  const [fields, setFields] = useState<FormField[]>(FORM_DEFINITIONS['project_allocation'].fields);

  // Voice Simulation State
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceStep, setVoiceStep] = useState<'listening' | 'recognized' | 'confirm'>('listening');
  const [recognizedText, setRecognizedText] = useState('');
  const [activeVoiceFieldId, setActiveVoiceFieldId] = useState<string | null>(null);

  // Submission Simulation State
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'validating' | 'submitting' | 'success'>('idle');
  const [referenceId, setReferenceId] = useState('');

  // Update fields when form selection changes
  useEffect(() => {
    setFields(FORM_DEFINITIONS[selectedFormId].fields);
    setSubmissionStatus('idle'); // Reset submission state
  }, [selectedFormId]);

  const updateField = (id: string, value: string) => {
    setFields(prev =>
      prev.map(f =>
        f.id === id ? { ...f, value, error: undefined } : f
      )
    );
  };

  // --- Auto-Fill Logic ---
  const handleAutoFill = () => {
    // Simulate API delay
    const toastId = toast.loading("AI is analyzing your profile...");

    setTimeout(() => {
      setFields(prev => prev.map(f => {
        // AI Logic: Map known fields to user data or mock context
        let newValue = f.value;

        if (f.id === 'full_name') newValue = user?.full_name || 'Demo User';
        if (f.id === 'email') newValue = user?.email || 'demo@access.ai';
        if (f.id === 'employee_id') newValue = 'EMP-2024-8842';
        if (f.id === 'department') newValue = 'Technology'; // Mock
        if (f.id === 'manager') newValue = 'Sarah Connor';   // Mock

        // Context-aware mocks
        if (f.id === 'project_name' && !f.value) newValue = 'Accessibility Audit 2024';
        if (f.id === 'role' && !f.value) newValue = 'Lead Developer';

        return { ...f, value: newValue };
      }));

      toast.dismiss(toastId);
      toast.success("Form pre-filled with your information", {
        description: "Data sourced from Employee Profile & Current Assignment"
      });
    }, 1200);
  };

  // --- Voice Input Simulation ---
  const startVoiceInput = (fieldId: string) => {
    setActiveVoiceFieldId(fieldId);
    setIsVoiceListening(true);
    setVoiceStep('listening');
    setRecognizedText('');

    // Simulate recognition delay
    setTimeout(() => {
      setVoiceStep('recognized');
      // Mock result based on field type
      const mockResult = getMockVoiceResult(fieldId);
      setRecognizedText(mockResult);
    }, 2000);
  };

  const getMockVoiceResult = (fieldId: string) => {
    switch (fieldId) {
      case 'project_name': return "Q4 Infrastructure Upgrade";
      case 'justification': return "We need additional resources to meet the compliance deadline.";
      case 'reason': return "Attending a medical appointment.";
      case 'description': return "Lunch with potential client to discuss contract renewal.";
      case 'report_title': return "Client Dinner - San Francisco";
      default: return "This is a simulated voice input.";
    }
  };

  const confirmVoiceInput = () => {
    if (activeVoiceFieldId) {
      updateField(activeVoiceFieldId, recognizedText);
      setIsVoiceListening(false);
      setActiveVoiceFieldId(null);
      toast.success("Field updated via voice");
    }
  };

  // --- Submission Simulation ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Step 1: Validation
    setSubmissionStatus('validating');
    setTimeout(() => {
      // Step 2: Submitting
      setSubmissionStatus('submitting');
      setTimeout(() => {
        // Step 3: Success
        setSubmissionStatus('success');
        const ref = 'REF-' + Math.floor(10000000 + Math.random() * 90000000);
        setReferenceId(ref);
        toast.success("Form submitted successfully!");
      }, 2000);
    }, 1500);
  };

  const currentForm = FORM_DEFINITIONS[selectedFormId];
  const completedFields = fields.filter(f => f.value.trim()).length;
  const progress = Math.round((completedFields / fields.length) * 100);

  // Success View
  if (submissionStatus === 'success') {
    return (
      <main className="container py-12 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full p-8 text-center space-y-6 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Form Submitted!</h2>
            <p className="text-muted-foreground mt-2">
              Your {currentForm.title} has been sent for approval.
            </p>
          </div>
          <div className="p-4 bg-muted rounded-lg border border-dashed">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Reference Number</p>
            <p className="text-2xl font-mono font-bold text-primary mt-1">{referenceId}</p>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setSubmissionStatus('idle');
              setReferenceId('');
              // Reset fields but keep selection
              setFields(FORM_DEFINITIONS[selectedFormId].fields);
            }}
          >
            Submit Another Response
          </Button>
        </Card>
      </main>
    )
  }

  return (
    <main id="main-content" className="container py-8 md:py-12 transition-accessibility">
      <div className="max-w-3xl mx-auto">

        {/* Header & Selection */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h1 className="text-accessible-2xl font-bold text-foreground">
                Workplace Forms
              </h1>
              <p className="text-muted-foreground mt-1">
                Select a form to complete
              </p>
            </div>

            <div className="w-full md:w-64">
              <Select value={selectedFormId} onValueChange={setSelectedFormId}>
                <SelectTrigger className="h-12 border-2 border-primary/20">
                  <SelectValue placeholder="Select Form" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(FORM_DEFINITIONS).map(def => (
                    <SelectItem key={def.id} value={def.id}>
                      {def.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold">{currentForm.title}</h2>
            <p className="text-sm text-muted-foreground">{currentForm.description}</p>
          </div>
          <Button
            variant="outline"
            onClick={handleAutoFill}
            className="shrink-0"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Auto-Fill
          </Button>
        </div>

        {/* Progress indicator */}
        <Card className="p-4 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Completion Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedFields} of {fields.length} fields
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </Card>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="p-6 md:p-8">
            <div className="space-y-6">
              {fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor={field.id}
                      className={cn(
                        'text-base',
                        field.error && 'text-destructive'
                      )}
                    >
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>

                    {field.voiceEnabled && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary',
                          activeVoiceFieldId === field.id && 'bg-primary/20 text-primary'
                        )}
                        onClick={() => startVoiceInput(field.id)}
                        aria-label={`Voice input for ${field.label}`}
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {field.type === 'textarea' ? (
                    <Textarea
                      id={field.id}
                      value={field.value}
                      onChange={(e) => updateField(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      rows={4}
                      readOnly={field.readOnly}
                      className={cn("resize-none", field.readOnly && "bg-muted")}
                    />
                  ) : field.type === 'select' ? (
                    <Select
                      value={field.value}
                      onValueChange={(value) => updateField(field.id, value)}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={field.id}
                      type={field.type}
                      value={field.value}
                      onChange={(e) => updateField(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      readOnly={field.readOnly}
                      className={cn(
                        'h-12',
                        field.readOnly && "bg-muted font-medium text-foreground/80",
                        field.error && 'border-destructive'
                      )}
                      aria-invalid={!!field.error}
                    />
                  )}

                  {field.error && (
                    <p className="flex items-center gap-1 text-sm text-destructive" role="alert">
                      <AlertCircle className="h-3 w-3" />
                      {field.error}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t">
              {submissionStatus === 'validating' ? (
                <div className="flex items-center justify-center p-4 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400 rounded-lg">
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  <span className="font-medium">Validating form data...</span>
                </div>
              ) : submissionStatus === 'submitting' ? (
                <div className="flex items-center justify-center p-4 bg-primary/10 text-primary rounded-lg">
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  <span className="font-medium">Submitting to backend systems...</span>
                </div>
              ) : (
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-14 text-lg"
                  disabled={progress < 100} // Disable if not full, or make it validate
                >
                  <FormInput className="h-5 w-5 mr-2" />
                  Submit Request
                </Button>
              )}
            </div>
          </Card>
        </form>
      </div>

      {/* Simulation: Voice Input Dialog */}
      <Dialog open={isVoiceListening} onOpenChange={setIsVoiceListening}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle>Voice Input</DialogTitle>
          </DialogHeader>
          <div className="py-8 flex flex-col items-center justify-center space-y-6">

            {voiceStep === 'listening' && (
              <>
                <div className="relative">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                    <Mic className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute inset-0 rounded-full ring-4 ring-primary/10 animate-[ping_1.5s_ease-in-out_infinite]" />
                </div>
                <p className="text-lg font-medium">Listening...</p>
                <p className="text-sm text-muted-foreground">
                  Populating field: <span className="font-semibold text-foreground">{fields.find(f => f.id === activeVoiceFieldId)?.label}</span>
                </p>
              </>
            )}

            {(voiceStep === 'recognized' || voiceStep === 'confirm') && (
              <>
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Recognized Text:</p>
                  <div className="p-3 bg-muted rounded-md text-lg font-medium text-foreground italic">
                    "{recognizedText}"
                  </div>
                </div>

                <div className="flex gap-3 w-full justify-center pt-2">
                  <Button variant="outline" onClick={() => setIsVoiceListening(false)} className="w-32">
                    <X className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                  <Button onClick={confirmVoiceInput} className="w-32">
                    <Check className="mr-2 h-4 w-4" />
                    Confirm
                  </Button>
                </div>
              </>
            )}

          </div>
        </DialogContent>
      </Dialog>


    </main>
  );
}

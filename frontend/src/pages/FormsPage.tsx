import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { endpoints } from '@/lib/api';
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
import { VoiceInput } from '@/components/VoiceInput';
import {
  FormInput,
  Mic,
  Sparkles,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'date' | 'select' | 'textarea';
  value: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  error?: string;
  voiceEnabled?: boolean;
}

const initialFields: FormField[] = [
  { id: 'name', label: 'Full Name', type: 'text', value: '', placeholder: 'Enter your full name', required: true, voiceEnabled: true },
  { id: 'email', label: 'Email Address', type: 'email', value: '', placeholder: 'your.email@company.com', required: true },
  { id: 'department', label: 'Department', type: 'select', value: '', options: ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'], required: true },
  { id: 'project', label: 'Project Name', type: 'text', value: '', placeholder: 'Enter project name', required: true, voiceEnabled: true },
  { id: 'startDate', label: 'Start Date', type: 'date', value: '', required: true },
  { id: 'endDate', label: 'End Date', type: 'date', value: '', required: true },
  { id: 'hours', label: 'Estimated Hours/Week', type: 'select', value: '', options: ['10', '20', '30', '40'], required: true },
  { id: 'priority', label: 'Priority Level', type: 'select', value: '', options: ['Low', 'Medium', 'High', 'Critical'], required: true },
  { id: 'manager', label: 'Project Manager', type: 'text', value: '', placeholder: 'Manager name', voiceEnabled: true },
  { id: 'description', label: 'Project Description', type: 'textarea', value: '', placeholder: 'Describe the project goals and scope...', voiceEnabled: true },
];

export default function FormsPage() {
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [activeVoiceField, setActiveVoiceField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const autofillMutation = useMutation({
    mutationFn: endpoints.autofillForm,
    onSuccess: (data) => {
      setFields(prev =>
        prev.map(f => ({
          ...f,
          value: data[f.id] || f.value,
          error: undefined,
        }))
      );
      toast.success('Form auto-filled using AI context');
    },
    onError: () => toast.error("Failed to auto-fill form")
  });

  const submitMutation = useMutation({
    mutationFn: endpoints.submitForm,
    onSuccess: () => {
      toast.success('Form submitted successfully!');
      setFields(initialFields);
    },
    onError: () => toast.error("Failed to submit form")
  });

  const updateField = (id: string, value: string) => {
    setFields(prev =>
      prev.map(f =>
        f.id === id ? { ...f, value, error: undefined } : f
      )
    );
  };

  const handleVoiceInput = (id: string, text: string) => {
    updateField(id, text);
    setActiveVoiceField(null);
  };

  const handleAutoFill = () => {
    autofillMutation.mutate();
  };

  const validateForm = (): boolean => {
    let isValid = true;

    setFields(prev =>
      prev.map(f => {
        if (f.required && !f.value.trim()) {
          isValid = false;
          return { ...f, error: 'This field is required' };
        }
        if (f.type === 'email' && f.value && !f.value.includes('@')) {
          isValid = false;
          return { ...f, error: 'Please enter a valid email' };
        }
        return { ...f, error: undefined };
      })
    );

    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    // Construct form data object
    const formData = fields.reduce((acc, field) => ({
      ...acc,
      [field.id]: field.value
    }), {});

    submitMutation.mutate(formData);
  };

  const isAutoFilling = autofillMutation.isPending;
  const isSubmissionPending = submitMutation.isPending;

  const completedFields = fields.filter(f => f.value.trim()).length;
  const progress = Math.round((completedFields / fields.length) * 100);

  return (
    <main id="main-content" className="container py-8 md:py-12 transition-accessibility">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-accessible-2xl font-bold text-foreground">
              Project Allocation Form
            </h1>
            <p className="text-muted-foreground mt-1">
              Complete the form using voice input or AI auto-fill
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleAutoFill}
            disabled={isAutoFilling}
          >
            {isAutoFilling ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            AI Auto-Fill
          </Button>
        </div>

        {/* Progress indicator */}
        <Card className="p-4 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Form Progress</span>
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
                          'h-8 w-8 p-0',
                          activeVoiceField === field.id && 'bg-primary text-primary-foreground'
                        )}
                        onClick={() => setActiveVoiceField(
                          activeVoiceField === field.id ? null : field.id
                        )}
                        aria-label={`Voice input for ${field.label}`}
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {activeVoiceField === field.id && (
                    <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg animate-fade-in">
                      <VoiceInput
                        onTranscript={(text) => handleVoiceInput(field.id, text)}
                        size="default"
                      />
                      <span className="text-sm text-muted-foreground">
                        Speak to fill this field...
                      </span>
                    </div>
                  )}

                  {field.type === 'text' || field.type === 'email' || field.type === 'date' ? (
                    <Input
                      id={field.id}
                      type={field.type}
                      value={field.value}
                      onChange={(e) => updateField(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      className={cn(
                        'h-12',
                        field.error && 'border-destructive'
                      )}
                      aria-invalid={!!field.error}
                      aria-describedby={field.error ? `${field.id}-error` : undefined}
                    />
                  ) : field.type === 'select' ? (
                    <Select
                      value={field.value}
                      onValueChange={(value) => updateField(field.id, value)}
                    >
                      <SelectTrigger
                        className={cn(
                          'h-12',
                          field.error && 'border-destructive'
                        )}
                      >
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === 'textarea' ? (
                    <Textarea
                      id={field.id}
                      value={field.value}
                      onChange={(e) => updateField(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      rows={4}
                      className={cn(field.error && 'border-destructive')}
                      aria-invalid={!!field.error}
                      aria-describedby={field.error ? `${field.id}-error` : undefined}
                    />
                  ) : null}

                  {field.error && (
                    <p
                      id={`${field.id}-error`}
                      className="flex items-center gap-1 text-sm text-destructive"
                      role="alert"
                    >
                      <AlertCircle className="h-3 w-3" />
                      {field.error}
                    </p>
                  )}

                  {field.value && !field.error && (
                    <p className="flex items-center gap-1 text-sm text-success">
                      <Check className="h-3 w-3" />
                      Looks good
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                type="submit"
                size="lg"
                className="flex-1 h-12"
                disabled={isSubmissionPending}
              >
                {isSubmissionPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FormInput className="h-4 w-4 mr-2" />
                    Submit Form
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-12"
                onClick={() => setFields(initialFields)}
              >
                Clear Form
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </main>
  );
}

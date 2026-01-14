import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Check, Fingerprint } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAuth, api } from '@/contexts/AuthContext';
import { AuthLayout } from '@/layouts/AuthLayout';
import { VoiceInput } from '@/components/VoiceInput';
import { toast } from 'sonner';
import { useAccessibility } from '@/contexts/AccessibilityContext';

const registerSchema = z.object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
    disability_type: z.string().optional(),
    accessibility_preferences: z.object({
        voice_input: z.boolean().default(false),
        high_contrast: z.boolean().default(false),
        dyslexia_font: z.boolean().default(false),
        text_to_speech: z.boolean().default(false),
    }),
    biometric_registered: z.boolean().default(false),
    face_id_registered: z.boolean().default(false),
    terms: z.boolean().refine((val) => val === true, 'You must accept the terms'),
}).refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const { updateSettings } = useAccessibility();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            accessibility_preferences: {
                voice_input: false,
                high_contrast: false,
                dyslexia_font: false,
                text_to_speech: false,
            },
        },
    });

    const onSubmit = async (data: RegisterForm) => {
        setIsLoading(true);
        try {
            // Exclude 'terms' from the payload sent to backend
            const { terms, ...registerData } = data;

            // Smart Simulation: Generate Device Token if biometrics enabled
            let deviceToken = localStorage.getItem('access_ai_face_token');
            if (data.biometric_registered || data.face_id_registered) {
                if (!deviceToken) {
                    // Simple random token generator
                    deviceToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
                    localStorage.setItem('access_ai_face_token', deviceToken);
                }
            }

            // Include the token in the payload
            const payload = {
                ...registerData,
                face_id_data: deviceToken
            };

            const response = await api.post('/auth/register', payload);

            // Auto login after register
            const loginResponse = await api.post('/auth/login', {
                email: data.email,
                password: data.password,
            });

            const { access_token, user } = loginResponse.data;

            // Apply initial settings
            if (user.accessibility_preferences) {
                updateSettings({
                    highContrast: user.accessibility_preferences.high_contrast,
                    dyslexiaFont: user.accessibility_preferences.dyslexia_font,
                    textSize: 100 // Default
                });
            }

            login(access_token, user);
            toast.success('Account created successfully');
            navigate('/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Create an account"
            subtitle="Join ACCESS.AI to start using accessible document tools"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Full Name */}
                <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <div className="flex gap-2">
                        <Input
                            id="full_name"
                            placeholder="John Doe"
                            autoComplete="name"
                            aria-invalid={!!errors.full_name}
                            {...register('full_name')}
                        />
                        <VoiceInput
                            onTranscript={(text) => setValue('full_name', text)}
                            className="shrink-0"
                        />
                    </div>
                    {errors.full_name && (
                        <p className="text-sm text-destructive font-medium">{errors.full_name.message}</p>
                    )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex gap-2">
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            autoComplete="email"
                            aria-invalid={!!errors.email}
                            {...register('email')}
                        />
                        <VoiceInput
                            onTranscript={(text) => {
                                const cleanText = text.toLowerCase().replace(/\s/g, '');
                                setValue('email', cleanText);
                            }}
                            className="shrink-0"
                        />
                    </div>
                    {errors.email && (
                        <p className="text-sm text-destructive font-medium">{errors.email.message}</p>
                    )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        aria-invalid={!!errors.password}
                        {...register('password')}
                    />
                    {errors.password && (
                        <p className="text-sm text-destructive font-medium">{errors.password.message}</p>
                    )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm Password</Label>
                    <Input
                        id="confirm_password"
                        type="password"
                        autoComplete="new-password"
                        aria-invalid={!!errors.confirm_password}
                        {...register('confirm_password')}
                    />
                    {errors.confirm_password && (
                        <p className="text-sm text-destructive font-medium">{errors.confirm_password.message}</p>
                    )}
                </div>

                {/* Disability Type */}
                <div className="space-y-2">
                    <Label htmlFor="disability_type">Disability Type (Optional)</Label>
                    <Select onValueChange={(val) => setValue('disability_type', val)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select disability type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="blind_low_vision">Blind / Low Vision</SelectItem>
                            <SelectItem value="deaf_hard_hearing">Deaf / Hard of Hearing</SelectItem>
                            <SelectItem value="motor_disability">Motor Disability</SelectItem>
                            <SelectItem value="cognitive_learning">Cognitive / Learning Disability</SelectItem>
                            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Helps us customize your experience</p>
                </div>

                {/* Accessibility Preferences */}
                <div className="space-y-3 rounded-md border p-4 bg-muted/20">
                    <Label className="text-base">Accessibility Preferences</Label>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="pref_voice"
                            onCheckedChange={(checked) => setValue('accessibility_preferences.voice_input', checked as boolean)}
                        />
                        <Label htmlFor="pref_voice" className="font-normal cursor-pointer">Enable voice input by default</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="pref_contrast"
                            onCheckedChange={(checked) => setValue('accessibility_preferences.high_contrast', checked as boolean)}
                        />
                        <Label htmlFor="pref_contrast" className="font-normal cursor-pointer">Enable high contrast mode</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="pref_dyslexia"
                            onCheckedChange={(checked) => setValue('accessibility_preferences.dyslexia_font', checked as boolean)}
                        />
                        <Label htmlFor="pref_dyslexia" className="font-normal font-dyslexic cursor-pointer">Use dyslexia-friendly font</Label>
                    </div>
                </div>

                {/* Biometric Setup (Simulated) */}
                <div className="space-y-3 rounded-md border p-4 bg-blue-50/50 dark:bg-blue-900/10">
                    <Label className="text-base flex items-center gap-2">
                        <Fingerprint className="h-4 w-4" />
                        Security Setup (Simulated)
                    </Label>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="setup_biometric"
                            onCheckedChange={(checked) => setValue('biometric_registered', checked as boolean)}
                        />
                        <Label htmlFor="setup_biometric" className="font-normal cursor-pointer">Register Fingerprint</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="setup_face"
                            onCheckedChange={(checked) => setValue('face_id_registered', checked as boolean)}
                        />
                        <Label htmlFor="setup_face" className="font-normal cursor-pointer">Register Face ID</Label>
                    </div>
                </div>

                {/* Terms */}
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="terms"
                        onCheckedChange={(checked) => setValue('terms', checked as boolean)}
                        aria-invalid={!!errors.terms}
                    />
                    <Label htmlFor="terms" className="text-sm font-normal">
                        I agree to the <Link to="/terms" className="underline">Terms of Service</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>
                    </Label>
                </div>
                {errors.terms && (
                    <p className="text-sm text-destructive font-medium">{errors.terms.message}</p>
                )}

                <Button type="submit" className="w-full" disabled={isLoading} size="lg">
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                        </>
                    ) : (
                        'Create Account'
                    )}
                </Button>
            </form>

            <div className="text-center text-sm">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                    Sign in
                </Link>
            </div>
        </AuthLayout>
    );
}

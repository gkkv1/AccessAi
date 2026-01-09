import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Fingerprint, Camera, KeyRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, api } from '@/contexts/AuthContext';
import { AuthLayout } from '@/layouts/AuthLayout';
import { VoiceInput } from '@/components/VoiceInput';
import { BiometricAuth } from '@/components/BiometricAuth';
import { FaceAuth } from '@/components/FaceAuth';
import { toast } from 'sonner';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<string>('password');

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/login', {
                email: data.email,
                password: data.password,
            });

            const { access_token, user } = response.data;
            login(access_token, user);
            toast.success('Login successful');
            navigate('/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    // Simulate Biometric Login (Uses default demo user for simulation)
    const handleBiometricSuccess = async () => {
        setIsLoading(true);
        try {
            // In a real app, we'd exchange a signed biometric challenge.
            // Here, we just log in as the demo user for simulation purposes.
            const response = await api.post('/auth/login', {
                email: 'demo@access.ai',
                password: 'password123',
            });
            const { access_token, user } = response.data;

            // Artificial delay to let success animation play
            setTimeout(() => {
                login(access_token, user);
                toast.success('Identity Verified');
                navigate('/dashboard');
            }, 500);

        } catch (error) {
            toast.error("Biometric verification failed");
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Welcome back"
            subtitle="Enter your credentials to access your account"
        >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="password" aria-label="Use Password">
                        <KeyRound className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Password</span>
                    </TabsTrigger>
                    <TabsTrigger value="fingerprint" aria-label="Use Fingerprint">
                        <Fingerprint className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Biometric</span>
                    </TabsTrigger>
                    <TabsTrigger value="face" aria-label="Use Face ID">
                        <Camera className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Face ID</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="password" className="space-y-4 animate-in fade-in slide-in-from-left-4">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    autoComplete="email"
                                    aria-invalid={!!errors.email}
                                    aria-describedby={errors.email ? "email-error" : undefined}
                                    {...register('email')}
                                />
                                <VoiceInput
                                    onTranscript={(text) => {
                                        // Sanitize email input: lowercase and remove spaces
                                        const cleanText = text.toLowerCase().replace(/\s/g, '');
                                        setValue('email', cleanText);
                                    }}
                                    className="shrink-0"
                                />
                            </div>
                            {errors.email && (
                                <p id="email-error" className="text-sm text-destructive font-medium">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link
                                    to="/forgot-password"
                                    className="text-sm font-medium text-primary hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                aria-invalid={!!errors.password}
                                aria-describedby={errors.password ? "password-error" : undefined}
                                {...register('password')}
                            />
                            {errors.password && (
                                <p id="password-error" className="text-sm text-destructive font-medium">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading} size="lg">
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign in'
                            )}
                        </Button>
                    </form>
                </TabsContent>

                <TabsContent value="fingerprint">
                    <BiometricAuth
                        onSuccess={handleBiometricSuccess}
                        onCancel={() => setActiveTab('password')}
                    />
                </TabsContent>

                <TabsContent value="face">
                    <FaceAuth
                        onSuccess={handleBiometricSuccess}
                        onCancel={() => setActiveTab('password')}
                    />
                </TabsContent>
            </Tabs>

            <div className="text-center text-sm mt-6">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="font-semibold text-primary hover:underline">
                    Create an account
                </Link>
            </div>
        </AuthLayout>
    );
}

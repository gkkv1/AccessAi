import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/contexts/AuthContext';
import { AuthLayout } from '@/layouts/AuthLayout';
import { toast } from 'sonner';

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordForm>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordForm) => {
        setIsLoading(true);
        try {
            await api.post('/auth/forgot-password', { email: data.email });
            setIsSubmitted(true);
            toast.success('Reset link sent');
        } catch (error: any) {
            toast.error('Failed to send reset link');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <AuthLayout title="Check your email" subtitle="We have sent a password reset link to your email.">
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                        Click the link in the email to reset your password. The link will expire in 24 hours.
                    </p>
                    <Button asChild className="w-full" variant="outline">
                        <Link to="/login">Back to Login</Link>
                    </Button>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Forgot password?"
            subtitle="Enter your email address and we'll send you a link to reset your password"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        autoComplete="email"
                        aria-invalid={!!errors.email}
                        {...register('email')}
                    />
                    {errors.email && (
                        <p className="text-sm text-destructive font-medium">{errors.email.message}</p>
                    )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                        </>
                    ) : (
                        'Send Reset Link'
                    )}
                </Button>
            </form>

            <div className="text-center">
                <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center justify-center gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to Login
                </Link>
            </div>
        </AuthLayout>
    );
}

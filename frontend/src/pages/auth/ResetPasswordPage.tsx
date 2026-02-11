import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/contexts/AuthContext';
import { AuthLayout } from '@/layouts/AuthLayout';
import { toast } from 'sonner';

const resetPasswordSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordForm>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const onSubmit = async (data: ResetPasswordForm) => {
        if (!token) {
            toast.error('Invalid token');
            return;
        }
        setIsLoading(true);
        try {
            await api.post('/auth/reset-password', {
                token,
                password: data.password,
                confirm_password: data.confirm_password
            });
            toast.success('Password reset successfully');
            navigate('/login');
        } catch (error: any) {
            toast.error('Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <AuthLayout title="Invalid Request" subtitle="Missing reset token.">
                <Button asChild className="w-full">
                    <Link to="/login">Back to Login</Link>
                </Button>
            </AuthLayout>
        )
    }

    return (
        <AuthLayout
            title="Reset password"
            subtitle="Enter your new password below"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
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

                <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
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

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Resetting...
                        </>
                    ) : (
                        'Reset Password'
                    )}
                </Button>
            </form>
        </AuthLayout>
    );
}

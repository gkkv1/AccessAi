import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/contexts/AuthContext';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            setStatus('error');
            return;
        }

        const verify = async () => {
            try {
                await api.post(`/auth/verify-email?token=${token}`);
                setStatus('success');
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } catch (error) {
                setStatus('error');
            }
        };

        verify();
    }, [token, navigate]);

    return (
        <AuthLayout title="Email Verification">
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
                {status === 'loading' && (
                    <>
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-muted-foreground">Verifying your email address...</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                        <div className="text-center">
                            <h3 className="font-semibold text-lg">Email Verified!</h3>
                            <p className="text-muted-foreground">Redirecting to login...</p>
                        </div>
                        <Button asChild className="w-full mt-4">
                            <Link to="/login">Go to Login</Link>
                        </Button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle className="h-12 w-12 text-destructive" />
                        <div className="text-center">
                            <h3 className="font-semibold text-lg">Verification Failed</h3>
                            <p className="text-muted-foreground">The link may be invalid or expired.</p>
                        </div>
                        <Button asChild className="w-full mt-4">
                            <Link to="/login">Back to Login</Link>
                        </Button>
                    </>
                )}
            </div>
        </AuthLayout>
    );
}

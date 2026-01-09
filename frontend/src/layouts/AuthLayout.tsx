import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AccessibilityToolbar } from '@/components/AccessibilityToolbar';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
            <div className="absolute top-4 right-4">
                <AccessibilityToolbar />
            </div>

            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <Link to="/" className="inline-block">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                            ACCESS.AI
                        </h1>
                    </Link>
                    <h2 className="text-2xl font-semibold tracking-tight">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="text-muted-foreground">
                            {subtitle}
                        </p>
                    )}
                </div>

                <div className="bg-card text-card-foreground border rounded-xl shadow-sm p-6 sm:p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}

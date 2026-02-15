import { useState, useEffect } from 'react';
import { Fingerprint, Loader2, CheckCircle2, RotateCcw, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface BiometricAuthProps {
    userName?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

// Convert base64 string to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// Convert Uint8Array to base64
function uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function BiometricAuth({ userName = "User", onSuccess, onCancel }: BiometricAuthProps) {
    const [status, setStatus] = useState<'checking' | 'idle' | 'scanning' | 'success' | 'failed' | 'unsupported'>('checking');
    const [isSupported, setIsSupported] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [hasCredential, setHasCredential] = useState(false);

    // Check device compatibility on mount
    useEffect(() => {
        checkBiometricSupport();
    }, []);

    const checkBiometricSupport = async () => {
        try {
            // Check if we're in a secure context (HTTPS or localhost)
            if (!window.isSecureContext) {
                setStatus('unsupported');
                setErrorMessage('Biometric authentication requires a secure connection (HTTPS). You are currently accessing via HTTP. For mobile testing, you need to use HTTPS or set up a local SSL certificate.');
                return;
            }

            // Check if WebAuthn is available
            if (!window.PublicKeyCredential) {
                setStatus('unsupported');
                setErrorMessage('WebAuthn is not supported in this browser. Please use a modern browser like Chrome, Edge, Firefox, or Safari.');
                return;
            }

            // Check if platform authenticator is available (biometric)
            const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

            if (!available) {
                setStatus('unsupported');
                setErrorMessage('No biometric authenticator detected on this device. Your device may not have a fingerprint sensor or it is not enabled.');
                return;
            }

            // Check if conditional UI is supported (optional, for better UX)
            const conditionalAvailable = await PublicKeyCredential.isConditionalMediationAvailable?.() || false;

            setIsSupported(true);

            // Check if user already has a credential registered
            const storedCredentialId = localStorage.getItem('biometric_credential_id');
            if (storedCredentialId) {
                setHasCredential(true);
            }

            setStatus('idle');
            toast.success('Fingerprint authentication is available!');
        } catch (error) {
            console.error('Error checking biometric support:', error);
            setStatus('unsupported');
            setErrorMessage('Unable to verify biometric support. Please check your device settings.');
        }
    };

    const registerBiometric = async () => {
        setStatus('scanning');
        try {
            // Create a challenge (in production, this should come from your server)
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
                challenge: challenge,
                rp: {
                    name: "Access.AI",
                    id: window.location.hostname,
                },
                user: {
                    id: new TextEncoder().encode(userName),
                    name: userName.toLowerCase().replace(/\s+/g, ''),
                    displayName: userName,
                },
                pubKeyCredParams: [
                    { alg: -7, type: "public-key" },  // ES256
                    { alg: -257, type: "public-key" }, // RS256
                ],
                authenticatorSelection: {
                    authenticatorAttachment: "platform",
                    userVerification: "required",
                    requireResidentKey: false,
                },
                timeout: 60000,
                attestation: "none",
            };

            const credential = await navigator.credentials.create({
                publicKey: publicKeyCredentialCreationOptions,
            }) as PublicKeyCredential;

            if (credential) {
                // Store credential ID for future authentication
                localStorage.setItem('biometric_credential_id', credential.id);
                localStorage.setItem('biometric_user', userName);

                setHasCredential(true);
                setStatus('success');
                toast.success('Fingerprint registered successfully!');

                setTimeout(() => {
                    onSuccess();
                }, 1500);
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            setStatus('failed');

            if (error.name === 'NotAllowedError') {
                setErrorMessage('Biometric authentication was cancelled or timed out.');
            } else if (error.name === 'InvalidStateError') {
                setErrorMessage('A credential already exists for this authenticator.');
                // Try to authenticate instead
                setTimeout(() => authenticateBiometric(), 1000);
            } else {
                setErrorMessage(`Registration failed: ${error.message}`);
            }

            toast.error('Fingerprint registration failed');
        }
    };

    const authenticateBiometric = async () => {
        setStatus('scanning');
        try {
            const credentialId = localStorage.getItem('biometric_credential_id');

            if (!credentialId) {
                // No credential registered, try to register
                await registerBiometric();
                return;
            }

            // Create a challenge (in production, this should come from your server)
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
                challenge: challenge,
                allowCredentials: [{
                    id: Uint8Array.from(atob(credentialId), c => c.charCodeAt(0)),
                    type: 'public-key',
                    transports: ['internal'],
                }],
                timeout: 60000,
                userVerification: "required",
            };

            const assertion = await navigator.credentials.get({
                publicKey: publicKeyCredentialRequestOptions,
            }) as PublicKeyCredential;

            if (assertion) {
                setStatus('success');
                const storedUser = localStorage.getItem('biometric_user') || userName;
                toast.success(`Welcome back, ${storedUser}!`);

                setTimeout(() => {
                    onSuccess();
                }, 1500);
            }
        } catch (error: any) {
            console.error('Authentication error:', error);
            setStatus('failed');

            if (error.name === 'NotAllowedError') {
                setErrorMessage('Biometric authentication was cancelled or timed out.');
            } else if (error.name === 'InvalidStateError') {
                setErrorMessage('No matching credential found. Please register first.');
                setHasCredential(false);
                localStorage.removeItem('biometric_credential_id');
            } else {
                setErrorMessage(`Authentication failed: ${error.message}`);
            }

            toast.error('Fingerprint authentication failed');
        }
    };

    const startScan = () => {
        if (hasCredential) {
            authenticateBiometric();
        } else {
            registerBiometric();
        }
    };

    const retryAuth = () => {
        setStatus('idle');
        setErrorMessage('');
    };

    // Show unsupported state
    if (status === 'unsupported') {
        return (
            <div
                className="flex flex-col items-center justify-center space-y-6 p-6 animate-in fade-in"
                role="dialog"
                aria-labelledby="biometric-title"
            >
                <h2 id="biometric-title" className="text-xl font-semibold text-center text-destructive">
                    Fingerprint Not Available
                </h2>

                <div className="relative flex items-center justify-center w-32 h-32">
                    <div className="relative z-10 p-4 rounded-full bg-destructive/10 text-destructive">
                        <XCircle size={64} />
                    </div>
                </div>

                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Not Accessible</AlertTitle>
                    <AlertDescription className="text-sm">
                        {errorMessage}
                    </AlertDescription>
                </Alert>

                <div className="space-y-3 w-full max-w-xs">
                    <p className="text-sm text-muted-foreground text-center">
                        {errorMessage.includes('HTTPS') ? 'How to fix:' : 'Possible reasons:'}
                    </p>
                    {errorMessage.includes('HTTPS') ? (
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside text-left">
                            <li>Use HTTPS instead of HTTP</li>
                            <li>Set up a self-signed SSL certificate (Vite: vite --host --https)</li>
                            <li>Use a service like ngrok to create an HTTPS tunnel</li>
                            <li>Deploy to a server with HTTPS enabled</li>
                        </ul>
                    ) : (
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside text-left">
                            <li>No fingerprint sensor on this device</li>
                            <li>Biometric authentication not enabled in settings</li>
                            <li>Browser doesn't support WebAuthn API</li>
                            <li>Device doesn't have biometric hardware</li>
                        </ul>
                    )}

                    <Button variant="outline" onClick={checkBiometricSupport} className="w-full mt-4">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Check Again
                    </Button>

                    <Button variant="ghost" onClick={onCancel} className="w-full text-muted-foreground">
                        Use Password Instead
                    </Button>
                </div>
            </div>
        );
    }

    // Show checking state
    if (status === 'checking') {
        return (
            <div
                className="flex flex-col items-center justify-center space-y-6 p-6 animate-in fade-in"
                role="dialog"
                aria-labelledby="biometric-title"
            >
                <h2 id="biometric-title" className="text-xl font-semibold text-center">
                    Checking Device Compatibility...
                </h2>

                <div className="relative flex items-center justify-center w-32 h-32">
                    <div className="relative z-10 p-4 rounded-full bg-muted text-muted-foreground">
                        <Loader2 size={64} className="animate-spin" />
                    </div>
                </div>

                <p className="text-sm text-muted-foreground">
                    Please wait while we verify fingerprint support...
                </p>
            </div>
        );
    }

    // Show main authentication UI
    return (
        <div
            className="flex flex-col items-center justify-center space-y-6 p-6 animate-in fade-in"
            role="dialog"
            aria-labelledby="biometric-title"
            aria-live="polite"
        >
            <h2 id="biometric-title" className="text-xl font-semibold text-center">
                {status === 'idle' && (hasCredential ? "Fingerprint Login" : "Register Fingerprint")}
                {status === 'scanning' && (hasCredential ? "Authenticating..." : "Registering Fingerprint...")}
                {status === 'success' && "Fingerprint Recognized!"}
                {status === 'failed' && "Authentication Failed"}
            </h2>

            <div className="relative flex items-center justify-center w-32 h-32">
                {/* Fingerprint Icon / Animation Area */}
                <div className={cn(
                    "relative z-10 p-4 rounded-full transition-all duration-500",
                    status === 'idle' && "bg-muted text-muted-foreground",
                    status === 'scanning' && "bg-primary/10 text-primary scale-110",
                    status === 'success' && "bg-green-100 text-green-600 dark:bg-green-900/30",
                    status === 'failed' && "bg-red-100 text-red-600 dark:bg-red-900/30"
                )}>
                    {status === 'scanning' ? (
                        <div className="relative">
                            <Fingerprint size={64} className="animate-pulse" />
                            {/* Scanning Line overlay */}
                            <div
                                className="absolute top-0 left-0 w-full h-1 bg-primary/50 blur-[2px] animate-[scan_1.5s_ease-in-out_infinite]"
                                style={{ animationDirection: 'alternate' }}
                            />
                        </div>
                    ) : status === 'success' ? (
                        <CheckCircle2 size={64} className="animate-in zoom-in spin-in-12" />
                    ) : status === 'failed' ? (
                        <XCircle size={64} className="animate-in zoom-in" />
                    ) : (
                        <Fingerprint size={64} onClick={startScan} className="cursor-pointer hover:scale-105 transition-transform" />
                    )}
                </div>

                {/* Ripple Effect for Scanning */}
                {status === 'scanning' && (
                    <>
                        <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
                        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite_200ms]" />
                    </>
                )}
            </div>

            <div className="space-y-4 text-center w-full max-w-xs">
                <p className="text-sm text-muted-foreground min-h-[1.5rem]" aria-live="assertive">
                    {status === 'idle' && (hasCredential ? "Touch the fingerprint sensor to login." : "Touch the fingerprint sensor to register.")}
                    {status === 'scanning' && "Keep your finger still on the sensor..."}
                    {status === 'success' && `Welcome back, ${userName}!`}
                    {status === 'failed' && (errorMessage || "Authentication failed. Please try again.")}
                </p>

                {status === 'idle' && (
                    <Button onClick={startScan} size="lg" className="w-full">
                        <Fingerprint className="mr-2 h-5 w-5" />
                        {hasCredential ? 'Use Fingerprint' : 'Register Fingerprint'}
                    </Button>
                )}

                {status === 'failed' && (
                    <Button onClick={retryAuth} variant="outline" className="w-full">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Try Again
                    </Button>
                )}

                {!hasCredential && status === 'idle' && (
                    <p className="text-xs text-muted-foreground">
                        First time? Register your fingerprint for future logins.
                    </p>
                )}

                <Button variant="ghost" onClick={onCancel} className="w-full text-muted-foreground">
                    Use Password Instead
                </Button>
            </div>

            {/* Simple keyframe style for scanning line if not provided in tailwind config */}
            <style>{`
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    50% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </div>
    );
}

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AccessibilityToolbar } from './AccessibilityToolbar';
import {
  FileText,
  Mic,
  FormInput,
  Search,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  LogIn,
  Eye,
  EyeOff
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useFocus } from '@/contexts/FocusContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { label: 'Search', href: '/search', icon: Search },
  { label: 'Documents', href: '/documents', icon: FileText },
  { label: 'Forms', href: '/forms', icon: FormInput },
  { label: 'Transcribe', href: '/transcribe', icon: Mic },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { isFocusMode, toggleFocusMode } = useFocus();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b transition-all duration-500",
      isFocusMode ? "bg-background/95 border-transparent shadow-none" : "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    )}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <img src="/AccessAILogo.jpeg" alt="Access AI Logo" className="h-12 w-auto rounded-lg object-contain" />
          {/* <span>ACCESS<span className="text-primary">.AI</span></span> */}
        </Link>

        {/* Desktop Navigation - Hidden in Focus Mode */}
        {!isFocusMode && (
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {isAuthenticated && navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link key={item.href} to={item.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'gap-2',
                      isActive && 'bg-primary/10 text-primary'
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right side actions */}
        <div className="flex items-center gap-2">

          {/* Focus Mode Toggle */}
          {isAuthenticated && (
            <Button
              variant={isFocusMode ? "default" : "ghost"}
              size="sm"
              onClick={toggleFocusMode}
              className={cn("gap-2 border transition-all", isFocusMode ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "")}
              title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
            >
              {isFocusMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="hidden sm:inline">{isFocusMode ? "Exit Focus" : "Focus Mode"}</span>
            </Button>
          )}

          {!isFocusMode && <AccessibilityToolbar />}

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={cn("relative h-8 w-8 rounded-full", isFocusMode && "opacity-50 hover:opacity-100")}>
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserIcon className="h-4 w-4" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.full_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              {/* Login buttons logic remains here, but simplifying replace for now since we are mostly logged in */}
              <div className="hidden md:flex gap-2">
                <Button variant="ghost" asChild>
                  <Link to="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    Log in
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Get Started</Link>
                </Button>
              </div>
            </>
          )}

          {!isFocusMode && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden touch-target"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && !isFocusMode && (
        <nav
          id="mobile-menu"
          className="md:hidden border-t bg-background animate-slide-up"
          aria-label="Mobile navigation"
        >
          <div className="container py-4 space-y-1">
            {isAuthenticated ? (
              <>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted'
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                      {item.label}
                    </Link>
                  );
                })}
                <div className="border-t my-2 pt-2">
                  <div className="px-4 py-2">
                    <p className="text-sm font-medium">{user?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-2 p-2">
                <Button asChild className="w-full" variant="outline" onClick={() => setMobileMenuOpen(false)}>
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild className="w-full" onClick={() => setMobileMenuOpen(false)}>
                  <Link to="/register">Create Account</Link>
                </Button>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

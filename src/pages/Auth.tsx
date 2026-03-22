import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Zap, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = () => {
    try {
      if (isLogin) {
        authSchema.pick({ email: true, password: true }).parse({ email, password });
      } else {
        authSchema.parse({ email, password, fullName });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: typeof errors = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof typeof errors] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Sign in failed",
            description: error.message === 'Invalid login credentials' 
              ? 'Invalid email or password.'
              : error.message,
            variant: "destructive",
          });
        } else {
          toast({ title: "Welcome back!", description: "Let's keep the momentum going." });
          navigate('/dashboard');
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast({
            title: error.message.includes('already registered') ? "Account exists" : "Sign up failed",
            description: error.message.includes('already registered') 
              ? "This email is already registered. Please sign in."
              : error.message,
            variant: "destructive",
          });
        } else {
          toast({ title: "Account created!", description: "Welcome to NeonFlow! Let's build great habits." });
          navigate('/dashboard');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-dark flex flex-col relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="p-6 relative z-10 animate-fade-in">
        <Link to="/" className="inline-flex items-center gap-2 text-foreground font-serif font-bold text-xl">
          <Zap className="h-6 w-6 text-primary" />
          <span className="neon-text-subtle">NeonFlow</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md animate-scale-in">
          <Card className="neon-card border-primary/10">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 w-14 h-14 rounded-xl gradient-neon flex items-center justify-center shadow-neon">
                <Zap className="h-7 w-7 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl font-serif">
                {isLogin ? 'Welcome back' : 'Create your account'}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {isLogin 
                  ? 'Sign in to continue your flow'
                  : 'Start your productivity journey'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2 animate-slide-down">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="fullName" type="text" placeholder="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10 bg-secondary border-border focus:border-primary focus:shadow-neon" />
                    </div>
                    {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-secondary border-border focus:border-primary focus:shadow-neon" />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 bg-secondary border-border focus:border-primary focus:shadow-neon" />
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <Button type="submit" className="w-full shadow-neon" size="lg" disabled={loading}>
                  {loading ? (
                    <span className="animate-pulse">Please wait...</span>
                  ) : (
                    <>
                      {isLogin ? 'Sign In' : 'Create Account'}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setErrors({}); }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {isLogin ? (
                    <>Don't have an account? <span className="text-primary font-medium">Sign up</span></>
                  ) : (
                    <>Already have an account? <span className="text-primary font-medium">Sign in</span></>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

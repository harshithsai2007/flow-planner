import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Flame, Target, BarChart3, ArrowRight, Sparkles, Zap } from 'lucide-react';

export default function Index() {
  return (
    <div className="min-h-screen gradient-dark overflow-hidden">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-neon flex items-center justify-center shadow-neon">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-serif font-bold text-2xl neon-text-subtle text-foreground">NeonFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Sign In</Button>
          </Link>
          <Link to="/auth">
            <Button className="shadow-neon">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 md:py-32 text-center relative">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl mx-auto relative animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 text-primary text-sm font-medium mb-8 neon-border animate-pulse-neon">
            <Sparkles className="h-4 w-4" />
            Your productivity journey starts here
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight mb-6 leading-tight">
            <span className="text-foreground">Master your</span><br />
            <span className="neon-text text-primary animate-glow">daily flow</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Track habits, crush goals, and visualize your progress with a powerful 
            productivity planner designed for ambitious minds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="xl" variant="hero" className="shadow-neon-strong">
                Start for Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-4 neon-text-subtle text-foreground">
          Everything you need
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
          A complete system to organize, track, and elevate your productivity.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: CheckCircle2, title: 'Task Management', desc: 'Organize daily tasks with priorities, due dates, and categories', color: 'text-primary' },
            { icon: Flame, title: 'Habit Tracking', desc: 'Build powerful streaks and make good habits stick', color: 'text-warning' },
            { icon: Target, title: 'Goal Setting', desc: 'Set ambitious goals and track your progress visually', color: 'text-progress' },
            { icon: BarChart3, title: 'Analytics', desc: 'Beautiful charts showing your productivity trends', color: 'text-success' },
          ].map((feature, i) => (
            <div 
              key={i} 
              className="p-6 rounded-xl neon-card hover:shadow-neon transition-all duration-500 animate-slide-up group" 
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:shadow-neon transition-all duration-500">
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="font-serif font-semibold text-lg mb-2 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Motivational Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="relative rounded-2xl overflow-hidden neon-card p-10 md:p-16 text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
          <div className="relative">
            <p className="text-primary font-mono text-sm uppercase tracking-widest mb-4">Daily Motivation</p>
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4 neon-text text-primary">
              "The secret of getting ahead<br />is getting started."
            </h2>
            <p className="text-muted-foreground text-lg">— Mark Twain</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="rounded-2xl p-10 md:p-14 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(210 100% 56% / 0.15) 0%, hsl(185 100% 50% / 0.1) 100%)' }}>
          <div className="absolute inset-0 border border-primary/20 rounded-2xl pointer-events-none" />
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 text-foreground">Ready to level up?</h2>
          <p className="text-lg text-muted-foreground mb-8">Join thousands of achievers tracking their progress.</p>
          <Link to="/auth">
            <Button size="lg" className="shadow-neon">Get Started Free</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground border-t border-border">
        <p className="font-mono text-sm">© 2026 NeonFlow. Built for ambitious minds.</p>
      </footer>
    </div>
  );
}

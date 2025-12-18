import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Leaf, CheckCircle2, Flame, Target, BarChart3, ArrowRight, Sparkles } from 'lucide-react';

export default function Index() {
  return (
    <div className="min-h-screen gradient-calm">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg gradient-sage flex items-center justify-center">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl">Bloom</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link to="/auth">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <div className="max-w-3xl mx-auto animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Your productivity journey starts here
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Organize your life,<br />
            <span className="text-primary">achieve your goals</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Bloom helps students and young professionals manage tasks, build lasting habits, and track progress toward meaningful goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="xl" variant="hero">
                Start for Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: CheckCircle2, title: 'Task Management', desc: 'Organize daily tasks with priorities and due dates', color: 'text-primary' },
            { icon: Flame, title: 'Habit Tracking', desc: 'Build streaks and make good habits stick', color: 'text-accent' },
            { icon: Target, title: 'Goal Setting', desc: 'Set goals and track your progress visually', color: 'text-progress' },
            { icon: BarChart3, title: 'Analytics', desc: 'See your productivity trends over time', color: 'text-streak' },
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-2xl bg-card shadow-md hover:shadow-lg transition-shadow animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="gradient-hero rounded-3xl p-8 md:p-12 text-center text-primary-foreground">
          <h2 className="text-2xl md:text-4xl font-bold mb-4">Ready to bloom?</h2>
          <p className="text-lg opacity-90 mb-6">Join thousands of students achieving their goals.</p>
          <Link to="/auth">
            <Button size="lg" variant="secondary">Get Started Free</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground">
        <p>© 2024 Bloom. Built for productive minds.</p>
      </footer>
    </div>
  );
}

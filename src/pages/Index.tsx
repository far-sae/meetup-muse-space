import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Clock, CheckCircle, ArrowRight, Zap, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">InterviewBook</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" size="sm">Admin Login</Button>
            </Link>
            <Link to="/book">
              <Button size="sm" className="box-glow">Book Now</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(82_85%_50%/0.08),transparent_60%)]" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
              <Zap className="h-3.5 w-3.5" />
              Effortless Interview Scheduling
            </div>
            <h1 className="font-display text-5xl font-bold tracking-tight text-foreground sm:text-7xl">
              Book Your
              <span className="text-primary text-glow"> Interview </span>
              in Seconds
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Skip the back-and-forth emails. Pick a time that works for you, fill in your details, and you're confirmed — all in under a minute.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link to="/book">
                <Button size="lg" className="box-glow text-base px-8 h-12 gap-2">
                  Schedule Interview <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-border/50">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
              Three simple steps to get your interview scheduled
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Calendar,
                title: "Pick a Date",
                description: "Browse the calendar and select an available date that works for your schedule.",
              },
              {
                icon: Clock,
                title: "Choose a Time",
                description: "View open time slots and pick the one that fits best. No conflicts, no hassle.",
              },
              {
                icon: CheckCircle,
                title: "Confirm & Go",
                description: "Fill in your details, hit confirm, and receive an instant booking confirmation.",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="group relative rounded-xl border border-border bg-card p-8 transition-all hover:border-primary/40 hover:box-glow"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 border-t border-border/50">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: Users, label: "Candidates Served", value: "10,000+" },
              { icon: Shield, label: "Uptime Guarantee", value: "99.9%" },
              { icon: Clock, label: "Avg. Booking Time", value: "< 60s" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <stat.icon className="mx-auto mb-3 h-6 w-6 text-primary" />
                <div className="font-display text-4xl font-bold text-foreground">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container flex items-center justify-between text-sm text-muted-foreground">
          <span>© 2026 InterviewBook. All rights reserved.</span>
          <Link to="/login" className="hover:text-primary transition-colors">Admin</Link>
        </div>
      </footer>
    </div>
  );
};

export default Index;

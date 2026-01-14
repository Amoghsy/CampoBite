import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import {
  Ticket,
  Brain,
  BarChart3,
  Shield,
  Package,
  Smartphone,
  Bell,
  Zap,
  Users,
  TrendingUp,
  Star
} from 'lucide-react';

const mainFeatures = [
  {
    icon: Ticket,
    title: 'Token-Based Queue Management',
    description: 'Revolutionary digital token system that eliminates physical queues. Each order gets a unique token, and students can track their position in real-time without standing in line.',
    highlights: ['Unique token per order', 'Real-time position tracking', 'SMS/App notifications', 'Queue-free experience'],
    gradient: 'from-primary to-accent',
  },

  {
    icon: BarChart3,
    title: 'Real-Time Analytics Dashboard',
    description: 'Comprehensive analytics for administrators to monitor sales, track popular items, identify peak hours, and make data-driven decisions for better canteen management.',
    highlights: ['Live sales monitoring', 'Popular item tracking', 'Revenue visualization', 'Performance metrics'],
    gradient: 'from-success to-teal',
  },
  {
    icon: Shield,
    title: 'Secure Authentication System',
    description: 'Role-based access control with secure login for students, faculty, and administrators. Integration with college email systems for seamless verification.',
    highlights: ['College email integration', 'Role-based access', 'Session management', 'Secure password handling'],
    gradient: 'from-primary to-deep-blue',
  },
  {
    icon: Package,
    title: 'Smart Inventory Optimization',
    description: 'AI-assisted inventory management that tracks stock levels, predicts requirements, and alerts staff when items are running low or need reordering.',
    highlights: ['Stock level monitoring', 'Auto-reorder alerts', 'Usage pattern tracking', 'Supplier integration ready'],
    gradient: 'from-warning to-accent',
  },
  {
    icon: Star,
    title: 'User Ratings & Feedback System',
    description: 'Students can rate their meals and provide feedback, helping canteen staff improve food quality and identify popular dishes for better menu planning.',
    highlights: ['Star-based rating system', 'Meal quality feedback', 'Popular dish tracking', 'Continuous improvement'],
    gradient: 'from-deep-blue to-primary',
  },
];

const additionalFeatures = [
  {
    icon: Smartphone,
    title: 'Mobile-First Design',
    description: 'Optimized for smartphones with responsive design and touch-friendly interface',
  },
  {
    icon: Bell,
    title: 'Push Notifications',
    description: 'Instant alerts when your order status changes or when food is ready',
  },
  {
    icon: Zap,
    title: 'Fast Checkout',
    description: 'One-tap ordering for frequent items and saved payment preferences',
  },
  {
    icon: Users,
    title: 'Multi-Role Support',
    description: 'Separate interfaces for students, faculty, staff, and administrators',
  },
  {
    icon: TrendingUp,
    title: 'Performance Reports',
    description: 'Daily, weekly, and monthly reports for canteen performance analysis',
  },
  {
    icon: BarChart3,
    title: 'Menu Analytics',
    description: 'Identify best and worst performing items to optimize the menu',
  },
];

export default function Features() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-16 md:py-24 gradient-hero">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Powered by Modern Technology
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Features that Make <span className="gradient-text">CampoBite</span> Smart
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Discover the intelligent features that transform campus dining into a
              seamless, efficient, and enjoyable experience.
            </p>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20">
        <div className="container">
          <div className="space-y-24">
            {mainFeatures.map((feature, index) => (
              <div
                key={index}
                className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  } gap-8 lg:gap-16 items-center animate-fade-in`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Icon Card */}
                <div className="flex-1 w-full">
                  <div className={`relative p-6 md:p-8 rounded-3xl bg-gradient-to-br ${feature.gradient} aspect-square max-w-[200px] md:max-w-md mx-auto flex items-center justify-center`}>
                    <feature.icon className="h-20 w-20 md:h-32 md:w-32 text-white/90" />
                    <div className="absolute inset-0 bg-white/10 rounded-3xl" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium">
                    Feature {index + 1}
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                    {feature.title}
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    {feature.description}
                  </p>
                  <ul className="grid grid-cols-2 gap-3">
                    {feature.highlights.map((highlight, hIndex) => (
                      <li
                        key={hIndex}
                        className="flex items-center gap-2 text-sm text-foreground"
                      >
                        <div className="h-2 w-2 rounded-full bg-accent" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">More Powerful Features</h2>
            <p className="text-muted-foreground">
              Additional capabilities that enhance the overall experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalFeatures.map((feature, index) => (
              <Card
                key={index}
                className="card-hover border-border/50 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>




    </Layout>
  );
}

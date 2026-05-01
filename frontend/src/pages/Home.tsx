import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import {
  Smartphone,
  Ticket,
  Clock,
  Brain,
  ArrowRight,
  ChefHat,
  Users,
  Zap,
  UtensilsCrossed,
  Coffee,
  Soup,
  Pizza,
  Salad,
  Sandwich,
  Cookie
} from 'lucide-react';

const features = [
  {
    icon: Smartphone,
    title: 'Online Ordering',
    description: 'Order food anytime from your mobile device',
  },
  {
    icon: Ticket,
    title: 'Token-Based Pickup',
    description: 'Get a unique token for quick, queue-free collection',
  },
  {
    icon: Clock,
    title: 'Real-Time Tracking',
    description: 'Track your order status live from preparation to ready',
  },
  {
    icon: Brain,
    title: ' Demand Analysis',
    description: 'Smart predictions for optimal food availability',
  },
];

const popularItems = [
  { icon: Soup, name: 'Masala Dosa', price: '₹60', tag: 'Bestseller' },
  { icon: Coffee, name: 'Filter Coffee', price: '₹25', tag: 'Hot' },
  { icon: Pizza, name: 'Paneer Pizza', price: '₹120', tag: 'Popular' },
  { icon: Salad, name: 'Fresh Salad', price: '₹80', tag: 'Healthy' },
  { icon: Sandwich, name: 'Veg Sandwich', price: '₹45', tag: 'Quick' },
  { icon: Cookie, name: 'Fresh Cookies', price: '₹30', tag: 'Sweet' },
];

const stats = [
  { value: '500+', label: 'Daily Orders' },
  { value: '< 5 min', label: 'Avg Wait Time' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '15+', label: 'Menu Items' },
];

export default function Home() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />

        {/* Floating Food Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
          <div className="absolute top-20 left-[10%] animate-float opacity-20">
            <Pizza className="h-12 w-12 text-accent" />
          </div>
          <div className="absolute top-32 right-[15%] animate-float opacity-15" style={{ animationDelay: '1s' }}>
            <Coffee className="h-10 w-10 text-primary" />
          </div>
          <div className="absolute bottom-32 left-[20%] animate-float opacity-20" style={{ animationDelay: '2s' }}>
            <Soup className="h-14 w-14 text-accent" />
          </div>
          <div className="absolute top-40 left-[40%] animate-float opacity-10" style={{ animationDelay: '1.5s' }}>
            <Cookie className="h-8 w-8 text-warning" />
          </div>
          <div className="absolute bottom-40 right-[25%] animate-float opacity-15" style={{ animationDelay: '0.5s' }}>
            <Salad className="h-10 w-10 text-success" />
          </div>
        </div>

        <div className="container relative py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium">
                <UtensilsCrossed className="h-4 w-4" />
                Campus Canteen Made Smart
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="gradient-text">CampoBite</span>
                <br />
                <span className="text-foreground">Delicious Food,</span>
                <br />
                <span className="text-foreground">Zero Queues 🍽️</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
                Your campus canteen is now smarter! Order your favorite meals online,
                get a digital token, and skip the long queues. Fresh food, fast service.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="gradient-primary border-0 text-base h-12 px-8 hover:opacity-90 group" asChild>
                  <Link to="/auth">
                    <UtensilsCrossed className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                    Order Food
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-base h-12 px-8" asChild>
                  <Link to="/auth">Admin Dashboard</Link>
                </Button>
              </div>

              {/* Quick Food Tags */}
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="px-3 py-1 rounded-full bg-warning/10 text-warning text-sm font-medium">🔥 Hot Meals</span>
                <span className="px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium">🥗 Fresh Salads</span>
                <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium">☕ Beverages</span>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">🍰 Desserts</span>
              </div>
            </div>

            {/* Hero Food Card */}
            <div className="relative hidden lg:block">
              <div className="relative z-10 animate-float">
                <div className="bg-card rounded-3xl shadow-card p-8 border border-border">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center">
                      <ChefHat className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Your Order is Ready! 🎉</p>
                      <p className="text-sm text-muted-foreground">Token #247</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-success/10">
                      <div className="flex items-center gap-2">
                        <Soup className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium text-foreground">Masala Dosa</span>
                      </div>
                      <span className="text-sm text-success font-semibold">Ready ✓</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-accent/10">
                      <div className="flex items-center gap-2">
                        <Coffee className="h-4 w-4 text-accent" />
                        <span className="text-sm font-medium text-foreground">Filter Coffee (2)</span>
                      </div>
                      <span className="text-sm text-accent font-medium">Preparing</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted">
                      <div className="flex items-center gap-2">
                        <Cookie className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">Cookies (3)</span>
                      </div>
                      <span className="text-sm text-muted-foreground">In Queue</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Estimated pickup</span>
                      <span className="text-sm font-semibold text-foreground">~5 mins</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-accent/20 blur-3xl" />
              <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
              <div className="absolute top-1/2 -right-4 h-20 w-20 rounded-full bg-warning/20 blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-b border-border">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <p className="text-3xl md:text-4xl font-bold gradient-text">{stat.value}</p>
                <p className="text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Items Section */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 text-warning text-sm font-medium mb-4">
              🔥 Popular on Campus
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Today's <span className="gradient-text">Favorites</span>
            </h2>
            <p className="text-muted-foreground">
              Check out what your fellow students are ordering right now
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {popularItems.map((item, index) => (
              <Card
                key={index}
                className="group card-hover border-border/50 bg-card cursor-pointer"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-4 text-center">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-accent/10 to-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <item.icon className="h-8 w-8 text-accent" />
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium mb-2">
                    {item.tag}
                  </span>
                  <h3 className="font-medium text-sm text-foreground mb-1">{item.name}</h3>
                  <p className="text-accent font-bold">{item.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" className="group" asChild>
              <Link to="/auth">
                View Full Menu
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose <span className="gradient-text">CampoBite</span>?
            </h2>
            <p className="text-lg text-muted-foreground">
              Experience the future of campus dining with our intelligent food ordering system
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group card-hover border-border/50 bg-card"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-primary">
        <div className="container text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Ready to Skip the Queue?
            </h2>
            <p className="text-lg text-white/80">
              Start ordering food online and experience queue-free campus dining today.
            </p>
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 text-base h-12 px-8"
              asChild
            >
              <Link to="/auth">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}

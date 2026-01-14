import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { 
  LogIn, 
  UtensilsCrossed, 
  ShoppingCart, 
  Ticket, 
  Clock, 
  CheckCircle,
  ArrowDown
} from 'lucide-react';

const steps = [
  {
    icon: LogIn,
    step: 1,
    title: 'Login to Your Account',
    description: 'Sign in with your college email or create a new account. Quick authentication for students and faculty.',
  },
  {
    icon: UtensilsCrossed,
    step: 2,
    title: 'Browse the Menu',
    description: 'Explore our diverse menu with real-time availability. See prices, preparation times, and popular items.',
  },
  {
    icon: ShoppingCart,
    step: 3,
    title: 'Place Your Order',
    description: 'Add items to cart and checkout. Choose payment method and confirm your order with a single tap.',
  },
  {
    icon: Ticket,
    step: 4,
    title: 'Get Your Digital Token',
    description: 'Receive a unique token number instantly. This is your queue position - no physical waiting required.',
  },
  {
    icon: Clock,
    step: 5,
    title: 'Track Order Status',
    description: 'Monitor your order in real-time. Get notifications when your food moves from preparation to ready.',
  },
  {
    icon: CheckCircle,
    step: 6,
    title: 'Collect Your Food',
    description: 'Show your token at the counter and collect your order. Skip the queue, grab your food, and enjoy!',
  },
];

export default function HowItWorks() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-16 md:py-24 gradient-hero">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              How <span className="gradient-text">CampoBite</span> Works
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              A simple 6-step process to order food online and skip the canteen queues. 
              Fast, efficient, and designed for busy campus life.
            </p>
          </div>
        </div>
      </section>

      {/* Steps Timeline */}
      <section className="py-20">
        <div className="container max-w-4xl">
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-accent to-success transform md:-translate-x-1/2 hidden md:block" />

            <div className="space-y-12">
              {steps.map((step, index) => (
                <div 
                  key={index}
                  className="relative animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`flex flex-col md:flex-row items-start gap-6 ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}>
                    {/* Step Number Circle */}
                    <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 z-10">
                      <div className="h-16 w-16 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {step.step}
                      </div>
                    </div>

                    {/* Card */}
                    <Card className={`flex-1 card-hover border-border/50 ${
                      index % 2 === 0 ? 'md:mr-auto md:pr-24' : 'md:ml-auto md:pl-24'
                    } md:w-[calc(50%-2rem)]`}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Mobile Step Number */}
                          <div className="flex md:hidden h-12 w-12 shrink-0 rounded-xl gradient-primary items-center justify-center text-white font-bold">
                            {step.step}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                                <step.icon className="h-5 w-5 text-accent" />
                              </div>
                              <h3 className="font-semibold text-lg text-foreground">
                                {step.title}
                              </h3>
                            </div>
                            <p className="text-muted-foreground">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Arrow for mobile */}
                  {index < steps.length - 1 && (
                    <div className="flex justify-center my-4 md:hidden">
                      <ArrowDown className="h-6 w-6 text-accent animate-bounce" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">Why This System Works</h2>
            <p className="text-muted-foreground">
              Our token-based approach eliminates traditional queue problems
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center p-6 card-hover border-border/50">
              <CardContent className="pt-6">
                <div className="h-16 w-16 mx-auto rounded-2xl gradient-primary flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Save Time</h3>
                <p className="text-muted-foreground text-sm">
                  Average wait time reduced from 20 minutes to under 5 minutes
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 card-hover border-border/50">
              <CardContent className="pt-6">
                <div className="h-16 w-16 mx-auto rounded-2xl gradient-success flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No Queue Stress</h3>
                <p className="text-muted-foreground text-sm">
                  Order from anywhere on campus and arrive when your food is ready
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 card-hover border-border/50">
              <CardContent className="pt-6">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-warning flex items-center justify-center mb-4">
                  <Ticket className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Fair System</h3>
                <p className="text-muted-foreground text-sm">
                  Token-based ordering ensures first-come-first-served fairness
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
}

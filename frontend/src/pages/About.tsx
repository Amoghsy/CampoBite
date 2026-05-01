import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { 
  GraduationCap, 
  Target, 
  Lightbulb, 
  
} from 'lucide-react';



const objectives = [
  'Eliminate physical queues in campus canteens',
  'Reduce average waiting time by 80%',
  'Provide real-time order tracking',
  'Enable Algorithm based demand forecasting',
  'Improve canteen operational efficiency',
  'Enhance student and faculty dining experience',
];

export default function About() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-16 md:py-24 gradient-hero">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto animate-fade-in">
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About <span className="gradient-text">CampoBite</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              An innovative smart canteen management system designed to revolutionize 
              campus canteens through technology and innovation .
            </p>
          </div>
        </div>
      </section>

      {/* Project Overview */}
      <section className="py-20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-3xl md:text-4xl font-bold">
                 Overview
              </h2>
              <p className="text-lg text-muted-foreground">
                CampoBite is a smart campus canteen management system developed to address the challenges of long queues and inefficiencies in traditional campus canteens. The system focuses on improving the overall food ordering and management experience within educational institutions.
              </p>
              <p className="text-lg text-muted-foreground">
               By enabling online menu browsing, digital token–based ordering, real-time order tracking, and automated notifications, CampoBite modernizes canteen operations. With features such as digital billing, email-based receipts, admin-controlled menu and stock management, and data-driven insights for demand prediction and waste reduction, the system delivers an efficient, transparent, and user-friendly dining solution for both students and administrators.
              </p>
              <div className="flex flex-wrap gap-3 pt-4">
               
              </div>
            </div>

            <div className="relative">
              <Card className="border-border/50 shadow-card">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center">
                      <Target className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold">Objectives</h3>
                  </div>
                  <ul className="space-y-3">
                    {objectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full bg-accent mt-2 shrink-0" />
                        <span className="text-muted-foreground">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              {/* Decorative */}
              <div className="absolute -z-10 -top-4 -right-4 h-full w-full rounded-2xl bg-accent/20" />
            </div>
          </div>
        </div>
      </section>

     

      {/* Vision Section */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 gradient-primary text-white overflow-hidden">
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="shrink-0">
                    <div className="h-24 w-24 rounded-3xl bg-white/20 flex items-center justify-center">
                      <Lightbulb className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  <div className="text-center md:text-left">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">Our Vision</h2>
                    <p className="text-white/90 text-lg">
                      The vision of CampoBite is to create a seamless, queue-free canteen experience through smart digital innovation. It aims to optimize food ordering, preparation, and management using real-time data and intelligent automation. CampoBite strives to reduce food wastage and operational inefficiencies in campus canteens. Ultimately, it envisions transforming traditional canteens into smart, efficient, and student-friendly dining spaces.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

    
    </Layout>
  );
}

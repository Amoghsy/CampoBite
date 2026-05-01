import { Link } from 'react-router-dom';
import { Utensils, BarChart3, Cloud, Brain, Mail, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
                <Utensils className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold">
                Campo<span className="text-accent">Bite</span>
              </span>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-md">
              CampoBite is a smart canteen management system designed to streamline
              operations in campus canteens, enhancing efficiency and user experience
              through technology.
            </p>
            <div className="flex gap-4">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary">
                <Utensils className="h-5 w-5" />
              </div>
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-accent/10 text-accent">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-success/10 text-success">
                <Cloud className="h-5 w-5" />
              </div>
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-warning/10 text-warning">
                <Brain className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About Project
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>Phone</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 CampoBite. All Rights Reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Built with Java & React | Smart Canteen System for Campus Canteens
          </p>
        </div>
      </div>
    </footer>
  );
}

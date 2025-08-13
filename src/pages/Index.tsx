
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Users, Zap, Shield, Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Music className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground-dark">FanCard</h1>
          </div>
          <div className="space-x-4">
            <Link to="/auth">
              <Button variant="ghost" className="text-foreground hover:text-foreground-dark">
                Login
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-secondary text-secondary-foreground">
            Revolutionary Music Experience
          </Badge>
          <h2 className="text-5xl font-bold mb-6 text-foreground-dark">
            Transform Your Music with
            <span className="text-primary block">Smart Fan Cards</span>
          </h2>
          <p className="text-xl text-foreground mb-8 max-w-2xl mx-auto">
            Create, manage, and share your music through innovative NFC-enabled fan cards. 
            Connect with your audience like never before.
          </p>
          <div className="space-x-4">
            <Link to="/auth">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Start Creating <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4 text-foreground-dark">Why Choose FanCard?</h3>
            <p className="text-foreground max-w-2xl mx-auto">
              Discover the features that make FanCard the perfect platform for artists and music lovers
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-card border-border">
              <CardHeader>
                <Zap className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-foreground-dark">Instant Access</CardTitle>
                <CardDescription className="text-foreground">
                  NFC technology enables instant music streaming with just a tap
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-foreground-dark">Secure & Private</CardTitle>
                <CardDescription className="text-foreground">
                  Your music and data are protected with enterprise-grade security
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-foreground-dark">Fan Engagement</CardTitle>
                <CardDescription className="text-foreground">
                  Build deeper connections with your audience through interactive experiences
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <h4 className="text-4xl font-bold text-primary mb-2">10K+</h4>
              <p className="text-foreground">Active Artists</p>
            </div>
            <div>
              <h4 className="text-4xl font-bold text-primary mb-2">50K+</h4>
              <p className="text-foreground">Fan Cards Created</p>
            </div>
            <div>
              <h4 className="text-4xl font-bold text-primary mb-2">1M+</h4>
              <p className="text-foreground">Music Streams</p>
            </div>
            <div>
              <h4 className="text-4xl font-bold text-primary mb-2">99.9%</h4>
              <p className="text-foreground">Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/10">
        <div className="container mx-auto text-center">
          <h3 className="text-3xl font-bold mb-4 text-foreground-dark">Ready to Get Started?</h3>
          <p className="text-xl text-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of artists who are already using FanCard to revolutionize their music experience
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Create Your First Fan Card <Star className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Music className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground-dark">FanCard</span>
          </div>
          <p className="text-foreground">© 2024 FanCard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, Brain, Trophy, DraftingCompass } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center sticky top-0 z-50 bg-background/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3">
          <DraftingCompass className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary tracking-tight">BizLaunch</h1>
        </div>
        <nav>
          <Link href="/dashboard">
            <Button variant="ghost" className="text-primary hover:bg-primary/10">Go to Dashboard</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground mb-6 leading-tight">
            Turn Your Business Idea into <span className="text-accent">Reality</span>.
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
            BizLaunch provides the tools, step-by-step guidance, and AI-powered insights you need to confidently plan, launch, and grow your successful business.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-105 py-3 px-8 text-lg rounded-lg">
              Start Your Journey <Rocket className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-4xl font-bold text-center text-foreground mb-20">Why Entrepreneurs Choose BizLaunch</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 bg-card rounded-xl overflow-hidden">
                <CardHeader className="items-center text-center p-6 bg-primary/5">
                  <div className="p-4 bg-primary/10 rounded-full mb-4 inline-block ring-4 ring-primary/20">
                    <Brain className="w-10 h-10 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">AI Business Advisor</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-muted-foreground text-center text-base">
                    Get personalized advice, generate business plans, estimate costs, and draft communications with our intelligent AI assistant.
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 bg-card rounded-xl overflow-hidden">
                <CardHeader className="items-center text-center p-6 bg-accent/5">
                  <div className="p-4 bg-accent/10 rounded-full mb-4 inline-block ring-4 ring-accent/20">
                   <Rocket className="w-10 h-10 text-accent" />
                  </div>
                  <CardTitle className="text-2xl">Step-by-Step Wizard</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-muted-foreground text-center text-base">
                    Navigate the complexities of starting a business with our guided checklists, covering planning, launching, managing, and growing.
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 bg-card rounded-xl overflow-hidden">
                <CardHeader className="items-center text-center p-6 bg-green-500/5">
                   <div className="p-4 bg-green-500/10 rounded-full mb-4 inline-block ring-4 ring-green-500/20">
                    <Trophy className="w-10 h-10 text-green-600" />
                  </div>
                  <CardTitle className="text-2xl">Achievement Tracking</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-muted-foreground text-center text-base">
                    Stay motivated by unlocking achievements as you complete crucial milestones on your entrepreneurial journey.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Image Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="bg-card p-8 md:p-12 rounded-xl shadow-2xl flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            <div className="lg:w-1/2 text-center lg:text-left">
              <h3 className="text-4xl font-bold text-foreground mb-6">Visualize Your Success Story</h3>
              <p className="text-muted-foreground text-lg mb-8">
                Our platform is designed to be intuitive and empowering, helping you focus on what matters most: building your dream business with clarity and confidence.
              </p>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/5 hover:text-primary text-base py-3 px-8 rounded-lg">Explore the Dashboard</Button>
              </Link>
            </div>
            <div className="lg:w-1/2 mt-8 lg:mt-0">
              <Image
                src="https://placehold.co/600x400.png"
                alt="BizLaunch Dashboard Preview"
                width={600}
                height={400}
                className="rounded-lg shadow-xl object-cover"
                data-ai-hint="business dashboard"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center border-t mt-12">
        <p className="text-muted-foreground">&copy; {new Date().getFullYear()} BizLaunch. All rights reserved. Your partner in entrepreneurial success.</p>
      </footer>
    </div>
  );
}

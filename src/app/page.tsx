"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Rocket, Brain, Trophy, LogIn, UserPlus, CheckCircle, Zap, Users, Building } from 'lucide-react';
import React, { useState } from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function LandingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  const pricingTiers = [
    {
      name: "Side Hustle",
      monthlyPrice: 0,
      description: "Get started with essential tools to plan your business.",
      features: [
        "Basic Wizard Access (Plan Stage)",
        "Limited AI Advisor Queries",
        "Track 5 Achievements",
        "Community Support",
      ],
      cta: "Get Started Free",
      href: "/auth/signup?plan=side-hustle",
      icon: <Rocket className="w-6 h-6 mb-2 text-primary" />,
      popular: false,
    },
    {
      name: "Solopreneur",
      monthlyPrice: 29.99,
      description: "Unlock more tools and AI power for growing businesses.",
      features: [
        "Full Wizard Access (All Stages)",
        "Standard AI Advisor Queries",
        "Track All Achievements",
        "File Uploads for Key Tasks",
        "Email Support",
      ],
      cta: "Choose Solopreneur",
      href: "/auth/signup?plan=solopreneur",
      icon: <Zap className="w-6 h-6 mb-2 text-accent" />,
      popular: true,
    },
    {
      name: "Small Business Plan",
      monthlyPrice: 99.99,
      description: "Advanced features and collaboration for scaling your operations.",
      features: [
        "All Solopreneur Features",
        "Priority AI Advisor Queries",
        "Advanced AI Tools (e.g., In-depth Analysis)",
        "Team Member Access (up to 5 users - coming soon)",
        "Priority Support",
      ],
      cta: "Choose Small Business",
      href: "/auth/signup?plan=small-business",
      icon: <Users className="w-6 h-6 mb-2 text-primary" />,
      popular: false,
    },
    {
      name: "Corporate Enterprises",
      monthlyPrice: null, // Custom pricing
      description: "Tailored solutions for large organizations and specific needs.",
      features: [
        "All Small Business Plan Features",
        "Dedicated Account Manager",
        "Custom AI Model Integrations & Workflows",
        "Volume Discounts & Scalable Infrastructure",
        "SLA & Premium Support",
      ],
      cta: "Contact Sales",
      href: "mailto:sales@bizlaunch.example.com",
      icon: <Building className="w-6 h-6 mb-2 text-foreground" />,
      popular: false,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center sticky top-0 z-50 bg-background/80 backdrop-blur-md shadow-sm">
        <Link href="/" className="flex items-center gap-3">
          <Rocket className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-primary tracking-tight">BizLaunch</h1>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link href="/auth/signin">
            <Button variant="outline" size="sm" className="text-primary border-primary hover:bg-primary/10">
              <LogIn className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Sign In</span>
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <UserPlus className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Sign Up</span>
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-32 text-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground mb-6 leading-tight">
            Turn Your Business Idea into Reality with <span className="text-accent">BizLaunch</span>.
          </h2>
          <p className="text-md sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 sm:mb-12">
            BizLaunch provides the tools, step-by-step guidance, and AI-powered insights you need to confidently plan, launch, and grow your successful business.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg transition-transform hover:scale-105 py-3 px-6 sm:px-8 text-base sm:text-lg rounded-lg">
              Explore Features <Rocket className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-12 sm:mb-16 md:mb-20">Why Entrepreneurs Choose BizLaunch</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
              <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 bg-card rounded-xl overflow-hidden">
                <CardHeader className="items-center text-center p-6 bg-primary/5">
                  <div className="p-3 sm:p-4 bg-primary/10 rounded-full mb-3 sm:mb-4 inline-block ring-2 sm:ring-4 ring-primary/20">
                    <Brain className="w-7 h-7 sm:w-8 md:w-10 text-primary" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl">AI Business Advisor</CardTitle>
                </CardHeader>
                <CardContent className="p-5 sm:p-6">
                  <p className="text-muted-foreground text-center text-sm sm:text-base">
                    Get personalized advice, generate business plans, estimate costs, and draft communications with our intelligent AI assistant.
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 bg-card rounded-xl overflow-hidden">
                <CardHeader className="items-center text-center p-6 bg-accent/5">
                  <div className="p-3 sm:p-4 bg-accent/10 rounded-full mb-3 sm:mb-4 inline-block ring-2 sm:ring-4 ring-accent/20">
                   <Rocket className="w-7 h-7 sm:w-8 md:w-10 text-accent" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl">Step-by-Step Wizard</CardTitle>
                </CardHeader>
                <CardContent className="p-5 sm:p-6">
                  <p className="text-muted-foreground text-center text-sm sm:text-base">
                    Navigate the complexities of starting a business with our guided checklists, covering planning, launching, managing, and growing.
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 bg-card rounded-xl overflow-hidden">
                <CardHeader className="items-center text-center p-6 bg-green-500/5">
                   <div className="p-3 sm:p-4 bg-green-500/10 rounded-full mb-3 sm:mb-4 inline-block ring-2 sm:ring-4 ring-green-500/20">
                    <Trophy className="w-7 h-7 sm:w-8 md:w-10 text-green-600" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl">Achievement Tracking</CardTitle>
                </CardHeader>
                <CardContent className="p-5 sm:p-6">
                  <p className="text-muted-foreground text-center text-sm sm:text-base">
                    Stay motivated by unlocking achievements as you complete crucial milestones on your entrepreneurial journey.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-4">
              Find the Perfect Plan
            </h3>
            <p className="text-md sm:text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-8">
              Choose the plan that best suits your business needs and budget. Start for free or unlock powerful premium features.
            </p>
            <div className="flex justify-center items-center space-x-3 mb-12 sm:mb-16 md:mb-20">
              <Label htmlFor="pricing-toggle" className={`text-sm font-medium ${!isAnnual ? 'text-accent' : 'text-muted-foreground'}`}>Monthly</Label>
              <Switch
                id="pricing-toggle"
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
                aria-label="Toggle pricing frequency"
              />
              <Label htmlFor="pricing-toggle" className={`text-sm font-medium ${isAnnual ? 'text-accent' : 'text-muted-foreground'}`}>
                Annually <span className="text-xs text-green-600 font-semibold">(Save ~17%)</span>
              </Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {pricingTiers.map((tier) => {
                let displayPrice: string;
                let displayFrequency: string;
                let priceNote: string | null = null;

                if (tier.monthlyPrice === 0) {
                  displayPrice = "$0";
                  displayFrequency = "/month";
                } else if (tier.monthlyPrice === null) {
                  displayPrice = "Custom";
                  displayFrequency = "";
                } else if (isAnnual) {
                  displayPrice = `$${(tier.monthlyPrice * 10).toFixed(2)}`; // 2 months free
                  displayFrequency = "/year";
                  priceNote = "Billed annually";
                } else {
                  displayPrice = `$${tier.monthlyPrice.toFixed(2)}`;
                  displayFrequency = "/month";
                }

                return (
                  <Card key={tier.name} className={`flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden ${tier.popular ? 'border-2 border-accent ring-2 ring-accent/30' : 'border-border'}`}>
                    <CardHeader className="items-center text-center p-6 bg-secondary/30">
                      {tier.icon}
                      <CardTitle className="text-xl sm:text-2xl">{tier.name}</CardTitle>
                      <div className="text-3xl sm:text-4xl font-bold text-foreground mt-2">
                        {displayPrice}
                        {displayFrequency && <span className="text-sm font-normal text-muted-foreground">{displayFrequency}</span>}
                      </div>
                      {priceNote && <p className="text-xs text-muted-foreground mt-1">{priceNote}</p>}
                      <CardDescription className="text-xs sm:text-sm mt-1 h-12 sm:h-10">{tier.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 flex-grow">
                      <ul className="space-y-3 text-sm text-muted-foreground">
                        {tier.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter className="p-6 mt-auto">
                      <Link href={tier.href + (isAnnual && tier.monthlyPrice !== 0 && tier.monthlyPrice !== null ? '&billing=annual' : '')} className="w-full">
                        <Button size="lg" className={`w-full ${tier.popular ? 'bg-accent hover:bg-accent/90 text-accent-foreground' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}>
                          {tier.cta}
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>


        {/* Image Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="bg-card p-6 sm:p-8 md:p-10 lg:p-12 rounded-xl shadow-2xl flex flex-col lg:flex-row items-center gap-6 md:gap-8 lg:gap-12">
            <div className="lg:w-1/2 text-center lg:text-left">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 sm:mb-6">Visualize Your Success Story</h3>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg mb-6 sm:mb-8">
                Our platform is designed to be intuitive and empowering, helping you focus on what matters most: building your dream business with clarity and confidence.
              </p>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/5 hover:text-primary text-sm sm:text-base py-3 px-6 sm:px-8 rounded-lg">Explore the Dashboard</Button>
              </Link>
            </div>
            <div className="lg:w-1/2 mt-6 lg:mt-0 w-full">
              <Image
                src="https://placehold.co/600x400.png"
                alt="BizLaunch Dashboard Preview showing charts and tasks for business planning"
                width={600}
                height={400}
                className="rounded-lg shadow-xl object-cover w-full h-auto"
                data-ai-hint="business dashboard"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 text-center border-t mt-10 sm:mt-12">
        <p className="text-muted-foreground text-xs sm:text-sm">&copy; {new Date().getFullYear()} BizLaunch. All rights reserved. Your partner in entrepreneurial success.</p>
      </footer>
    </div>
  );
}

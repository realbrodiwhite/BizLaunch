// src/components/AIBusinessAdvisor.tsx
"use client";

import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { generateBusinessPlanDraft } from '@/ai/flows/business-plan-generator'; // Example flow
import { estimateStartupCosts } from '@/ai/flows/startup-cost-estimator'; // Example flow
import { summarizeMarketResearch } from '@/ai/flows/market-research-summary'; // Example flow
import { generateBusinessNames } from '@/ai/flows/business-name-generator'; // Example flow
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const FormSchema = z.object({
  queryType: z.enum(["business_plan", "cost_estimation", "market_research", "name_generation"], {
     required_error: "Please select a query type.",
   }),
  details: z.string().min(10, {
    message: "Please provide more details about your request (at least 10 characters).",
  }),
  // Conditional fields based on queryType
  location: z.string().optional(),
  businessType: z.string().optional(),
  targetMarket: z.string().optional(),
  keywords: z.string().optional(),
  industry: z.string().optional(),
});

export function AIBusinessAdvisor() {
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

   const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
     defaultValues: {
      queryType: undefined,
      details: "",
      location: "",
      businessType: "",
      targetMarket: "",
      keywords: "",
      industry: "",
    },
  });

   const queryType = form.watch("queryType");

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    setError(null);
    setAiResponse(null);

    try {
      let result;
       switch (data.queryType) {
        case 'business_plan':
           if (!data.details) throw new Error("Business description is required for plan generation.");
          result = await generateBusinessPlanDraft({ businessDescription: data.details });
          setAiResponse(result.businessPlanDraft);
          break;
        case 'cost_estimation':
          if (!data.businessType || !data.location) throw new Error("Business type and location are required for cost estimation.");
          result = await estimateStartupCosts({ businessType: data.businessType, location: data.location, description: data.details });
          setAiResponse(`Estimated Costs:\n${result.estimatedCosts}\n\nFunding Options:\n${result.fundingOptions}`);
          break;
        case 'market_research':
           if (!data.businessType || !data.targetMarket) throw new Error("Business type and target market are required for market research.");
          result = await summarizeMarketResearch({ businessType: data.businessType, targetMarket: data.targetMarket });
          setAiResponse(result.summary);
          break;
        case 'name_generation':
           if (!data.keywords || !data.industry) throw new Error("Keywords and industry are required for name generation.");
          result = await generateBusinessNames({ keywords: data.keywords, industry: data.industry });
           setAiResponse(`Suggested Names:\n- ${result.names.join('\n- ')}`);
          break;
        default:
          throw new Error("Invalid query type selected.");
      }
       toast({
        title: "AI Advisor Response",
        description: "Successfully generated advice.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
       setError(errorMessage);
       toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
       console.error("AI Advisor Error:", err);
    } finally {
      setIsLoading(false);
    }
  }


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2 text-primary">
          <Terminal className="w-5 h-5" />
          AI Business Advisor
        </CardTitle>
        <CardDescription>
          Ask for tailored advice based on your business needs. Select a query type and provide details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
             <FormField
              control={form.control}
              name="queryType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What can I help you with?</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a query type..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="business_plan">Generate Business Plan Draft</SelectItem>
                      <SelectItem value="cost_estimation">Estimate Startup Costs</SelectItem>
                      <SelectItem value="market_research">Summarize Market Research</SelectItem>
                      <SelectItem value="name_generation">Generate Business Names</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {queryType === 'cost_estimation' && (
              <>
                <FormField
                  control={form.control}
                  name="businessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Type</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Coffee Shop, Online Retail" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Austin, TX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {queryType === 'market_research' && (
              <>
                <FormField
                  control={form.control}
                  name="businessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Type</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., SaaS for small businesses" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="targetMarket"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Market</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Freelancers, Gen Z" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

             {queryType === 'name_generation' && (
              <>
                 <FormField
                  control={form.control}
                  name="keywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keywords</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., sustainable, coffee, tech, community" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Food & Beverage, Technology" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

             <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details / Business Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                         queryType === 'business_plan' ? "Describe your business idea..." :
                         queryType === 'cost_estimation' ? "Provide any additional context for cost estimation..." :
                         "Provide context for your request..."
                      }
                      className="resize-none"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {isLoading ? "Generating..." : "Get Advice"}
            </Button>
          </form>
        </Form>

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

         {isLoading && (
          <div className="mt-6 space-y-2">
            <div className="animate-pulse h-4 bg-muted rounded w-1/4"></div>
            <div className="animate-pulse h-4 bg-muted rounded w-full"></div>
            <div className="animate-pulse h-4 bg-muted rounded w-3/4"></div>
            <div className="animate-pulse h-4 bg-muted rounded w-1/2"></div>
          </div>
        )}

         {aiResponse && !isLoading && (
           <Card className="mt-6 bg-secondary">
            <CardHeader>
              <CardTitle className="text-lg text-secondary-foreground">AI Response</CardTitle>
            </CardHeader>
             <CardContent className="text-secondary-foreground whitespace-pre-wrap">
              {aiResponse}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

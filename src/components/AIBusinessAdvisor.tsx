
// src/components/AIBusinessAdvisor.tsx
"use client";

import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import { Terminal, Search, Link as LinkIcon } from "lucide-react";
import { generateBusinessPlanDraft } from '@/ai/flows/business-plan-generator';
import { estimateStartupCosts } from '@/ai/flows/startup-cost-estimator';
import { summarizeMarketResearch } from '@/ai/flows/market-research-summary';
import { generateBusinessNames } from '@/ai/flows/business-name-generator';
import { findGrants, type GrantFinderOutput } from '@/ai/flows/grant-finder-flow';
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FormSchema = z.object({
  queryType: z.enum(["business_plan", "cost_estimation", "market_research", "name_generation", "grant_finder"], {
     required_error: "Please select a query type.",
   }),
  details: z.string().min(10, {
    message: "Please provide more details (at least 10 characters). For business plan or grant finding, this should be a detailed business description.",
  }),
  // Conditional fields
  location: z.string().optional(),
  businessType: z.string().optional(), // Used by cost estimation & market research
  targetMarket: z.string().optional(), // Used by market research
  keywords: z.string().optional(), // Used by name generation
  industry: z.string().optional(), // Used by name generation & grant finder
});

interface AIResponse {
  type: "text" | "grants";
  content: string | GrantFinderOutput;
}

export function AIBusinessAdvisor() {
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
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
          setAiResponse({type: "text", content: result.businessPlanDraft});
          break;
        case 'cost_estimation':
          if (!data.businessType || !data.location) throw new Error("Business type and location are required for cost estimation.");
          result = await estimateStartupCosts({ businessType: data.businessType, location: data.location, description: data.details });
          setAiResponse({type: "text", content: `Estimated Costs:\n${result.estimatedCosts}\n\nFunding Options:\n${result.fundingOptions}`});
          break;
        case 'market_research':
           if (!data.businessType || !data.targetMarket) throw new Error("Business type and target market are required for market research.");
          result = await summarizeMarketResearch({ businessType: data.businessType, targetMarket: data.targetMarket });
          setAiResponse({type: "text", content: result.summary});
          break;
        case 'name_generation':
           if (!data.keywords || !data.industry) throw new Error("Keywords and industry are required for name generation.");
          result = await generateBusinessNames({ keywords: data.keywords, industry: data.industry });
           setAiResponse({type: "text", content: `Suggested Names:\n- ${result.names.join('\n- ')}`});
          break;
        case 'grant_finder':
          if (!data.details || !data.industry || !data.location) throw new Error("Business description, industry, and location are required for grant finding.");
          result = await findGrants({ businessDescription: data.details, industry: data.industry, location: data.location });
          setAiResponse({type: "grants", content: result});
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

  const renderGrantSuggestions = (grantData: GrantFinderOutput) => {
    return (
      <div className="space-y-6">
        <div>
          <h4 className="text-md font-semibold mb-2 text-foreground">Grant Suggestions:</h4>
          {grantData.grantSuggestions.length > 0 ? (
            <ul className="space-y-4">
              {grantData.grantSuggestions.map((grant, index) => (
                <li key={index} className="p-3 border rounded-md bg-background shadow-sm">
                  <h5 className="font-semibold text-primary">{grant.grantName}</h5>
                  <p className="text-sm text-muted-foreground mt-1"><strong className="text-foreground">Source:</strong> {grant.source}</p>
                  <p className="text-sm text-muted-foreground mt-1"><strong className="text-foreground">Description:</strong> {grant.description}</p>
                  <p className="text-sm text-muted-foreground mt-1"><strong className="text-foreground">Eligibility:</strong> {grant.eligibilityCriteria}</p>
                  {grant.potentialAmount && <p className="text-sm text-muted-foreground mt-1"><strong className="text-foreground">Potential Amount:</strong> {grant.potentialAmount}</p>}
                  {grant.applicationLink && (
                    <a href={grant.applicationLink} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline mt-1 flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" /> Application Link
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No specific grant suggestions found based on the provided details. Try broadening your search or using the keywords below.</p>
          )}
        </div>
        <div>
          <h4 className="text-md font-semibold mb-2 text-foreground">Recommended Search Keywords:</h4>
          {grantData.searchKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {grantData.searchKeywords.map((keyword, index) => (
                <span key={index} className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">{keyword}</span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No specific keywords generated.</p>
          )}
           <a href="https://www.grants.gov" target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline mt-3 inline-flex items-center gap-1">
              <Search className="w-3 h-3" /> Search on Grants.gov
            </a>
        </div>
         {grantData.additionalAdvice && (
          <div>
            <h4 className="text-md font-semibold mb-2 text-foreground">Additional Advice:</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{grantData.additionalAdvice}</p>
          </div>
        )}
      </div>
    );
  };


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
                      <SelectItem value="grant_finder">Find Grant Opportunities</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(queryType === 'cost_estimation' || queryType === 'grant_finder') && (
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Location (City, State)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Austin, TX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}
            
            {(queryType === 'cost_estimation' || queryType === 'market_research') && (
                 <FormField
                  control={form.control}
                  name="businessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Coffee Shop, SaaS, Non-profit" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}

            {queryType === 'market_research' && (
                <FormField
                  control={form.control}
                  name="targetMarket"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Market</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Freelancers, Gen Z, Local community" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}

             {(queryType === 'name_generation' || queryType === 'grant_finder') && (
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Technology, Food & Beverage, Healthcare" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}
            
            {queryType === 'name_generation' && (
                 <FormField
                  control={form.control}
                  name="keywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keywords for Name Generation</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., sustainable, coffee, tech, community" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}


             <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {queryType === 'business_plan' || queryType === 'grant_finder' ? "Detailed Business Description" :
                     queryType === 'cost_estimation' ? "Additional Context / Business Details" :
                     "Details / Context for your request"}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                         queryType === 'business_plan' ? "Describe your business idea, mission, products/services, target market, etc." :
                         queryType === 'grant_finder' ? "Provide a comprehensive description of your business, its goals, impact, and what you might use grant funding for." :
                         queryType === 'cost_estimation' ? "Any specifics about your planned operations, scale, or unique needs." :
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
             <CardContent className="text-secondary-foreground">
              {aiResponse.type === 'text' && <div className="whitespace-pre-wrap">{aiResponse.content as string}</div>}
              {aiResponse.type === 'grants' && renderGrantSuggestions(aiResponse.content as GrantFinderOutput)}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}


// src/components/AIBusinessAdvisor.tsx
"use client";

import React, { useState, useEffect } from 'react';
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
import { Terminal, Search, Link as LinkIcon, Presentation } from "lucide-react";
import { generateBusinessPlanDraft } from '@/ai/flows/business-plan-generator';
import { estimateStartupCosts } from '@/ai/flows/startup-cost-estimator';
import { summarizeMarketResearch } from '@/ai/flows/market-research-summary';
import { generateBusinessNames } from '@/ai/flows/business-name-generator';
import { findGrants, type GrantFinderOutput } from '@/ai/flows/grant-finder-flow';
import { generatePitchDeckContent, type PitchDeckCreatorOutput } from '@/ai/flows/pitch-deck-creator';
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAchievementStatus } from '@/lib/achievementUtils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


// Define types for props and state
export interface AdvisorTaskInfo {
  id: string;
  label: string;
}

interface AIBusinessAdvisorProps {
  allTasks: AdvisorTaskInfo[];
}

const FormSchema = z.object({
  queryType: z.enum(["business_plan", "cost_estimation", "market_research", "name_generation", "grant_finder", "pitch_deck_creator"], {
     required_error: "Please select a query type.",
   }),
  details: z.string().min(10, {
    message: "Please provide more details (at least 10 characters). This is often the main business description.",
  }),
  // Conditional fields
  location: z.string().optional(), // Used by cost estimation & grant finder
  businessType: z.string().optional(), // Used by cost estimation & market research
  targetMarket: z.string().optional(), // Used by market research & pitch deck
  keywords: z.string().optional(), // Used by name generation
  industry: z.string().optional(), // Used by name generation & grant finder
  problemSolved: z.string().optional(), // pitch deck
  solutionOffered: z.string().optional(), // pitch deck
  teamOverview: z.string().optional(), // pitch deck
  financialHighlights: z.string().optional(), // pitch deck
  fundingAsk: z.string().optional(), // pitch deck
});

interface AIResponse {
  type: "text" | "grants" | "pitch_deck";
  content: string | GrantFinderOutput | PitchDeckCreatorOutput;
}

export function AIBusinessAdvisor({ allTasks }: AIBusinessAdvisorProps) {
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedTaskLabels, setCompletedTaskLabels] = useState<string[]>([]);

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
      problemSolved: "",
      solutionOffered: "",
      teamOverview: "",
      financialHighlights: "",
      fundingAsk: "",
    },
  });

  const queryType = form.watch("queryType");

  useEffect(() => {
    const loadCompletedTasks = () => {
      if (typeof window !== 'undefined' && allTasks) {
        const currentCompletedLabels = allTasks
          .filter(task => getAchievementStatus(task.id))
          .map(task => task.label);
        setCompletedTaskLabels(currentCompletedLabels);
      }
    };

    loadCompletedTasks(); 

    const handleAchievementUpdate = () => {
      loadCompletedTasks(); 
    };

    window.addEventListener('achievementUpdate', handleAchievementUpdate);
    return () => {
      window.removeEventListener('achievementUpdate', handleAchievementUpdate);
    };
  }, [allTasks]);

  const getCompletedTasksContext = (): string => {
    if (completedTaskLabels.length > 0) {
      return `The user has indicated progress or completion on the following tasks: ${completedTaskLabels.join(', ')}. Please consider this context.`;
    }
    return "";
  }


  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    setError(null);
    setAiResponse(null);
    const context = getCompletedTasksContext();

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
        case 'pitch_deck_creator':
          if (!data.details || !data.problemSolved || !data.solutionOffered || !data.targetMarket) {
            throw new Error("Business description, problem, solution, and target market are required for pitch deck creation.");
          }
          result = await generatePitchDeckContent({
            businessDescription: data.details,
            problemSolved: data.problemSolved,
            solutionOffered: data.solutionOffered,
            targetMarket: data.targetMarket,
            teamOverview: data.teamOverview,
            financialHighlights: data.financialHighlights,
            fundingAsk: data.fundingAsk,
            completedTasksContext: context,
          });
          setAiResponse({ type: "pitch_deck", content: result });
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

  const getDynamicPlaceholder = (fieldName: 'details' | 'problemSolved' | 'solutionOffered' | 'targetMarket' | 'teamOverview' | 'financialHighlights' | 'fundingAsk' ) => {
    const businessPlanTaskLabel = "Write your business plan";
    const startupCostsTaskLabel = "Calculate your startup costs";
    const marketResearchTaskLabel = "Market research and competitive analysis";

    if (fieldName === 'details') {
      switch (queryType) {
        case 'business_plan':
          return completedTaskLabels.includes(businessPlanTaskLabel)
            ? "Your 'Write your business plan' task is complete. How can I help refine it? E.g., 'Help me strengthen the executive summary' or 'Review my financial projections section'."
            : "Describe your business idea, mission, products/services, target market, etc., to generate a business plan draft.";
        case 'cost_estimation':
          return completedTaskLabels.includes(startupCostsTaskLabel)
            ? "You've calculated startup costs. Need help finding funding options based on these costs, or perhaps a review of your cost breakdown?"
            : "Provide specifics about your planned operations, scale, or unique needs for a startup cost estimate.";
        case 'market_research':
          return completedTaskLabels.includes(marketResearchTaskLabel)
              ? "Market research task is complete. Need to dive deeper into a specific competitor, trend, or generate marketing ideas based on your research?"
              : "Describe your business type and target market for a research summary.";
        case 'grant_finder':
          return "Provide a comprehensive description of your business, its goals, impact, and what you might use grant funding for.";
        case 'pitch_deck_creator':
          return completedTaskLabels.includes(businessPlanTaskLabel)
            ? "You've started your business plan. Use key details from it here for your overall business description."
            : "Provide a concise, compelling overview of your business. What is its core mission and value proposition?";
        default:
          return "Provide context for your request...";
      }
    }
    if (queryType === 'pitch_deck_creator') {
        switch(fieldName) {
            case 'problemSolved':
                return "What specific pain point or unmet need does your business address for customers?";
            case 'solutionOffered':
                return "How do your products/services uniquely solve this problem? What are the key benefits?";
            case 'targetMarket':
                return completedTaskLabels.includes(marketResearchTaskLabel)
                ? "You've done market research. Summarize your target audience, market size, and growth potential."
                : "Who are your ideal customers? Describe the market segment you're targeting and its size.";
            case 'teamOverview':
                return "Briefly introduce key team members and highlight relevant experience or expertise.";
            case 'financialHighlights':
                return "Mention any key financial projections, current traction (users, revenue), or important milestones achieved/expected.";
            case 'fundingAsk':
                return "If seeking investment, how much are you asking for and how will the funds be utilized?";
        }
    }
    return "Enter details...";
  };

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

  const renderPitchDeckContent = (pitchDeckData: PitchDeckCreatorOutput) => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-primary">{pitchDeckData.pitchTitleSuggestion || "Pitch Deck Outline"}</h3>
        {pitchDeckData.slides.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {pitchDeckData.slides.map((slide, index) => (
              <AccordionItem value={`slide-${index}`} key={index}>
                <AccordionTrigger className="text-left hover:no-underline">
                    <div className="flex items-center gap-2">
                        <Presentation className="w-4 h-4 text-accent"/>
                        {slide.title}
                    </div>
                </AccordionTrigger>
                <AccordionContent className="bg-background p-4 rounded-b-md">
                  <h5 className="font-semibold mb-2 text-foreground">Content Suggestions:</h5>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    {slide.contentSuggestions.map((suggestion, sIndex) => (
                      <li key={sIndex}>{suggestion}</li>
                    ))}
                  </ul>
                  {slide.speakerNotes && (
                    <>
                      <h5 className="font-semibold mt-3 mb-2 text-foreground">Speaker Notes:</h5>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{slide.speakerNotes}</p>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-sm text-muted-foreground">No slide suggestions generated. Please refine your input.</p>
        )}
        {pitchDeckData.additionalTips && pitchDeckData.additionalTips.length > 0 && (
          <div>
            <h4 className="text-md font-semibold mb-2 text-foreground">Additional Pitch Tips:</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              {pitchDeckData.additionalTips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
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
          Ask for tailored advice based on your business needs. Select a query type and provide details. Your progress from checklists is considered!
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
                      <SelectItem value="pitch_deck_creator">Create Pitch Deck Content</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Details Textarea - Common for most queries */}
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {queryType === 'business_plan' ? "Business Description / Plan Section to Refine" :
                     queryType === 'grant_finder' ? "Detailed Business Description for Grant Search" :
                     queryType === 'cost_estimation' ? "Business Details for Cost Estimation" :
                     queryType === 'pitch_deck_creator' ? "Overall Business Description/Mission" :
                     "Details / Context for your request"}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={getDynamicPlaceholder('details')}
                      className="resize-none"
                      rows={queryType === 'pitch_deck_creator' ? 3 : 5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conditional fields based on queryType */}
            {(queryType === 'cost_estimation' || queryType === 'grant_finder') && (
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Location (City, State)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Austin, TX or Denver, CO" {...field} />
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

            {(queryType === 'market_research' || queryType === 'pitch_deck_creator') && (
                <FormField
                  control={form.control}
                  name="targetMarket"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Market</FormLabel>
                      <FormControl>
                        <Input placeholder={getDynamicPlaceholder('targetMarket')} {...field} />
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

            {/* Fields for Pitch Deck Creator */}
            {queryType === 'pitch_deck_creator' && (
              <>
                <FormField
                  control={form.control}
                  name="problemSolved"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Problem Solved</FormLabel>
                      <FormControl>
                        <Textarea placeholder={getDynamicPlaceholder('problemSolved')} className="resize-none" rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="solutionOffered"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Solution Offered</FormLabel>
                      <FormControl>
                        <Textarea placeholder={getDynamicPlaceholder('solutionOffered')} className="resize-none" rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="teamOverview"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Overview (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder={getDynamicPlaceholder('teamOverview')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="financialHighlights"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Financial Highlights/Traction (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder={getDynamicPlaceholder('financialHighlights')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="fundingAsk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Funding Ask (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder={getDynamicPlaceholder('fundingAsk')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

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
              {aiResponse.type === 'pitch_deck' && renderPitchDeckContent(aiResponse.content as PitchDeckCreatorOutput)}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

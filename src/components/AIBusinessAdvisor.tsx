
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
import { Terminal, Search, Link as LinkIcon, Presentation, FileText as FileTextIcon, MessageSquareQuote, Mail, Send } from "lucide-react";
import { generateBusinessPlanSection, type GenerateSectionInput, type GenerateSectionOutput } from '@/ai/flows/business-plan-generator';
import { estimateStartupCosts } from '@/ai/flows/startup-cost-estimator';
import { summarizeMarketResearch } from '@/ai/flows/market-research-summary';
import { generateBusinessNames } from '@/ai/flows/business-name-generator';
import { findGrants, type GrantFinderOutput } from '@/ai/flows/grant-finder-flow';
import { generatePitchDeckContent, type PitchDeckCreatorOutput } from '@/ai/flows/pitch-deck-creator';
import { getColoradoRegistrationGuide, type ColoradoRegistrationGuideOutput } from '@/ai/flows/colorado-business-registration-guide';
import { analyzeText, type TextAnalysisOutput } from '@/ai/flows/text-analyzer-flow';
import { draftEmailReply, type DraftEmailReplyOutput } from '@/ai/flows/draft-email-reply-flow';
import { draftColdOutreachEmail, type DraftColdOutreachEmailOutput } from '@/ai/flows/cold-outreach-email-drafter';
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
  queryType: z.enum(["business_plan", "cost_estimation", "market_research", "name_generation", "grant_finder", "pitch_deck_creator", "colorado_registration_guide", "text_analyzer", "draft_email_reply", "cold_outreach_email_drafter"], {
     required_error: "Please select a query type.",
   }),
  details: z.string().min(10, {
    message: "Please provide more details (at least 10 characters).",
  }),
  // Common fields repurposed or optional
  location: z.string().optional(), 
  businessType: z.string().optional(), 
  targetMarket: z.string().optional(), 
  keywords: z.string().optional(), 
  industry: z.string().optional(), 
  // Pitch deck specific
  problemSolved: z.string().optional(),
  solutionOffered: z.string().optional(),
  teamOverview: z.string().optional(),
  financialHighlights: z.string().optional(),
  fundingAsk: z.string().optional(),
  // Text_analyzer specific
  analysisType: z.enum(['sentiment', 'keywords_summary']).optional(),
  // Email reply drafter specific (customerInquiry is mapped from 'details')
  businessContext: z.string().optional(),
  desiredTone: z.enum(["Formal", "Friendly", "Empathetic", "Concise", "Detailed"]).optional(),
  keyPointsToInclude: z.string().optional(), // Will be split into array
  // Cold Outreach Email Drafter specific
  outreachTargetAudience: z.string().optional(),
  outreachValueProposition: z.string().optional(),
  outreachDesiredOutcome: z.string().optional(),
  outreachBusinessName: z.string().optional(),
  outreachSenderName: z.string().optional(),
  outreachTone: z.enum(["Professional", "Friendly", "Direct", "Persuasive", "Enthusiastic"]).optional(),
  outreachCompanyBrief: z.string().optional(), // 'details' can be company brief here
});

interface AIResponse {
  type: "text" | "grants" | "pitch_deck" | "structured_guide" | "text_analysis" | "email_reply" | "cold_outreach_email";
  content: string | GrantFinderOutput | PitchDeckCreatorOutput | ColoradoRegistrationGuideOutput | TextAnalysisOutput | DraftEmailReplyOutput | DraftColdOutreachEmailOutput;
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
      analysisType: "sentiment",
      businessContext: "",
      desiredTone: "Friendly",
      keyPointsToInclude: "",
      outreachTargetAudience: "",
      outreachValueProposition: "",
      outreachDesiredOutcome: "",
      outreachBusinessName: "",
      outreachSenderName: "",
      outreachTone: "Professional",
      outreachCompanyBrief: "",
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
      return `The user has indicated progress or completion on the following tasks: ${completedTaskLabels.join(', ')}. Please consider this context when generating your response.`;
    }
    return "The user has not yet marked any specific tasks as completed. Provide foundational advice.";
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
          if (!data.details) throw new Error("Business description (overall concept) is required.");
          // For the AI Advisor, this will now generate the Executive Summary as a starting point
          result = await generateBusinessPlanSection({
            overallBusinessConcept: data.details,
            sectionName: "Executive Summary", // Defaulting to Executive Summary
            // existingContent is not provided here for a new draft from the advisor
            completedTasksContext: context, 
          });
          setAiResponse({ type: "text", content: result.generatedContent });
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
        case 'colorado_registration_guide':
          if (!data.details) throw new Error("Business description is required for the Colorado registration guide.");
          result = await getColoradoRegistrationGuide({
            businessDescription: data.details,
            businessType: data.businessType,
            completedTasksContext: context,
          });
          setAiResponse({ type: "structured_guide", content: result });
          break;
        case 'text_analyzer':
          if (!data.details) throw new Error("Text to analyze is required.");
          result = await analyzeText({
            textToAnalyze: data.details,
            analysisType: data.analysisType || 'sentiment',
            completedTasksContext: context,
          });
          setAiResponse({ type: "text_analysis", content: result });
          break;
        case 'draft_email_reply':
          if (!data.details || !data.businessContext) throw new Error("Customer inquiry and business context are required for drafting an email reply.");
          const keyPointsArray = data.keyPointsToInclude?.split('\n').filter(point => point.trim() !== '') || [];
          result = await draftEmailReply({
            customerInquiry: data.details,
            businessContext: data.businessContext!,
            desiredTone: data.desiredTone || 'Friendly',
            keyPointsToInclude: keyPointsArray,
            completedTasksContext: context,
          });
          setAiResponse({ type: "email_reply", content: result });
          break;
        case 'cold_outreach_email_drafter':
          if (!data.outreachTargetAudience || !data.outreachValueProposition || !data.outreachDesiredOutcome || !data.outreachBusinessName || !data.outreachSenderName) {
            throw new Error("Target audience, value proposition, desired outcome, business name, and sender name are required for cold outreach emails.");
          }
          result = await draftColdOutreachEmail({
            targetAudience: data.outreachTargetAudience,
            valueProposition: data.outreachValueProposition,
            desiredOutcome: data.outreachDesiredOutcome,
            businessName: data.outreachBusinessName,
            senderName: data.outreachSenderName,
            tone: data.outreachTone || 'Professional',
            companyBrief: data.details, // 'details' field used for companyBrief here
            completedTasksContext: context,
          });
          setAiResponse({ type: "cold_outreach_email", content: result });
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

  const getDynamicPlaceholder = (fieldName: 'details' | 'problemSolved' | 'solutionOffered' | 'targetMarket' | 'teamOverview' | 'financialHighlights' | 'fundingAsk' | 'businessContext' | 'keyPointsToInclude' | 'outreachTargetAudience' | 'outreachValueProposition' | 'outreachDesiredOutcome' | 'outreachBusinessName' | 'outreachSenderName') => {
    const businessPlanTaskLabel = "Write your business plan";
    const startupCostsTaskLabel = "Calculate your startup costs";
    const marketResearchTaskLabel = "Market research and competitive analysis";
    const registerBusinessTaskLabel = "Register your business";
    const analyzeFeedbackTaskLabel = "Analyze Customer Feedback using AI";

    if (fieldName === 'details') { 
      switch (queryType) {
        case 'business_plan':
          return completedTaskLabels.includes(businessPlanTaskLabel)
            ? "You've started your business plan. Provide your overall business concept to generate a starting Executive Summary, or to refine a specific section using the Interactive Business Plan tool."
            : "Describe your business idea, mission, products/services, target market, etc., to generate an Executive Summary draft.";
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
        case 'colorado_registration_guide':
          return completedTaskLabels.includes(registerBusinessTaskLabel)
            ? "You've started registering your business. What specific questions do you have about Colorado registration, or which part needs clarification?"
            : "Briefly describe your business. If you know your intended business structure (e.g., LLC, sole proprietorship), include that for more tailored Colorado registration advice.";
        case 'text_analyzer':
          return completedTaskLabels.includes(analyzeFeedbackTaskLabel)
            ? "Paste customer feedback, reviews, or any text here to analyze its sentiment and extract keywords. For example, 'Our customers love the new feature, but some find it a bit confusing to set up.'"
            : "Enter any text (e.g., customer review, survey response, competitor ad copy) to analyze sentiment and keywords.";
        case 'draft_email_reply':
          return "Paste the full customer email or message here.";
        case 'cold_outreach_email_drafter':
            return "Briefly describe your company (1-2 sentences) to give context for the outreach email. This will be used as 'Company Brief'.";
        default:
          return "Provide context for your request...";
      }
    }
    if (queryType === 'pitch_deck_creator') {
        switch(fieldName) {
            case 'problemSolved': return "What specific pain point or unmet need does your business address for customers?";
            case 'solutionOffered': return "How do your products/services uniquely solve this problem? What are the key benefits?";
            case 'targetMarket': return completedTaskLabels.includes(marketResearchTaskLabel) ? "You've done market research. Summarize your target audience, market size, and growth potential." : "Who are your ideal customers? Describe the market segment you're targeting and its size.";
            case 'teamOverview': return "Briefly introduce key team members and highlight relevant experience or expertise.";
            case 'financialHighlights': return "Mention any key financial projections, current traction (users, revenue), or important milestones achieved/expected.";
            case 'fundingAsk': return "If seeking investment, how much are you asking for and how will the funds be utilized?";
        }
    }
    if (queryType === 'draft_email_reply') {
      switch(fieldName) {
        case 'businessContext': return "Briefly describe your business/product/service that the customer is asking about. E.g., 'We are an online bookstore specializing in rare books.'";
        case 'keyPointsToInclude': return "List any specific points or information you MUST include in the reply, one per line. E.g.,\n- Mention the 10% discount code: SAVE10\n- Our return policy is 30 days";
      }
    }
     if (queryType === 'cold_outreach_email_drafter') {
        switch(fieldName) {
            case 'outreachTargetAudience': return "e.g., Marketing VPs at Series B tech companies";
            case 'outreachValueProposition': return "e.g., Our AI tool increases lead conversion by 30%";
            case 'outreachDesiredOutcome': return "e.g., Schedule a 15-minute demo";
            case 'outreachBusinessName': return "e.g., Innovatech Solutions";
            case 'outreachSenderName': return "e.g., Jane Doe";
        }
    }
    return "Enter details...";
  };

  const renderGrantSuggestions = (grantData: GrantFinderOutput) => (
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

  const renderPitchDeckContent = (pitchDeckData: PitchDeckCreatorOutput) => (
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

  const renderStructuredGuide = (guideData: ColoradoRegistrationGuideOutput) => (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{guideData.introduction}</p>
        {guideData.guideSections.length > 0 ? (
          <Accordion type="single" collapsible className="w-full" defaultValue="section-0">
            {guideData.guideSections.map((section, index) => (
              <AccordionItem value={`section-${index}`} key={index}>
                <AccordionTrigger className="text-left hover:no-underline">
                    <div className="flex items-center gap-2">
                        <FileTextIcon className="w-4 h-4 text-accent"/>
                        {section.title}
                    </div>
                </AccordionTrigger>
                <AccordionContent className="bg-background p-4 rounded-b-md space-y-3">
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: section.content.replace(/\n/g, '<br />') }} />
                  {section.relevantLinks && section.relevantLinks.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold text-foreground mb-1">Relevant Links:</h5>
                      <ul className="space-y-1">
                        {section.relevantLinks.map((link, lIndex) => (
                          <li key={lIndex}>
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline flex items-center gap-1">
                              <LinkIcon className="w-3 h-3" /> {link.text}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-sm text-muted-foreground">No guide sections available. Please refine your input.</p>
        )}
        {guideData.nextStepsSuggestion && (
          <div>
            <h4 className="text-md font-semibold mb-2 text-foreground">Next Steps:</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{guideData.nextStepsSuggestion}</p>
          </div>
        )}
      </div>
  );

  const renderTextAnalysis = (analysisData: TextAnalysisOutput) => (
      <div className="space-y-4">
        <div>
          <h4 className="text-md font-semibold text-foreground">Sentiment:</h4>
          <p className="text-sm text-muted-foreground">{analysisData.sentiment} {analysisData.sentimentScore && `(Score: ${analysisData.sentimentScore.toFixed(2)})`}</p>
        </div>
        <div>
          <h4 className="text-md font-semibold text-foreground">Summary:</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysisData.summary}</p>
        </div>
        {analysisData.keywords && analysisData.keywords.length > 0 && (
          <div>
            <h4 className="text-md font-semibold text-foreground">Keywords:</h4>
            <div className="flex flex-wrap gap-2 mt-1">
              {analysisData.keywords.map((keyword, index) => (
                <span key={index} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">{keyword}</span>
              ))}
            </div>
          </div>
        )}
      </div>
  );

  const renderEmailReply = (emailData: DraftEmailReplyOutput) => (
      <div className="space-y-4">
        {emailData.suggestedSubjectLine && (
          <div>
            <h4 className="text-md font-semibold text-foreground">Suggested Subject:</h4>
            <p className="text-sm text-muted-foreground p-2 bg-background border rounded-md">{emailData.suggestedSubjectLine}</p>
          </div>
        )}
        <div>
          <h4 className="text-md font-semibold text-foreground">Draft Reply:</h4>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap p-3 bg-background border rounded-md">{emailData.draftReply}</div>
        </div>
      </div>
  );

  const renderColdOutreachEmail = (emailData: DraftColdOutreachEmailOutput) => (
    <div className="space-y-4">
        <div>
          <h4 className="text-md font-semibold text-foreground">Suggested Subject:</h4>
          <p className="text-sm text-muted-foreground p-2 bg-background border rounded-md">{emailData.draftEmailSubject}</p>
        </div>
        <div>
          <h4 className="text-md font-semibold text-foreground">Draft Email Body:</h4>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap p-3 bg-background border rounded-md">{emailData.draftEmailBody}</div>
        </div>
      </div>
  );


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
                      <SelectItem value="business_plan">Generate Executive Summary Draft</SelectItem>
                      <SelectItem value="cost_estimation">Estimate Startup Costs</SelectItem>
                      <SelectItem value="market_research">Summarize Market Research</SelectItem>
                      <SelectItem value="name_generation">Generate Business Names</SelectItem>
                      <SelectItem value="grant_finder">Find Grant Opportunities</SelectItem>
                      <SelectItem value="pitch_deck_creator">Create Pitch Deck Content</SelectItem>
                      <SelectItem value="colorado_registration_guide">Colorado Business Registration Guide</SelectItem>
                      <SelectItem value="text_analyzer">Analyze Text (Sentiment/Keywords)</SelectItem>
                      <SelectItem value="draft_email_reply">Draft Email Reply (Inbound)</SelectItem>
                      <SelectItem value="cold_outreach_email_drafter">Draft Cold Outreach Email</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="details" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {queryType === 'business_plan' ? "Overall Business Concept / Idea" :
                     queryType === 'grant_finder' ? "Detailed Business Description for Grant Search" :
                     queryType === 'cost_estimation' ? "Business Details for Cost Estimation" :
                     queryType === 'pitch_deck_creator' ? "Overall Business Description/Mission" :
                     queryType === 'colorado_registration_guide' ? "Business Description for Registration Guide" :
                     queryType === 'text_analyzer' ? "Text to Analyze" :
                     queryType === 'draft_email_reply' ? "Customer Inquiry (Email/Message)" :
                     queryType === 'cold_outreach_email_drafter' ? "Brief Company Context / Key Selling Points" :
                     "Details / Context for your request"}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={getDynamicPlaceholder('details')}
                      className="resize-none"
                      rows={queryType === 'draft_email_reply' || queryType === 'text_analyzer' || queryType === 'cold_outreach_email_drafter' ? 5 : 3}
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
            
            {(queryType === 'cost_estimation' || queryType === 'market_research' || queryType === 'colorado_registration_guide') && (
                 <FormField
                  control={form.control}
                  name="businessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {queryType === 'colorado_registration_guide' ? "Potential Business Type (e.g., LLC, Sole Prop)" : "Business Type"}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Coffee Shop, SaaS, LLC, Non-profit" {...field} />
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
            
            {queryType === 'text_analyzer' && (
              <FormField
                control={form.control}
                name="analysisType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Analysis Type</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value || 'sentiment'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select analysis type..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sentiment">Sentiment & Keyword Analysis</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {queryType === 'pitch_deck_creator' && (
              <>
                <FormField control={form.control} name="problemSolved" render={({ field }) => (<FormItem><FormLabel>Problem Solved</FormLabel><FormControl><Textarea placeholder={getDynamicPlaceholder('problemSolved')} className="resize-none" rows={2} {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="solutionOffered" render={({ field }) => (<FormItem><FormLabel>Solution Offered</FormLabel><FormControl><Textarea placeholder={getDynamicPlaceholder('solutionOffered')} className="resize-none" rows={2} {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="teamOverview" render={({ field }) => (<FormItem><FormLabel>Team Overview (Optional)</FormLabel><FormControl><Input placeholder={getDynamicPlaceholder('teamOverview')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="financialHighlights" render={({ field }) => (<FormItem><FormLabel>Financial Highlights/Traction (Optional)</FormLabel><FormControl><Input placeholder={getDynamicPlaceholder('financialHighlights')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="fundingAsk" render={({ field }) => (<FormItem><FormLabel>Funding Ask (Optional)</FormLabel><FormControl><Input placeholder={getDynamicPlaceholder('fundingAsk')} {...field} /></FormControl><FormMessage /></FormItem>)} />
              </>
            )}

            {queryType === 'draft_email_reply' && (
              <>
                <FormField control={form.control} name="businessContext" render={({ field }) => (<FormItem><FormLabel>Your Business Context for this Reply</FormLabel><FormControl><Textarea placeholder={getDynamicPlaceholder('businessContext')} className="resize-none" rows={2} {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="desiredTone" render={({ field }) => (<FormItem><FormLabel>Desired Tone</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value || "Friendly"}><FormControl><SelectTrigger><SelectValue placeholder="Select a tone..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="Friendly">Friendly</SelectItem><SelectItem value="Formal">Formal</SelectItem><SelectItem value="Empathetic">Empathetic</SelectItem><SelectItem value="Concise">Concise</SelectItem><SelectItem value="Detailed">Detailed</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="keyPointsToInclude" render={({ field }) => (<FormItem><FormLabel>Key Points to Include (Optional, one per line)</FormLabel><FormControl><Textarea placeholder={getDynamicPlaceholder('keyPointsToInclude')} className="resize-none" rows={3} {...field} /></FormControl><FormMessage /></FormItem>)} />
              </>
            )}

            {/* Fields for Cold Outreach Email Drafter */}
            {queryType === 'cold_outreach_email_drafter' && (
              <>
                <FormField control={form.control} name="outreachTargetAudience" render={({ field }) => (<FormItem><FormLabel>Target Audience</FormLabel><FormControl><Input placeholder={getDynamicPlaceholder('outreachTargetAudience')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="outreachValueProposition" render={({ field }) => (<FormItem><FormLabel>Value Proposition</FormLabel><FormControl><Textarea placeholder={getDynamicPlaceholder('outreachValueProposition')} className="resize-none" rows={2} {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="outreachDesiredOutcome" render={({ field }) => (<FormItem><FormLabel>Desired Outcome</FormLabel><FormControl><Input placeholder={getDynamicPlaceholder('outreachDesiredOutcome')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="outreachBusinessName" render={({ field }) => (<FormItem><FormLabel>Your Business Name</FormLabel><FormControl><Input placeholder={getDynamicPlaceholder('outreachBusinessName')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="outreachSenderName" render={({ field }) => (<FormItem><FormLabel>Your Name (Sender)</FormLabel><FormControl><Input placeholder={getDynamicPlaceholder('outreachSenderName')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="outreachTone" render={({ field }) => (<FormItem><FormLabel>Desired Tone</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value || "Professional"}><FormControl><SelectTrigger><SelectValue placeholder="Select a tone..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="Professional">Professional</SelectItem><SelectItem value="Friendly">Friendly</SelectItem><SelectItem value="Direct">Direct</SelectItem><SelectItem value="Persuasive">Persuasive</SelectItem><SelectItem value="Enthusiastic">Enthusiastic</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
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
              <CardTitle className="text-lg text-secondary-foreground flex items-center gap-2">
                {aiResponse.type === 'text_analysis' ? <MessageSquareQuote className="w-5 h-5" /> : 
                 aiResponse.type === 'email_reply' ? <Mail className="w-5 h-5" /> : 
                 aiResponse.type === 'cold_outreach_email' ? <Send className="w-5 h-5" /> :
                 <Terminal className="w-5 h-5" />}
                 AI Response
              </CardTitle>
            </CardHeader>
             <CardContent className="text-secondary-foreground">
              {aiResponse.type === 'text' && <div className="whitespace-pre-wrap">{aiResponse.content as string}</div>}
              {aiResponse.type === 'grants' && renderGrantSuggestions(aiResponse.content as GrantFinderOutput)}
              {aiResponse.type === 'pitch_deck' && renderPitchDeckContent(aiResponse.content as PitchDeckCreatorOutput)}
              {aiResponse.type === 'structured_guide' && renderStructuredGuide(aiResponse.content as ColoradoRegistrationGuideOutput)}
              {aiResponse.type === 'text_analysis' && renderTextAnalysis(aiResponse.content as TextAnalysisOutput)}
              {aiResponse.type === 'email_reply' && renderEmailReply(aiResponse.content as DraftEmailReplyOutput)}
              {aiResponse.type === 'cold_outreach_email' && renderColdOutreachEmail(aiResponse.content as DraftColdOutreachEmailOutput)}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}


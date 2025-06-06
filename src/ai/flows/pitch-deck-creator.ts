
'use server';
/**
 * @fileOverview An AI agent that helps generate content for a business pitch deck.
 *
 * - generatePitchDeckContent - A function that generates pitch deck slide ideas.
 * - PitchDeckCreatorInput - The input type for the generatePitchDeckContent function.
 * - PitchDeckCreatorOutput - The return type for the generatePitchDeckContent function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const PitchDeckSlideSchema = z.object({
  title: z.string().describe('The title of the pitch deck slide (e.g., "Problem", "Solution", "Market Size").'),
  contentSuggestions: z.array(z.string()).describe('Key bullet points or content suggestions for this slide.'),
  speakerNotes: z.string().optional().describe('Optional speaker notes or talking points for this slide.'),
});

const PitchDeckCreatorInputSchema = z.object({
  businessDescription: z
    .string()
    .describe('A detailed description of the business, its mission, products/services.'),
  problemSolved: z.string().describe('The core problem the business is solving for its customers.'),
  solutionOffered: z.string().describe('How the business solves this problem with its products/services.'),
  targetMarket: z
    .string()
    .describe('A description of the target customer base and market size/opportunity.'),
  teamOverview: z
    .string()
    .optional()
    .describe('A brief overview of the key team members and their expertise.'),
  financialHighlights: z
    .string()
    .optional()
    .describe('Key financial projections, milestones, or traction (e.g., "Projecting $100k revenue in Year 1", "Acquired 500 beta users").'),
  fundingAsk: z
    .string()
    .optional()
    .describe('The amount of funding being sought and how it will be used (if applicable).'),
  completedTasksContext: z
    .string()
    .optional()
    .describe('Context about the user\'s progress in their business journey (e.g., "User has completed market research and drafted a business plan.").'),
});
export type PitchDeckCreatorInput = z.infer<typeof PitchDeckCreatorInputSchema>;

const PitchDeckCreatorOutputSchema = z.object({
  pitchTitleSuggestion: z.string().describe("A catchy title suggestion for the overall pitch deck."),
  slides: z
    .array(PitchDeckSlideSchema)
    .describe('An array of suggested pitch deck slides with content points.'),
  additionalTips: z.array(z.string()).optional().describe("General tips for delivering a compelling pitch."),
});
export type PitchDeckCreatorOutput = z.infer<typeof PitchDeckCreatorOutputSchema>;

export async function generatePitchDeckContent(
  input: PitchDeckCreatorInput
): Promise<PitchDeckCreatorOutput> {
  return pitchDeckCreatorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'pitchDeckCreatorPrompt',
  input: {schema: PitchDeckCreatorInputSchema},
  output: {schema: PitchDeckCreatorOutputSchema},
  prompt: `You are an expert pitch deck consultant. Your goal is to help a user generate a compelling pitch deck outline and key content points based on their business information.

Consider the following user progress context if provided: {{{completedTasksContext}}}

Business Information:
- Description: {{{businessDescription}}}
- Problem Solved: {{{problemSolved}}}
- Solution Offered: {{{solutionOffered}}}
- Target Market: {{{targetMarket}}}
{{#if teamOverview}}- Team Overview: {{{teamOverview}}}{{/if}}
{{#if financialHighlights}}- Financial Highlights: {{{financialHighlights}}}{{/if}}
{{#if fundingAsk}}- Funding Ask: {{{fundingAsk}}}{{/if}}

Please generate:
1. A catchy title suggestion for the overall pitch deck.
2. A list of standard pitch deck slides (e.g., Problem, Solution, Product, Target Market, Business Model, Team, Financials, Ask).
3. For each slide, provide:
    - A clear slide Title.
    - 3-5 key Content Suggestions (bullet points or concise statements).
    - Optional Speaker Notes with tips on what to emphasize.
4. Optional: Provide 2-3 general Additional Tips for delivering a compelling pitch.

Structure your output according to the defined schema. Focus on clarity, conciseness, and impact.
`,
});

const pitchDeckCreatorFlow = ai.defineFlow(
  {
    name: 'pitchDeckCreatorFlow',
    inputSchema: PitchDeckCreatorInputSchema,
    outputSchema: PitchDeckCreatorOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

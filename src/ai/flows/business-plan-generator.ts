
'use server';
/**
 * @fileOverview An AI agent that helps generate or refine sections of a business plan.
 *
 * - generateBusinessPlanSection - A function that handles the business plan section generation/refinement.
 * - GenerateSectionInput - The input type for the generateBusinessPlanSection function.
 * - GenerateSectionOutput - The return type for the generateBusinessPlanSection function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Define standard business plan sections as an enum for better type safety
const BusinessPlanSectionEnum = z.enum([
  "Executive Summary",
  "Company Description",
  "Market Analysis",
  "Organization and Management",
  "Products or Services", // Corrected from "Service or Product Line" to match UI
  "Marketing and Sales Strategy",
  "Funding Request",
  "Financial Projections",
  "Appendix"
]);

const GenerateSectionInputSchema = z.object({
  overallBusinessConcept: z
    .string()
    .min(10, "Overall business concept must be at least 10 characters.")
    .describe("A concise description of the overall business idea, its mission, and core value proposition."),
  sectionName: BusinessPlanSectionEnum
    .describe("The specific section of the business plan to generate or refine."),
  existingContent: z
    .string()
    .optional()
    .describe("Any existing content for this section that the user has already written. The AI should build upon or refine this content if provided."),
  completedTasksContext: z
    .string()
    .optional()
    .describe('Context about the user\'s progress in their business journey (e.g., "User has completed market research and is now working on financial projections.").'),
});
export type GenerateSectionInput = z.infer<typeof GenerateSectionInputSchema>;

const GenerateSectionOutputSchema = z.object({
  generatedContent: z.string().describe("The AI-generated or refined content for the specified business plan section."),
});
export type GenerateSectionOutput = z.infer<typeof GenerateSectionOutputSchema>;

export async function generateBusinessPlanSection(
  input: GenerateSectionInput
): Promise<GenerateSectionOutput> {
  // This function now directly calls the flow.
  // The `defineFlow` wrapper might seem redundant here if it's a 1:1 call,
  // but it's good practice for consistency and if we add more logic later.
  return generateBusinessPlanSectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBusinessPlanSectionPrompt',
  input: {schema: GenerateSectionInputSchema},
  output: {schema: GenerateSectionOutputSchema},
  prompt: `You are an expert AI business consultant specializing in crafting compelling business plan sections.
The user is building their business plan and needs assistance with a specific section.

Overall Business Concept:
{{{overallBusinessConcept}}}

Section to {{#if existingContent}}Refine{{else}}Draft{{/if}}: {{{sectionName}}}

{{#if existingContent}}
Existing Content for "{{sectionName}}" (Please refine or expand upon this):
{{{existingContent}}}
{{else}}
Please draft the "{{sectionName}}" section.
{{/if}}

{{#if completedTasksContext}}
User's Business Journey Progress (for context): {{{completedTasksContext}}}
{{/if}}

Guidelines for "{{sectionName}}":
{{#if (eq sectionName "Executive Summary")}}
- Briefly summarize the entire business plan. Highlight key points: mission, vision, products/services, target market, competitive advantage, financial highlights, and funding request (if any). Make it compelling and concise (usually 1-2 pages).
{{else if (eq sectionName "Company Description")}}
- Detail the nature of the business, its legal structure, mission statement, vision, core values, objectives, and competitive advantages. Include history if relevant.
{{else if (eq sectionName "Market Analysis")}}
- Describe the target market: demographics, psychographics, needs. Analyze the industry: size, trends, growth potential. Detail the competitive landscape: key competitors, their strengths/weaknesses, and your differentiation.
{{else if (eq sectionName "Organization and Management")}}
- Outline the organizational structure. Detail the key management team members, their expertise, roles, and responsibilities. Include an organizational chart if helpful. Mention advisory board if any.
{{else if (eq sectionName "Products or Services")}}
- Clearly describe your products or services. Explain how they benefit customers and what problems they solve. Detail any unique features, competitive advantages, lifecycle, and intellectual property (if any).
{{else if (eq sectionName "Marketing and Sales Strategy")}}
- Explain how you will reach your target market (promotion). Detail your pricing strategy, sales process, and distribution channels.
{{else if (eq sectionName "FundingRequest")}}
- If seeking funding, specify the amount required. Detail how the funds will be used (e.g., R&D, marketing, working capital). Outline future funding plans if applicable. If not seeking funding currently, this section can be brief or state that.
{{else if (eq sectionName "Financial Projections")}}
- Provide realistic financial forecasts for at least 3-5 years. Include income statements, cash flow statements, and balance sheets. List key assumptions. This section is critical for investors. (Note: As an AI, I can help structure this but actual numbers must come from the user).
{{else if (eq sectionName "Appendix")}}
- Include supporting documents such as resumes of key personnel, permits, licenses, detailed market research data, letters of intent, etc. (Note: As an AI, I can list what *could* go here).
{{/if}}

Based on the above, provide the 'generatedContent' for the "{{sectionName}}" section. Ensure it is well-written, professional, and tailored to the overall business concept.
If existing content was provided, integrate it smoothly into your response or offer clear suggestions for improvement.
Focus only on the requested section.
`,
});

// Renamed flow and function for clarity.
const generateBusinessPlanSectionFlow = ai.defineFlow(
  {
    name: 'generateBusinessPlanSectionFlow',
    inputSchema: GenerateSectionInputSchema,
    outputSchema: GenerateSectionOutputSchema,
  },
  async (input: GenerateSectionInput) => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("AI did not return an output for the business plan section.");
    }
    return output;
  }
);

    
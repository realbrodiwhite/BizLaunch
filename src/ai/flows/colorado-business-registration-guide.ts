'use server';
/**
 * @fileOverview An AI agent that provides a guide for registering a business in Colorado.
 *
 * - getColoradoRegistrationGuide - A function that generates the registration guide.
 * - ColoradoRegistrationGuideInput - The input type for the getColoradoRegistrationGuide function.
 * - ColoradoRegistrationGuideOutput - The return type for the getColoradoRegistrationGuide function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ColoradoRegistrationGuideInputSchema = z.object({
  businessDescription: z
    .string()
    .describe('A brief description of the business and its planned activities.'),
  businessType: z.string().optional().describe('The potential legal structure (e.g., LLC, Sole Proprietorship, Corporation). If known, this helps tailor advice.'),
  completedTasksContext: z
    .string()
    .optional()
    .describe('Context about the user\'s progress in their business journey (e.g., "User has completed market research and drafted a business plan.").'),
});
export type ColoradoRegistrationGuideInput = z.infer<typeof ColoradoRegistrationGuideInputSchema>;

const GuideSectionSchema = z.object({
    title: z.string().describe('The title of this section of the guide.'),
    content: z.string().describe('Detailed content for this section, can include steps, advice, and links. Use markdown for formatting, especially for links e.g., [Link Text](URL).'),
    relevantLinks: z.array(z.object({
        text: z.string().describe("The display text for the link."),
        url: z.string().url().describe("The URL for the resource.")
    })).optional().describe("A list of relevant hyperlinks for this section.")
});

const ColoradoRegistrationGuideOutputSchema = z.object({
  introduction: z.string().describe("A brief introduction to business registration in Colorado."),
  guideSections: z
    .array(GuideSectionSchema)
    .describe('An array of structured sections forming the registration guide.'),
  nextStepsSuggestion: z.string().optional().describe("A suggestion for what the user might focus on next after reviewing the guide.")
});
export type ColoradoRegistrationGuideOutput = z.infer<typeof ColoradoRegistrationGuideOutputSchema>;

export async function getColoradoRegistrationGuide(
  input: ColoradoRegistrationGuideInput
): Promise<ColoradoRegistrationGuideOutput> {
  return coloradoRegistrationGuideFlow(input);
}

const prompt = ai.definePrompt({
  name: 'coloradoRegistrationGuidePrompt',
  input: {schema: ColoradoRegistrationGuideInputSchema},
  output: {schema: ColoradoRegistrationGuideOutputSchema},
  prompt: `You are an expert AI business advisor specializing in Colorado business registration.
Your goal is to provide a clear, step-by-step guide for registering a business in Colorado.
The user has provided the following information:
Business Description: {{{businessDescription}}}
{{#if businessType}}Potential Business Type: {{{businessType}}}{{/if}}
{{#if completedTasksContext}}User Progress Context: {{{completedTasksContext}}}{{/if}}

Please generate a comprehensive guide covering the following topics, tailored to Colorado:
1.  **Introduction**: Briefly explain the importance of proper registration.
2.  **Key Considerations Before Filing**:
    *   Choosing a Business Name (including name availability search in Colorado).
    *   Deciding on a Business Structure (LLC, Sole Proprietorship, Corporation, Partnership - briefly explain each and mention Colorado specifics if any).
    *   Registered Agent requirements in Colorado.
3.  **Core Registration Steps with the Colorado Secretary of State (SOS)**:
    *   How to file (Online via MyBizColorado portal).
    *   Information typically required for filing (varies by structure, but general items).
    *   Mention Periodic Reports.
4.  **Obtaining an Employer IdentificationNumber (EIN)** from the IRS (when it's needed).
5.  **State Tax Obligations**:
    *   Registering with the Colorado Department of Revenue (CDOR) for state taxes (sales tax, wage withholding, etc.).
    *   Mentioning the Colorado Account Number (CAN).
6.  **Local Licenses and Permits**:
    *   Briefly mention the need to check with city/county for local requirements.
7.  **Next Steps Suggestion**: Based on the context, what should the user focus on next regarding registration?

For each section in 'guideSections':
- Provide a clear 'title'.
- 'content' should be informative, actionable, and use Markdown for formatting (e.g., bolding, bullet points).
- 'relevantLinks' should be an array of objects with 'text' and 'url'. Prioritize official Colorado government resources (e.g., Colorado SOS, MyBizColorado, CDOR, IRS).

Example for a relevantLink: { text: "Colorado Secretary of State", url: "https://www.sos.state.co.us/" }

Focus on providing accurate, Colorado-specific information. Be encouraging and clear.
Structure your output strictly according to the 'ColoradoRegistrationGuideOutputSchema'.
`,
});

const coloradoRegistrationGuideFlow = ai.defineFlow(
  {
    name: 'coloradoRegistrationGuideFlow',
    inputSchema: ColoradoRegistrationGuideInputSchema,
    outputSchema: ColoradoRegistrationGuideOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

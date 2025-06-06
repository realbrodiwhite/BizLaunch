
'use server';
/**
 * @fileOverview An AI agent that helps find potential grant opportunities for businesses.
 *
 * - findGrants - A function that finds grant opportunities.
 * - GrantFinderInput - The input type for the findGrants function.
 * - GrantFinderOutput - The return type for the findGrants function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GrantFinderInputSchema = z.object({
  businessDescription: z
    .string()
    .describe('A detailed description of the business, its mission, and activities.'),
  industry: z
    .string()
    .describe(
      'The primary industry the business operates in (e.g., Technology, Healthcare, Education, Retail).'
    ),
  location: z
    .string()
    .describe(
      'The city and state where the business is or will be primarily located (e.g., Austin, TX).'
    ),
});
export type GrantFinderInput = z.infer<typeof GrantFinderInputSchema>;

const GrantSuggestionSchema = z.object({
  grantName: z.string().describe('The official name of the grant.'),
  description: z
    .string()
    .describe('A brief summary of the grant and its purpose.'),
  eligibilityCriteria: z
    .string()
    .describe('Key eligibility requirements for the grant.'),
  potentialAmount: z
    .string()
    .optional()
    .describe('Estimated or typical grant amount, if available.'),
  applicationLink: z
    .string()
    .url()
    .optional()
    .describe(
      'A direct URL to the grant application or information page, if available.'
    ),
  source: z
    .string()
    .describe(
      'The organization or platform offering the grant (e.g., SBA, Grants.gov, specific foundation).'
    ),
});

const GrantFinderOutputSchema = z.object({
  grantSuggestions: z
    .array(GrantSuggestionSchema)
    .describe('A list of potential grant opportunities.'),
  searchKeywords: z
    .array(z.string())
    .describe(
      'Recommended keywords for searching on platforms like Grants.gov.'
    ),
  additionalAdvice: z.string().optional().describe('Any other relevant advice for finding grants.')
});
export type GrantFinderOutput = z.infer<typeof GrantFinderOutputSchema>;

export async function findGrants(
  input: GrantFinderInput
): Promise<GrantFinderOutput> {
  return grantFinderFlow(input);
}

const prompt = ai.definePrompt({
  name: 'grantFinderPrompt',
  input: {schema: GrantFinderInputSchema},
  output: {schema: GrantFinderOutputSchema},
  prompt: `You are an expert grant research specialist. Your goal is to identify potential grant opportunities for a business based on the provided details.

Business Description: {{{businessDescription}}}
Industry: {{{industry}}}
Location: {{{location}}}

Please provide:
1. A list of specific grant suggestions. For each grant, include:
    - Grant Name
    - Description
    - Key Eligibility Criteria
    - Potential Amount (if commonly known, otherwise omit)
    - Application Link (if a direct link is discoverable, otherwise omit)
    - Source (e.g., SBA, specific foundation, Grants.gov listing if specific enough)
2. A list of recommended search keywords that the user can use on platforms like Grants.gov or other grant databases to find more opportunities.
3. Any additional brief advice for finding grants, such as types of organizations to look for locally.

Focus on federal, state, and prominent private foundation grants relevant to the business type, industry, and location. If specific grants are hard to find, emphasize providing strong search keywords and general advice on where to look (e.g., state economic development websites, industry-specific foundations). Ensure application links are valid URLs if provided.
`,
});

const grantFinderFlow = ai.defineFlow(
  {
    name: 'grantFinderFlow',
    inputSchema: GrantFinderInputSchema,
    outputSchema: GrantFinderOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

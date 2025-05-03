'use server';

/**
 * @fileOverview Generates a summary of market research based on a business type and target market.
 *
 * - summarizeMarketResearch - A function that generates the market research summary.
 * - MarketResearchInput - The input type for the summarizeMarketResearch function.
 * - MarketResearchOutput - The return type for the summarizeMarketResearch function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const MarketResearchInputSchema = z.object({
  businessType: z.string().describe('The type of business (e.g., coffee shop, online store).'),
  targetMarket: z.string().describe('The target market for the business (e.g., students, young professionals).'),
});
export type MarketResearchInput = z.infer<typeof MarketResearchInputSchema>;

const MarketResearchOutputSchema = z.object({
  summary: z.string().describe('A summary of the market research for the specified business type and target market.'),
});
export type MarketResearchOutput = z.infer<typeof MarketResearchOutputSchema>;

export async function summarizeMarketResearch(input: MarketResearchInput): Promise<MarketResearchOutput> {
  return summarizeMarketResearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeMarketResearchPrompt',
  input: {
    schema: z.object({
      businessType: z.string().describe('The type of business.'),
      targetMarket: z.string().describe('The target market.'),
    }),
  },
  output: {
    schema: z.object({
      summary: z.string().describe('A summary of the market research.'),
    }),
  },
  prompt: `You are an expert market research analyst. Generate a summary of the market research for a business of type {{{businessType}}} targeting the market {{{targetMarket}}}. The summary should include market size, trends, and competitive landscape. Focus on the key aspects a business owner should consider when assessing market viability.
`,
});

const summarizeMarketResearchFlow = ai.defineFlow<
  typeof MarketResearchInputSchema,
  typeof MarketResearchOutputSchema
>({
  name: 'summarizeMarketResearchFlow',
  inputSchema: MarketResearchInputSchema,
  outputSchema: MarketResearchOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});

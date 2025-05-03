'use server';

/**
 * @fileOverview Estimates startup costs based on business type and location.
 *
 * - estimateStartupCosts - A function that estimates startup costs.
 * - StartupCostInput - The input type for the estimateStartupCosts function.
 * - StartupCostOutput - The return type for the estimateStartupCosts function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const StartupCostInputSchema = z.object({
  businessType: z.string().describe('The type of business (e.g., restaurant, retail store, online service).'),
  location: z.string().describe('The location where the business will operate (e.g., city, state).'),
  description: z.string().optional().describe('Any additional information about the startup to provide more accurate estimate.'),
});
export type StartupCostInput = z.infer<typeof StartupCostInputSchema>;

const StartupCostOutputSchema = z.object({
  estimatedCosts: z.string().describe('An estimated range of startup costs, with a breakdown of major expenses.'),
  fundingOptions: z.string().describe('Potential funding options and resources for the business.'),
});
export type StartupCostOutput = z.infer<typeof StartupCostOutputSchema>;

export async function estimateStartupCosts(input: StartupCostInput): Promise<StartupCostOutput> {
  return startupCostEstimatorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'startupCostEstimatorPrompt',
  input: {
    schema: z.object({
      businessType: z.string().describe('The type of business (e.g., restaurant, retail store, online service).'),
      location: z.string().describe('The location where the business will operate (e.g., city, state).'),
      description: z.string().optional().describe('Any additional information about the startup to provide more accurate estimate.'),
    }),
  },
  output: {
    schema: z.object({
      estimatedCosts: z.string().describe('An estimated range of startup costs, with a breakdown of major expenses.'),
      fundingOptions: z.string().describe('Potential funding options and resources for the business.'),
    }),
  },
  prompt: `You are an expert business consultant specializing in startup costs.

  Based on the type of business, its location, and any provided description, estimate the startup costs and provide potential funding options.

  Type of Business: {{{businessType}}}
  Location: {{{location}}}
  Description: {{{description}}}

  Provide a detailed estimate of startup costs, including a breakdown of expenses such as rent, equipment, inventory, and marketing. Also, list potential funding options for this business.
  `,
});

const startupCostEstimatorFlow = ai.defineFlow<
  typeof StartupCostInputSchema,
  typeof StartupCostOutputSchema
>({
  name: 'startupCostEstimatorFlow',
  inputSchema: StartupCostInputSchema,
  outputSchema: StartupCostOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});

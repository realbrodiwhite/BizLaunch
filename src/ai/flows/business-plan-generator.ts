'use server';
/**
 * @fileOverview A business plan generator AI agent.
 *
 * - generateBusinessPlanDraft - A function that handles the business plan generation process.
 * - GenerateBusinessPlanInput - The input type for the generateBusinessPlanDraft function.
 * - GenerateBusinessPlanOutput - The return type for the generateBusinessPlanDraft function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateBusinessPlanInputSchema = z.object({
  businessDescription: z
    .string()
    .describe('A short description of the business idea.'),
});
export type GenerateBusinessPlanInput = z.infer<typeof GenerateBusinessPlanInputSchema>;

const GenerateBusinessPlanOutputSchema = z.object({
  businessPlanDraft: z.string().describe('A draft of the business plan.'),
});
export type GenerateBusinessPlanOutput = z.infer<typeof GenerateBusinessPlanOutputSchema>;

export async function generateBusinessPlanDraft(
  input: GenerateBusinessPlanInput
): Promise<GenerateBusinessPlanOutput> {
  return generateBusinessPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBusinessPlanPrompt',
  input: {
    schema: z.object({
      businessDescription: z
        .string()
        .describe('A short description of the business idea.'),
    }),
  },
  output: {
    schema: z.object({
      businessPlanDraft: z.string().describe('A draft of the business plan.'),
    }),
  },
  prompt: `You are an AI business plan generator. You will use the following business description to generate a draft business plan.

Business Description: {{{businessDescription}}}

Business Plan Draft:
`,
});

const generateBusinessPlanFlow = ai.defineFlow<
  typeof GenerateBusinessPlanInputSchema,
  typeof GenerateBusinessPlanOutputSchema
>(
  {
    name: 'generateBusinessPlanFlow',
    inputSchema: GenerateBusinessPlanInputSchema,
    outputSchema: GenerateBusinessPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

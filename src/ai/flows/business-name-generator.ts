'use server';

/**
 * @fileOverview Generates business name ideas based on keywords and industry information.
 *
 * - generateBusinessNames - A function that generates business name ideas.
 * - GenerateBusinessNamesInput - The input type for the generateBusinessNames function.
 * - GenerateBusinessNamesOutput - The return type for the generateBusinessNames function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateBusinessNamesInputSchema = z.object({
  keywords: z.string().describe('Keywords related to the business.'),
  industry: z.string().describe('The industry of the business.'),
});
export type GenerateBusinessNamesInput = z.infer<typeof GenerateBusinessNamesInputSchema>;

const GenerateBusinessNamesOutputSchema = z.object({
  names: z.array(z.string()).describe('An array of generated business names.'),
});
export type GenerateBusinessNamesOutput = z.infer<typeof GenerateBusinessNamesOutputSchema>;

export async function generateBusinessNames(
  input: GenerateBusinessNamesInput
): Promise<GenerateBusinessNamesOutput> {
  return generateBusinessNamesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBusinessNamesPrompt',
  input: {
    schema: z.object({
      keywords: z.string().describe('Keywords related to the business.'),
      industry: z.string().describe('The industry of the business.'),
    }),
  },
  output: {
    schema: z.object({
      names: z.array(z.string()).describe('An array of generated business names.'),
    }),
  },
  prompt: `You are a creative business name generator. Generate a list of business names based on the provided keywords and industry.

Industry: {{{industry}}}
Keywords: {{{keywords}}}

Here are some possible business names:`, // added keywords
});

const generateBusinessNamesFlow = ai.defineFlow<
  typeof GenerateBusinessNamesInputSchema,
  typeof GenerateBusinessNamesOutputSchema
>({
  name: 'generateBusinessNamesFlow',
  inputSchema: GenerateBusinessNamesInputSchema,
  outputSchema: GenerateBusinessNamesOutputSchema,
},
async input => {
  const {output} = await prompt(input);
  return output!;
});

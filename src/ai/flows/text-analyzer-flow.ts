
'use server';
/**
 * @fileOverview An AI agent that analyzes text for sentiment and keywords.
 *
 * - analyzeText - A function that performs text analysis.
 * - TextAnalysisInput - The input type for the analyzeText function.
 * - TextAnalysisOutput - The return type for the analyzeText function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const TextAnalysisInputSchema = z.object({
  textToAnalyze: z.string().describe('The text content to be analyzed.'),
  analysisType: z.enum(['sentiment', 'keywords_summary']).default('sentiment').describe('The type of analysis to perform. Currently, only sentiment analysis is fully supported; keywords_summary will also perform sentiment and keyword extraction.'),
  completedTasksContext: z
    .string()
    .optional()
    .describe('Context about the user\'s progress in their business journey.'),
});
export type TextAnalysisInput = z.infer<typeof TextAnalysisInputSchema>;

const TextAnalysisOutputSchema = z.object({
  sentiment: z.string().describe('The overall sentiment detected in the text (e.g., Positive, Negative, Neutral).'),
  sentimentScore: z.number().optional().describe('A numerical score representing the sentiment, if available (e.g., between -1 for very negative and 1 for very positive).'),
  summary: z.string().describe('A brief summary highlighting the key points that led to the sentiment and overall meaning of the text.'),
  keywords: z.array(z.string()).optional().describe('A list of key terms or phrases identified in the text.'),
});
export type TextAnalysisOutput = z.infer<typeof TextAnalysisOutputSchema>;

export async function analyzeText(
  input: TextAnalysisInput
): Promise<TextAnalysisOutput> {
  return textAnalyzerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'textAnalyzerPrompt',
  input: {schema: TextAnalysisInputSchema},
  output: {schema: TextAnalysisOutputSchema},
  prompt: `You are an expert AI text analysis assistant. Your task is to analyze the provided text.
{{#if completedTasksContext}}
Consider the following user progress context: {{{completedTasksContext}}}
{{/if}}

Based on the 'analysisType' (currently focusing on sentiment-like analysis even if 'keywords_summary' is chosen):
1. Determine the overall sentiment (Positive, Negative, Neutral).
2. Optionally, provide a sentimentScore (e.g., a number between -1 and 1).
3. Provide a concise summary that explains the sentiment and captures the main points of the text.
4. Extract key terms or phrases.

Text to Analyze:
{{{textToAnalyze}}}

Provide your analysis in the specified output format.
`,
});

const textAnalyzerFlow = ai.defineFlow(
  {
    name: 'textAnalyzerFlow',
    inputSchema: TextAnalysisInputSchema,
    outputSchema: TextAnalysisOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

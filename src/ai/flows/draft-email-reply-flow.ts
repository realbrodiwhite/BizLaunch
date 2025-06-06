
'use server';
/**
 * @fileOverview An AI agent that helps draft email replies to customer inquiries.
 *
 * - draftEmailReply - A function that drafts an email reply.
 * - DraftEmailReplyInput - The input type for the draftEmailReply function.
 * - DraftEmailReplyOutput - The return type for the draftEmailReply function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const DraftEmailReplyInputSchema = z.object({
  customerInquiry: z.string().describe("The full text of the customer's email or message."),
  businessContext: z.string().describe("Brief description of your business, products, or services relevant to the inquiry. This helps tailor the reply accurately."),
  desiredTone: z.enum(["Formal", "Friendly", "Empathetic", "Concise", "Detailed"]).default("Friendly").describe("The desired tone for the email reply."),
  keyPointsToInclude: z.array(z.string()).optional().describe("Specific bullet points or information that must be included in the reply. Each string in the array is a separate point."),
  completedTasksContext: z
    .string()
    .optional()
    .describe('Context about the user\'s progress in their business journey.'),
});
export type DraftEmailReplyInput = z.infer<typeof DraftEmailReplyInputSchema>;

const DraftEmailReplyOutputSchema = z.object({
  draftReply: z.string().describe("The AI-generated draft email reply. It should be well-formatted (e.g., with appropriate line breaks) and ready to be copied. Start with a greeting and end with a closing."),
  suggestedSubjectLine: z.string().optional().describe("A suggested subject line for the reply email, especially if it's a new thread or the original subject is not suitable. Should be concise and relevant."),
});
export type DraftEmailReplyOutput = z.infer<typeof DraftEmailReplyOutputSchema>;

export async function draftEmailReply(
  input: DraftEmailReplyInput
): Promise<DraftEmailReplyOutput> {
  return draftEmailReplyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'draftEmailReplyPrompt',
  input: {schema: DraftEmailReplyInputSchema},
  output: {schema: DraftEmailReplyOutputSchema},
  prompt: `You are an expert AI assistant specializing in crafting professional and effective email replies for businesses.
The user needs help drafting a reply to a customer inquiry.

User's Business Context:
{{{businessContext}}}

Customer's Inquiry:
{{{customerInquiry}}}

Desired Tone for the Reply: {{{desiredTone}}}

{{#if keyPointsToInclude}}
Key Points to Incorporate in the Reply:
{{#each keyPointsToInclude}}
- {{{this}}}
{{/each}}
{{/if}}

{{#if completedTasksContext}}
User's Business Journey Progress: {{{completedTasksContext}}} (Use this for general awareness of the business's maturity, but focus on the specific inquiry).
{{/if}}

Please generate a draft email reply. The reply should:
- Directly address the customer's inquiry.
- Maintain the specified 'desiredTone'.
- Incorporate all 'keyPointsToInclude' naturally within the message.
- Be well-structured with a clear greeting, body, and closing.
- If the inquiry implies a problem, be empathetic and solution-oriented.
- If the inquiry is a sales lead, be persuasive and provide a clear call to action if appropriate.
- If the inquiry is a general question, be informative and helpful.
- Also, provide a 'suggestedSubjectLine' for the email. If replying to an existing email, the subject line can be "Re: [Original Subject]" or a more relevant one. If it's a new communication based on the inquiry, create a fresh, descriptive subject.

Output the response strictly according to the 'DraftEmailReplyOutputSchema'.
Ensure the 'draftReply' is formatted with appropriate line breaks for an email.
`,
});

const draftEmailReplyFlow = ai.defineFlow(
  {
    name: 'draftEmailReplyFlow',
    inputSchema: DraftEmailReplyInputSchema,
    outputSchema: DraftEmailReplyOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

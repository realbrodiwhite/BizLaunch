
'use server';
/**
 * @fileOverview An AI agent that helps draft cold outreach emails.
 *
 * - draftColdOutreachEmail - A function that drafts a cold outreach email.
 * - DraftColdOutreachEmailInput - The input type for the draftColdOutreachEmail function.
 * - DraftColdOutreachEmailOutput - The return type for the draftColdOutreachEmail function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const DraftColdOutreachEmailInputSchema = z.object({
  targetAudience: z.string().describe("Who is this email for? (e.g., 'Potential investors', 'Small business owners in the tech industry', 'Marketing managers at B2B SaaS companies')"),
  valueProposition: z.string().describe("What is the key value or benefit you are offering them? Be specific."),
  desiredOutcome: z.string().describe("What do you want the recipient to do after reading the email? (e.g., 'Schedule a 15-min discovery call', 'Visit our new product page', 'Register for our webinar')"),
  businessName: z.string().describe("Your company's name."),
  senderName: z.string().describe("Your name (the sender)."),
  tone: z.enum(["Professional", "Friendly", "Direct", "Persuasive", "Enthusiastic"]).default("Professional").describe("The desired tone for the email."),
  companyBrief: z.string().optional().describe("A very brief (1-2 sentences) description of your company for context, if not inherently clear from the value proposition."),
  completedTasksContext: z
    .string()
    .optional()
    .describe('Context about the user\'s progress in their business journey.'),
});
export type DraftColdOutreachEmailInput = z.infer<typeof DraftColdOutreachEmailInputSchema>;

const DraftColdOutreachEmailOutputSchema = z.object({
  draftEmailSubject: z.string().describe("A compelling and concise suggested subject line for the cold outreach email."),
  draftEmailBody: z.string().describe("The AI-generated draft email body. It should be well-formatted with a clear call to action, greeting, and closing."),
});
export type DraftColdOutreachEmailOutput = z.infer<typeof DraftColdOutreachEmailOutputSchema>;

export async function draftColdOutreachEmail(
  input: DraftColdOutreachEmailInput
): Promise<DraftColdOutreachEmailOutput> {
  return draftColdOutreachEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'draftColdOutreachEmailPrompt',
  input: {schema: DraftColdOutreachEmailInputSchema},
  output: {schema: DraftColdOutreachEmailOutputSchema},
  prompt: `You are an expert AI assistant specializing in crafting effective cold outreach emails for businesses.
The user needs help drafting a cold email.

User's Business & Outreach Goal:
- Target Audience: {{{targetAudience}}}
- Value Proposition: {{{valueProposition}}}
- Desired Outcome: {{{desiredOutcome}}}
- Business Name: {{{businessName}}}
- Sender Name: {{{senderName}}}
- Desired Tone: {{{tone}}}
{{#if companyBrief}}- Company Context: {{{companyBrief}}}{{/if}}

{{#if completedTasksContext}}
User's Business Journey Progress: {{{completedTasksContext}}} (Use this for general awareness, but focus on crafting an effective outreach email based on the specific inputs above).
{{/if}}

Please generate:
1.  A 'draftEmailSubject' that is concise, attention-grabbing, and relevant to the target audience and value proposition. Avoid overly salesy or generic subjects.
2.  A 'draftEmailBody' that:
    *   Starts with a personalized or relevant opening (even if generalized for a cold email).
    *   Clearly communicates the 'valueProposition' and its benefit to the 'targetAudience'.
    *   Includes a clear call to action aligned with the 'desiredOutcome'.
    *   Maintains the specified 'tone'.
    *   Is well-structured, concise, and easy to read.
    *   Ends with a professional closing including the 'senderName' and 'businessName'.

Output the response strictly according to the 'DraftColdOutreachEmailOutputSchema'.
Ensure the 'draftEmailBody' is formatted with appropriate line breaks.
Focus on creating an email that has a good chance of getting a positive response.
`,
});

const draftColdOutreachEmailFlow = ai.defineFlow(
  {
    name: 'draftColdOutreachEmailFlow',
    inputSchema: DraftColdOutreachEmailInputSchema,
    outputSchema: DraftColdOutreachEmailOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);


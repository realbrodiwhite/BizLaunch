
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
  "Products or Services", // Corrected from "Service or Product Line"
  "Marketing and Sales Strategy",
  "Funding Request", // Frontend might send "Funding Request (if applicable)"
  "Financial Projections",
  "Appendix" // Frontend might send "Appendix (optional)"
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
  // If the input.sectionName contains extra like "(if applicable)" or "(optional)",
  // we should strip it to match the enum.
  let cleanSectionName = input.sectionName;
  if (input.sectionName.includes(" (if applicable)")) {
    cleanSectionName = input.sectionName.replace(" (if applicable)", "") as typeof BusinessPlanSectionEnum._type;
  } else if (input.sectionName.includes(" (optional)")) {
    cleanSectionName = input.sectionName.replace(" (optional)", "") as typeof BusinessPlanSectionEnum._type;
  }
  
  const validatedInput = {
    ...input,
    sectionName: cleanSectionName
  };

  return generateBusinessPlanSectionFlow(validatedInput);
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
- **Objective**: Create a compelling, concise overview that captures the essence of the entire business plan. It's often written last but placed first.
- **Key Elements to Include**:
    - **Business Concept**: Briefly what your business is.
    - **Mission Statement**: Your business's purpose.
    - **Vision Statement**: Where you see the business going.
    - **Products/Services**: What you offer and its unique value proposition.
    - **Target Market**: Who your customers are.
    - **Competitive Advantage**: What makes you different/better.
    - **Management Team Highlights**: Briefly mention key team members and expertise.
    - **Financial Highlights**: Key financial projections (e.g., revenue, profit) and current status if applicable.
    - **Funding Request (if applicable)**: Amount sought and its primary use.
- **Tone**: Professional, confident, and engaging. It should make the reader want to learn more.
- **Length**: Typically 1-2 pages. Be succinct.
{{else if (eq sectionName "Company Description")}}
- **Objective**: Provide a detailed overview of the business, its structure, and its goals.
- **Key Elements to Include**:
    - **Nature of Business**: What industry are you in? What will you do?
    - **Legal Structure**: Sole proprietorship, partnership, LLC, corporation?
    - **Mission Statement**: Clearly state the purpose of your business.
    - **Vision Statement**: Describe the future you are working towards.
    - **Core Values**: What principles guide your business?
    - **Company History (if applicable)**: How did the business start? Key milestones.
    - **Objectives**: Specific short-term and long-term goals.
    - **Location and Facilities (if relevant)**.
    - **Competitive Advantages**: What unique strengths does your company possess?
{{else if (eq sectionName "Market Analysis")}}
- **Objective**: Demonstrate a strong understanding of your target market, industry, and competitive environment.
- **Key Elements to Include**:
    - **Target Market**:
        - Demographics: Age, gender, location, income, education.
        - Psychographics: Lifestyle, values, interests, buying behavior.
        - Needs and Pain Points: What problems does your target market face that you solve?
        - Market Size & Growth Potential: How large is this market and is it growing?
    - **Industry Analysis**:
        - Industry Overview: Current state, key trends, regulations.
        - Industry Size and Growth Rate: Data and forecasts.
        - Key Success Factors: What does it take to succeed in this industry?
    - **Competitive Landscape**:
        - Key Competitors: Direct and indirect.
        - Competitor Analysis: Their strengths, weaknesses, strategies, market share.
        - Your Competitive Differentiation: How are you better or different?
    - **SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats)** for your business in this market.
{{else if (eq sectionName "Organization and Management")}}
- **Objective**: Detail your company's organizational structure and the expertise of your management team.
- **Key Elements to Include**:
    - **Organizational Structure**: How is the company organized (e.g., functional, divisional)? An organizational chart can be helpful (describe it if you can't create one).
    - **Management Team**:
        - Key Personnel: Names, titles, roles, and responsibilities.
        - Bios/Expertise: Highlight relevant experience, skills, and accomplishments for each key member.
    - **Board of Directors/Advisory Board (if applicable)**: Members and their roles.
    - **Gaps in Management (if any)**: And how you plan to fill them.
    - **Personnel Plan**: Future hiring needs.
{{else if (eq sectionName "Products or Services")}}
- **Objective**: Clearly describe what you are selling and the value it provides to customers.
- **Key Elements to Include**:
    - **Detailed Description**: What are your products or services? How do they work?
    - **Customer Benefits**: What problems do they solve for the customer? What value do they offer?
    - **Unique Features**: What makes your offering stand out?
    - **Competitive Advantages**: Why is your offering superior to competitors'?
    - **Product/Service Lifecycle**: Where is it in its lifecycle (e.g., development, launch, growth)?
    - **Intellectual Property (if applicable)**: Patents, trademarks, copyrights.
    - **Research and Development (R&D)**: Any ongoing or planned R&D activities.
    - **Sourcing and Fulfillment (if applicable)**: How will you produce/deliver your offering?
{{else if (eq sectionName "Marketing and Sales Strategy")}}
- **Objective**: Explain how you will reach your target market, attract customers, and generate sales.
- **Key Elements to Include**:
    - **Target Market Recap**: Briefly reiterate who you're targeting.
    - **Positioning**: How do you want your brand/product to be perceived in the market?
    - **Marketing Strategy (The 4 P's or similar framework)**:
        - **Product**: (Covered in Products/Services, but briefly mention key value props here).
        - **Price**: Your pricing strategy (e.g., value-based, cost-plus, competitive) and specific price points.
        - **Place (Distribution)**: How will customers access your products/services (e.g., online, retail, direct sales)?
        - **Promotion**: How will you communicate with your target market? (Advertising, public relations, content marketing, social media, email marketing, sales promotions, events, etc.)
    - **Sales Strategy**:
        - Sales Process: How will you convert leads into customers?
        - Sales Team Structure (if applicable).
        - Sales Channels.
    - **Key Marketing and Sales Metrics**: How will you measure success (e.g., website traffic, conversion rates, customer acquisition cost)?
{{else if (eq sectionName "Funding Request")}}
- **Objective**: If seeking funding, clearly state how much you need, how you will use it, and the proposed terms. If not seeking funding, state that.
- **Key Elements to Include (if seeking funding)**:
    - **Current Funding Status**: How much have you raised to date, from whom?
    - **Amount of Funding Requested**: Be specific.
    - **Use of Funds**: Detailed breakdown of how the new capital will be spent (e.g., product development, marketing, working capital, equipment purchase, hiring key personnel).
    - **Type of Funding Sought**: Equity, debt, convertible note?
    - **Proposed Terms (if applicable/known)**: Valuation, interest rates, repayment schedule.
    - **Future Funding Plans**: Do you anticipate needing more funding rounds in the future?
- **If NOT seeking funding currently**: Briefly state this, e.g., "The company is currently bootstrapped and not seeking external funding at this time."
{{else if (eq sectionName "Financial Projections")}}
- **Objective**: Present realistic financial forecasts for your business. (Note: As an AI, I can help structure this section and explain what's needed, but actual numbers must come from the user or be based on their specific inputs if provided elsewhere.)
- **Key Elements to Include**:
    - **Assumptions**: Clearly list the key assumptions underlying your projections (e.g., sales growth rate, pricing, cost of goods sold percentage, key expense drivers).
    - **Income Statement (Profit & Loss)**: Projected for at least 3-5 years (monthly for the first year, then quarterly or annually). Shows revenues, cost of goods sold, gross profit, operating expenses, net profit.
    - **Cash Flow Statement**: Projected for at least 3-5 years. Shows cash inflows and outflows from operating, investing, and financing activities. Crucial for understanding liquidity.
    - **Balance Sheet**: Projected for at least 3-5 years. Shows assets, liabilities, and equity at specific points in time.
    - **Break-Even Analysis**: At what point (in sales volume or revenue) does your business cover all its costs?
    - **Key Financial Ratios/Metrics**: Relevant to your industry (e.g., gross profit margin, net profit margin, customer acquisition cost, lifetime value).
- **Guidance**: "Based on the overall business concept and any financial details provided, outline the structure for financial projections. Emphasize the need for realistic assumptions. For example, you can start by saying: 'Our financial projections for the next [3/5] years are based on the following key assumptions... We project revenues of X in Year 1, growing to Y by Year 3...'"
{{else if (eq sectionName "Appendix")}}
- **Objective**: Include supporting documents that are too detailed for the main body of the plan or provide additional credibility. (Note: As an AI, I can list common items that *could* go here.)
- **Common Items to Include**:
    - Resumes of key management personnel.
    - Letters of intent from potential customers or partners.
    - Detailed market research data or surveys.
    - Licenses, permits, or relevant legal documents.
    - Extended financial statements or spreadsheets.
    - Product specifications or technical drawings.
    - Leases or contracts.
    - List of references.
- **Guidance**: "Suggest a list of potential documents that could be included in the appendix, based on the type of business and information discussed in other sections."
{{/if}}

Based on the above, provide the 'generatedContent' for the "{{sectionName}}" section. Ensure it is well-written, professional, and tailored to the overall business concept.
If existing content was provided, integrate it smoothly into your response or offer clear suggestions for improvement.
Focus only on the requested section.
If a section is highly dependent on user-specific numbers (like detailed financial projections), guide the user on what to include and how to structure it, rather than inventing numbers.
`,
});

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

    

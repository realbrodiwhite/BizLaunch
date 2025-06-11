
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from "@/components/ui/sidebar";
import { Briefcase, Rocket, Settings, LineChart, Home as HomeIcon, Target, FileText, DollarSign, Building, CreditCard, PiggyBank, MapPin, Landmark, Users, ClipboardCheck, Banknote, ShieldCheck, ShoppingBag, BarChart2, Laptop, Siren, HeartHandshake, LandmarkIcon, Award, Trophy, Star, CheckCircle, Link as LinkIcon, Search, MessageSquareQuote, Mail, Send, UploadCloud, Wand2, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { AIBusinessAdvisor, type AdvisorTaskInfo } from "@/components/AIBusinessAdvisor";
import { ResourceHub } from "@/components/ResourceHub";
import { AchievementsDisplay } from "@/components/AchievementsDisplay";
import type { Achievement } from "@/lib/achievementUtils";
import { IconRenderer } from "@/components/IconRenderer";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { updateAchievementStatus, getAchievementStatus } from '@/lib/achievementUtils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Input } from '@/components/ui/input';
import { toast } from "@/hooks/use-toast";
import { storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytes } from 'firebase/storage';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from '@/lib/utils';

// Define new hierarchical task structure
export interface TaskActions {
  handleFileUpload: (file: File, taskId: string) => Promise<void>;
  setSelectedFile: (file: File | null) => void;
  selectedFile: File | null;
}

export interface WorksheetTask {
  id: string;
  label: string;
  completed: boolean;
  details?: React.ReactNode | ((actions: TaskActions) => React.ReactNode);
  subTasks?: WorksheetTask[];
  achievementName?: string;
  achievementDescription?: string;
  achievementIconName?: string;
  requiresUpload?: boolean;
  isInteractiveTool?: boolean;
  interactiveToolLink?: string;
  isExpanded?: boolean; // For UI state of sub-task visibility
}

export interface Stage {
  key: 'plan' | 'launch' | 'manage' | 'grow';
  title: string;
  icon: React.ElementType;
  tasks: WorksheetTask[];
}

const DASHBOARD_STATE_STORAGE_KEY = 'bizlaunch_dashboardState_v1';

// Function to get initial task details (simplified for sub-tasks)
const getWorksheetTaskDetails = (taskId: string, task: WorksheetTask, actions: TaskActions): React.ReactNode => {
  if (task.isInteractiveTool && task.interactiveToolLink) {
    return (
      <div className="mt-1">
        <p className="text-xs mb-1">This task involves using an interactive tool.</p>
        <Link href={task.interactiveToolLink} passHref>
          <Button size="sm" variant="outline" className="text-xs h-7">
            <Wand2 className="mr-1 h-3 w-3" /> Open {task.label} Tool
          </Button>
        </Link>
      </div>
    );
  }
  if (task.requiresUpload) {
     return (
      <div className="mt-1 space-y-1">
        <p className="text-xs">Upload relevant document(s) to mark this task complete (e.g., registration certificate, license application).</p>
        <Input
            type="file"
            id={`upload-${task.id}`}
            aria-label={`Upload for ${task.label}`}
            accept=".pdf,.doc,.docx,.jpg,.png"
            onChange={(e) => actions.setSelectedFile(e.target.files ? e.target.files[0] : null)}
            className="max-w-xs h-8 text-xs file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
          {actions.selectedFile && <p className="text-xs text-muted-foreground">Selected: {actions.selectedFile.name}</p>}
          <Button
            onClick={() => {
              if (actions.selectedFile) {
                actions.handleFileUpload(actions.selectedFile, task.id);
              } else {
                toast({ variant: "destructive", title: "No file selected", description: "Please select a document to upload." });
              }
            }}
            disabled={!actions.selectedFile}
            size="sm"
            className="text-xs h-7"
          >
            <UploadCloud className="mr-1 h-3 w-3" /> Upload & Complete
          </Button>
      </div>
     );
  }

  if (typeof task.details === 'function') return task.details(actions);
  if (typeof task.details === 'string' && task.details.startsWith('https://')) {
    return <a href={task.details} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-xs flex items-center gap-1"><LinkIcon className="w-3 h-3"/> Visit Link</a>;
  }
  if (task.details) return <p className="text-xs text-muted-foreground mt-1">{task.details}</p>;

  return null;
};


const initialStagesData: Stage[] = [
  {
    key: 'plan',
    title: 'Plan Your Business',
    icon: Briefcase,
    tasks: [
      {
        id: 'market-research',
        label: 'Market Research and Competitive Analysis',
        completed: false,
        achievementName: 'Market Maven', achievementDescription: 'Completed initial market research.', achievementIconName: 'Target',
        details: "Understand your customers, industry, and competitors. This involves identifying your target audience and their needs, analyzing market size, trends, and growth potential, and researching your direct and indirect competitors, their strengths, and weaknesses.",
        isExpanded: false,
        subTasks: [
          { id: 'mr-audience', label: 'Understand Your Target Audience', completed: false, isExpanded: false, subTasks: [
            { id: 'mr-audience-demographics', label: 'Define customer demographics (age, location, income)', completed: false, details: "E.g., Age 25-45, urban areas, income $50k+." },
            { id: 'mr-audience-psychographics', label: 'Identify psychographics (lifestyle, values, interests)', completed: false, details: "E.g., Environmentally conscious, tech-savvy, enjoys outdoor activities." },
            { id: 'mr-audience-needs', label: 'Determine customer needs and pain points', completed: false, details: "What problems are they trying to solve? What frustrates them with current solutions?" },
          ]},
          { id: 'mr-market', label: 'Analyze Market Size & Trends', completed: false, isExpanded: false, subTasks: [
            { id: 'mr-market-size', label: 'Research overall market size (TAM, SAM, SOM)', completed: false, details: "Total Addressable Market, Serviceable Addressable Market, Serviceable Obtainable Market." },
            { id: 'mr-market-trends', label: 'Identify current market trends (growth, new tech)', completed: false, details: "Is the market growing or declining? What new technologies or consumer behaviors are emerging?" },
            { id: 'mr-market-potential', label: 'Assess growth potential', completed: false, details: "What is the future outlook for this market?" },
          ]},
          { id: 'mr-competitors', label: 'Research Competitors', completed: false, isExpanded: false, subTasks: [
            { id: 'mr-competitors-direct', label: 'Identify direct competitors', completed: false, details: "Who offers similar products/services to the same target market?" },
            { id: 'mr-competitors-indirect', label: 'Identify indirect competitors', completed: false, details: "Who offers different products/services that solve the same customer problem?" },
            { id: 'mr-competitors-swot', label: 'Analyze competitor strengths & weaknesses', completed: false, details: "What do they do well? Where do they fall short?" },
            { id: 'mr-competitors-strategy', label: 'Review competitor pricing & marketing', completed: false, details: "How do they price their offerings? What marketing channels do they use?" },
          ]},
          { id: 'mr-document', label: 'Document Findings & Explore Resources', completed: false, isExpanded: false, details: (actions) => (
              <div className="text-xs">
                <p className="mb-1">Compile your research into a shareable format.</p>
                <a href="https://www.sba.gov/business-guide/plan-your-business/market-research-competitive-analysis" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center gap-1"><LinkIcon className="w-3 h-3"/> Explore SBA's Market Research Guide</a>
              </div>
          )},
        ],
      },
      {
        id: 'business-plan',
        label: 'Write Your Business Plan',
        completed: false,
        achievementName: 'Master Planner', achievementDescription: 'Drafted the business plan.', achievementIconName: 'FileText',
        isInteractiveTool: true, interactiveToolLink: '/dashboard/business-plan',
        details: (actions) => (
           <div className="text-xs">
             <p className="mb-1">Create a comprehensive roadmap for your business. Use our Interactive Business Plan tool!</p>
             <Link href="/dashboard/business-plan" passHref>
               <Button size="sm" variant="outline" className="text-xs h-7"><Wand2 className="mr-1 h-3 w-3" /> Open Business Plan Tool</Button>
             </Link>
           </div>
        ),
        isExpanded: false,
        subTasks: [
          { id: 'bp-executive-summary', label: 'Draft Executive Summary', completed: false, details: "A brief overview of the entire plan." },
          { id: 'bp-company-description', label: 'Define Company Description', completed: false, details: "Business nature, mission, vision, legal structure, objectives." },
          { id: 'bp-market-analysis-doc', label: 'Document Market Analysis Section', completed: false, isExpanded: false, subTasks: [
            {id: 'bp-ma-target', label: 'Summarize target market', completed: false, details: "Key characteristics of your ideal customers."},
            {id: 'bp-ma-industry', label: 'Describe industry overview', completed: false, details: "Current state, trends, and outlook of your industry."},
            {id: 'bp-ma-competition', label: 'Detail competitive landscape', completed: false, details: "Who are your competitors and what are their strengths/weaknesses?"},
            {id: 'bp-ma-swot', label: 'Conduct SWOT analysis for your business', completed: false, details: "Strengths, Weaknesses, Opportunities, Threats specific to your venture."},
          ]},
          { id: 'bp-organization-management', label: 'Outline Organization and Management', completed: false, details: "Team structure, key personnel, roles, expertise." },
          { id: 'bp-products-services', label: 'Describe Products or Services', completed: false, details: "What you sell, unique value proposition, benefits." },
          { id: 'bp-marketing-sales', label: 'Develop Marketing and Sales Strategy', completed: false, details: "How you'll reach customers and generate sales." },
          { id: 'bp-funding-request', label: 'Specify Funding Request (if applicable)', completed: false, details: "Amount needed, use of funds, terms." },
          { id: 'bp-financial-projections', label: 'Create Financial Projections', completed: false, details: "Income statement, cash flow, balance sheet forecasts." },
          { id: 'bp-appendix', label: 'Prepare Appendix (optional)', completed: false, details: "Supporting documents: resumes, permits, etc." },
        ],
      },
      { id: 'startup-costs', label: 'Calculate your startup costs', completed: false, achievementName: 'Cost Calculator', achievementDescription: 'Calculated initial startup costs.', achievementIconName: 'DollarSign', details: "Estimate initial investment: rent, equipment, inventory, marketing, etc. Use SBA guide or AI Advisor for help.", isInteractiveTool: true, interactiveToolLink: "#TODO_link_to_AI_advisor_cost_estimator_query" },
      { id: 'business-credit', label: 'Establish business credit', completed: false, achievementName: 'Credit Conscious', achievementDescription: 'Learned about business credit.', achievementIconName: 'CreditCard', details: "Register business, open business bank account, get EIN, establish trade lines. See SBA guide.", isExpanded: false, subTasks:[
        {id: 'bc-register', label: "Ensure business is legally registered", completed: false, details: "Complete all necessary business registration steps."},
        {id: 'bc-bank', label: "Open a business bank account", completed: false, details: "Keep business and personal finances separate."},
        {id: 'bc-ein', label: "Obtain an Employer Identification Number (EIN)", completed: false, details: "Necessary for tax purposes and banking."},
        {id: 'bc-tradelines', label: "Establish trade lines with suppliers", completed: false, details: "Apply for credit with vendors who report to credit bureaus."},
        {id: 'bc-monitor', label: "Monitor business credit reports", completed: false, details: "Regularly check reports from Dun & Bradstreet, Experian, Equifax."},
      ]},
      { id: 'fund-business', label: 'Fund your business', completed: false, achievementName: 'Funding Finder', achievementDescription: 'Explored funding options.', achievementIconName: 'PiggyBank', details: "Explore bootstrapping, loans (SBA), grants (AI Grant Finder), investors, crowdfunding. See SBA guide.", isInteractiveTool: true, interactiveToolLink: "#TODO_link_to_AI_advisor_grant_finder_query", isExpanded: false, subTasks:[
        {id: 'fb-personal', label: "Assess personal investment capacity (Bootstrapping)", completed: false, details: "Determine how much of your own money you can invest."},
        {id: 'fb-friends-family', label: "Consider friends and family loans/investment", completed: false, details: "Clearly define terms if pursuing this option."},
        {id: 'fb-loans', label: "Research small business loans (e.g., SBA loans)", completed: false, details: "Understand requirements and application processes."},
        {id: 'fb-grants', label: "Search for relevant grants", completed: false, details: "Use tools like our AI Grant Finder or Grants.gov."},
        {id: 'fb-investors', label: "Explore angel investors or venture capital", completed: false, details: "Prepare a pitch deck and research potential investors."},
        {id: 'fb-crowdfunding', label: "Evaluate crowdfunding platforms", completed: false, details: "Choose a platform that aligns with your business type."},
      ]},
      { id: 'buy-existing', label: 'Consider buying an existing business or franchise', completed: false, achievementName: 'Strategic Thinker', achievementDescription: 'Considered buying vs. starting.', achievementIconName: 'Building', details: "Weigh pros/cons (established base vs. cost/issues). Due diligence is key. See SBA resources.", isExpanded: false, subTasks: [
        {id: 'be-research', label: "Research available businesses/franchises", completed: false, details: "Look for opportunities in your desired industry and location."},
        {id: 'be-due-diligence', label: "Conduct thorough due diligence", completed: false, details: "Investigate financials, legal status, reputation, and operations."},
        {id: 'be-valuation', label: "Determine a fair valuation", completed: false, details: "Use multiple methods or hire a professional appraiser."},
        {id: 'be-financing', label: "Secure financing for acquisition", completed: false, details: "Explore SBA loans for business acquisition or seller financing."},
        {id: 'be-legal', label: "Consult with legal and financial advisors", completed: false, details: "Ensure all agreements are sound and protect your interests."},
      ]},
    ],
  },
  {
    key: 'launch',
    title: 'Launch Your Business',
    icon: Rocket,
    tasks: [
      { id: 'pick-location', label: 'Pick your business location', completed: false, achievementName: 'Location Scout', achievementDescription: 'Chose a business location.', achievementIconName: 'MapPin', details: "Consider business type, target market, zoning, costs, accessibility. See SBA guide.", isExpanded: false, subTasks: [
        {id: 'pl-zoning', label: "Analyze zoning laws and regulations", completed: false, details: "Ensure potential locations comply with local zoning ordinances."},
        {id: 'pl-accessibility', label: "Evaluate customer and employee accessibility", completed: false, details: "Consider parking, public transport, and foot traffic."},
        {id: 'pl-costs', label: "Compare lease terms and costs", completed: false, details: "If leasing, review rent, utilities, and other associated costs."},
        {id: 'pl-home-based', label: "Research home-based business requirements", completed: false, details: "If applicable, understand regulations for operating from home."},
        {id: 'pl-finalize', label: "Finalize location and secure lease/property", completed: false, details: "Complete necessary legal and financial steps to secure your location."},
      ]},
      { id: 'choose-structure', label: 'Choose a business structure', completed: false, achievementName: 'Structure Selector', achievementDescription: 'Selected a legal structure.', achievementIconName: 'Landmark', details: "Sole proprietorship, partnership, LLC, corporation. Impacts liability, taxes. See SBA & CO SOS guides.", isExpanded: false, subTasks: [
        {id: 'cs-understand', label: "Understand implications of different structures", completed: false, details: "Research Sole Proprietorship, Partnership, LLC, S-Corp, C-Corp."},
        {id: 'cs-consult', label: "Consult with legal/financial advisors", completed: false, details: "Get professional advice on the best structure for your situation."},
        {id: 'cs-decide', label: "Decide on the legal structure", completed: false, details: "Make the final decision based on your research and advice."},
      ]},
      { id: 'choose-name', label: 'Choose your business name', completed: false, achievementName: 'Name Giver', achievementDescription: 'Picked a business name.', achievementIconName: 'FileText', details: "Brainstorm, check availability (CO SOS, USPTO, domain). Use AI Name Generator. See SBA tips.", isInteractiveTool: true, interactiveToolLink: "#TODO_link_to_AI_advisor_name_generator_query", isExpanded: false, subTasks: [
        {id: 'cn-brainstorm', label: "Brainstorm name ideas reflecting your brand", completed: false, details: "Consider names that are memorable, relevant, and easy to pronounce."},
        {id: 'cn-check-availability', label: "Check name availability", completed: false, details: "Search CO SOS, USPTO, domain registrars, and social media."},
        {id: 'cn-trademark', label: "Verify name doesn't infringe on trademarks", completed: false, details: "Conduct a thorough trademark search."},
        {id: 'cn-register-name', label: "Register chosen business name (and DBA if needed)", completed: false, details: "File necessary paperwork with the state."},
      ]},
      { id: 'register-business', label: 'Register your business', completed: false, achievementName: 'Official Registrant', achievementDescription: 'Registered the business.', achievementIconName: 'ClipboardCheck', requiresUpload: true, details: "Formalize with government. Upload registration doc. CO: MyBizColorado. Use AI Advisor for CO guide.", isInteractiveTool: true, interactiveToolLink: "#TODO_link_to_AI_advisor_co_reg_guide_query", isExpanded: false, subTasks: [
        {id: 'rb-identify', label: "Identify necessary state/local registrations", completed: false, details: "E.g., Colorado Secretary of State for business entity formation."},
        {id: 'rb-file-docs', label: "File formation documents (Articles of Org./Incorp.)", completed: false, details: "Submit the correct forms for your chosen business structure."},
        {id: 'rb-obtain-docs', label: "Obtain official registration documents/certificates", completed: false, details: "Keep these safe for banking and other legal requirements."},
      ]},
      { id: 'get-tax-ids', label: 'Get federal and state tax ID numbers', completed: false, achievementName: 'Tax ID Acquirer', achievementDescription: 'Obtained necessary tax IDs.', achievementIconName: 'DollarSign', details: "Federal EIN from IRS. State tax ID from CDOR (Colorado).", isExpanded: false, subTasks: [
        {id: 'gt-ein', label: "Apply for an Employer Identification Number (EIN) from IRS", completed: false, details: "This is like a social security number for your business."},
        {id: 'gt-state-tax-id', label: "Register with Colorado Dept. of Revenue (CDOR)", completed: false, details: "For state taxes like sales tax, wage withholding, etc."},
      ]},
      { id: 'apply-licenses', label: 'Apply for licenses and permits', completed: false, achievementName: 'License Applicant', achievementDescription: 'Applied for required licenses.', achievementIconName: 'FileText', details: "Secure operational licenses. Use SBA tool & CO licensing directory.", requiresUpload: true, isExpanded: false, subTasks: [
        {id: 'al-identify', label: "Identify required federal, state, and local licenses/permits", completed: false, details: "Varies by industry, location, and business activities."},
        {id: 'al-prepare-submit', label: "Prepare and submit applications", completed: false, details: "Ensure all forms are filled out accurately and completely."},
        {id: 'al-obtain', label: "Obtain and display necessary licenses/permits", completed: false, details: "Keep copies and display originals as required."},
      ]},
      { id: 'open-bank-account', label: 'Open a business bank account', completed: false, achievementName: 'Bank Opener', achievementDescription: 'Opened a business bank account.', achievementIconName: 'CreditCard', details: "Separate personal/business finances. See SBA guidance.", isExpanded: false, subTasks: [
        {id: 'ob-research', label: "Research business banking options and fees", completed: false, details: "Compare services, fees, and account features."},
        {id: 'ob-gather-docs', label: "Gather required documentation (EIN, registration docs)", completed: false, details: "Banks will need these to open your account."},
        {id: 'ob-open-account', label: "Open a dedicated bank account for your business", completed: false, details: "Use this account for all business income and expenses."},
      ]},
      { id: 'get-insurance', label: 'Get business insurance', completed: false, achievementName: 'Insured Entrepreneur', achievementDescription: 'Secured business insurance.', achievementIconName: 'ShieldCheck', details: "General liability, professional liability, workers' comp, etc. See SBA info.", isExpanded: false, subTasks: [
        {id: 'gi-assess', label: "Assess insurance needs for your business type", completed: false, details: "Consider general liability, professional liability, product liability, commercial property, workers' compensation."},
        {id: 'gi-quotes', label: "Obtain quotes from insurance providers or brokers", completed: false, details: "Compare coverage options and premiums."},
        {id: 'gi-secure', label: "Secure appropriate business insurance coverage", completed: false, details: "Review policies carefully before signing."},
      ]},
    ],
  },
  {
    key: 'manage',
    title: 'Manage Your Business',
    icon: Settings,
    tasks: [
        { id: 'manage-finances', label: 'Manage your finances', completed: false, achievementName: 'Finance Manager', achievementDescription: 'Started managing finances.', achievementIconName: 'Banknote', details: "Bookkeeping, budgeting, cash flow, financial statements. See SBA resources.", isExpanded: false, subTasks: [
            {id: 'mf-bookkeeping', label: "Set up a bookkeeping system", completed: false, details: "Choose accounting software or a manual system. Consider hiring a bookkeeper."},
            {id: 'mf-track', label: "Regularly track income and expenses", completed: false, details: "Keep detailed records of all financial transactions."},
            {id: 'mf-budget', label: "Create and maintain a business budget", completed: false, details: "Plan for future income and expenses."},
            {id: 'mf-cashflow', label: "Monitor cash flow closely", completed: false, details: "Ensure you have enough cash on hand to cover obligations."},
            {id: 'mf-statements', label: "Review financial statements regularly (P&L, Balance Sheet)", completed: false, details: "Understand your financial performance and position."},
        ]},
        { id: 'hire-employees', label: 'Hire and manage employees', completed: false, achievementName: 'Team Builder', achievementDescription: 'Learned about hiring.', achievementIconName: 'Users', details: "Legal reqs, job descriptions, recruiting, onboarding, compliance. See SBA & CDLE.", isExpanded: false, subTasks: [
            {id: 'he-roles', label: "Define job roles and write job descriptions", completed: false, details: "Clearly outline responsibilities and qualifications."},
            {id: 'he-recruit', label: "Develop a recruiting strategy and post openings", completed: false, details: "Use job boards, networking, and referrals."},
            {id: 'he-interview', label: "Conduct interviews and select candidates", completed: false, details: "Use structured interviews and check references."},
            {id: 'he-onboard', label: "Create an onboarding process for new hires", completed: false, details: "Help new employees integrate smoothly."},
            {id: 'he-comply', label: "Comply with labor laws and regulations", completed: false, details: "Understand wage and hour laws, anti-discrimination laws, etc."},
        ]},
        { id: 'pay-taxes', label: 'Pay taxes', completed: false, achievementName: 'Tax Payer', achievementDescription: 'Understood tax obligations.', achievementIconName: 'DollarSign', details: "Federal (IRS) and state (CDOR for CO) tax obligations.", isExpanded: false, subTasks: [
            {id: 'pt-understand', label: "Understand federal, state, and local tax obligations", completed: false, details: "Income tax, self-employment tax, sales tax, payroll taxes, etc."},
            {id: 'pt-estimated', label: "Make estimated tax payments if required", completed: false, details: "For self-employed individuals and corporations."},
            {id: 'pt-file', label: "File tax returns accurately and on time", completed: false, details: "Keep good records throughout the year."},
            {id: 'pt-professional', label: "Consider hiring a tax professional", completed: false, details: "Especially if your tax situation is complex."},
        ]},
        { id: 'stay-compliant', label: 'Stay legally compliant', completed: false, achievementName: 'Compliance Keeper', achievementDescription: 'Learned about legal compliance.', achievementIconName: 'ShieldCheck', details: "Labor laws, regulations, reporting. See SBA compliance guide.", isExpanded: false, subTasks: [
            {id: 'sc-permits', label: "Maintain necessary licenses and permits", completed: false, details: "Renew them on time as required."},
            {id: 'sc-reporting', label: "Fulfill state reporting requirements (e.g., periodic reports)", completed: false, details: "E.g., Colorado Secretary of State Periodic Report."},
            {id: 'sc-data-privacy', label: "Understand data privacy regulations (if applicable)", completed: false, details: "E.g., GDPR, CCPA, HIPAA if handling sensitive data."},
            {id: 'sc-contracts', label: "Review and manage contracts carefully", completed: false, details: "With suppliers, customers, and employees."},
        ]},
        { id: 'buy-assets', label: 'Buy assets and equipment', completed: false, achievementName: 'Asset Acquirer', achievementDescription: 'Considered asset purchasing.', achievementIconName: 'ShoppingBag', details: "Purchase and manage necessary business assets. See SBA.", isExpanded: false, subTasks: [
            {id: 'ba-identify', label: "Identify necessary assets and equipment", completed: false, details: "Computers, machinery, vehicles, office furniture, etc."},
            {id: 'ba-budget', label: "Budget for asset purchases or leases", completed: false, details: "Determine whether to buy new, used, or lease."},
            {id: 'ba-track', label: "Track and maintain assets", completed: false, details: "Keep records for depreciation and insurance purposes."},
        ]},
        { id: 'marketing-sales-manage', label: 'Marketing and sales execution', completed: false, achievementName: 'Marketing Strategist', achievementDescription: 'Explored marketing and sales.', achievementIconName: 'BarChart2', details: "Implement strategies, track results. See SBA resources.", isExpanded: false, subTasks: [
            {id: 'msm-implement', label: "Implement marketing plan activities", completed: false, details: "Execute advertising, content creation, social media campaigns, etc."},
            {id: 'msm-track', label: "Track marketing campaign performance and KPIs", completed: false, details: "Monitor website traffic, conversion rates, ROI."},
            {id: 'msm-sales-process', label: "Manage sales process and customer relationships (CRM)", completed: false, details: "Use tools to track leads and manage interactions."},
            {id: 'msm-analyze-adjust', label: "Analyze results and adjust strategies as needed", completed: false, details: "Continuously optimize your marketing and sales efforts."},
        ]},
        { id: 'ai-small-business', label: 'Explore AI for small business', completed: false, achievementName: 'AI Explorer', achievementDescription: 'Looked into AI tools.', achievementIconName: 'Laptop', details: "Customer service, marketing, content, data analysis. Use BizLaunch AI tools.", isInteractiveTool: true, interactiveToolLink: "#TODO_link_to_AI_advisor_main_page"},
        { id: 'analyze-feedback-ai', label: 'Analyze Customer Feedback using AI', completed: false, achievementName: 'Feedback Analyst', achievementDescription: 'Used AI to analyze feedback.', achievementIconName: 'MessageSquareQuote', details: "Use AI Text Analyzer tool in AI Business Advisor.", isInteractiveTool: true, interactiveToolLink: "#TODO_link_to_AI_advisor_text_analyzer_query" },
        { id: 'draft-email-replies-ai', label: 'Draft Email Replies using AI', completed: false, achievementName: 'Email Assistant', achievementDescription: 'Used AI to help draft email replies.', achievementIconName: 'Mail', details: "Use AI Email Reply Drafter in AI Business Advisor.", isInteractiveTool: true, interactiveToolLink: "#TODO_link_to_AI_advisor_email_reply_query" },
        { id: 'draft-cold-outreach-ai', label: 'Draft Cold Outreach Emails using AI', completed: false, achievementName: 'Outreach Expert', achievementDescription: 'Used AI to help draft cold outreach emails.', achievementIconName: 'Send', details: "Use AI Cold Outreach Email Drafter in AI Business Advisor.", isInteractiveTool: true, interactiveToolLink: "#TODO_link_to_AI_advisor_cold_outreach_query"},
        { id: 'cybersecurity', label: 'Strengthen your cybersecurity', completed: false, achievementName: 'Cyber Guardian', achievementDescription: 'Learned about cybersecurity.', achievementIconName: 'ShieldCheck', details: "Protect digital assets and customer data. See SBA guide.", isExpanded: false, subTasks: [
            {id: 'cy-passwords', label: "Implement strong password policies", completed: false, details: "Use unique, complex passwords and multi-factor authentication."},
            {id: 'cy-software-updates', label: "Keep software and systems updated", completed: false, details: "Apply security patches regularly."},
            {id: 'cy-data-backup', label: "Regularly back up important data", completed: false, details: "Store backups securely, both on-site and off-site."},
            {id: 'cy-employee-training', label: "Train employees on cybersecurity best practices", completed: false, details: "Phishing awareness, safe internet use, etc."},
        ]},
        { id: 'prepare-emergencies', label: 'Prepare for emergencies', completed: false, achievementName: 'Emergency Planner', achievementDescription: 'Prepared for emergencies.', achievementIconName: 'Siren', details: "Contingency plans for unexpected events. See Ready.gov.", isExpanded: false, subTasks: [
            {id: 'pe-risk-assessment', label: "Identify potential risks and emergencies", completed: false, details: "Natural disasters, power outages, cyberattacks, etc."},
            {id: 'pe-communication-plan', label: "Develop an emergency communication plan", completed: false, details: "How to contact employees, customers, and suppliers."},
            {id: 'pe-continuity-plan', label: "Create a business continuity plan", completed: false, details: "How to continue critical operations during/after an emergency."},
        ]},
        { id: 'recover-disasters', label: 'Recover from disasters', completed: false, achievementName: 'Disaster Recoverer', achievementDescription: 'Planned for disaster recovery.', achievementIconName: 'HeartHandshake', details: "Plan for recovery from natural or other disasters. See SBA." },
        { id: 'close-sell', label: 'Plan for closing or selling your business', completed: false, achievementName: 'Exit Strategist', achievementDescription: 'Considered exit strategies.', achievementIconName: 'ClipboardCheck', details: "Understand the process for exiting. See SBA guide.", isExpanded: false, subTasks: [
            {id: 'cs-succession', label: "Develop a succession plan (if applicable)", completed: false, details: "Who will take over if you retire or leave?"},
            {id: 'cs-valuation', label: "Understand your business valuation", completed: false, details: "Get an appraisal if considering selling."},
            {id: 'cs-legal-financial-prep', label: "Prepare legal and financial documents for sale/closure", completed: false, details: "Consult with advisors."},
        ]},
        { id: 'hire-disabilities', label: 'Consider hiring employees with disabilities', completed: false, achievementName: 'Inclusive Employer', achievementDescription: 'Learned about inclusive hiring.', achievementIconName: 'Users', details: "Learn about benefits and resources. See Dept. of Labor ODEP." },
    ],
  },
  {
    key: 'grow',
    title: 'Grow Your Business',
    icon: LineChart,
    tasks: [
        { id: 'get-more-funding-grow', label: 'Get more funding for growth', completed: false, achievementName: 'Growth Funder', achievementDescription: 'Explored growth funding.', achievementIconName: 'PiggyBank', details: "Secure capital for expansion. See SBA growth funding.", isExpanded: false, subTasks: [
            {id: 'gmf-growth-capital', label: "Identify needs for growth capital", completed: false, details: "New markets, product development, hiring, etc."},
            {id: 'gmf-options', label: "Explore growth funding options (venture capital, private equity, business loans)", completed: false, details: "Research options suitable for your growth stage."},
            {id: 'gmf-prepare-pitch', label: "Prepare financial projections and pitch for investors/lenders", completed: false, details: "Demonstrate strong growth potential."},
        ]},
        { id: 'expand-locations', label: 'Expand to new locations', completed: false, achievementName: 'Expansionist', achievementDescription: 'Considered location expansion.', achievementIconName: 'MapPin', details: "Expand physical or market reach. See SBA guide.", isExpanded: false, subTasks: [
            {id: 'el-market-research', label: "Conduct market research for new locations/regions", completed: false, details: "Assess demand and competition in potential new areas."},
            {id: 'el-logistics', label: "Plan logistical and operational aspects of expansion", completed: false, details: "Supply chain, staffing, facilities."},
            {id: 'el-financial-plan', label: "Develop a financial plan for expansion", completed: false, details: "Budget for costs and project revenue from new locations."},
        ]},
        { id: 'merge-acquire', label: 'Merge and acquire businesses', completed: false, achievementName: 'M&A Explorer', achievementDescription: 'Learned about mergers/acquisitions.', achievementIconName: 'Building', details: "Grow through strategic M&A. See SBA M&A guide.", isExpanded: false, subTasks: [
            {id: 'ma-identify-targets', label: "Identify potential merger or acquisition targets", completed: false, details: "Look for businesses that offer strategic advantages."},
            {id: 'ma-due-diligence', label: "Conduct due diligence on target companies", completed: false, details: "Thoroughly investigate financials, operations, and legal standing."},
            {id: 'ma-integration-plan', label: "Develop an integration plan for post-merger/acquisition", completed: false, details: "How to combine operations, cultures, and systems."},
        ]},
        { id: 'federal-contractor', label: 'Become a federal contractor', completed: false, achievementName: 'Federal Contractor', achievementDescription: 'Explored federal contracting.', achievementIconName: 'Landmark', details: "Bid on government contracts. See SBA resources.", isExpanded: false, subTasks: [
            {id: 'fc-register-sam', label: "Register in the System for Award Management (SAM.gov)", completed: false, details: "Required for federal contracting."},
            {id: 'fc-identify-opps', label: "Identify federal contracting opportunities", completed: false, details: "Use government procurement websites."},
            {id: 'fc-prepare-bids', label: "Learn how to prepare bids and proposals", completed: false, details: "Understand the government procurement process."},
        ]},
        { id: 'export-products', label: 'Export products', completed: false, achievementName: 'Global Exporter', achievementDescription: 'Considered exporting products.', achievementIconName: 'BarChart2', details: "Sell internationally. See SBA exporting guide.", isExpanded: false, subTasks: [
            {id: 'ep-market-research', label: "Research potential international markets", completed: false, details: "Assess demand, competition, and cultural factors."},
            {id: 'ep-logistics-compliance', label: "Understand export regulations, logistics, and payment methods", completed: false, details: "Shipping, customs, international finance."},
            {id: 'ep-export-plan', label: "Develop an export plan", completed: false, details: "Strategy for entering and succeeding in foreign markets."},
        ]},
        { id: 'women-owned', label: 'Explore resources for Women-owned businesses', completed: false, achievementName: 'Resourceful Entrepreneur (W)', achievementDescription: 'Explored resources for women.', achievementIconName: 'Users', details: (actions) => (<a href="https://www.sba.gov/business-guide/grow-your-business/women-owned-businesses" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-xs flex items-center gap-1"><LinkIcon className="w-3 h-3"/>SBA Women-Owned Businesses</a>)},
        { id: 'native-american-owned', label: 'Explore resources for Native American-owned businesses', completed: false, achievementName: 'Resourceful Entrepreneur (NA)', achievementDescription: 'Explored resources for Native Americans.', achievementIconName: 'Users', details: (actions) => (<a href="https://www.sba.gov/business-guide/grow-your-business/native-american-owned-businesses" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-xs flex items-center gap-1"><LinkIcon className="w-3 h-3"/>SBA Native American-Owned</a>)},
        { id: 'veteran-owned', label: 'Explore resources for Veteran-owned businesses', completed: false, achievementName: 'Resourceful Entrepreneur (V)', achievementDescription: 'Explored resources for veterans.', achievementIconName: 'Users', details: (actions) => (<a href="https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-xs flex items-center gap-1"><LinkIcon className="w-3 h-3"/>SBA Veteran-Owned</a>)},
        { id: 'military-spouse', label: 'Explore resources for Military spouse businesses', completed: false, achievementName: 'Resourceful Entrepreneur (MS)', achievementDescription: 'Explored resources for military spouses.', achievementIconName: 'Users', details: (actions) => (<a href="https://www.sba.gov/business-guide/grow-your-business/military-spouse-owned-businesses" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-xs flex items-center gap-1"><LinkIcon className="w-3 h-3"/>SBA Military Spouse-Owned</a>)},
        { id: 'rural-businesses', label: 'Explore resources for Rural businesses', completed: false, achievementName: 'Resourceful Entrepreneur (R)', achievementDescription: 'Explored resources for rural businesses.', achievementIconName: 'Users', details: (actions) => (<a href="https://www.sba.gov/business-guide/grow-your-business/rural-businesses" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-xs flex items-center gap-1"><LinkIcon className="w-3 h-3"/>SBA Rural Businesses</a>)},
        { id: 'minority-owned', label: 'Explore resources for Minority-owned businesses', completed: false, achievementName: 'Resourceful Entrepreneur (M)', achievementDescription: 'Explored resources for minorities.', achievementIconName: 'Users', details: (actions) => (<a href="https://www.sba.gov/business-guide/grow-your-business/minority-owned-businesses" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-xs flex items-center gap-1"><LinkIcon className="w-3 h-3"/>SBA Minority-Owned</a>)},
    ],
  },
];

// Helper function to recursively update task completion
const updateTaskCompletion = (tasks: WorksheetTask[], taskId: string, completed: boolean): WorksheetTask[] => {
  return tasks.map(task => {
    if (task.id === taskId) {
      return { ...task, completed };
    }
    if (task.subTasks) {
      return { ...task, subTasks: updateTaskCompletion(task.subTasks, taskId, completed) };
    }
    return task;
  });
};

// Helper function to recursively set expansion state
const updateTaskExpansion = (tasks: WorksheetTask[], taskId: string, isExpanded: boolean): WorksheetTask[] => {
  return tasks.map(task => {
    if (task.id === taskId) {
      return { ...task, isExpanded };
    }
    if (task.subTasks) {
      return { ...task, subTasks: updateTaskExpansion(task.subTasks, taskId, isExpanded) };
    }
    return task;
  });
};


// Helper function to load completion states
const loadStagesDataWithCompletion = (initialData: Stage[]): Stage[] => {
  if (typeof window === 'undefined') return initialData;
  try {
    const savedState = localStorage.getItem(DASHBOARD_STATE_STORAGE_KEY);
    
    const initializeTasksWithDefaults = (tasks: WorksheetTask[]): WorksheetTask[] => {
        return tasks.map(task => ({
            ...task,
            completed: task.completed || false,
            isExpanded: task.isExpanded !== undefined ? task.isExpanded : (task.subTasks && task.subTasks.length > 0 ? false : undefined),
            subTasks: task.subTasks ? initializeTasksWithDefaults(task.subTasks) : undefined,
        }));
    };
    
    if (!savedState) return initialData.map(stage => ({...stage, tasks: initializeTasksWithDefaults(stage.tasks)}));

    const parsedState = JSON.parse(savedState);

    const mergeCompletion = (tasks: WorksheetTask[], savedTasksState: Record<string, {completed: boolean, isExpanded?: boolean}>): WorksheetTask[] => {
        return tasks.map(task => {
            const savedTaskInfo = savedTasksState[task.id];
            const completed = savedTaskInfo?.completed ?? task.completed ?? false; // Default to false
            // Default to collapsed for parents if not specified, undefined for leaf or if already set
            const isExpanded = savedTaskInfo?.isExpanded ?? task.isExpanded ?? (task.subTasks && task.subTasks.length > 0 ? false : undefined);

            return {
                ...task,
                completed,
                isExpanded,
                subTasks: task.subTasks ? mergeCompletion(task.subTasks, savedTasksState) : undefined,
            };
        });
    };

    return initialData.map(stage => ({
      ...stage,
      tasks: mergeCompletion(stage.tasks, parsedState[stage.key] || {}),
    }));

  } catch (error) {
    console.error("Failed to load dashboard state from localStorage:", error);
    // Fallback: initialize tasks with defaults if loading fails
    const initializeTasksWithDefaults = (tasks: WorksheetTask[]): WorksheetTask[] => {
        return tasks.map(task => ({
            ...task,
            completed: task.completed || false,
            isExpanded: task.isExpanded !== undefined ? task.isExpanded : (task.subTasks && task.subTasks.length > 0 ? false : undefined),
            subTasks: task.subTasks ? initializeTasksWithDefaults(task.subTasks) : undefined,
        }));
    };
    return initialData.map(stage => ({...stage, tasks: initializeTasksWithDefaults(stage.tasks)}));
  }
};


// Helper to initialize expansion state (default to collapsed for tasks with subtasks)
const initializeExpansion = (tasks: WorksheetTask[]): WorksheetTask[] => {
  return tasks.map(task => ({
    ...task,
    isExpanded: task.isExpanded !== undefined ? task.isExpanded : (task.subTasks && task.subTasks.length > 0 ? false : undefined),
    subTasks: task.subTasks ? initializeExpansion(task.subTasks) : undefined,
  }));
};


// Helper function to save completion states
const saveStagesDataCompletion = (stages: Stage[]) => {
  if (typeof window === 'undefined') return;
  try {
    const stateToSave: Record<string, Record<string, {completed: boolean, isExpanded?: boolean}>> = {};

    const extractCompletion = (tasks: WorksheetTask[]): Record<string, {completed: boolean, isExpanded?: boolean}> => {
        let completionMap: Record<string, {completed: boolean, isExpanded?: boolean}> = {};
        tasks.forEach(task => {
            completionMap[task.id] = { 
              completed: task.completed, 
              // Ensure isExpanded is only saved if it's not undefined
              ...(task.isExpanded !== undefined && { isExpanded: task.isExpanded }) 
            };
            if (task.subTasks) {
                completionMap = { ...completionMap, ...extractCompletion(task.subTasks) };
            }
        });
        return completionMap;
    };

    stages.forEach(stage => {
      stateToSave[stage.key] = extractCompletion(stage.tasks);
    });
    localStorage.setItem(DASHBOARD_STATE_STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (error) {
    console.error("Failed to save dashboard state to localStorage:", error);
  }
};


// Helper function to calculate progress
const calculateProgress = (tasks: WorksheetTask[]): { completedCount: number, totalLeafTasks: number } => {
  let completedCount = 0;
  let totalLeafTasks = 0;

  const countTasks = (taskList: WorksheetTask[]) => {
    taskList.forEach(task => {
      if (task.subTasks && task.subTasks.length > 0) {
        countTasks(task.subTasks); // Recurse if it has sub-tasks
      } else { // Leaf node
        totalLeafTasks++;
        if (task.completed) {
          completedCount++;
        }
      }
    });
  };

  countTasks(tasks);
  return { completedCount, totalLeafTasks };
};

// Flatten tasks for AI Advisor and Achievements
const getAllWorksheetTasks = (stages: Stage[]): WorksheetTask[] => {
  const all: WorksheetTask[] = [];
  const recurse = (tasks: WorksheetTask[]) => {
    tasks.forEach(task => {
      all.push(task);
      if (task.subTasks) {
        recurse(task.subTasks);
      }
    });
  };
  stages.forEach(stage => recurse(stage.tasks));
  return all;
};


export default function DashboardPage() {
  const [stagesData, setStagesData] = useState<Stage[]>(() => loadStagesDataWithCompletion(initialStagesData));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    saveStagesDataCompletion(stagesData);
  }, [stagesData]);

  useEffect(() => {
    const handleExternalAchievementUpdate = (event: Event) => {
      if (event instanceof CustomEvent) {
        const { taskId, completed } = event.detail;
        setStagesData(prevStages =>
          prevStages.map(stage => ({
            ...stage,
            tasks: updateTaskCompletion(stage.tasks, taskId, completed),
          }))
        );
      }
    };
    window.addEventListener('achievementUpdate', handleExternalAchievementUpdate);
    return () => {
      window.removeEventListener('achievementUpdate', handleExternalAchievementUpdate);
    };
  }, []);

  const handleCheckChange = (taskId: string, newCompletedStatus: boolean) => {
    const taskToUpdate = findTaskById(stagesData, taskId);

    if (taskToUpdate && taskToUpdate.requiresUpload && newCompletedStatus && !taskToUpdate.completed) {
        toast({
            variant: "default",
            title: "Upload Required",
            description: "Please upload the required document to complete this task.",
        });
        return; 
    }

    setStagesData(prevStages =>
      prevStages.map(stage => ({
        ...stage,
        tasks: updateTaskCompletion(stage.tasks, taskId, newCompletedStatus),
      }))
    );

    if (taskToUpdate?.achievementName) {
      updateAchievementStatus(taskId, newCompletedStatus);
      window.dispatchEvent(new CustomEvent('achievementUpdate', { detail: { taskId, completed: newCompletedStatus } }));
    }
  };

  const findTaskById = (stages: Stage[], taskId: string): WorksheetTask | null => {
    for (const stage of stages) {
      const found = findTaskInList(stage.tasks, taskId);
      if (found) return found;
    }
    return null;
  };

  const findTaskInList = (tasks: WorksheetTask[], taskId: string): WorksheetTask | null => {
    for (const task of tasks) {
      if (task.id === taskId) return task;
      if (task.subTasks) {
        const found = findTaskInList(task.subTasks, taskId);
        if (found) return found;
      }
    }
    return null;
  };

  const toggleTaskExpansion = (taskId: string) => {
    setStagesData(prevStages =>
      prevStages.map(stage => ({
        ...stage,
        tasks: updateTaskExpansion(stage.tasks, taskId, !(findTaskById(prevStages, taskId)?.isExpanded ?? false)),
      }))
    );
  };


  const handleFileUpload = async (file: File, taskId: string) => {
    if (!file) {
      toast({ variant: "destructive", title: "Upload Error", description: "No file selected." });
      return;
    }
    setIsUploading(true);
    const userId = "default_user"; // Placeholder
    const filePath = `${userId}/task_documents/${taskId}/${file.name}`;
    const fileRef = storageRef(storage, filePath);

    try {
      await uploadBytes(fileRef, file);
      handleCheckChange(taskId, true); 
      setSelectedFile(null);
      toast({ title: "Upload Successful", description: `Document "${file.name}" uploaded and task marked complete.` });
    } catch (error) {
      console.error("Upload Error:", error);
      toast({ variant: "destructive", title: "Upload Failed", description: "Error uploading document. Check console & Firebase storage rules." });
    } finally {
      setIsUploading(false);
    }
  };

  const taskActions: TaskActions = { handleFileUpload, setSelectedFile, selectedFile };

  const allTasksForAdvisor = useMemo(() => {
    return getAllWorksheetTasks(stagesData).map(task => ({ id: task.id, label: task.label }));
  }, [stagesData]);

  const allAchievements = useMemo(() => {
    return getAllWorksheetTasks(stagesData)
      .filter(task => task.achievementName)
      .map(task => ({
        id: task.id,
        name: task.achievementName!,
        description: task.achievementDescription!,
        iconName: task.achievementIconName!,
      }));
  }, [stagesData]);

  const overallProgress = useMemo(() => {
    const allLeafTasks = getAllWorksheetTasks(stagesData).filter(t => !t.subTasks || t.subTasks.length === 0);
    const completedLeafTasks = allLeafTasks.filter(t => t.completed).length;
    return allLeafTasks.length > 0 ? (completedLeafTasks / allLeafTasks.length) * 100 : 0;
  }, [stagesData]);

  const TaskItem: React.FC<{ task: WorksheetTask; level: number }> = ({ task, level }) => {
    const hasSubTasks = task.subTasks && task.subTasks.length > 0;
    const showDetailsButton = task.details || (task.isInteractiveTool && task.interactiveToolLink) || task.requiresUpload;

    return (
      <div style={{ marginLeft: `${level * 16}px` }} className="py-1">
        <div className={cn("flex items-start gap-2 p-2 rounded-md transition-colors hover:bg-muted/30", task.completed && "bg-secondary/50")}>
          {hasSubTasks ? (
            <Button variant="ghost" size="icon" onClick={() => toggleTaskExpansion(task.id)} className="h-6 w-6 flex-shrink-0">
              {task.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          ) : (
            <div className="w-6 h-6 flex-shrink-0"></div> 
          )}
          <Checkbox
            id={task.id}
            checked={task.completed}
            onCheckedChange={(checked) => handleCheckChange(task.id, !!checked)}
            aria-labelledby={`${task.id}-label`}
            disabled={isUploading}
            className="mt-1 flex-shrink-0"
          />
          <Label
            htmlFor={task.id}
            id={`${task.id}-label`}
            className={cn("flex-1 text-sm font-medium leading-tight cursor-pointer", task.completed && "line-through text-muted-foreground")}
          >
            {task.label}
          </Label>
          {showDetailsButton && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto flex-shrink-0">
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 text-xs p-3" side="bottom" align="end">
                {getWorksheetTaskDetails(task.id, task, taskActions)}
              </PopoverContent>
            </Popover>
          )}
        </div>
        {hasSubTasks && task.isExpanded && (
          <div className="mt-1">
            {task.subTasks?.map(subTask => <TaskItem key={subTask.id} task={subTask} level={level + 1} />)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarHeader className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Rocket className="w-8 h-8 text-accent" />
            <h1 className="text-2xl font-bold text-primary group-data-[collapsible=icon]:hidden tracking-tight">BizLaunch</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem><SidebarMenuButton href="#top" isActive tooltip="Dashboard Home"><HomeIcon /><span>Dashboard</span></SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="#worksheet" tooltip="Business Worksheet"><Star /><span>Worksheet</span></SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/dashboard/business-plan" tooltip="Interactive Business Plan"><Wand2 /><span>Business Plan Tool</span></SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="#achievements" tooltip="Achievements"><Trophy /><span>Achievements</span></SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="#resources" tooltip="Resource Hub"><LandmarkIcon /><span>Resource Hub</span></SidebarMenuButton></SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="p-4 sm:p-6 flex-1" id="top">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">Welcome to Your BizLaunch Dashboard</h2>
          <SidebarTrigger className="md:hidden" />
        </div>
        <p className="text-muted-foreground mb-8 text-sm sm:text-base">Your comprehensive worksheet to plan, launch, manage, and grow your business. Complete tasks and sub-tasks to make progress.</p>

        <div className="mb-8">
            <Label className="text-sm text-muted-foreground">Overall Progress:</Label>
            <Progress value={overallProgress} className="w-full h-3 mt-1" aria-label={`Overall progress: ${overallProgress.toFixed(0)}%`} />
        </div>

        <AIBusinessAdvisor allTasks={allTasksForAdvisor} />

        <div id="worksheet" className="mt-12 pt-12 border-t scroll-mt-20">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl font-semibold text-primary flex items-center gap-2">
                <Star className="w-5 h-5 sm:w-6 sm:h-6" />
                Business Development Worksheet
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Track your progress through all stages of business development. Expand sections to see detailed sub-tasks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Accordion type="multiple" className="w-full" defaultValue={stagesData.map(s => s.key)}>
                {stagesData.map((stage) => {
                  const stageProgress = calculateProgress(stage.tasks);
                  const progressPercentage = stageProgress.totalLeafTasks > 0 ? (stageProgress.completedCount / stageProgress.totalLeafTasks) * 100 : 0;
                  return (
                    <AccordionItem value={stage.key} key={stage.key} className="border-b">
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center gap-3 w-full">
                          <stage.icon className="w-5 h-5 text-primary" />
                          <span className="text-lg font-medium text-foreground">{stage.title}</span>
                          <span className="ml-auto text-xs text-muted-foreground">({stageProgress.completedCount}/{stageProgress.totalLeafTasks})</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-1 pb-3 pl-2 pr-1">
                        <Progress value={progressPercentage} className="w-full h-1.5 mb-3" aria-label={`Stage progress for ${stage.title}: ${progressPercentage.toFixed(0)}%`} />
                        <div className="space-y-1">
                          {stage.tasks.map(task => (
                            <TaskItem key={task.id} task={task} level={0} />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        <div id="achievements" className="mt-12 pt-12 border-t scroll-mt-20">
          <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-primary flex items-center gap-2"><Trophy className="w-5 h-5 sm:w-6 sm:h-6" /> Achievements</h3>
          <AchievementsDisplay allAchievements={allAchievements} stageKeys={stagesData.map(s => s.key)} />
        </div>

        <div id="resources" className="mt-12 pt-12 border-t scroll-mt-20">
          <ResourceHub />
        </div>
      </SidebarInset>
    </div>
  );
}


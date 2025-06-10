
"use client"; 

import React, { useState, useEffect } from 'react';
import Link from 'next/link'; // Import Link
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from "@/components/ui/sidebar";
import { Briefcase, Rocket, Settings, LineChart, Home as HomeIcon, Target, FileText, DollarSign, Building, CreditCard, PiggyBank, MapPin, Landmark, Users, ClipboardCheck, Banknote, ShieldCheck, ShoppingBag, BarChart2, Laptop, Siren, HeartHandshake, LandmarkIcon, Award, Trophy, Star, CheckCircle, ArrowLeft, ArrowRight, Link as LinkIcon, Search, MessageSquareQuote, Mail, Send, UploadCloud, Wand2 } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card';
import { Separator } from "@/components/ui/separator";
import { Input } from '@/components/ui/input'; // For file input styling
import { toast } from "@/hooks/use-toast";
import { storage } from '@/lib/firebase'; // Firebase storage instance
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface WizardTask extends TaskWithAchievement {
  stageKey: 'plan' | 'launch' | 'manage' | 'grow';
  stageTitle: string;
  stageIcon: React.ElementType;
  details: React.ReactNode | ((actions: TaskActions) => React.ReactNode); // Allow function for dynamic details
  requiresUpload?: boolean; // Optional flag for tasks requiring upload
  isInteractiveTool?: boolean; // Flag if this task links to an interactive tool
  interactiveToolLink?: string; // Link to the interactive tool
}

interface TaskWithAchievement {
  id: string;
  label: string;
  completed: boolean;
  achievementName: string;
  achievementDescription:string;
  achievementIconName: string;
}

// Interface for actions that can be passed to dynamic detail renderers
interface TaskActions {
  handleFileUpload: (file: File, taskId: string) => Promise<void>;
  setSelectedFile: (file: File | null) => void;
  selectedFile: File | null;
}


const planTasksRaw: Omit<WizardTask, 'completed' | 'stageIcon' | 'details'>[] = [
  { id: 'market-research', label: 'Market research and competitive analysis', achievementName: 'Market Maven', achievementDescription: 'Completed initial market research.', achievementIconName: 'Target', stageKey: 'plan', stageTitle: 'Plan Your Business' },
  { id: 'business-plan', label: 'Write your business plan', achievementName: 'Master Planner', achievementDescription: 'Drafted the business plan.', achievementIconName: 'FileText', stageKey: 'plan', stageTitle: 'Plan Your Business', isInteractiveTool: true, interactiveToolLink: '/dashboard/business-plan' },
  { id: 'startup-costs', label: 'Calculate your startup costs', achievementName: 'Cost Calculator', achievementDescription: 'Calculated initial startup costs.', achievementIconName: 'DollarSign', stageKey: 'plan', stageTitle: 'Plan Your Business' },
  { id: 'business-credit', label: 'Establish business credit', achievementName: 'Credit Conscious', achievementDescription: 'Learned about business credit.', achievementIconName: 'CreditCard', stageKey: 'plan', stageTitle: 'Plan Your Business' },
  { id: 'fund-business', label: 'Fund your business', achievementName: 'Funding Finder', achievementDescription: 'Explored funding options.', achievementIconName: 'PiggyBank', stageKey: 'plan', stageTitle: 'Plan Your Business' },
  { id: 'buy-existing', label: 'Consider buying an existing business or franchise', achievementName: 'Strategic Thinker', achievementDescription: 'Considered buying vs. starting.', achievementIconName: 'Building', stageKey: 'plan', stageTitle: 'Plan Your Business' },
];

const launchTasksRaw: Omit<WizardTask, 'completed' | 'stageIcon' | 'details'>[] = [
  { id: 'pick-location', label: 'Pick your business location', achievementName: 'Location Scout', achievementDescription: 'Chose a business location.', achievementIconName: 'MapPin', stageKey: 'launch', stageTitle: 'Launch Your Business' },
  { id: 'choose-structure', label: 'Choose a business structure', achievementName: 'Structure Selector', achievementDescription: 'Selected a legal structure.', achievementIconName: 'Landmark', stageKey: 'launch', stageTitle: 'Launch Your Business' },
  { id: 'choose-name', label: 'Choose your business name', achievementName: 'Name Giver', achievementDescription: 'Picked a business name.', achievementIconName: 'FileText', stageKey: 'launch', stageTitle: 'Launch Your Business' },
  { id: 'register-business', label: 'Register your business', achievementName: 'Official Registrant', achievementDescription: 'Registered the business.', achievementIconName: 'ClipboardCheck', stageKey: 'launch', stageTitle: 'Launch Your Business', requiresUpload: true },
  { id: 'get-tax-ids', label: 'Get federal and state tax ID numbers', achievementName: 'Tax ID Acquirer', achievementDescription: 'Obtained necessary tax IDs.', achievementIconName: 'DollarSign', stageKey: 'launch', stageTitle: 'Launch Your Business' },
  { id: 'apply-licenses', label: 'Apply for licenses and permits', achievementName: 'License Applicant', achievementDescription: 'Applied for required licenses.', achievementIconName: 'FileText', stageKey: 'launch', stageTitle: 'Launch Your Business' },
  { id: 'open-bank-account', label: 'Open a business bank account', achievementName: 'Bank Opener', achievementDescription: 'Opened a business bank account.', achievementIconName: 'CreditCard', stageKey: 'launch', stageTitle: 'Launch Your Business' },
  { id: 'get-insurance', label: 'Get business insurance', achievementName: 'Insured Entrepreneur', achievementDescription: 'Secured business insurance.', achievementIconName: 'ShieldCheck', stageKey: 'launch', stageTitle: 'Launch Your Business' },
];

const manageTasksRaw: Omit<WizardTask, 'completed' | 'stageIcon' | 'details'>[] = [
  { id: 'manage-finances', label: 'Manage your finances', achievementName: 'Finance Manager', achievementDescription: 'Started managing finances.', achievementIconName: 'Banknote', stageKey: 'manage', stageTitle: 'Manage Your Business' },
  { id: 'hire-employees', label: 'Hire and manage employees', achievementName: 'Team Builder', achievementDescription: 'Learned about hiring.', achievementIconName: 'Users', stageKey: 'manage', stageTitle: 'Manage Your Business' },
  { id: 'pay-taxes', label: 'Pay taxes', achievementName: 'Tax Payer', achievementDescription: 'Understood tax obligations.', achievementIconName: 'DollarSign', stageKey: 'manage', stageTitle: 'Manage Your Business' },
  { id: 'stay-compliant', label: 'Stay legally compliant', achievementName: 'Compliance Keeper', achievementDescription: 'Learned about legal compliance.', achievementIconName: 'ShieldCheck', stageKey: 'manage', stageTitle: 'Manage Your Business' },
  { id: 'buy-assets', label: 'Buy assets and equipment', achievementName: 'Asset Acquirer', achievementDescription: 'Considered asset purchasing.', achievementIconName: 'ShoppingBag', stageKey: 'manage', stageTitle: 'Manage Your Business' },
  { id: 'marketing-sales', label: 'Marketing and sales', achievementName: 'Marketing Strategist', achievementDescription: 'Explored marketing and sales.', achievementIconName: 'BarChart2', stageKey: 'manage', stageTitle: 'Manage Your Business' },
  { id: 'ai-small-business', label: 'Explore AI for small business', achievementName: 'AI Explorer', achievementDescription: 'Looked into AI tools.', achievementIconName: 'Laptop', stageKey: 'manage', stageTitle: 'Manage Your Business' },
  { id: 'analyze-feedback-ai', label: 'Analyze Customer Feedback using AI', achievementName: 'Feedback Analyst', achievementDescription: 'Used AI to analyze feedback.', achievementIconName: 'MessageSquareQuote', stageKey: 'manage', stageTitle: 'Manage Your Business' },
  { id: 'draft-email-replies-ai', label: 'Draft Email Replies using AI', achievementName: 'Email Assistant', achievementDescription: 'Used AI to help draft email replies.', achievementIconName: 'Mail', stageKey: 'manage', stageTitle: 'Manage Your Business' },
  { id: 'draft-cold-outreach-ai', label: 'Draft Cold Outreach Emails using AI', achievementName: 'Outreach Expert', achievementDescription: 'Used AI to help draft cold outreach emails.', achievementIconName: 'Send', stageKey: 'manage', stageTitle: 'Manage Your Business' },
  { id: 'cybersecurity', label: 'Strengthen your cybersecurity', achievementName: 'Cyber Guardian', achievementDescription: 'Learned about cybersecurity.', achievementIconName: 'ShieldCheck', stageKey: 'manage', stageTitle: 'Manage Your Business' },
  { id: 'prepare-emergencies', label: 'Prepare for emergencies', achievementName: 'Emergency Planner', achievementDescription: 'Prepared for emergencies.', achievementIconName: 'Siren', stageKey: 'manage', stageTitle: 'Manage Your Business' },
  { id: 'recover-disasters', label: 'Recover from disasters', achievementName: 'Disaster Recoverer', achievementDescription: 'Planned for disaster recovery.', achievementIconName: 'HeartHandshake', stageKey: 'manage', stageTitle: 'Manage Your Business' },
  { id: 'close-sell', label: 'Plan for closing or selling your business', achievementName: 'Exit Strategist', achievementDescription: 'Considered exit strategies.', achievementIconName: 'ClipboardCheck', stageKey: 'manage', stageTitle: 'Manage Your Business' },
  { id: 'hire-disabilities', label: 'Consider hiring employees with disabilities', achievementName: 'Inclusive Employer', achievementDescription: 'Learned about inclusive hiring.', achievementIconName: 'Users', stageKey: 'manage', stageTitle: 'Manage Your Business' },
];

const growTasksRaw: Omit<WizardTask, 'completed' | 'stageIcon' | 'details'>[] = [
  { id: 'get-more-funding', label: 'Get more funding', achievementName: 'Growth Funder', achievementDescription: 'Explored growth funding.', achievementIconName: 'PiggyBank', stageKey: 'grow', stageTitle: 'Grow Your Business' },
  { id: 'expand-locations', label: 'Expand to new locations', achievementName: 'Expansionist', achievementDescription: 'Considered location expansion.', achievementIconName: 'MapPin', stageKey: 'grow', stageTitle: 'Grow Your Business' },
  { id: 'merge-acquire', label: 'Merge and acquire businesses', achievementName: 'M&A Explorer', achievementDescription: 'Learned about mergers/acquisitions.', achievementIconName: 'Building', stageKey: 'grow', stageTitle: 'Grow Your Business' },
  { id: 'federal-contractor', label: 'Become a federal contractor', achievementName: 'Federal Contractor', achievementDescription: 'Explored federal contracting.', achievementIconName: 'Landmark', stageKey: 'grow', stageTitle: 'Grow Your Business' },
  { id: 'export-products', label: 'Export products', achievementName: 'Global Exporter', achievementDescription: 'Considered exporting products.', achievementIconName: 'BarChart2', stageKey: 'grow', stageTitle: 'Grow Your Business' },
  { id: 'women-owned', label: 'Explore resources for Women-owned businesses', achievementName: 'Resourceful Entrepreneur (W)', achievementDescription: 'Explored resources for women.', achievementIconName: 'Users', stageKey: 'grow', stageTitle: 'Grow Your Business' },
  { id: 'native-american-owned', label: 'Explore resources for Native American-owned businesses', achievementName: 'Resourceful Entrepreneur (NA)', achievementDescription: 'Explored resources for Native Americans.', achievementIconName: 'Users', stageKey: 'grow', stageTitle: 'Grow Your Business' },
  { id: 'veteran-owned', label: 'Explore resources for Veteran-owned businesses', achievementName: 'Resourceful Entrepreneur (V)', achievementDescription: 'Explored resources for veterans.', achievementIconName: 'Users', stageKey: 'grow', stageTitle: 'Grow Your Business' },
  { id: 'military-spouse', label: 'Explore resources for Military spouse businesses', achievementName: 'Resourceful Entrepreneur (MS)', achievementDescription: 'Explored resources for military spouses.', achievementIconName: 'Users', stageKey: 'grow', stageTitle: 'Grow Your Business' },
  { id: 'rural-businesses', label: 'Explore resources for Rural businesses', achievementName: 'Resourceful Entrepreneur (R)', achievementDescription: 'Explored resources for rural businesses.', achievementIconName: 'Users', stageKey: 'grow', stageTitle: 'Grow Your Business' },
  { id: 'minority-owned', label: 'Explore resources for Minority-owned businesses', achievementName: 'Resourceful Entrepreneur (M)', achievementDescription: 'Explored resources for minorities.', achievementIconName: 'Users', stageKey: 'grow', stageTitle: 'Grow Your Business' },
];

const stageIcons = {
  plan: Briefcase,
  launch: Rocket,
  manage: Settings,
  grow: LineChart,
};

const getTaskDetails = (taskId: string, taskActions: TaskActions, task: WizardTask): React.ReactNode => {
   if (task.isInteractiveTool && task.interactiveToolLink) {
    return (
      <div>
        <p className="mb-3">This task involves using an interactive tool. Click the button below to go to the dedicated page for this activity.</p>
        <Link href={task.interactiveToolLink} passHref>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Wand2 className="mr-2 h-4 w-4" /> Open {task.label} Tool
          </Button>
        </Link>
        <p className="mt-3 text-xs text-muted-foreground">Completing the interactive tool will help you fulfill this step. You can mark this task complete here once you're satisfied with your work in the tool.</p>
      </div>
    );
  }
  switch (taskId) {
    case 'market-research': return (
      <div>
        <p className="mb-2">Understand your customers, industry, and competitors. This involves:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Identifying your target audience and their needs.</li>
          <li>Analyzing market size, trends, and growth potential.</li>
          <li>Researching your direct and indirect competitors, their strengths, and weaknesses.</li>
          <li>Explore resources like the <a href="https://www.sba.gov/business-guide/plan-your-business/market-research-competitive-analysis" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA's Market Research Guide <LinkIcon className="inline w-3 h-3"/></a>.</li>
        </ul>
      </div>);
    // case 'business-plan': return (<div><p className="mb-2">Create a comprehensive roadmap for your business. Common sections include:</p><ul className="list-disc pl-5 space-y-1"><li><strong>Executive Summary:</strong> A brief overview of your entire plan.</li><li><strong>Company Description:</strong> Detail your business, mission, vision, and legal structure.</li><li><strong>Market Analysis:</strong> Summarize your market research findings.</li><li><strong>Organization and Management:</strong> Outline your business and management structure.</li><li><strong>Service or Product Line:</strong> Describe what you're selling and its benefits.</li><li><strong>Marketing and Sales Strategy:</strong> How you'll reach and sell to customers.</li><li><strong>Funding Request (if applicable):</strong> How much money you need and how it will be used.</li><li><strong>Financial Projections:</strong> Forecasts for revenue, expenses, and profitability.</li><li><strong>Appendix (optional):</strong> Supporting documents like resumes, permits, etc.</li></ul><p className="mt-2">Use templates from <a href="https://www.sba.gov/business-guide/plan-your-business/write-your-business-plan" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA <LinkIcon className="inline w-3 h-3"/></a> or <a href="https://www.score.org/business-plan-templates" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SCORE <LinkIcon className="inline w-3 h-3"/></a>. The AI Business Advisor can help draft sections.</p></div>);
    case 'startup-costs': return (<div><p className="mb-2">Estimate the initial investment needed to launch. Consider costs like:</p><ul className="list-disc pl-5 space-y-1"><li>Office space (rent, utilities)</li><li>Equipment and supplies</li><li>Initial inventory</li><li>Licenses and permits</li><li>Insurance</li><li>Marketing and advertising (website, initial campaigns)</li><li>Salaries (if applicable)</li><li>Legal and professional fees</li></ul><p className="mt-2">The <a href="https://www.sba.gov/business-guide/plan-your-business/calculate-your-startup-costs" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA <LinkIcon className="inline w-3 h-3"/></a> offers guidance. Our AI Advisor can also help estimate costs.</p></div>);
    case 'business-credit': return (<div><p className="mb-2">Establishing business credit is crucial for securing loans, getting favorable terms from suppliers, and separating your personal and business finances. Aim to:</p><ul className="list-disc pl-5 space-y-1"><li><strong>Understand Creditworthiness:</strong> Learn what factors contribute to a good business credit score.</li><li><strong>Register Your Business:</strong> Formally establish your business entity.</li><li><strong>Open a Business Bank Account:</strong> Keep business finances separate.</li><li><strong>Get an EIN:</strong> Obtain an Employer Identification Number from the IRS, even if you don't have employees.</li><li><strong>Establish Trade Lines:</strong> Work with vendors and suppliers who report payments to business credit bureaus.</li><li><strong>Monitor Your Credit:</strong> Regularly check your business credit reports for accuracy.</li></ul><p className="mt-2">Read more at the <a href="https://www.sba.gov/business-guide/launch-your-business/establish-business-credit" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA's guide to establishing business credit <LinkIcon className="inline w-3 h-3"/></a>.</p></div>);
    case 'fund-business': return (<div><p className="mb-2">Explore various options to finance your startup and growth. Consider the following steps:</p><ul className="list-disc pl-5 space-y-1"><li><strong>Assess Your Needs:</strong> Determine how much funding you require based on your startup cost calculations and business plan.</li><li><strong>Explore Self-Funding (Bootstrapping):</strong> Using personal savings or revenue generated by the business.</li><li><strong>Research Loans:</strong> Investigate options like <a href="https://www.sba.gov/funding-programs/loans" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA loans <LinkIcon className="inline w-3 h-3"/></a>, bank loans, or microloans.</li><li><strong>Seek Grants:</strong> Use our AI Grant Finder tool (in the AI Business Advisor section) and platforms like <a href="https://www.grants.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">Grants.gov <LinkIcon className="inline w-3 h-3"/></a>. Focus on grants specific to your industry, location, or business type.</li><li><strong>Consider Investors:</strong> Angel investors or venture capital might be an option for high-growth potential businesses. Prepare a pitch deck (our AI Advisor can help!).</li><li><strong>Look into Crowdfunding:</strong> Platforms like Kickstarter or Indiegogo can help raise funds from a large number of people.</li></ul><p className="mt-2">The <a href="https://www.sba.gov/business-guide/plan-your-business/fund-your-business" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA provides an overview of funding options <LinkIcon className="inline w-3 h-3"/></a>.</p></div>);
    case 'buy-existing': return (<div><p className="mb-2">Purchasing an existing business or franchise can be an alternative to starting from scratch. Key considerations include:</p><ul className="list-disc pl-5 space-y-1"><li><strong>Pros:</strong> Established customer base, existing cash flow, proven concept, trained employees, existing licenses and permits.</li><li><strong>Cons:</strong> Higher upfront cost, potential hidden problems, less flexibility, existing reputation (good or bad).</li><li><strong>Due Diligence:</strong> Thoroughly investigate the business's financials, legal standing, operations, and market position.</li><li><strong>Valuation:</strong> Determine a fair price for the business.</li><li><strong>Financing:</strong> Explore how you will fund the purchase.</li></ul><p className="mt-2">The <a href="https://www.sba.gov/business-guide/plan-your-business/buy-existing-business-or-franchise" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA offers resources <LinkIcon className="inline w-3 h-3"/></a> on buying existing businesses and franchises.</p></div>);
    case 'pick-location': return (<div><p className="mb-2">Choosing the right location is vital for many businesses. Consider these factors:</p><ul className="list-disc pl-5 space-y-1"><li><strong>Business Type:</strong> Does your business require a physical storefront, office, or can it be home-based/online?</li><li><strong>Target Market:</strong> Is the location accessible and convenient for your customers?</li><li><strong>Zoning Laws:</strong> Ensure the location is zoned for your type of business. Check local city/county regulations.</li><li><strong>Competition:</strong> Analyze nearby competitors.</li><li><strong>Costs:</strong> Evaluate rent, utilities, and other location-specific expenses.</li><li><strong>Infrastructure & Accessibility:</strong> Consider parking, public transport, and road access.</li><li><strong>Demographics:</strong> Research the local population if customer foot traffic is important.</li></ul><p className="mt-2">The <a href="https://www.sba.gov/business-guide/launch-your-business/pick-your-business-location" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA provides guidance on picking a location <LinkIcon className="inline w-3 h-3"/></a>.</p></div>);
    case 'choose-structure': return (<div><p className="mb-2">Selecting the right legal structure impacts your liability, taxes, and administrative requirements. Common structures include:</p><ul className="list-disc pl-5 space-y-1"><li><strong>Sole Proprietorship:</strong> Simple, owned by one person, personal liability.</li><li><strong>Partnership:</strong> Owned by two or more individuals, shared liability and profits.</li><li><strong>Limited Liability Company (LLC):</strong> Combines simplicity with limited personal liability.</li><li><strong>Corporation (C-Corp, S-Corp):</strong> More complex, separate legal entity, offers strongest liability protection.</li></ul><p className="mt-2">Understand the pros and cons with the <a href="https://www.sba.gov/business-guide/launch-your-business/choose-business-structure" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA's guide <LinkIcon className="inline w-3 h-3"/></a>. For Colorado-specific information, visit the <a href="https://www.sos.state.co.us/pubs/business/chooseBusinessStructure.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">Colorado Secretary of State <LinkIcon className="inline w-3 h-3"/></a>. The AI Advisor can also provide a Colorado-specific registration guide.</p></div>);
    case 'choose-name': return (<div><p className="mb-2">Your business name is a key part of your brand. Consider these steps:</p><ul className="list-disc pl-5 space-y-1"><li><strong>Brainstorm Ideas:</strong> Think about names that are memorable, descriptive, and available. Use the AI Business Name Generator for ideas!</li><li><strong>Check Availability:</strong>
        <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>Ensure the name isn't already in use by another business in your state. For Colorado, search the <a href="https://www.coloradosos.gov/biz/BusinessEntityCriteriaExt.do" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">Colorado SOS database <Search className="inline w-3 h-3"/></a>.</li>
            <li>Check for federal trademark availability through the <a href="https://www.uspto.gov/trademarks" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">USPTO <LinkIcon className="inline w-3 h-3"/></a>.</li>
            <li>Check for domain name and social media handle availability.</li>
        </ul>
    </li>
    <li><strong>Register Your Name:</strong> This process varies by business structure and state. It might involve registering a "Doing Business As" (DBA) name or registering the name as part of your business entity formation.</li>
</ul><p className="mt-2">The <a href="https://www.sba.gov/business-guide/launch-your-business/choose-your-business-name" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA offers tips on choosing your business name <LinkIcon className="inline w-3 h-3"/></a>.</p></div>);
    case 'register-business': return (
      <div>
        <p className="mb-2">Formally register your business with government agencies. Upload your official registration document (e.g., Certificate of Formation, Articles of Incorporation) to mark this task complete.</p>
        <ul className="list-disc pl-5 space-y-1 mb-3">
            <li>General info: <a href="https://www.sba.gov/business-guide/launch-your-business/register-your-business" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA <LinkIcon className="inline w-3 h-3"/></a>.</li>
            <li>Colorado: <a href="https://mybiz.colorado.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">MyBizColorado <LinkIcon className="inline w-3 h-3"/></a>. Use the AI Advisor for a Colorado-specific guide.</li>
        </ul>
        <div className="space-y-2">
          <Input 
            type="file" 
            aria-label="Upload registration document"
            accept=".pdf,.doc,.docx,.jpg,.png" 
            onChange={(e) => taskActions.setSelectedFile(e.target.files ? e.target.files[0] : null)} 
            className="max-w-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
          {taskActions.selectedFile && <p className="text-xs text-muted-foreground">Selected: {taskActions.selectedFile.name}</p>}
          <Button 
            onClick={() => {
              if (taskActions.selectedFile) {
                taskActions.handleFileUpload(taskActions.selectedFile, 'register-business');
              } else {
                toast({ variant: "destructive", title: "No file selected", description: "Please select a document to upload." });
              }
            }}
            disabled={!taskActions.selectedFile}
            size="sm"
          >
            <UploadCloud className="mr-2 h-4 w-4" /> Upload Document & Complete Task
          </Button>
        </div>
      </div>
    );
    case 'get-tax-ids': return (<ul><li><DollarSign className="inline w-4 h-4 mr-1 text-accent"/>Obtain federal (EIN) and state tax identification numbers.</li><li>Federal EIN: <a href="https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">IRS Website <LinkIcon className="inline w-3 h-3"/></a>. Colorado: through <a href="https://tax.colorado.gov/how-to-register-for-a-colorado-account-number-can" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">CDOR <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>);
    case 'apply-licenses': return (<ul><li><FileText className="inline w-4 h-4 mr-1 text-accent"/>Secure necessary operational licenses.</li><li>Use the <a href="https://www.sba.gov/business-guide/launch-your-business/apply-licenses-permits" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA tool <LinkIcon className="inline w-3 h-3"/></a>. Colorado also has <a href="https://osa.colorado.gov/licensing-directory" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">a licensing directory <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>);
    case 'open-bank-account': return (<ul><li><CreditCard className="inline w-4 h-4 mr-1 text-accent"/>Open a dedicated account for business finances.</li><li><a href="https://www.sba.gov/business-guide/launch-your-business/open-business-bank-account" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA guidance <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>);
    case 'get-insurance': return (<ul><li><ShieldCheck className="inline w-4 h-4 mr-1 text-accent"/>Get appropriate coverage to protect your business.</li><li><a href="https://www.sba.gov/business-guide/launch-your-business/get-business-insurance" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA info on insurance <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>);
    case 'manage-finances': return (<div><p className="mb-2">Effective financial management is key to business sustainability. Focus on:</p><ul className="list-disc pl-5 space-y-1"><li><strong>Bookkeeping:</strong> Regularly record all income and expenses. Consider accounting software.</li><li><strong>Budgeting:</strong> Create a budget to plan and control your spending.</li><li><strong>Cash Flow Management:</strong> Monitor money coming in and out to ensure you can meet obligations.</li><li><strong>Financial Statements:</strong> Understand and regularly review your profit and loss statement, balance sheet, and cash flow statement.</li><li><strong>Separating Finances:</strong> Keep personal and business finances strictly separate.</li></ul><p className="mt-2">The <a href="https://www.sba.gov/business-guide/manage-your-business/manage-your-finances" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA offers finance management resources <LinkIcon className="inline w-3 h-3"/></a>.</p></div>);
    case 'hire-employees': return (<div><p className="mb-2">Hiring your first employees is a major step. Key aspects include:</p><ul className="list-disc pl-5 space-y-1"><li><strong>Legal Requirements:</strong> Understand employer obligations (EIN, payroll taxes, workers' compensation, labor laws).</li><li><strong>Job Descriptions:</strong> Write clear and accurate job descriptions.</li><li><strong>Recruiting:</strong> Find qualified candidates through job boards, networking, etc.</li><li><strong>Interviewing & Selection:</strong> Develop a structured interview process.</li><li><strong>Onboarding:</strong> Integrate new hires effectively into your company.</li><li><strong>Compliance:</strong> Adhere to all federal and state employment laws.</li></ul><p className="mt-2">Consult the <a href="https://www.sba.gov/business-guide/manage-your-business/hire-manage-employees" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA's hiring guide <LinkIcon className="inline w-3 h-3"/></a>. For Colorado-specific information, check <a href="https://cdle.colorado.gov/employers" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">CDLE resources <LinkIcon className="inline w-3 h-3"/></a>.</p></div>);
    case 'pay-taxes': return (<ul><li><DollarSign className="inline w-4 h-4 mr-1 text-accent"/>Understand obligations and file/pay accurately.</li><li>Federal: <a href="https://www.irs.gov/businesses" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">IRS for Businesses <LinkIcon className="inline w-3 h-3"/></a>. Colorado: <a href="https://tax.colorado.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">CDOR <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>);
    case 'stay-compliant': return (<ul><li><ShieldCheck className="inline w-4 h-4 mr-1 text-accent"/>Adhere to labor laws, regulations, and reporting.</li><li><a href="https://www.sba.gov/business-guide/manage-your-business/stay-legally-compliant" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA compliance guide <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>);
    case 'buy-assets': return (<ul><li><ShoppingBag className="inline w-4 h-4 mr-1 text-accent"/>Purchase and manage necessary business assets.</li><li><a href="https://www.sba.gov/business-guide/manage-your-business/buy-assets-equipment" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA on buying assets <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>);
    case 'marketing-sales': return (<ul><li><BarChart2 className="inline w-4 h-4 mr-1 text-accent"/>Attract customers and generate revenue.</li><li><a href="https://www.sba.gov/business-guide/manage-your-business/marketing-sales" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA marketing & sales resources <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>);
    case 'ai-small-business': return (<div><p className="mb-2">Artificial Intelligence can be a powerful tool for small businesses, even without a dedicated tech team. Explore how AI can help with:</p><ul className="list-disc pl-5 space-y-1"><li><strong>Customer Service:</strong> Chatbots for instant responses (though more complex than Genkit's direct use here).</li><li><strong>Marketing:</strong> Generating ad copy, social media posts, blog ideas (use our AI Advisor tools!).</li><li><strong>Content Creation:</strong> Drafting emails, reports, product descriptions (use our AI Advisor!).</li><li><strong>Data Analysis:</strong> Identifying trends in customer feedback (use our "Analyze Text" tool!).</li><li><strong>Efficiency:</strong> Automating repetitive tasks.</li></ul><p className="mt-2">Start by exploring the AI tools built into BizLaunch in the "AI Business Advisor" section below. For more advanced uses, you can research dedicated AI platforms for specific tasks.</p></div>);
    case 'analyze-feedback-ai': return (<ul><li><MessageSquareQuote className="inline w-4 h-4 mr-1 text-accent"/>Use the AI Text Analyzer tool in the AI Business Advisor to understand customer sentiment and extract keywords from feedback.</li></ul>);
    case 'draft-email-replies-ai': return (<ul><li><Mail className="inline w-4 h-4 mr-1 text-accent"/>Use the AI Email Reply Drafter in the AI Business Advisor to quickly respond to customer inquiries.</li></ul>);
    case 'draft-cold-outreach-ai': return (<ul><li><Send className="inline w-4 h-4 mr-1 text-accent"/>Use the AI Cold Outreach Email Drafter in the AI Business Advisor to create effective outreach messages.</li></ul>);
    case 'cybersecurity': return (<ul><li><ShieldCheck className="inline w-4 h-4 mr-1 text-accent"/>Protect your digital assets and customer data.</li><li><a href="https://www.sba.gov/business-guide/manage-your-business/strengthen-your-cybersecurity" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA cybersecurity guide <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>);
    case 'prepare-emergencies': return (<ul><li><Siren className="inline w-4 h-4 mr-1 text-accent"/>Develop contingency plans for unexpected events.</li><li><a href="https://www.ready.gov/business" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">Ready.gov for businesses <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>);
    case 'recover-disasters': return (<ul><li><HeartHandshake className="inline w-4 h-4 mr-1 text-accent"/>Plan for recovery from natural or other disasters.</li><li><a href="https://www.sba.gov/funding-programs/disaster-assistance" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA disaster assistance <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>);
    case 'close-sell': return (<ul><li><ClipboardCheck className="inline w-4 h-4 mr-1 text-accent"/>Understand the process for exiting your business.</li><li><a href="https://www.sba.gov/business-guide/manage-your-business/close-or-sell-your-business" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA guide on closing/selling <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>);
    case 'hire-disabilities': return (<ul><li><Users className="inline w-4 h-4 mr-1 text-accent"/>Learn about benefits and resources.</li><li>Visit the <a href="https://www.dol.gov/agencies/odep/topics/employers" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">Department of Labor's ODEP <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>);
    case 'get-more-funding': return (<ul><li><PiggyBank className="inline w-4 h-4 mr-1 text-accent"/>Secure capital for expansion activities.</li><li><a href="https://www.sba.gov/business-guide/grow-your-business/get-more-funding" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA growth funding options <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>);
    case 'expand-locations': return (<ul><li><MapPin className="inline w-4 h-4 mr-1 text-accent"/>Expand your physical or market reach.</li><li><a href="https://www.sba.gov/business-guide/grow-your-business/expand-new-locations" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA expansion guide <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>);
    case 'merge-acquire': return (<ul><li><Building className="inline w-4 h-4 mr-1 text-accent"/>Grow through strategic acquisitions or mergers.</li><li><a href="https://www.sba.gov/business-guide/grow-your-business/merge-acquire-businesses" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA M&A guide <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>);
    case 'federal-contractor': return (<ul><li><Landmark className="inline w-4 h-4 mr-1 text-accent"/>Bid on government contracts.</li><li><a href="https://www.sba.gov/federal-contracting" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA federal contracting resources <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>);
    case 'export-products': return (<ul><li><BarChart2 className="inline w-4 h-4 mr-1 text-accent"/>Sell your products or services internationally.</li><li><a href="https://www.sba.gov/business-guide/grow-your-business/export-products" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA exporting guide <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>);
    case 'women-owned': return (<ul><li><Users className="inline w-4 h-4 mr-1 text-accent"/>Access resources tailored for women entrepreneurs.</li><li><a href="https://www.sba.gov/business-guide/grow-your-business/women-owned-businesses" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA Women-Owned Businesses <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>);
    case 'native-american-owned': return (<ul><li><Users className="inline w-4 h-4 mr-1 text-accent"/>Access resources for Native American entrepreneurs.</li><li><a href="https://www.sba.gov/business-guide/grow-your-business/native-american-owned-businesses" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA Native American-Owned <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>);
    case 'veteran-owned': return (<ul><li><Users className="inline w-4 h-4 mr-1 text-accent"/>Access resources for veteran entrepreneurs.</li><li><a href="https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA Veteran-Owned <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>);
    case 'military-spouse': return (<ul><li><Users className="inline w-4 h-4 mr-1 text-accent"/>Access resources for military spouse entrepreneurs.</li><li><a href="https://www.sba.gov/business-guide/grow-your-business/military-spouse-owned-businesses" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA Military Spouse-Owned <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>);
    case 'rural-businesses': return (<ul><li><Users className="inline w-4 h-4 mr-1 text-accent"/>Access resources for rural entrepreneurs.</li><li><a href="https://www.sba.gov/business-guide/grow-your-business/rural-businesses" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA Rural Businesses <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>);
    case 'minority-owned': return (<ul><li><Users className="inline w-4 h-4 mr-1 text-accent"/>Access resources for minority entrepreneurs.</li><li><a href="https://www.sba.gov/business-guide/grow-your-business/minority-owned-businesses" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA Minority-Owned <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>);
    default: return <p>Details for this task are coming soon.</p>;
  }
};

const wizardTasks: WizardTask[] = [
  ...planTasksRaw.map(task => ({ ...task, completed: false, stageIcon: stageIcons[task.stageKey], details: (actions: TaskActions) => getTaskDetails(task.id, actions, task as WizardTask) })),
  ...launchTasksRaw.map(task => ({ ...task, completed: false, stageIcon: stageIcons[task.stageKey], details: (actions: TaskActions) => getTaskDetails(task.id, actions, task as WizardTask) })),
  ...manageTasksRaw.map(task => ({ ...task, completed: false, stageIcon: stageIcons[task.stageKey], details: (actions: TaskActions) => getTaskDetails(task.id, actions, task as WizardTask) })),
  ...growTasksRaw.map(task => ({ ...task, completed: false, stageIcon: stageIcons[task.stageKey], details: (actions: TaskActions) => getTaskDetails(task.id, actions, task as WizardTask) })),
];

const allAchievements: Achievement[] = wizardTasks.map(task => ({
    id: task.id,
    name: task.achievementName,
    description: task.achievementDescription,
    iconName: task.achievementIconName,
}));

const allTasksForAdvisor: AdvisorTaskInfo[] = wizardTasks.map(task => ({
  id: task.id,
  label: task.label,
}));


export default function DashboardPage() {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [tasks, setTasks] = useState<WizardTask[]>(() => {
    if (typeof window !== 'undefined') {
      const savedIndex = localStorage.getItem('bizlaunch_currentTaskIndex');
      if (savedIndex !== null) {
        setCurrentTaskIndex(parseInt(savedIndex, 10));
      }
      return wizardTasks.map(task => ({
        ...task,
        completed: getAchievementStatus(task.id),
      }));
    }
    return wizardTasks.map(task => ({ ...task, completed: false }));
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bizlaunch_currentTaskIndex', currentTaskIndex.toString());
    }
  }, [currentTaskIndex]);

  useEffect(() => {
    const handleExternalAchievementUpdate = (event: Event) => {
      if (event instanceof CustomEvent) {
        const { taskId, completed } = event.detail;
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId ? { ...task, completed } : task
          )
        );
      }
    };
    window.addEventListener('achievementUpdate', handleExternalAchievementUpdate);
    return () => {
      window.removeEventListener('achievementUpdate', handleExternalAchievementUpdate);
    };
  }, []);

  const markTaskComplete = (taskId: string) => {
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: true } : task
      );
      const changedTask = updatedTasks.find(task => task.id === taskId);
      if (changedTask) {
        updateAchievementStatus(changedTask.id, true);
        window.dispatchEvent(new CustomEvent('achievementUpdate', { detail: { taskId: changedTask.id, completed: true } }));
      }
      return updatedTasks;
    });
  };

  const handleCheckChange = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.requiresUpload && !task.completed) { // Only block if requires upload AND not yet completed
        toast({
            variant: "default",
            title: "Upload Required",
            description: "Please upload the required document to complete this task.",
        });
        return; // Prevent checkbox toggling if upload is required and task is not yet marked as complete
    }

    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
      const changedTask = updatedTasks.find(task => task.id === taskId);
      if (changedTask) {
        updateAchievementStatus(changedTask.id, changedTask.completed);
        window.dispatchEvent(new CustomEvent('achievementUpdate', { detail: { taskId: changedTask.id, completed: changedTask.completed } }));
      }
      return updatedTasks;
    });
  };

  const handleFileUpload = async (file: File, taskId: string) => {
    if (!file) {
      toast({ variant: "destructive", title: "Upload Error", description: "No file selected." });
      return;
    }
    setIsUploading(true);
    // Placeholder for actual user ID - replace with real auth user ID when available
    const userId = "default_user"; 
    const filePath = `${userId}/registration_documents/${taskId}/${file.name}`;
    const fileRef = storageRef(storage, filePath);

    try {
      await uploadBytes(fileRef, file);
      //const downloadURL = await getDownloadURL(fileRef); // Optional: get URL if needed
      
      markTaskComplete(taskId); // Mark task as complete
      setSelectedFile(null); // Reset file input

      toast({
        title: "Upload Successful",
        description: `Document "${file.name}" uploaded and task marked as complete.`,
      });
    } catch (error) {
      console.error("Upload Error:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "There was an error uploading your document. Please try again. (Ensure you are logged in if storage rules require auth, or check storage rules in Firebase console)",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const taskActions: TaskActions = {
    handleFileUpload,
    setSelectedFile,
    selectedFile,
  };


  const goToNextTask = () => {
    setCurrentTaskIndex(prev => Math.min(prev + 1, tasks.length - 1));
    setSelectedFile(null); // Reset selected file when navigating
  };

  const goToPreviousTask = () => {
    setCurrentTaskIndex(prev => Math.max(prev - 1, 0));
    setSelectedFile(null); // Reset selected file when navigating
  };

  const currentTask = tasks[currentTaskIndex];
  const CurrentStageIcon = currentTask.stageIcon;

  const overallProgress = tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0;
  const tasksInCurrentStage = tasks.filter(t => t.stageKey === currentTask.stageKey);
  const completedInCurrentStage = tasksInCurrentStage.filter(t => t.completed).length;
  const stageProgress = tasksInCurrentStage.length > 0 ? (completedInCurrentStage / tasksInCurrentStage.length) * 100 : 0;


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
              <SidebarMenuItem>
                <SidebarMenuButton href="#top" isActive tooltip="Dashboard Home">
                  <HomeIcon />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton href="#wizard" tooltip="Business Wizard">
                  <Star /> 
                  <span>Wizard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton href="/dashboard/business-plan" tooltip="Interactive Business Plan">
                  <Wand2 /> 
                  <span>Business Plan Tool</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton href="#achievements" tooltip="Achievements">
                  <Trophy />
                  <span>Achievements</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton href="#resources" tooltip="Resource Hub">
                   <LandmarkIcon /> {/* Or consider LinkIcon */}
                  <span>Resource Hub</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
      <SidebarInset className="p-4 sm:p-6 flex-1" id="top">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">Welcome to Your BizLaunch Dashboard</h2>
           <SidebarTrigger className="md:hidden"/>
        </div>

        <p className="text-muted-foreground mb-8 text-sm sm:text-base">Your comprehensive guide to planning, launching, managing, and growing your business. Start with the wizard below, track your achievements, or ask our AI Business Advisor for personalized guidance.</p>
        
        <AIBusinessAdvisor allTasks={allTasksForAdvisor} />

        <div id="wizard" className="mt-12 pt-12 border-t scroll-mt-20">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl font-semibold text-primary flex items-center gap-2">
                <CurrentStageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                {currentTask.stageTitle} - Step {tasks.filter(t => t.stageKey === currentTask.stageKey).findIndex(t => t.id === currentTask.id) + 1} of {tasks.filter(t => t.stageKey === currentTask.stageKey).length}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Follow these steps to build and grow your business. (Overall Progress: {currentTaskIndex + 1} of {tasks.length})</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor={`task-${currentTask.id}`} className="text-lg sm:text-xl font-semibold text-foreground mb-2 block">
                  {currentTask.label}
                </Label>
                { !currentTask.isInteractiveTool && (
                    <div className="flex items-center space-x-3 p-3 border rounded-md bg-secondary shadow-sm">
                    <Checkbox
                        id={`task-${currentTask.id}`}
                        checked={currentTask.completed}
                        onCheckedChange={() => handleCheckChange(currentTask.id)}
                        aria-labelledby={`task-${currentTask.id}-label`}
                        disabled={isUploading || (currentTask.requiresUpload && !currentTask.completed)}
                    />
                    <p id={`task-${currentTask.id}-label`} className="text-xs sm:text-sm text-secondary-foreground flex-1">
                        {currentTask.requiresUpload && !currentTask.completed ? "Complete by uploading document below." : "Mark this task as completed."}
                    </p>
                    </div>
                )}
              </div>

              <div className="mt-4 p-4 border rounded-md bg-background text-sm text-muted-foreground space-y-2 prose prose-sm max-w-none prose-ul:list-disc prose-ul:pl-5 prose-li:mb-1 prose-a:text-accent prose-a:hover:underline">
                 <h4 className="font-semibold text-foreground text-base mb-2">Task Details & Sub-Goals:</h4>
                {typeof currentTask.details === 'function' ? currentTask.details(taskActions) : currentTask.details}
              </div>
              
              <Separator className="my-6" />

              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Stage Progress ({currentTask.stageTitle}):</p>
                <Progress value={stageProgress} className="w-full h-2 mb-4" aria-label={`Stage progress for ${currentTask.stageTitle}: ${stageProgress.toFixed(0)}%`} />
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Overall Progress:</p>
                <Progress value={overallProgress} className="w-full h-2" aria-label={`Overall progress: ${overallProgress.toFixed(0)}%`} />
              </div>

              <div className="flex flex-col sm:flex-row justify-between mt-6 gap-3 sm:gap-0">
                <Button onClick={goToPreviousTask} disabled={currentTaskIndex === 0 || isUploading} variant="outline" className="w-full sm:w-auto">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous Task
                </Button>
                <Button onClick={goToNextTask} disabled={currentTaskIndex === tasks.length - 1 || isUploading} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                  Next Task <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>


        <div id="achievements" className="mt-12 pt-12 border-t scroll-mt-20">
            <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-primary flex items-center gap-2"><Trophy className="w-5 h-5 sm:w-6 sm:h-6"/> Achievements</h3>
            <AchievementsDisplay allAchievements={allAchievements} stageKeys={['plan', 'launch', 'manage', 'grow']} />
        </div>


        <div id="resources" className="mt-12 pt-12 border-t scroll-mt-20">
           <ResourceHub />
        </div>
      </SidebarInset>
    </div>
  );
}


    
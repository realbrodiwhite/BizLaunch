
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
  // No 'level' needed if we compute indentation dynamically or use CSS
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

  return null; // No specific details for very granular sub-tasks by default
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
        details: (actions) => (
          <div className="text-xs">
            <p className="mb-1">Understand your customers, industry, and competitors.</p>
            <a href="https://www.sba.gov/business-guide/plan-your-business/market-research-competitive-analysis" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center gap-1"><LinkIcon className="w-3 h-3"/> SBA's Market Research Guide</a>
          </div>
        ),
        subTasks: [
          { id: 'mr-audience', label: 'Understand Your Target Audience', completed: false, subTasks: [
            { id: 'mr-audience-demographics', label: 'Define customer demographics (age, location, income)', completed: false, details: "E.g., Age 25-45, urban areas, income $50k+." },
            { id: 'mr-audience-psychographics', label: 'Identify psychographics (lifestyle, values, interests)', completed: false, details: "E.g., Environmentally conscious, tech-savvy, enjoys outdoor activities." },
            { id: 'mr-audience-needs', label: 'Determine customer needs and pain points', completed: false, details: "What problems are they trying to solve? What frustrates them with current solutions?" },
          ]},
          { id: 'mr-market', label: 'Analyze Market Size & Trends', completed: false, subTasks: [
            { id: 'mr-market-size', label: 'Research overall market size (TAM, SAM, SOM)', completed: false, details: "Total Addressable Market, Serviceable Addressable Market, Serviceable Obtainable Market." },
            { id: 'mr-market-trends', label: 'Identify current market trends (growth, new tech)', completed: false, details: "Is the market growing or declining? What new technologies or consumer behaviors are emerging?" },
            { id: 'mr-market-potential', label: 'Assess growth potential', completed: false, details: "What is the future outlook for this market?" },
          ]},
          { id: 'mr-competitors', label: 'Research Competitors', completed: false, subTasks: [
            { id: 'mr-competitors-direct', label: 'Identify direct competitors', completed: false, details: "Who offers similar products/services to the same target market?" },
            { id: 'mr-competitors-indirect', label: 'Identify indirect competitors', completed: false, details: "Who offers different products/services that solve the same customer problem?" },
            { id: 'mr-competitors-swot', label: 'Analyze competitor strengths & weaknesses', completed: false, details: "What do they do well? Where do they fall short?" },
            { id: 'mr-competitors-strategy', label: 'Review competitor pricing & marketing', completed: false, details: "How do they price their offerings? What marketing channels do they use?" },
          ]},
          { id: 'mr-document', label: 'Document Findings', completed: false, details: "Compile your research into a shareable format." },
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
        subTasks: [
          { id: 'bp-executive-summary', label: 'Draft Executive Summary', completed: false, details: "A brief overview of the entire plan." },
          { id: 'bp-company-description', label: 'Define Company Description', completed: false, details: "Business nature, mission, vision, legal structure, objectives." },
          { id: 'bp-market-analysis-doc', label: 'Document Market Analysis Section', completed: false, subTasks: [
            {id: 'bp-ma-target', label: 'Summarize target market', completed: false},
            {id: 'bp-ma-industry', label: 'Describe industry overview', completed: false},
            {id: 'bp-ma-competition', label: 'Detail competitive landscape', completed: false},
            {id: 'bp-ma-swot', label: 'Conduct SWOT analysis for your business', completed: false},
          ]},
          { id: 'bp-organization-management', label: 'Outline Organization and Management', completed: false, details: "Team structure, key personnel, roles, expertise." },
          { id: 'bp-products-services', label: 'Describe Products or Services', completed: false, details: "What you sell, unique value proposition, benefits." },
          { id: 'bp-marketing-sales', label: 'Develop Marketing and Sales Strategy', completed: false, details: "How you'll reach customers and generate sales." },
          { id: 'bp-funding-request', label: 'Specify Funding Request (if applicable)', completed: false, details: "Amount needed, use of funds, terms." },
          { id: 'bp-financial-projections', label: 'Create Financial Projections', completed: false, details: "Income statement, cash flow, balance sheet forecasts." },
          { id: 'bp-appendix', label: 'Prepare Appendix (optional)', completed: false, details: "Supporting documents: resumes, permits, etc." },
        ],
      },
      { id: 'startup-costs', label: 'Calculate your startup costs', completed: false, achievementName: 'Cost Calculator', achievementDescription: 'Calculated initial startup costs.', achievementIconName: 'DollarSign', details: "Estimate initial investment: rent, equipment, inventory, marketing, etc. Use SBA guide or AI Advisor." },
      { id: 'business-credit', label: 'Establish business credit', completed: false, achievementName: 'Credit Conscious', achievementDescription: 'Learned about business credit.', achievementIconName: 'CreditCard', details: "Register business, open business bank account, get EIN, establish trade lines. See SBA guide." },
      { id: 'fund-business', label: 'Fund your business', completed: false, achievementName: 'Funding Finder', achievementDescription: 'Explored funding options.', achievementIconName: 'PiggyBank', details: "Explore bootstrapping, loans (SBA), grants (AI Grant Finder), investors, crowdfunding. See SBA guide." },
      { id: 'buy-existing', label: 'Consider buying an existing business or franchise', completed: false, achievementName: 'Strategic Thinker', achievementDescription: 'Considered buying vs. starting.', achievementIconName: 'Building', details: "Weigh pros/cons (established base vs. cost/issues). Due diligence is key. See SBA resources." },
    ],
  },
  {
    key: 'launch',
    title: 'Launch Your Business',
    icon: Rocket,
    tasks: [
      { id: 'pick-location', label: 'Pick your business location', completed: false, achievementName: 'Location Scout', achievementDescription: 'Chose a business location.', achievementIconName: 'MapPin', details: "Consider business type, target market, zoning, costs, accessibility. See SBA guide." },
      { id: 'choose-structure', label: 'Choose a business structure', completed: false, achievementName: 'Structure Selector', achievementDescription: 'Selected a legal structure.', achievementIconName: 'Landmark', details: "Sole proprietorship, partnership, LLC, corporation. Impacts liability, taxes. See SBA & CO SOS guides." },
      { id: 'choose-name', label: 'Choose your business name', completed: false, achievementName: 'Name Giver', achievementDescription: 'Picked a business name.', achievementIconName: 'FileText', details: "Brainstorm, check availability (CO SOS, USPTO, domain). Use AI Name Generator. See SBA tips." },
      { id: 'register-business', label: 'Register your business', completed: false, achievementName: 'Official Registrant', achievementDescription: 'Registered the business.', achievementIconName: 'ClipboardCheck', requiresUpload: true, details: "Formalize with government. Upload registration doc. CO: MyBizColorado. Use AI Advisor for CO guide." },
      { id: 'get-tax-ids', label: 'Get federal and state tax ID numbers', completed: false, achievementName: 'Tax ID Acquirer', achievementDescription: 'Obtained necessary tax IDs.', achievementIconName: 'DollarSign', details: "Federal EIN from IRS. State tax ID from CDOR (Colorado)."},
      { id: 'apply-licenses', label: 'Apply for licenses and permits', completed: false, achievementName: 'License Applicant', achievementDescription: 'Applied for required licenses.', achievementIconName: 'FileText', details: "Secure operational licenses. Use SBA tool & CO licensing directory." },
      { id: 'open-bank-account', label: 'Open a business bank account', completed: false, achievementName: 'Bank Opener', achievementDescription: 'Opened a business bank account.', achievementIconName: 'CreditCard', details: "Separate personal/business finances. See SBA guidance." },
      { id: 'get-insurance', label: 'Get business insurance', completed: false, achievementName: 'Insured Entrepreneur', achievementDescription: 'Secured business insurance.', achievementIconName: 'ShieldCheck', details: "General liability, professional liability, workers' comp, etc. See SBA info." },
    ],
  },
  {
    key: 'manage',
    title: 'Manage Your Business',
    icon: Settings,
    tasks: [
        { id: 'manage-finances', label: 'Manage your finances', completed: false, achievementName: 'Finance Manager', achievementDescription: 'Started managing finances.', achievementIconName: 'Banknote', details: "Bookkeeping, budgeting, cash flow, financial statements. See SBA resources." },
        { id: 'hire-employees', label: 'Hire and manage employees', completed: false, achievementName: 'Team Builder', achievementDescription: 'Learned about hiring.', achievementIconName: 'Users', details: "Legal reqs, job descriptions, recruiting, onboarding, compliance. See SBA & CDLE." },
        { id: 'pay-taxes', label: 'Pay taxes', completed: false, achievementName: 'Tax Payer', achievementDescription: 'Understood tax obligations.', achievementIconName: 'DollarSign', details: "Federal (IRS) and state (CDOR for CO) tax obligations." },
        { id: 'stay-compliant', label: 'Stay legally compliant', completed: false, achievementName: 'Compliance Keeper', achievementDescription: 'Learned about legal compliance.', achievementIconName: 'ShieldCheck', details: "Labor laws, regulations, reporting. See SBA compliance guide." },
        { id: 'buy-assets', label: 'Buy assets and equipment', completed: false, achievementName: 'Asset Acquirer', achievementDescription: 'Considered asset purchasing.', achievementIconName: 'ShoppingBag', details: "Purchase and manage necessary business assets. See SBA." },
        { id: 'marketing-sales-manage', label: 'Marketing and sales execution', completed: false, achievementName: 'Marketing Strategist', achievementDescription: 'Explored marketing and sales.', achievementIconName: 'BarChart2', details: "Implement strategies, track results. See SBA resources." },
        { id: 'ai-small-business', label: 'Explore AI for small business', completed: false, achievementName: 'AI Explorer', achievementDescription: 'Looked into AI tools.', achievementIconName: 'Laptop', details: "Customer service, marketing, content, data analysis. Use BizLaunch AI tools." },
        { id: 'analyze-feedback-ai', label: 'Analyze Customer Feedback using AI', completed: false, achievementName: 'Feedback Analyst', achievementDescription: 'Used AI to analyze feedback.', achievementIconName: 'MessageSquareQuote', details: "Use AI Text Analyzer tool in AI Business Advisor." },
        { id: 'draft-email-replies-ai', label: 'Draft Email Replies using AI', completed: false, achievementName: 'Email Assistant', achievementDescription: 'Used AI to help draft email replies.', achievementIconName: 'Mail', details: "Use AI Email Reply Drafter in AI Business Advisor." },
        { id: 'draft-cold-outreach-ai', label: 'Draft Cold Outreach Emails using AI', completed: false, achievementName: 'Outreach Expert', achievementDescription: 'Used AI to help draft cold outreach emails.', achievementIconName: 'Send', details: "Use AI Cold Outreach Email Drafter in AI Business Advisor." },
        { id: 'cybersecurity', label: 'Strengthen your cybersecurity', completed: false, achievementName: 'Cyber Guardian', achievementDescription: 'Learned about cybersecurity.', achievementIconName: 'ShieldCheck', details: "Protect digital assets and customer data. See SBA guide." },
        { id: 'prepare-emergencies', label: 'Prepare for emergencies', completed: false, achievementName: 'Emergency Planner', achievementDescription: 'Prepared for emergencies.', achievementIconName: 'Siren', details: "Contingency plans for unexpected events. See Ready.gov." },
        { id: 'recover-disasters', label: 'Recover from disasters', completed: false, achievementName: 'Disaster Recoverer', achievementDescription: 'Planned for disaster recovery.', achievementIconName: 'HeartHandshake', details: "Plan for recovery from natural or other disasters. See SBA." },
        { id: 'close-sell', label: 'Plan for closing or selling your business', completed: false, achievementName: 'Exit Strategist', achievementDescription: 'Considered exit strategies.', achievementIconName: 'ClipboardCheck', details: "Understand the process for exiting. See SBA guide." },
        { id: 'hire-disabilities', label: 'Consider hiring employees with disabilities', completed: false, achievementName: 'Inclusive Employer', achievementDescription: 'Learned about inclusive hiring.', achievementIconName: 'Users', details: "Learn about benefits and resources. See Dept. of Labor ODEP." },
    ],
  },
  {
    key: 'grow',
    title: 'Grow Your Business',
    icon: LineChart,
    tasks: [
        { id: 'get-more-funding-grow', label: 'Get more funding for growth', completed: false, achievementName: 'Growth Funder', achievementDescription: 'Explored growth funding.', achievementIconName: 'PiggyBank', details: "Secure capital for expansion. See SBA growth funding." },
        { id: 'expand-locations', label: 'Expand to new locations', completed: false, achievementName: 'Expansionist', achievementDescription: 'Considered location expansion.', achievementIconName: 'MapPin', details: "Expand physical or market reach. See SBA guide." },
        { id: 'merge-acquire', label: 'Merge and acquire businesses', completed: false, achievementName: 'M&A Explorer', achievementDescription: 'Learned about mergers/acquisitions.', achievementIconName: 'Building', details: "Grow through strategic M&A. See SBA M&A guide." },
        { id: 'federal-contractor', label: 'Become a federal contractor', completed: false, achievementName: 'Federal Contractor', achievementDescription: 'Explored federal contracting.', achievementIconName: 'Landmark', details: "Bid on government contracts. See SBA resources." },
        { id: 'export-products', label: 'Export products', completed: false, achievementName: 'Global Exporter', achievementDescription: 'Considered exporting products.', achievementIconName: 'BarChart2', details: "Sell internationally. See SBA exporting guide." },
        { id: 'women-owned', label: 'Explore resources for Women-owned businesses', completed: false, achievementName: 'Resourceful Entrepreneur (W)', achievementDescription: 'Explored resources for women.', achievementIconName: 'Users', details: "SBA Women-Owned Businesses resources." },
        { id: 'native-american-owned', label: 'Explore resources for Native American-owned businesses', completed: false, achievementName: 'Resourceful Entrepreneur (NA)', achievementDescription: 'Explored resources for Native Americans.', achievementIconName: 'Users', details: "SBA Native American-Owned resources." },
        { id: 'veteran-owned', label: 'Explore resources for Veteran-owned businesses', completed: false, achievementName: 'Resourceful Entrepreneur (V)', achievementDescription: 'Explored resources for veterans.', achievementIconName: 'Users', details: "SBA Veteran-Owned resources." },
        { id: 'military-spouse', label: 'Explore resources for Military spouse businesses', completed: false, achievementName: 'Resourceful Entrepreneur (MS)', achievementDescription: 'Explored resources for military spouses.', achievementIconName: 'Users', details: "SBA Military Spouse-Owned resources." },
        { id: 'rural-businesses', label: 'Explore resources for Rural businesses', completed: false, achievementName: 'Resourceful Entrepreneur (R)', achievementDescription: 'Explored resources for rural businesses.', achievementIconName: 'Users', details: "SBA Rural Businesses resources." },
        { id: 'minority-owned', label: 'Explore resources for Minority-owned businesses', completed: false, achievementName: 'Resourceful Entrepreneur (M)', achievementDescription: 'Explored resources for minorities.', achievementIconName: 'Users', details: "SBA Minority-Owned resources." },
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
    if (!savedState) return initialData.map(stage => ({...stage, tasks: initializeExpansion(stage.tasks)}));

    const parsedState = JSON.parse(savedState);

    const mergeCompletion = (tasks: WorksheetTask[], savedTasksCompletion: Record<string, {completed: boolean, isExpanded?: boolean}>): WorksheetTask[] => {
        return tasks.map(task => {
            const savedTaskInfo = savedTasksCompletion[task.id];
            const completed = savedTaskInfo?.completed ?? task.completed;
            const isExpanded = savedTaskInfo?.isExpanded ?? task.isExpanded ?? (task.subTasks && task.subTasks.length > 0 ? false : undefined); // Default to collapsed for parents

            return {
                ...task,
                completed,
                isExpanded,
                subTasks: task.subTasks ? mergeCompletion(task.subTasks, savedTasksCompletion) : undefined,
            };
        });
    };

    return initialData.map(stage => ({
      ...stage,
      tasks: mergeCompletion(stage.tasks, parsedState[stage.key] || {}),
    }));

  } catch (error) {
    console.error("Failed to load dashboard state from localStorage:", error);
    return initialData.map(stage => ({...stage, tasks: initializeExpansion(stage.tasks)}));
  }
};

// Helper to initialize expansion state (default to collapsed for tasks with subtasks)
const initializeExpansion = (tasks: WorksheetTask[]): WorksheetTask[] => {
  return tasks.map(task => ({
    ...task,
    isExpanded: task.subTasks && task.subTasks.length > 0 ? false : undefined,
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
            completionMap[task.id] = { completed: task.completed, isExpanded: task.isExpanded };
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
        return; // Prevent checking if upload is required and not yet met
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
    let taskFound = false;
    const newStagesData = stagesData.map(stage => ({
      ...stage,
      tasks: stage.tasks.map(function toggleRecurse(task): WorksheetTask {
        if (task.id === taskId) {
          taskFound = true;
          return { ...task, isExpanded: !task.isExpanded };
        }
        if (task.subTasks) {
          return { ...task, subTasks: task.subTasks.map(toggleRecurse) };
        }
        return task;
      }),
    }));
    if (taskFound) {
      setStagesData(newStagesData);
    }
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
      handleCheckChange(taskId, true); // Mark task as complete
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
            <div className="w-6 h-6 flex-shrink-0"></div> // Placeholder for alignment
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

    
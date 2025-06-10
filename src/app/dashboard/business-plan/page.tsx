
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Brain, Save, FolderOpen, Printer, Loader2, Wand2, Undo2, Redo2, UserPlus, Trash2, Users, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { generateBusinessPlanSection, type GenerateSectionInput, type GenerateSectionOutput } from '@/ai/flows/business-plan-generator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const BUSINESS_PLAN_STORAGE_KEY = 'bizlaunch_interactiveBusinessPlan_v3'; // Incremented version for new structure
const MAX_UNDO_REDO_STEPS = 10;

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
}

interface BusinessPlanTask {
  id: string;
  label: string;
  guide: string | React.ReactNode;
  subTasks?: BusinessPlanTask[];
  isExpanded?: boolean;
}

interface BusinessPlanSection {
  id: string;
  title: string;
  content: string;
  placeholder: string;
  undoStack: string[];
  redoStack: string[];
  teamMembers?: TeamMember[];
  tasks?: BusinessPlanTask[]; // New: Tasks for detailed guidance within the section
}

// Define tasks for each section
const executiveSummaryTasks: BusinessPlanTask[] = [
  { id: 'es-concept', label: 'Business Concept', guide: 'Clearly and concisely state what your business is, what it does, and its core mission.', isExpanded: false },
  { id: 'es-problem', label: 'Problem & Solution', guide: 'Briefly describe the problem your business solves and the unique solution you offer.', isExpanded: false },
  { id: 'es-target-market', label: 'Target Market', guide: 'Identify your primary customers. Who are they and why do they need your product/service?', isExpanded: false },
  { id: 'es-competitive-advantage', label: 'Competitive Advantage', guide: 'What makes your business stand out from competitors? (e.g., unique technology, pricing, customer service).', isExpanded: false },
  { id: 'es-management-team', label: 'Management Team Highlights', guide: 'Briefly introduce key team members and their relevant expertise (if applicable).', isExpanded: false },
  { id: 'es-financial-summary', label: 'Financial Summary', guide: 'Provide key financial projections (e.g., revenue, profit goals for the first few years) and current funding status if applicable.', isExpanded: false },
  { id: 'es-funding-request', label: 'Funding Request (if seeking)', guide: 'If you are seeking funding, state the amount needed and its primary use.', isExpanded: false },
  { id: 'es-vision', label: 'Vision for the Future', guide: 'Concisely convey the long-term vision and goals for the business.', isExpanded: false },
];

const companyDescriptionTasks: BusinessPlanTask[] = [
  { id: 'cd-mission', label: 'Mission Statement', guide: 'State the fundamental purpose of your business and its overall intention.', isExpanded: false },
  { id: 'cd-vision', label: 'Vision Statement', guide: 'Describe where you see your business in the future. What are your long-term aspirations?', isExpanded: false },
  { id: 'cd-legal', label: 'Legal Structure & Ownership', guide: 'Specify your business\'s legal form (e.g., sole proprietorship, LLC, corporation) and who owns it.', isExpanded: false },
  { id: 'cd-history', label: 'Company History (if applicable)', guide: 'Briefly describe how the business started, its evolution, and key milestones achieved.', isExpanded: false },
  { id: 'cd-location', label: 'Location and Facilities', guide: 'Describe your physical location(s), facilities, and any strategic advantages they offer.', isExpanded: false },
  { id: 'cd-objectives', label: 'Business Objectives', guide: 'List specific, measurable, achievable, relevant, and time-bound (SMART) goals for the short and long term.', isExpanded: false },
  { id: 'cd-values', label: 'Core Values', guide: 'What are the guiding principles that will shape your company culture and decision-making?', isExpanded: false },
  { id: 'cd-socio-economic', label: 'Socio-Economic Impact (optional)', guide: 'Describe any positive social or economic contributions your business aims to make.', isExpanded: false },
];

const marketAnalysisTasks: BusinessPlanTask[] = [
  {
    id: 'ma-industry', label: 'Industry Overview', guide: 'Describe the industry your business operates in, including its current size, growth rate, trends, and key segments.', isExpanded: false,
    subTasks: [
      { id: 'ma-industry-size', label: 'Industry Size & Growth Rate', guide: 'Research and present data on the current market size and projected growth for your industry.', isExpanded: false },
      { id: 'ma-industry-trends', label: 'Key Industry Trends', guide: 'Identify major trends (e.g., technological, consumer behavior, regulatory) impacting your industry.', isExpanded: false },
      { id: 'ma-industry-outlook', label: 'Industry Outlook', guide: 'Provide an overall outlook for the industry, including opportunities and challenges.', isExpanded: false },
    ]
  },
  {
    id: 'ma-target-market', label: 'Target Market Analysis', guide: 'Define and describe your ideal customers in detail.', isExpanded: false,
    subTasks: [
      { id: 'ma-tm-demographics', label: 'Demographics', guide: 'Describe your target customers (age, gender, location, income, education, occupation).', isExpanded: false },
      { id: 'ma-tm-psychographics', label: 'Psychographics', guide: 'Describe their lifestyle, values, interests, attitudes, and opinions.', isExpanded: false },
      { id: 'ma-tm-behavioral', label: 'Behavioral Traits', guide: 'How do they make purchasing decisions? What are their buying habits? Where do they look for information?', isExpanded: false },
      { id: 'ma-tm-needs', label: 'Customer Needs & Pain Points', guide: 'What specific problems or needs does your target market have that your product/service addresses?', isExpanded: false },
      { id: 'ma-tm-size', label: 'Target Market Size & Potential', guide: 'Estimate the size of your specific target market segment and its growth potential.', isExpanded: false },
    ]
  },
  {
    id: 'ma-competition', label: 'Competitive Analysis', guide: 'Identify and analyze your key competitors.', isExpanded: false,
    subTasks: [
      { id: 'ma-comp-direct', label: 'Direct Competitors', guide: 'List businesses offering similar products/services to the same target market.', isExpanded: false },
      { id: 'ma-comp-indirect', label: 'Indirect Competitors', guide: 'List businesses offering different products/services that satisfy the same customer need.', isExpanded: false },
      { id: 'ma-comp-analysis', label: 'Competitor Profiles', guide: 'For each key competitor, analyze their products/services, pricing, strengths, weaknesses, market share, and marketing strategies.', isExpanded: false },
      { id: 'ma-comp-advantage', label: 'Your Competitive Advantages', guide: 'Clearly articulate what makes your business superior or different from the competition (e.g., price, quality, innovation, customer service).', isExpanded: false },
    ]
  },
  { id: 'ma-swot', label: 'SWOT Analysis', guide: 'Conduct a SWOT analysis (Strengths, Weaknesses, Opportunities, Threats) for your business within this market environment.', isExpanded: false },
  { id: 'ma-barriers', label: 'Barriers to Entry (optional)', guide: 'Discuss any significant barriers to entry for new competitors in your market and how you address them.', isExpanded: false },
];

const organizationManagementTasks: BusinessPlanTask[] = [
  { id: 'om-structure', label: 'Organizational Structure', guide: 'Describe how your company is structured (e.g., functional, divisional). An organizational chart can be described here if not visually included.', isExpanded: false },
  { id: 'om-team', label: 'Management Team', guide: 'Introduce key members of your management team. Use the "Key Team Members" input below for detailed profiles. This text area can summarize their collective expertise.', isExpanded: false },
  { id: 'om-roles', label: 'Roles and Responsibilities', guide: 'Define the primary roles and responsibilities of key positions within the company.', isExpanded: false },
  { id: 'om-advisors', label: 'Advisory Board / Consultants (if applicable)', guide: 'List any advisors, mentors, or key consultants and their roles.', isExpanded: false },
  { id: 'om-gaps', label: 'Management Gaps (if any)', guide: 'Identify any gaps in your current management team and how you plan to fill them.', isExpanded: false },
  { id: 'om-personnel', label: 'Personnel Plan', guide: 'Outline your current and future staffing needs, including number of employees and key roles to be hired.', isExpanded: false },
];

const productsServicesTasks: BusinessPlanTask[] = [
  { id: 'ps-detailed-desc', label: 'Detailed Description', guide: 'Clearly describe each of your products or services. How do they work?', isExpanded: false },
  { id: 'ps-customer-benefits', label: 'Customer Benefits & Value Proposition', guide: 'What specific problems do they solve for the customer? What unique value do they offer?', isExpanded: false },
  { id: 'ps-unique-features', label: 'Unique Features & Competitive Edge', guide: 'What makes your offering stand out from competitors? Highlight any unique technology, design, or features.', isExpanded: false },
  { id: 'ps-lifecycle', label: 'Product/Service Lifecycle', guide: 'Where is your offering in its lifecycle (e.g., concept, development, launch, growth, maturity)?', isExpanded: false },
  { id: 'ps-ip', label: 'Intellectual Property (if applicable)', guide: 'Describe any patents, trademarks, copyrights, or trade secrets associated with your products/services.', isExpanded: false },
  { id: 'ps-sourcing', label: 'Sourcing and Fulfillment (if applicable)', guide: 'How will you produce or source your products? How will services be delivered?', isExpanded: false },
  { id: 'ps-future-dev', label: 'Future Development / R&D', guide: 'Outline any plans for future product/service development or research and development activities.', isExpanded: false },
];

const marketingSalesTasks: BusinessPlanTask[] = [
  {
    id: 'ms-strategy-overview', label: 'Overall Marketing & Sales Strategy', guide: 'Provide a high-level overview of your approach to marketing and sales.', isExpanded: false,
    subTasks: [
      { id: 'ms-target-recap', label: 'Target Market Recap', guide: 'Briefly reiterate your primary target audience.', isExpanded: false },
      { id: 'ms-positioning', label: 'Positioning Strategy', guide: 'How do you want your brand/product to be perceived in the market relative to competitors?', isExpanded: false },
    ]
  },
  {
    id: 'ms-marketing-plan', label: 'Marketing Plan (The 4 Ps or similar)', guide: 'Detail your strategies for Product, Price, Place, and Promotion.', isExpanded: false,
    subTasks: [
      { id: 'ms-product-strategy', label: 'Product Strategy (as it relates to marketing)', guide: 'How does your product/service meet market needs? Key features to highlight.', isExpanded: false },
      { id: 'ms-pricing-strategy', label: 'Pricing Strategy', guide: 'Describe your pricing model (e.g., value-based, cost-plus, competitive) and specific price points or ranges.', isExpanded: false },
      { id: 'ms-place-strategy', label: 'Place (Distribution Channels)', guide: 'How will customers access your products/services (e.g., online, retail store, direct sales, partnerships)?', isExpanded: false },
      { id: 'ms-promotion-strategy', label: 'Promotion Strategy', guide: 'Detail your promotional activities (e.g., advertising, public relations, content marketing, social media, email marketing, sales promotions, events).', isExpanded: false },
    ]
  },
  {
    id: 'ms-sales-plan', label: 'Sales Plan', guide: 'Describe your sales process and team structure.', isExpanded: false,
    subTasks: [
      { id: 'ms-sales-process', label: 'Sales Process', guide: 'How will you convert leads into customers? What are the key stages in your sales cycle?', isExpanded: false },
      { id: 'ms-sales-team', label: 'Sales Team Structure (if applicable)', guide: 'Describe your sales team (e.g., inside sales, field sales, independent reps) and their responsibilities.', isExpanded: false },
      { id: 'ms-customer-service', label: 'Customer Service & Support', guide: 'How will you handle customer service and post-sale support?', isExpanded: false },
    ]
  },
  { id: 'ms-budget-metrics', label: 'Marketing & Sales Budget and Metrics', guide: 'Outline your anticipated marketing budget and key metrics you will track to measure success (e.g., website traffic, conversion rates, customer acquisition cost, customer lifetime value).', isExpanded: false },
];

const fundingRequestTasks: BusinessPlanTask[] = [
  { id: 'fr-current-status', label: 'Current Funding Status (if applicable)', guide: 'How much capital has been invested to date, and from what sources (e.g., personal, friends/family, angel investors)?', isExpanded: false },
  { id: 'fr-amount-requested', label: 'Amount of Funding Requested', guide: 'Clearly state the total amount of funding you are seeking in this round.', isExpanded: false },
  { id: 'fr-use-of-funds', label: 'Use of Funds', guide: 'Provide a detailed breakdown of how the requested capital will be spent (e.g., product development, marketing, working capital, equipment purchase, hiring).', isExpanded: false },
  { id: 'fr-type-of-funding', label: 'Type of Funding Sought', guide: 'Specify the type of funding (e.g., equity, debt, convertible note, grant).', isExpanded: false },
  { id: 'fr-terms', label: 'Proposed Terms (if applicable/known)', guide: 'Outline any proposed terms for the funding, such as valuation (for equity), interest rates and repayment schedule (for debt).', isExpanded: false },
  { id: 'fr-future-plans', label: 'Future Funding Plans (optional)', guide: 'Do you anticipate needing additional funding rounds in the future? If so, briefly explain.', isExpanded: false },
  { id: 'fr-no-funding', label: 'If Not Seeking Funding', guide: 'If you are not currently seeking external funding, briefly state how the business is or will be financed (e.g., bootstrapped, revenue-generating).', isExpanded: false },
];

const financialProjectionsTasks: BusinessPlanTask[] = [
  { id: 'fp-intro-assumptions', label: 'Introduction and Key Assumptions', guide: 'Briefly introduce your financial projections and clearly list the key assumptions underlying them (e.g., sales growth rate, pricing, cost of goods sold percentage, key expense drivers).', isExpanded: false },
  {
    id: 'fp-statements', label: 'Financial Statements', guide: 'Outline the structure for your projected financial statements. Typically for 3-5 years (monthly for Year 1, then quarterly or annually).', isExpanded: false,
    subTasks: [
      { id: 'fp-income', label: 'Income Statement (Profit & Loss)', guide: 'Shows revenues, cost of goods sold, gross profit, operating expenses, net profit.', isExpanded: false },
      { id: 'fp-cashflow', label: 'Cash Flow Statement', guide: 'Shows cash inflows and outflows from operating, investing, and financing activities. Crucial for understanding liquidity.', isExpanded: false },
      { id: 'fp-balancesheet', label: 'Balance Sheet', guide: 'Shows assets, liabilities, and equity at specific points in time.', isExpanded: false },
    ]
  },
  { id: 'fp-breakeven', label: 'Break-Even Analysis', guide: 'At what point (in sales volume or revenue) does your business cover all its costs?', isExpanded: false },
  { id: 'fp-keyratios', label: 'Key Financial Ratios/Metrics', guide: 'Identify and project relevant financial ratios for your industry (e.g., gross profit margin, net profit margin, customer acquisition cost, lifetime value).', isExpanded: false },
  { id: 'fp-notes', label: 'Notes and Explanations', guide: 'Provide brief explanations for significant figures or trends in your projections.', isExpanded: false },
];

const appendixTasks: BusinessPlanTask[] = [
  { id: 'ap-contents', label: 'Determine Appendix Contents', guide: 'List supporting documents that are too detailed for the main body of the plan or provide additional credibility. This text area can list what you plan to include.', isExpanded: false },
  { id: 'ap-example-list', label: 'Examples of Appendix Items (informational)', guide: 'Common items: Resumes of key personnel, letters of intent, detailed market research data, licenses, permits, extended financial statements, product specifications, leases, references.', isExpanded: false },
];


const initialSectionsData: Omit<BusinessPlanSection, 'undoStack' | 'redoStack' | 'teamMembers' | 'tasks'>[] = [
  { id: 'executiveSummary', title: 'Executive Summary', content: '', placeholder: 'Provide a brief overview of your entire business plan...' },
  { id: 'companyDescription', title: 'Company Description', content: '', placeholder: 'Detail your business, mission, vision, legal structure, and objectives...' },
  { id: 'marketAnalysis', title: 'Market Analysis', content: '', placeholder: 'Describe your target market, industry trends, and competitive landscape...' },
  { id: 'organizationManagement', title: 'Organization and Management', content: '', placeholder: 'Outline your business and management structure, roles, and responsibilities...' },
  { id: 'productsServices', title: 'Products or Services', content: '', placeholder: 'Describe what you are selling and its benefits to customers...' },
  { id: 'marketingSales', title: 'Marketing and Sales Strategy', content: '', placeholder: 'How will you reach your target market and sell your products/services?...' },
  { id: 'fundingRequest', title: 'Funding Request (if applicable)', content: '', placeholder: 'Specify the amount of funding needed and how it will be used...' },
  { id: 'financialProjections', title: 'Financial Projections', content: '', placeholder: 'Provide financial forecasts for revenue, expenses, and profitability...' },
  { id: 'appendix', title: 'Appendix (optional)', content: '', placeholder: 'Include supporting documents like resumes, permits, etc...' },
];

const sectionTasksMap: Record<string, BusinessPlanTask[]> = {
  executiveSummary: executiveSummaryTasks,
  companyDescription: companyDescriptionTasks,
  marketAnalysis: marketAnalysisTasks,
  organizationManagement: organizationManagementTasks,
  productsServices: productsServicesTasks,
  marketingSales: marketingSalesTasks,
  fundingRequest: fundingRequestTasks,
  financialProjections: financialProjectionsTasks,
  appendix: appendixTasks,
};

const initializeTasksRecursive = (tasks: BusinessPlanTask[]): BusinessPlanTask[] => {
  return tasks.map(task => ({
    ...task,
    isExpanded: task.isExpanded !== undefined ? task.isExpanded : false, // Default to collapsed
    subTasks: task.subTasks ? initializeTasksRecursive(task.subTasks) : undefined,
  }));
};

const initialSections: BusinessPlanSection[] = initialSectionsData.map(section => ({
  ...section,
  undoStack: [],
  redoStack: [],
  teamMembers: section.id === 'organizationManagement' ? [] : undefined,
  tasks: sectionTasksMap[section.id] ? initializeTasksRecursive(sectionTasksMap[section.id]) : [],
}));


export default function InteractiveBusinessPlanPage() {
  const [overallConcept, setOverallConcept] = useState<string>('');
  const [sections, setSections] = useState<BusinessPlanSection[]>(initialSections);
  const [isLoadingAI, setIsLoadingAI] = useState<Record<string, boolean>>({});
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);

  const handleSectionContentChange = (id: string, newContent: string) => {
    setSections(prevSections =>
      prevSections.map(section => {
        if (section.id === id) {
          if (section.content === newContent) {
            return section;
          }
          const newUndoStack = [section.content, ...section.undoStack].slice(0, MAX_UNDO_REDO_STEPS);
          return { ...section, content: newContent, undoStack: newUndoStack, redoStack: [] };
        }
        return section;
      })
    );
  };

  const handleUndo = (sectionId: string) => {
    setSections(prevSections =>
      prevSections.map(section => {
        if (section.id === sectionId && section.undoStack.length > 0) {
          const newUndoStack = [...section.undoStack];
          const contentToRestore = newUndoStack.shift()!;
          const newRedoStack = [section.content, ...section.redoStack].slice(0, MAX_UNDO_REDO_STEPS);
          return { ...section, content: contentToRestore, undoStack: newUndoStack, redoStack: newRedoStack };
        }
        return section;
      })
    );
    toast({ title: "Undo Successful", description: `Content for "${sections.find(s => s.id === sectionId)?.title}" has been reverted.` });
  };

  const handleRedo = (sectionId: string) => {
    setSections(prevSections =>
      prevSections.map(section => {
        if (section.id === sectionId && section.redoStack.length > 0) {
          const newRedoStack = [...section.redoStack];
          const contentToRestore = newRedoStack.shift()!;
          const newUndoStack = [section.content, ...section.undoStack].slice(0, MAX_UNDO_REDO_STEPS);
          return { ...section, content: contentToRestore, undoStack: newUndoStack, redoStack: newRedoStack };
        }
        return section;
      })
    );
    toast({ title: "Redo Successful", description: `Content for "${sections.find(s => s.id === sectionId)?.title}" has been restored.` });
  };

  const handleAddTeamMember = (sectionId: string) => {
    setSections(prevSections =>
      prevSections.map(section => {
        if (section.id === sectionId && section.id === 'organizationManagement') {
          const newTeamMember: TeamMember = { id: Date.now().toString(), name: '', role: '', bio: '' };
          const updatedTeamMembers = [...(section.teamMembers || []), newTeamMember];
          return { ...section, teamMembers: updatedTeamMembers };
        }
        return section;
      })
    );
  };

  const handleRemoveTeamMember = (sectionId: string, teamMemberId: string) => {
    setSections(prevSections =>
      prevSections.map(section => {
        if (section.id === sectionId && section.teamMembers) {
          const updatedTeamMembers = section.teamMembers.filter(member => member.id !== teamMemberId);
          return { ...section, teamMembers: updatedTeamMembers };
        }
        return section;
      })
    );
  };

  const handleTeamMemberChange = (sectionId: string, teamMemberId: string, field: keyof TeamMember, value: string) => {
    setSections(prevSections =>
      prevSections.map(section => {
        if (section.id === sectionId && section.teamMembers) {
          const updatedTeamMembers = section.teamMembers.map(member =>
            member.id === teamMemberId ? { ...member, [field]: value } : member
          );
          return { ...section, teamMembers: updatedTeamMembers };
        }
        return section;
      })
    );
  };
  
  const toggleSectionTaskExpansion = (sectionId: string, taskId: string) => {
    const toggleRecursively = (tasks: BusinessPlanTask[]): BusinessPlanTask[] => {
      return tasks.map(task => {
        if (task.id === taskId) {
          return { ...task, isExpanded: !task.isExpanded };
        }
        if (task.subTasks) {
          return { ...task, subTasks: toggleRecursively(task.subTasks) };
        }
        return task;
      });
    };

    setSections(prevSections =>
      prevSections.map(section => {
        if (section.id === sectionId && section.tasks) {
          return { ...section, tasks: toggleRecursively(section.tasks) };
        }
        return section;
      })
    );
  };


  const saveToLocalStorage = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        // Extract only necessary data for saving, especially for tasks (only isExpanded)
        const sectionsToSave = sections.map(section => {
          const tasksToSave = section.tasks ? section.tasks.map(function mapTasks(task): any {
            return {
              id: task.id,
              isExpanded: task.isExpanded,
              subTasks: task.subTasks ? task.subTasks.map(mapTasks) : undefined,
            };
          }) : [];
          return {
            id: section.id,
            content: section.content,
            undoStack: section.undoStack,
            redoStack: section.redoStack,
            teamMembers: section.teamMembers,
            tasksExpansion: tasksToSave, // Save only expansion state
          };
        });

        const dataToSave = { overallConcept, sections: sectionsToSave };
        localStorage.setItem(BUSINESS_PLAN_STORAGE_KEY, JSON.stringify(dataToSave));
        toast({ title: "Plan Saved!", description: "Your business plan has been saved to your browser." });
      } catch (error) {
        console.error("Error saving to localStorage:", error);
        toast({ variant: "destructive", title: "Save Failed", description: "Could not save your plan." });
      }
    }
  }, [overallConcept, sections]);

  const loadFromLocalStorage = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedDataString = localStorage.getItem(BUSINESS_PLAN_STORAGE_KEY);
        if (savedDataString) {
          const parsedData = JSON.parse(savedDataString);
          if (parsedData.overallConcept) setOverallConcept(parsedData.overallConcept);

          const loadedSections = initialSectionsData.map(initSection => {
            const savedSection = parsedData.sections.find((s: any) => s.id === initSection.id);
            
            const baseTasks = sectionTasksMap[initSection.id] ? initializeTasksRecursive(sectionTasksMap[initSection.id]) : [];
            
            const mergeTaskExpansion = (targetTasks: BusinessPlanTask[], savedTasksExpansion: any[] | undefined): BusinessPlanTask[] => {
              if (!savedTasksExpansion) return targetTasks;
              return targetTasks.map(targetTask => {
                const savedTaskState = savedTasksExpansion.find(st => st.id === targetTask.id);
                return {
                  ...targetTask,
                  isExpanded: savedTaskState?.isExpanded ?? targetTask.isExpanded,
                  subTasks: targetTask.subTasks ? mergeTaskExpansion(targetTask.subTasks, savedTaskState?.subTasks) : undefined,
                };
              });
            };

            return {
              ...initSection,
              content: savedSection?.content || '',
              undoStack: savedSection?.undoStack || [],
              redoStack: savedSection?.redoStack || [],
              teamMembers: initSection.id === 'organizationManagement' ? (savedSection?.teamMembers || []) : undefined,
              tasks: savedSection?.tasksExpansion ? mergeTaskExpansion(baseTasks, savedSection.tasksExpansion) : baseTasks,
            };
          });
          setSections(loadedSections);
          toast({ title: "Plan Loaded!", description: "Your business plan has been loaded." });
        } else {
           // If no saved data, initialize with default initialSections
           setSections(initialSectionsData.map(section => ({
              ...section,
              undoStack: [],
              redoStack: [],
              teamMembers: section.id === 'organizationManagement' ? [] : undefined,
              tasks: sectionTasksMap[section.id] ? initializeTasksRecursive(sectionTasksMap[section.id]) : [],
            })));
          toast({ title: "No Saved Plan", description: "Starting a fresh business plan!" });
        }
      } catch (error) {
        console.error("Error loading from localStorage:", error);
        setSections(initialSectionsData.map(section => ({
            ...section,
            undoStack: [],
            redoStack: [],
            teamMembers: section.id === 'organizationManagement' ? [] : undefined,
            tasks: sectionTasksMap[section.id] ? initializeTasksRecursive(sectionTasksMap[section.id]) : [],
        })));
        toast({ variant: "destructive", title: "Load Failed", description: "Could not load your plan. Resetting." });
      }
    }
  }, []);

  useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);


  const handleAIAssist = async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    setIsLoadingAI(prev => ({ ...prev, [sectionId]: true }));
    try {
      let additionalContext = "";
      if (section.id === 'organizationManagement' && section.teamMembers && section.teamMembers.length > 0) {
        additionalContext = "\n\nKey Team Members:\n" + section.teamMembers.map(tm => `- ${tm.name} (${tm.role}): ${tm.bio}`).join("\n");
      }

      const input: GenerateSectionInput = {
        overallBusinessConcept: overallConcept,
        sectionName: section.title as any, 
        existingContent: section.content + additionalContext, 
        completedTasksContext: 'User is working on their business plan using the interactive builder with detailed task guidance.'
      };
      const result: GenerateSectionOutput = await generateBusinessPlanSection(input);
      
      setSections(prevSections =>
        prevSections.map(s => {
          if (s.id === sectionId) {
            const newUndoStack = [s.content, ...s.undoStack].slice(0, MAX_UNDO_REDO_STEPS);
            return { ...s, content: result.generatedContent, undoStack: newUndoStack, redoStack: [] };
          }
          return s;
        })
      );
      toast({ title: `AI Assistance for ${section.title}`, description: "Content updated." });
    } catch (error) {
      console.error("AI Assist Error:", error);
      toast({ variant: "destructive", title: "AI Assist Failed", description: "Could not generate content." });
    } finally {
      setIsLoadingAI(prev => ({ ...prev, [sectionId]: false }));
    }
  };
  
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Recursive component to render tasks and sub-tasks for a section
  const SectionTaskItem: React.FC<{ task: BusinessPlanTask; sectionId: string; level: number }> = ({ task, sectionId, level }) => {
    const hasSubTasks = task.subTasks && task.subTasks.length > 0;
    const guideIsString = typeof task.guide === 'string';

    return (
      <div style={{ marginLeft: `${level * 20}px` }} className="py-1">
        <div className="flex items-start gap-2 p-2 rounded-md transition-colors hover:bg-muted/30">
          {hasSubTasks ? (
            <Button variant="ghost" size="icon" onClick={() => toggleSectionTaskExpansion(sectionId, task.id)} className="h-6 w-6 flex-shrink-0">
              {task.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          ) : (
            <div className="w-6 h-6 flex-shrink-0"></div> // Placeholder for alignment
          )}
          <div className="flex-1">
            <span className={cn("text-sm font-medium leading-tight", level === 0 ? "text-foreground" : "text-foreground/90")}>
              {task.label}
            </span>
            {task.guide && (
                 guideIsString && (task.guide as string).length > 100 ? (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="link" size="sm" className="p-0 h-auto ml-1 text-xs text-accent">
                                <Info className="w-3 h-3 mr-1"/> View Guide
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 text-xs p-3" side="bottom" align="start">
                            <div className="prose prose-xs max-w-none">{typeof task.guide === 'string' ? task.guide : task.guide}</div>
                        </PopoverContent>
                    </Popover>
                 ) : (
                    <div className="text-xs text-muted-foreground mt-1 prose prose-xs max-w-none">{typeof task.guide === 'string' ? task.guide : task.guide}</div>
                 )
            )}
          </div>
        </div>
        {hasSubTasks && task.isExpanded && (
          <div className="mt-1">
            {task.subTasks?.map(subTask => <SectionTaskItem key={subTask.id} task={subTask} sectionId={sectionId} level={level + 1} />)}
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="container mx-auto p-4 sm:p-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
            <Wand2 /> Interactive Business Plan Builder
          </CardTitle>
          <CardDescription>
            Craft your business plan section by section with detailed guidance and AI assistance. Save your progress!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="overallConcept" className="block text-sm font-medium text-foreground">
              Overall Business Concept/Idea:
            </label>
            <Textarea
              id="overallConcept"
              placeholder="Briefly describe your core business idea, mission, and value proposition. This will guide the AI."
              value={overallConcept}
              onChange={(e) => setOverallConcept(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={saveToLocalStorage} variant="outline"><Save className="mr-2 h-4 w-4" /> Save to Browser</Button>
            <Button onClick={loadFromLocalStorage} variant="outline"><FolderOpen className="mr-2 h-4 w-4" /> Load from Browser</Button>
            <Button onClick={() => setIsReviewModalOpen(true)}><Printer className="mr-2 h-4 w-4" /> Review & Export</Button>
          </div>

          <Accordion type="multiple" className="w-full space-y-4" defaultValue={[initialSections[0].id]}>
            {sections.map((section, index) => (
              <AccordionItem value={section.id} key={section.id} className="border rounded-lg bg-card overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline text-left text-primary font-semibold">
                  Step {index + 1}: {section.title}
                </AccordionTrigger>
                <AccordionContent className="p-4 border-t bg-background">
                  <div className="space-y-4">
                    {/* Detailed Task Guidance Area */}
                    {section.tasks && section.tasks.length > 0 && (
                      <Card className="bg-secondary/30 p-4">
                        <CardHeader className="p-0 pb-3">
                          <CardTitle className="text-md font-semibold text-secondary-foreground">Guidance & Key Considerations</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <ScrollArea className="h-auto max-h-80 pr-3 -mr-3"> {/* Added ScrollArea */}
                            {section.tasks.map(task => (
                              <SectionTaskItem key={task.id} task={task} sectionId={section.id} level={0} />
                            ))}
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    )}

                    {/* Main Content Textarea */}
                    <div>
                      <label htmlFor={`section-content-${section.id}`} className="block text-sm font-medium text-foreground mb-1">
                        Your Content for: {section.title}
                      </label>
                      <Textarea
                        id={`section-content-${section.id}`}
                        placeholder={section.placeholder}
                        value={section.content}
                        onChange={(e) => handleSectionContentChange(section.id, e.target.value)}
                        className="min-h-[200px] text-sm"
                        aria-label={`${section.title} content`}
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-2 items-center">
                        <Button 
                          onClick={() => handleAIAssist(section.id)} 
                          disabled={isLoadingAI[section.id] || !overallConcept.trim()}
                          size="sm"
                          className="bg-accent hover:bg-accent/90 text-accent-foreground"
                          title={!overallConcept.trim() ? "Please enter Overall Business Concept first" : "Get AI assistance"}
                        >
                          {isLoadingAI[section.id] ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Brain className="mr-2 h-4 w-4" />
                          )}
                          AI Assist this section
                        </Button>
                        <Button
                            onClick={() => handleUndo(section.id)}
                            variant="outline"
                            size="sm"
                            disabled={!section.undoStack || section.undoStack.length === 0}
                        >
                            <Undo2 className="mr-2 h-4 w-4" /> Undo ({section.undoStack?.length || 0})
                        </Button>
                        <Button
                            onClick={() => handleRedo(section.id)}
                            variant="outline"
                            size="sm"
                            disabled={!section.redoStack || section.redoStack.length === 0}
                        >
                            <Redo2 className="mr-2 h-4 w-4" /> Redo ({section.redoStack?.length || 0})
                        </Button>
                    </div>

                    {section.id === 'organizationManagement' && (
                      <div className="mt-6 pt-4 border-t">
                        <h4 className="text-md font-semibold mb-3 text-foreground flex items-center">
                          <Users className="mr-2 h-5 w-5 text-primary"/> Key Team Members
                        </h4>
                        {section.teamMembers && section.teamMembers.map((member) => (
                          <Card key={member.id} className="mb-4 p-4 bg-secondary/30">
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <FormItem>
                                  <label htmlFor={`teamName-${member.id}`} className="text-xs font-medium text-muted-foreground">Name</label>
                                  <Input
                                    id={`teamName-${member.id}`}
                                    value={member.name}
                                    onChange={(e) => handleTeamMemberChange(section.id, member.id, 'name', e.target.value)}
                                    placeholder="Team Member Name"
                                    className="text-sm"
                                  />
                                </FormItem>
                                <FormItem>
                                  <label htmlFor={`teamRole-${member.id}`} className="text-xs font-medium text-muted-foreground">Role/Title</label>
                                  <Input
                                    id={`teamRole-${member.id}`}
                                    value={member.role}
                                    onChange={(e) => handleTeamMemberChange(section.id, member.id, 'role', e.target.value)}
                                    placeholder="Role or Title"
                                    className="text-sm"
                                  />
                                </FormItem>
                              </div>
                              <FormItem>
                                <label htmlFor={`teamBio-${member.id}`} className="text-xs font-medium text-muted-foreground">Brief Bio/Experience</label>
                                <Textarea
                                  id={`teamBio-${member.id}`}
                                  value={member.bio}
                                  onChange={(e) => handleTeamMemberChange(section.id, member.id, 'bio', e.target.value)}
                                  placeholder="Brief bio, key experience, or responsibilities"
                                  rows={3}
                                  className="text-sm min-h-[60px]"
                                />
                              </FormItem>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveTeamMember(section.id, member.id)}
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive self-start"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Remove Team Member
                              </Button>
                            </div>
                          </Card>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddTeamMember(section.id)}
                          className="mt-2"
                        >
                          <UserPlus className="mr-2 h-4 w-4" /> Add Team Member
                        </Button>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl text-primary">Review Your Business Plan</DialogTitle>
            <DialogDescription>
              Here's a consolidated view of your business plan. You can print this to PDF.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-grow pr-6 -mr-6">
            <div className="space-y-6 py-4 printable-content">
              {overallConcept && (
                <section>
                  <h2 className="text-lg font-semibold mb-2 border-b pb-1 text-foreground">Overall Business Concept</h2>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{overallConcept}</p>
                </section>
              )}
              {sections.map((section, index) => (
                (section.content.trim() || (section.id === 'organizationManagement' && section.teamMembers && section.teamMembers.length > 0)) && (
                  <section key={section.id}>
                    <h2 className="text-lg font-semibold mb-2 border-b pb-1 text-foreground">Step {index + 1}: {section.title}</h2>
                    {section.content.trim() && <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-3">{section.content}</p>}
                    
                    {section.id === 'organizationManagement' && section.teamMembers && section.teamMembers.length > 0 && (
                      <div className="mt-3">
                        <h3 className="text-md font-semibold mb-2 text-foreground">Key Team Members:</h3>
                        {section.teamMembers.map(member => (
                          member.name.trim() && ( 
                            <div key={member.id} className="mb-2 pl-2 border-l-2 border-muted">
                              <h4 className="text-sm font-semibold text-foreground">{member.name} - <span className="font-normal text-muted-foreground">{member.role}</span></h4>
                              {member.bio.trim() && <p className="text-xs text-muted-foreground whitespace-pre-wrap">{member.bio}</p>}
                            </div>
                          )
                        ))}
                      </div>
                    )}
                  </section>
                )
              ))}
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4 print:hidden">
            <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print to PDF</Button>
            <DialogClose asChild>
              <Button variant="ghost">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-content, .printable-content * {
            visibility: visible;
          }
          .printable-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
        .prose { /* Basic prose styling for guides */
          line-height: 1.5;
        }
        .prose-xs {
            font-size: 0.75rem; /* 12px */
            line-height: 1.25rem; /* 20px */
        }
      `}</style>

    </div>
  );
}

    

"use client"; // Add "use client" for useState and useEffect

import React, { useState, useEffect } from 'react';
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from "@/components/ui/sidebar";
import { Briefcase, Rocket, Settings, LineChart, Home as HomeIcon, Target, FileText, DollarSign, Building, CreditCard, PiggyBank, MapPin, Landmark, Users, ClipboardCheck, Banknote, ShieldCheck, ShoppingBag, BarChart2, Laptop, Siren, HeartHandshake, LandmarkIcon, Award, Trophy, Star, CheckCircle, ArrowLeft, ArrowRight, Link as LinkIcon, Search, MessageSquareQuote } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Define an extended task type for the wizard
export interface WizardTask extends TaskWithAchievement {
  stageKey: 'plan' | 'launch' | 'manage' | 'grow';
  stageTitle: string;
  stageIcon: React.ElementType;
  details: React.ReactNode; // To store the detailed description for each task
}

interface TaskWithAchievement {
  id: string;
  label: string;
  completed: boolean;
  achievementName: string;
  achievementDescription: string;
  achievementIconName: string;
}


// Define tasks for each stage with achievement details, stageKey, stageTitle, and details
const planTasksRaw: Omit<WizardTask, 'completed' | 'stageIcon'>[] = [
  { id: 'market-research', label: 'Market research and competitive analysis', achievementName: 'Market Maven', achievementDescription: 'Completed initial market research.', achievementIconName: 'Target', stageKey: 'plan', stageTitle: 'Plan Your Business', details: (<ul><li><Target className="inline w-4 h-4 mr-1 text-accent"/>Understand your customers, industry, and competitors.</li><li>Explore resources like the <a href="https://www.sba.gov/business-guide/plan-your-business/market-research-competitive-analysis" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA's Market Research Guide <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'business-plan', label: 'Write your business plan', achievementName: 'Master Planner', achievementDescription: 'Drafted the business plan.', achievementIconName: 'FileText', stageKey: 'plan', stageTitle: 'Plan Your Business', details: (<ul><li><FileText className="inline w-4 h-4 mr-1 text-accent"/>Create a roadmap for your business strategy and financials.</li><li>Use templates from <a href="https://www.sba.gov/business-guide/plan-your-business/write-your-business-plan" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA <LinkIcon className="inline w-3 h-3"/></a> or <a href="https://www.score.org/business-plan-templates" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SCORE <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'startup-costs', label: 'Calculate your startup costs', achievementName: 'Cost Calculator', achievementDescription: 'Calculated initial startup costs.', achievementIconName: 'DollarSign', stageKey: 'plan', stageTitle: 'Plan Your Business', details: (<ul><li><DollarSign className="inline w-4 h-4 mr-1 text-accent"/>Estimate the initial investment needed.</li><li>The <a href="https://www.sba.gov/business-guide/plan-your-business/calculate-your-startup-costs" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA <LinkIcon className="inline w-3 h-3"/></a> offers guidance.</li></ul>) },
  { id: 'business-credit', label: 'Establish business credit', achievementName: 'Credit Conscious', achievementDescription: 'Learned about business credit.', achievementIconName: 'CreditCard', stageKey: 'plan', stageTitle: 'Plan Your Business', details: (<ul><li><CreditCard className="inline w-4 h-4 mr-1 text-accent"/>Learn how to build credit for your company.</li><li>Understand the basics with the <a href="https://www.sba.gov/business-guide/launch-your-business/establish-business-credit" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA's guide <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'fund-business', label: 'Fund your business', achievementName: 'Funding Finder', achievementDescription: 'Explored funding options.', achievementIconName: 'PiggyBank', stageKey: 'plan', stageTitle: 'Plan Your Business', details: (<ul><li><PiggyBank className="inline w-4 h-4 mr-1 text-accent"/>Explore loans, grants, and investment options.</li><li>Check <a href="https://www.sba.gov/funding-programs" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA funding programs <LinkIcon className="inline w-3 h-3"/></a> and <a href="https://www.grants.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">Grants.gov <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'buy-existing', label: 'Consider buying an existing business or franchise', achievementName: 'Strategic Thinker', achievementDescription: 'Considered buying vs. starting.', achievementIconName: 'Building', stageKey: 'plan', stageTitle: 'Plan Your Business', details: (<ul><li><Building className="inline w-4 h-4 mr-1 text-accent"/>Weigh the pros and cons of buying vs. starting from scratch.</li><li>The <a href="https://www.sba.gov/business-guide/plan-your-business/buy-existing-business-or-franchise" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA has resources <LinkIcon className="inline w-3 h-3"/></a> for this.</li></ul>) },
];

const launchTasksRaw: Omit<WizardTask, 'completed' | 'stageIcon'>[] = [
  { id: 'pick-location', label: 'Pick your business location', achievementName: 'Location Scout', achievementDescription: 'Chose a business location.', achievementIconName: 'MapPin', stageKey: 'launch', stageTitle: 'Launch Your Business', details: (<ul><li><MapPin className="inline w-4 h-4 mr-1 text-accent"/>Choose the right physical or virtual space.</li><li>Guidance from the <a href="https://www.sba.gov/business-guide/launch-your-business/pick-your-business-location" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'choose-structure', label: 'Choose a business structure', achievementName: 'Structure Selector', achievementDescription: 'Selected a legal structure.', achievementIconName: 'Landmark', stageKey: 'launch', stageTitle: 'Launch Your Business', details: (<ul><li><Landmark className="inline w-4 h-4 mr-1 text-accent"/>Select your legal entity (sole prop, LLC, etc.).</li><li>The <a href="https://www.sba.gov/business-guide/launch-your-business/choose-business-structure" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA explains options <LinkIcon className="inline w-3 h-3"/></a>. For Colorado, see the <a href="https://www.sos.state.co.us/pubs/business/chooseBusinessStructure.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">Colorado SOS <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'choose-name', label: 'Choose your business name', achievementName: 'Name Giver', achievementDescription: 'Picked a business name.', achievementIconName: 'FileText', stageKey: 'launch', stageTitle: 'Launch Your Business', details: (<ul><li><FileText className="inline w-4 h-4 mr-1 text-accent"/>Pick and register your business name.</li><li>Check <a href="https://www.sba.gov/business-guide/launch-your-business/choose-your-business-name" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA tips <LinkIcon className="inline w-3 h-3"/></a>. For Colorado, search on <a href="https://www.coloradosos.gov/biz/BusinessEntityCriteriaExt.do" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">Colorado SOS database <Search className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'register-business', label: 'Register your business', achievementName: 'Official Registrant', achievementDescription: 'Registered the business.', achievementIconName: 'ClipboardCheck', stageKey: 'launch', stageTitle: 'Launch Your Business', details: (<ul><li><ClipboardCheck className="inline w-4 h-4 mr-1 text-accent"/>Formally register your business with government agencies.</li><li>General info: <a href="https://www.sba.gov/business-guide/launch-your-business/register-your-business" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA <LinkIcon className="inline w-3 h-3"/></a>. Colorado: <a href="https://mybiz.colorado.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">MyBizColorado <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'get-tax-ids', label: 'Get federal and state tax ID numbers', achievementName: 'Tax ID Acquirer', achievementDescription: 'Obtained necessary tax IDs.', achievementIconName: 'DollarSign', stageKey: 'launch', stageTitle: 'Launch Your Business', details: (<ul><li><DollarSign className="inline w-4 h-4 mr-1 text-accent"/>Obtain federal (EIN) and state tax identification numbers.</li><li>Federal EIN: <a href="https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">IRS Website <LinkIcon className="inline w-3 h-3"/></a>. Colorado: through <a href="https://tax.colorado.gov/how-to-register-for-a-colorado-account-number-can" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">CDOR <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'apply-licenses', label: 'Apply for licenses and permits', achievementName: 'License Applicant', achievementDescription: 'Applied for required licenses.', achievementIconName: 'FileText', stageKey: 'launch', stageTitle: 'Launch Your Business', details: (<ul><li><FileText className="inline w-4 h-4 mr-1 text-accent"/>Secure necessary operational licenses.</li><li>Use the <a href="https://www.sba.gov/business-guide/launch-your-business/apply-licenses-permits" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA tool <LinkIcon className="inline w-3 h-3"/></a>. Colorado also has <a href="https://osa.colorado.gov/licensing-directory" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">a licensing directory <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'open-bank-account', label: 'Open a business bank account', achievementName: 'Bank Opener', achievementDescription: 'Opened a business bank account.', achievementIconName: 'CreditCard', stageKey: 'launch', stageTitle: 'Launch Your Business', details: (<ul><li><CreditCard className="inline w-4 h-4 mr-1 text-accent"/>Open a dedicated account for business finances.</li><li><a href="https://www.sba.gov/business-guide/launch-your-business/open-business-bank-account" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA guidance <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'get-insurance', label: 'Get business insurance', achievementName: 'Insured Entrepreneur', achievementDescription: 'Secured business insurance.', achievementIconName: 'ShieldCheck', stageKey: 'launch', stageTitle: 'Launch Your Business', details: (<ul><li><ShieldCheck className="inline w-4 h-4 mr-1 text-accent"/>Get appropriate coverage to protect your business.</li><li><a href="https://www.sba.gov/business-guide/launch-your-business/get-business-insurance" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA info on insurance <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
];

const manageTasksRaw: Omit<WizardTask, 'completed' | 'stageIcon'>[] = [
  { id: 'manage-finances', label: 'Manage your finances', achievementName: 'Finance Manager', achievementDescription: 'Started managing finances.', achievementIconName: 'Banknote', stageKey: 'manage', stageTitle: 'Manage Your Business', details: (<ul><li><Banknote className="inline w-4 h-4 mr-1 text-accent"/>Track income/expenses, manage cash flow, budget.</li><li><a href="https://www.sba.gov/business-guide/manage-your-business/manage-your-finances" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA finance management resources <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'hire-employees', label: 'Hire and manage employees', achievementName: 'Team Builder', achievementDescription: 'Learned about hiring.', achievementIconName: 'Users', stageKey: 'manage', stageTitle: 'Manage Your Business', details: (<ul><li><Users className="inline w-4 h-4 mr-1 text-accent"/>Recruit, hire, train, and manage your team.</li><li><a href="https://www.sba.gov/business-guide/manage-your-business/hire-manage-employees" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA hiring guide <LinkIcon className="inline w-3 h-3"/></a>. Colorado: <a href="https://cdle.colorado.gov/employers" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">CDLE resources <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'pay-taxes', label: 'Pay taxes', achievementName: 'Tax Payer', achievementDescription: 'Understood tax obligations.', achievementIconName: 'DollarSign', stageKey: 'manage', stageTitle: 'Manage Your Business', details: (<ul><li><DollarSign className="inline w-4 h-4 mr-1 text-accent"/>Understand obligations and file/pay accurately.</li><li>Federal: <a href="https://www.irs.gov/businesses" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">IRS for Businesses <LinkIcon className="inline w-3 h-3"/></a>. Colorado: <a href="https://tax.colorado.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">CDOR <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'stay-compliant', label: 'Stay legally compliant', achievementName: 'Compliance Keeper', achievementDescription: 'Learned about legal compliance.', achievementIconName: 'ShieldCheck', stageKey: 'manage', stageTitle: 'Manage Your Business', details: (<ul><li><ShieldCheck className="inline w-4 h-4 mr-1 text-accent"/>Adhere to labor laws, regulations, and reporting.</li><li><a href="https://www.sba.gov/business-guide/manage-your-business/stay-legally-compliant" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA compliance guide <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'buy-assets', label: 'Buy assets and equipment', achievementName: 'Asset Acquirer', achievementDescription: 'Considered asset purchasing.', achievementIconName: 'ShoppingBag', stageKey: 'manage', stageTitle: 'Manage Your Business', details: (<ul><li><ShoppingBag className="inline w-4 h-4 mr-1 text-accent"/>Purchase and manage necessary business assets.</li><li><a href="https://www.sba.gov/business-guide/manage-your-business/buy-assets-equipment" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA on buying assets <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'marketing-sales', label: 'Marketing and sales', achievementName: 'Marketing Strategist', achievementDescription: 'Explored marketing and sales.', achievementIconName: 'BarChart2', stageKey: 'manage', stageTitle: 'Manage Your Business', details: (<ul><li><BarChart2 className="inline w-4 h-4 mr-1 text-accent"/>Attract customers and generate revenue.</li><li><a href="https://www.sba.gov/business-guide/manage-your-business/marketing-sales" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA marketing & sales resources <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'ai-small-business', label: 'Explore AI for small business', achievementName: 'AI Explorer', achievementDescription: 'Looked into AI tools.', achievementIconName: 'Laptop', stageKey: 'manage', stageTitle: 'Manage Your Business', details: (<ul><li><Laptop className="inline w-4 h-4 mr-1 text-accent"/>Leverage artificial intelligence tools for efficiency.</li><li>Consider using the Text Analyzer in the AI Business Advisor below!</li></ul>) },
  { id: 'analyze-feedback-ai', label: 'Analyze Customer Feedback using AI', achievementName: 'Feedback Analyst', achievementDescription: 'Used AI to analyze feedback.', achievementIconName: 'MessageSquareQuote', stageKey: 'manage', stageTitle: 'Manage Your Business', details: (<ul><li><MessageSquareQuote className="inline w-4 h-4 mr-1 text-accent"/>Use the AI Text Analyzer tool in the AI Business Advisor to understand customer sentiment and extract keywords from feedback.</li></ul>) },
  { id: 'cybersecurity', label: 'Strengthen your cybersecurity', achievementName: 'Cyber Guardian', achievementDescription: 'Learned about cybersecurity.', achievementIconName: 'ShieldCheck', stageKey: 'manage', stageTitle: 'Manage Your Business', details: (<ul><li><ShieldCheck className="inline w-4 h-4 mr-1 text-accent"/>Protect your digital assets and customer data.</li><li><a href="https://www.sba.gov/business-guide/manage-your-business/strengthen-your-cybersecurity" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA cybersecurity guide <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'prepare-emergencies', label: 'Prepare for emergencies', achievementName: 'Emergency Planner', achievementDescription: 'Prepared for emergencies.', achievementIconName: 'Siren', stageKey: 'manage', stageTitle: 'Manage Your Business', details: (<ul><li><Siren className="inline w-4 h-4 mr-1 text-accent"/>Develop contingency plans for unexpected events.</li><li><a href="https://www.ready.gov/business" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">Ready.gov for businesses <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'recover-disasters', label: 'Recover from disasters', achievementName: 'Disaster Recoverer', achievementDescription: 'Planned for disaster recovery.', achievementIconName: 'HeartHandshake', stageKey: 'manage', stageTitle: 'Manage Your Business', details: (<ul><li><HeartHandshake className="inline w-4 h-4 mr-1 text-accent"/>Plan for recovery from natural or other disasters.</li><li><a href="https://www.sba.gov/funding-programs/disaster-assistance" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA disaster assistance <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'close-sell', label: 'Plan for closing or selling your business', achievementName: 'Exit Strategist', achievementDescription: 'Considered exit strategies.', achievementIconName: 'ClipboardCheck', stageKey: 'manage', stageTitle: 'Manage Your Business', details: (<ul><li><ClipboardCheck className="inline w-4 h-4 mr-1 text-accent"/>Understand the process for exiting your business.</li><li><a href="https://www.sba.gov/business-guide/manage-your-business/close-or-sell-your-business" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA guide on closing/selling <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'hire-disabilities', label: 'Consider hiring employees with disabilities', achievementName: 'Inclusive Employer', achievementDescription: 'Learned about inclusive hiring.', achievementIconName: 'Users', stageKey: 'manage', stageTitle: 'Manage Your Business', details: (<ul><li><Users className="inline w-4 h-4 mr-1 text-accent"/>Learn about benefits and resources.</li><li>Visit the <a href="https://www.dol.gov/agencies/odep/topics/employers" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">Department of Labor's ODEP <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
];

const growTasksRaw: Omit<WizardTask, 'completed' | 'stageIcon'>[] = [
  { id: 'get-more-funding', label: 'Get more funding', achievementName: 'Growth Funder', achievementDescription: 'Explored growth funding.', achievementIconName: 'PiggyBank', stageKey: 'grow', stageTitle: 'Grow Your Business', details: (<ul><li><PiggyBank className="inline w-4 h-4 mr-1 text-accent"/>Secure capital for expansion activities.</li><li><a href="https://www.sba.gov/business-guide/grow-your-business/get-more-funding" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA growth funding options <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'expand-locations', label: 'Expand to new locations', achievementName: 'Expansionist', achievementDescription: 'Considered location expansion.', achievementIconName: 'MapPin', stageKey: 'grow', stageTitle: 'Grow Your Business', details: (<ul><li><MapPin className="inline w-4 h-4 mr-1 text-accent"/>Expand your physical or market reach.</li><li><a href="https://www.sba.gov/business-guide/grow-your-business/expand-new-locations" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA expansion guide <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'merge-acquire', label: 'Merge and acquire businesses', achievementName: 'M&A Explorer', achievementDescription: 'Learned about mergers/acquisitions.', achievementIconName: 'Building', stageKey: 'grow', stageTitle: 'Grow Your Business', details: (<ul><li><Building className="inline w-4 h-4 mr-1 text-accent"/>Grow through strategic acquisitions or mergers.</li><li><a href="https://www.sba.gov/business-guide/grow-your-business/merge-acquire-businesses" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA M&A guide <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'federal-contractor', label: 'Become a federal contractor', achievementName: 'Federal Contractor', achievementDescription: 'Explored federal contracting.', achievementIconName: 'Landmark', stageKey: 'grow', stageTitle: 'Grow Your Business', details: (<ul><li><Landmark className="inline w-4 h-4 mr-1 text-accent"/>Bid on government contracts.</li><li><a href="https://www.sba.gov/federal-contracting" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA federal contracting resources <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'export-products', label: 'Export products', achievementName: 'Global Exporter', achievementDescription: 'Considered exporting products.', achievementIconName: 'BarChart2', stageKey: 'grow', stageTitle: 'Grow Your Business', details: (<ul><li><BarChart2 className="inline w-4 h-4 mr-1 text-accent"/>Sell your products or services internationally.</li><li><a href="https://www.sba.gov/business-guide/grow-your-business/export-products" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA exporting guide <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'women-owned', label: 'Explore resources for Women-owned businesses', achievementName: 'Resourceful Entrepreneur (W)', achievementDescription: 'Explored resources for women.', achievementIconName: 'Users', stageKey: 'grow', stageTitle: 'Grow Your Business', details: (<ul><li><Users className="inline w-4 h-4 mr-1 text-accent"/>Access resources tailored for women entrepreneurs.</li><li><a href="https://www.sba.gov/business-guide/grow-your-business/women-owned-businesses" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA Women-Owned Businesses <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'native-american-owned', label: 'Explore resources for Native American-owned businesses', achievementName: 'Resourceful Entrepreneur (NA)', achievementDescription: 'Explored resources for Native Americans.', achievementIconName: 'Users', stageKey: 'grow', stageTitle: 'Grow Your Business', details: (<ul><li><Users className="inline w-4 h-4 mr-1 text-accent"/>Access resources for Native American entrepreneurs.</li><li><a href="https://www.sba.gov/business-guide/grow-your-business/native-american-owned-businesses" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA Native American-Owned <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'veteran-owned', label: 'Explore resources for Veteran-owned businesses', achievementName: 'Resourceful Entrepreneur (V)', achievementDescription: 'Explored resources for veterans.', achievementIconName: 'Users', stageKey: 'grow', stageTitle: 'Grow Your Business', details: (<ul><li><Users className="inline w-4 h-4 mr-1 text-accent"/>Access resources for veteran entrepreneurs.</li><li><a href="https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA Veteran-Owned <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'military-spouse', label: 'Explore resources for Military spouse businesses', achievementName: 'Resourceful Entrepreneur (MS)', achievementDescription: 'Explored resources for military spouses.', achievementIconName: 'Users', stageKey: 'grow', stageTitle: 'Grow Your Business', details: (<ul><li><Users className="inline w-4 h-4 mr-1 text-accent"/>Access resources for military spouse entrepreneurs.</li><li><a href="https://www.sba.gov/business-guide/grow-your-business/military-spouse-owned-businesses" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA Military Spouse-Owned <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'rural-businesses', label: 'Explore resources for Rural businesses', achievementName: 'Resourceful Entrepreneur (R)', achievementDescription: 'Explored resources for rural businesses.', achievementIconName: 'Users', stageKey: 'grow', stageTitle: 'Grow Your Business', details: (<ul><li><Users className="inline w-4 h-4 mr-1 text-accent"/>Access resources for rural entrepreneurs.</li><li><a href="https://www.sba.gov/business-guide/grow-your-business/rural-businesses" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA Rural Businesses <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
  { id: 'minority-owned', label: 'Explore resources for Minority-owned businesses', achievementName: 'Resourceful Entrepreneur (M)', achievementDescription: 'Explored resources for minorities.', achievementIconName: 'Users', stageKey: 'grow', stageTitle: 'Grow Your Business', details: (<ul><li><Users className="inline w-4 h-4 mr-1 text-accent"/>Access resources for minority entrepreneurs.</li><li><a href="https://www.sba.gov/business-guide/grow-your-business/minority-owned-businesses" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">SBA Minority-Owned <LinkIcon className="inline w-3 h-3"/></a>.</li></ul>) },
];

const stageIcons = {
  plan: Briefcase,
  launch: Rocket,
  manage: Settings,
  grow: LineChart,
};

const wizardTasks: WizardTask[] = [
  ...planTasksRaw.map(task => ({ ...task, completed: false, stageIcon: stageIcons[task.stageKey] })),
  ...launchTasksRaw.map(task => ({ ...task, completed: false, stageIcon: stageIcons[task.stageKey] })),
  ...manageTasksRaw.map(task => ({ ...task, completed: false, stageIcon: stageIcons[task.stageKey] })),
  ...growTasksRaw.map(task => ({ ...task, completed: false, stageIcon: stageIcons[task.stageKey] })),
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


export default function HomePage() {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [tasks, setTasks] = useState<WizardTask[]>(() => {
    // Load progress from localStorage on component mount
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bizlaunch_currentTaskIndex', currentTaskIndex.toString());
    }
  }, [currentTaskIndex]);

  useEffect(() => {
    // Listen for external achievement updates (e.g., from AIBusinessAdvisor if it modifies tasks)
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

  const handleCheckChange = (taskId: string) => {
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

  const goToNextTask = () => {
    setCurrentTaskIndex(prev => Math.min(prev + 1, tasks.length - 1));
  };

  const goToPreviousTask = () => {
    setCurrentTaskIndex(prev => Math.max(prev - 1, 0));
  };

  const currentTask = tasks[currentTaskIndex];
  const CurrentStageIcon = currentTask.stageIcon;

  const overallProgress = tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0;
  const tasksInCurrentStage = tasks.filter(t => t.stageKey === currentTask.stageKey);
  const completedInCurrentStage = tasksInCurrentStage.filter(t => t.completed).length;
  const stageProgress = tasksInCurrentStage.length > 0 ? (completedInCurrentStage / tasksInCurrentStage.length) * 100 : 0;


  return (
    <div className="flex min-h-screen">
      <Sidebar side="left" variant="sidebar" collapsible="icon">
          <SidebarHeader className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <LandmarkIcon className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-primary group-data-[collapsible=icon]:hidden">BizLaunch</h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton href="#top" isActive tooltip="Home">
                  <HomeIcon />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton href="#wizard" tooltip="Business Wizard">
                  <Star /> 
                  <span>Wizard</span>
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
                   <LandmarkIcon />
                  <span>Resource Hub</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
      <SidebarInset className="p-6" id="top">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-3xl font-semibold text-foreground">Welcome to BizLaunch</h2>
           <SidebarTrigger className="md:hidden"/>
        </div>

        <p className="text-muted-foreground mb-8">Your comprehensive guide to planning, launching, managing, and growing your business. Start with the wizard below, track your achievements, or ask our AI Business Advisor for personalized guidance.</p>
        
        <AIBusinessAdvisor allTasks={allTasksForAdvisor} />

        {/* Business Wizard Section */}
        <div id="wizard" className="mt-12 pt-12 border-t scroll-mt-20">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-primary flex items-center gap-2">
                <CurrentStageIcon className="w-6 h-6" />
                {currentTask.stageTitle} - Step {tasks.filter(t => t.stageKey === currentTask.stageKey).findIndex(t => t.id === currentTask.id) + 1} of {tasks.filter(t => t.stageKey === currentTask.stageKey).length}
              </CardTitle>
              <CardDescription>Follow these steps to build and grow your business. (Overall Progress: {currentTaskIndex + 1} of {tasks.length})</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor={`task-${currentTask.id}`} className="text-xl font-semibold text-foreground mb-2 block">
                  {currentTask.label}
                </Label>
                <div className="flex items-center space-x-3 p-3 border rounded-md bg-secondary shadow-sm">
                  <Checkbox
                    id={`task-${currentTask.id}`}
                    checked={currentTask.completed}
                    onCheckedChange={() => handleCheckChange(currentTask.id)}
                    aria-labelledby={`task-${currentTask.id}-label`}
                  />
                  <p id={`task-${currentTask.id}-label`} className="text-sm text-secondary-foreground flex-1">
                    Mark this task as completed.
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 border rounded-md bg-background text-sm text-muted-foreground space-y-2">
                 <h4 className="font-semibold text-foreground">Task Details:</h4>
                {currentTask.details}
              </div>
              
              <Separator className="my-6" />

              <div>
                <p className="text-sm text-muted-foreground mb-1">Stage Progress ({currentTask.stageTitle}):</p>
                <Progress value={stageProgress} className="w-full h-2 mb-4" />
                <p className="text-sm text-muted-foreground mb-1">Overall Progress:</p>
                <Progress value={overallProgress} className="w-full h-2" />
              </div>

              <div className="flex justify-between mt-6">
                <Button onClick={goToPreviousTask} disabled={currentTaskIndex === 0} variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous Task
                </Button>
                <Button onClick={goToNextTask} disabled={currentTaskIndex === tasks.length - 1} className="bg-primary hover:bg-primary/90">
                  Next Task <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Achievements Section */}
        <div id="achievements" className="mt-12 pt-12 border-t scroll-mt-20">
            <h3 className="text-2xl font-semibold mb-6 text-primary flex items-center gap-2"><Trophy/> Achievements</h3>
            <AchievementsDisplay allAchievements={allAchievements} stageKeys={['plan', 'launch', 'manage', 'grow']} />
        </div>


        {/* Resource Hub */}
        <div id="resources" className="mt-12 pt-12 border-t scroll-mt-20">
           <ResourceHub />
        </div>
      </SidebarInset>
    </div>
  );
}


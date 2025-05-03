import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from "@/components/ui/sidebar";
import { Briefcase, Rocket, Settings, LineChart, Home as HomeIcon, Target, FileText, DollarSign, Building, CreditCard, PiggyBank, MapPin, Landmark, Users, ClipboardCheck, Banknote, ShieldCheck, ShoppingBag, BarChart2, Laptop, Siren, HeartHandshake, LandmarkIcon } from 'lucide-react'; // Renamed Home to HomeIcon
import { Button } from "@/components/ui/button";
import { AIBusinessAdvisor } from "@/components/AIBusinessAdvisor";
import { InteractiveChecklist } from "@/components/InteractiveChecklist"; // Import Checklist
import { ResourceHub } from "@/components/ResourceHub"; // Import Resource Hub

// Define tasks for each stage
const planTasks = [
  { id: 'market-research', label: 'Market research and competitive analysis', completed: false },
  { id: 'business-plan', label: 'Write your business plan', completed: false },
  { id: 'startup-costs', label: 'Calculate your startup costs', completed: false },
  { id: 'business-credit', label: 'Establish business credit', completed: false },
  { id: 'fund-business', label: 'Fund your business', completed: false },
  { id: 'buy-existing', label: 'Consider buying an existing business or franchise', completed: false },
];

const launchTasks = [
  { id: 'pick-location', label: 'Pick your business location', completed: false },
  { id: 'choose-structure', label: 'Choose a business structure', completed: false },
  { id: 'choose-name', label: 'Choose your business name', completed: false },
  { id: 'register-business', label: 'Register your business', completed: false },
  { id: 'get-tax-ids', label: 'Get federal and state tax ID numbers', completed: false },
  { id: 'apply-licenses', label: 'Apply for licenses and permits', completed: false },
  { id: 'open-bank-account', label: 'Open a business bank account', completed: false },
  { id: 'get-insurance', label: 'Get business insurance', completed: false },
];

const manageTasks = [
  { id: 'manage-finances', label: 'Manage your finances', completed: false },
  { id: 'hire-employees', label: 'Hire and manage employees', completed: false },
  { id: 'pay-taxes', label: 'Pay taxes', completed: false },
  { id: 'stay-compliant', label: 'Stay legally compliant', completed: false },
  { id: 'buy-assets', label: 'Buy assets and equipment', completed: false },
  { id: 'marketing-sales', label: 'Marketing and sales', completed: false },
  { id: 'ai-small-business', label: 'Explore AI for small business', completed: false },
  { id: 'cybersecurity', label: 'Strengthen your cybersecurity', completed: false },
  { id: 'prepare-emergencies', label: 'Prepare for emergencies', completed: false },
  { id: 'recover-disasters', label: 'Recover from disasters', completed: false },
  { id: 'close-sell', label: 'Plan for closing or selling your business', completed: false },
  { id: 'hire-disabilities', label: 'Consider hiring employees with disabilities', completed: false },
];

const growTasks = [
  { id: 'get-more-funding', label: 'Get more funding', completed: false },
  { id: 'expand-locations', label: 'Expand to new locations', completed: false },
  { id: 'merge-acquire', label: 'Merge and acquire businesses', completed: false },
  { id: 'federal-contractor', label: 'Become a federal contractor', completed: false },
  { id: 'export-products', label: 'Export products', completed: false },
  { id: 'women-owned', label: 'Explore resources for Women-owned businesses', completed: false },
  { id: 'native-american-owned', label: 'Explore resources for Native American-owned businesses', completed: false },
  { id: 'veteran-owned', label: 'Explore resources for Veteran-owned businesses', completed: false },
  { id: 'military-spouse', label: 'Explore resources for Military spouse businesses', completed: false },
  { id: 'rural-businesses', label: 'Explore resources for Rural businesses', completed: false },
  { id: 'minority-owned', label: 'Explore resources for Minority-owned businesses', completed: false },
];

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <Sidebar side="left" variant="sidebar" collapsible="icon">
          <SidebarHeader className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <LandmarkIcon className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-primary group-data-[collapsible=icon]:hidden">BizLaunch</h1>
            </div>
            {/* SidebarTrigger is automatically handled by SidebarProvider in layout */}
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton href="#top" isActive tooltip="Home">
                  <HomeIcon /> {/* Updated icon usage */}
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton href="#plan" tooltip="Plan Your Business">
                  <Briefcase />
                  <span>Plan Your Business</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton href="#launch" tooltip="Launch Your Business">
                  <Rocket />
                  <span>Launch Your Business</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton href="#manage" tooltip="Manage Your Business">
                  <Settings />
                  <span>Manage Your Business</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton href="#grow" tooltip="Grow Your Business">
                  <LineChart />
                  <span>Grow Your Business</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton href="#resources" tooltip="Resource Hub">
                   <LandmarkIcon /> {/* Reusing Landmark, could use Library or similar */}
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

        <p className="text-muted-foreground mb-8">Your comprehensive guide to planning, launching, managing, and growing your business. Use the navigation on the left to explore different stages or ask our AI Business Advisor for personalized guidance.</p>

        <AIBusinessAdvisor />

        {/* Interactive Guide Sections */}
        <div id="plan" className="mt-12 pt-12 border-t scroll-mt-20">
           <h3 className="text-2xl font-semibold mb-2 text-primary flex items-center gap-2"><Briefcase/>Plan Your Business</h3>
           <p className="text-muted-foreground mb-6">You've got a great idea. Now, make a plan to turn it into a great business.</p>
           <InteractiveChecklist title="Planning Checklist" tasks={planTasks} stageKey="plan" />
           {/* Detailed content for each task could go here or link out */}
            <details className="mt-4 ml-4 text-sm">
                <summary className="cursor-pointer font-medium text-primary hover:text-accent">Details</summary>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                    <li><Target className="inline w-4 h-4 mr-1 text-accent"/>Market research: Understand your customers, industry, and competitors.</li>
                    <li><FileText className="inline w-4 h-4 mr-1 text-accent"/>Business plan: Create a roadmap for your business strategy and financials.</li>
                    <li><DollarSign className="inline w-4 h-4 mr-1 text-accent"/>Startup costs: Estimate the initial investment needed.</li>
                     <li><CreditCard className="inline w-4 h-4 mr-1 text-accent"/>Business credit: Learn how to build credit for your company.</li>
                     <li><PiggyBank className="inline w-4 h-4 mr-1 text-accent"/>Funding: Explore loans, grants, and investment options.</li>
                     <li><Building className="inline w-4 h-4 mr-1 text-accent"/>Buy existing: Weigh the pros and cons of buying vs. starting from scratch.</li>
                </ul>
            </details>
        </div>

         <div id="launch" className="mt-12 pt-12 border-t scroll-mt-20">
           <h3 className="text-2xl font-semibold mb-2 text-primary flex items-center gap-2"><Rocket/>Launch Your Business</h3>
           <p className="text-muted-foreground mb-6">Turn your business into a reality. Register, file, and start doing business.</p>
           <InteractiveChecklist title="Launching Checklist" tasks={launchTasks} stageKey="launch" />
            <details className="mt-4 ml-4 text-sm">
                <summary className="cursor-pointer font-medium text-primary hover:text-accent">Details</summary>
                 <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                    <li><MapPin className="inline w-4 h-4 mr-1 text-accent"/>Location: Choose the right physical or virtual space.</li>
                    <li><Landmark className="inline w-4 h-4 mr-1 text-accent"/>Structure: Select your legal entity (sole prop, LLC, etc.).</li>
                    <li><FileText className="inline w-4 h-4 mr-1 text-accent"/>Name: Pick and register your business name.</li>
                    <li><ClipboardCheck className="inline w-4 h-4 mr-1 text-accent"/>Registration: Formally register your business with government agencies.</li>
                    <li><DollarSign className="inline w-4 h-4 mr-1 text-accent"/>Tax IDs: Obtain federal (EIN) and state tax identification numbers.</li>
                    <li><FileText className="inline w-4 h-4 mr-1 text-accent"/>Licenses/Permits: Secure necessary operational licenses.</li>
                    <li><CreditCard className="inline w-4 h-4 mr-1 text-accent"/>Bank Account: Open a dedicated account for business finances.</li>
                    <li><ShieldCheck className="inline w-4 h-4 mr-1 text-accent"/>Insurance: Get appropriate coverage to protect your business.</li>
                 </ul>
            </details>
        </div>

         <div id="manage" className="mt-12 pt-12 border-t scroll-mt-20">
           <h3 className="text-2xl font-semibold mb-2 text-primary flex items-center gap-2"><Settings/>Manage Your Business</h3>
           <p className="text-muted-foreground mb-6">Run your business like a boss. Master day-to-day operations and prepare for success.</p>
           <InteractiveChecklist title="Management Checklist" tasks={manageTasks} stageKey="manage" />
            <details className="mt-4 ml-4 text-sm">
                <summary className="cursor-pointer font-medium text-primary hover:text-accent">Details</summary>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                   <li><Banknote className="inline w-4 h-4 mr-1 text-accent"/>Finances: Track income/expenses, manage cash flow, budget.</li>
                   <li><Users className="inline w-4 h-4 mr-1 text-accent"/>Employees: Recruit, hire, train, and manage your team.</li>
                   <li><DollarSign className="inline w-4 h-4 mr-1 text-accent"/>Taxes: Understand obligations and file/pay accurately.</li>
                   <li><ShieldCheck className="inline w-4 h-4 mr-1 text-accent"/>Compliance: Adhere to labor laws, regulations, and reporting.</li>
                   <li><ShoppingBag className="inline w-4 h-4 mr-1 text-accent"/>Assets/Equipment: Purchase and manage necessary business assets.</li>
                   <li><BarChart2 className="inline w-4 h-4 mr-1 text-accent"/>Marketing/Sales: Attract customers and generate revenue.</li>
                   <li><Laptop className="inline w-4 h-4 mr-1 text-accent"/>AI: Leverage artificial intelligence tools for efficiency.</li>
                   <li><ShieldCheck className="inline w-4 h-4 mr-1 text-accent"/>Cybersecurity: Protect your digital assets and customer data.</li>
                   <li><Siren className="inline w-4 h-4 mr-1 text-accent"/>Emergencies: Develop contingency plans for unexpected events.</li>
                   <li><HeartHandshake className="inline w-4 h-4 mr-1 text-accent"/>Disasters: Plan for recovery from natural or other disasters.</li>
                   <li><ClipboardCheck className="inline w-4 h-4 mr-1 text-accent"/>Close/Sell: Understand the process for exiting your business.</li>
                   <li><Users className="inline w-4 h-4 mr-1 text-accent"/>Disabilities Hiring: Learn about benefits and resources.</li>
                </ul>
            </details>
        </div>

         <div id="grow" className="mt-12 pt-12 border-t scroll-mt-20">
           <h3 className="text-2xl font-semibold mb-2 text-primary flex items-center gap-2"><LineChart/>Grow Your Business</h3>
           <p className="text-muted-foreground mb-6">When business is good, it's time to expand. Find new funding, locations, and customers.</p>
           <InteractiveChecklist title="Growth Checklist" tasks={growTasks} stageKey="grow" />
            <details className="mt-4 ml-4 text-sm">
                 <summary className="cursor-pointer font-medium text-primary hover:text-accent">Details</summary>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                    <li><PiggyBank className="inline w-4 h-4 mr-1 text-accent"/>More Funding: Secure capital for expansion activities.</li>
                    <li><MapPin className="inline w-4 h-4 mr-1 text-accent"/>New Locations: Expand your physical or market reach.</li>
                    <li><Building className="inline w-4 h-4 mr-1 text-accent"/>Merge/Acquire: Grow through strategic acquisitions or mergers.</li>
                    <li><Landmark className="inline w-4 h-4 mr-1 text-accent"/>Federal Contracting: Bid on government contracts.</li>
                    <li><BarChart2 className="inline w-4 h-4 mr-1 text-accent"/>Exporting: Sell your products or services internationally.</li>
                     <li><Users className="inline w-4 h-4 mr-1 text-accent"/>Specific Groups: Access resources tailored for women, Native Americans, veterans, military spouses, rural, and minority entrepreneurs.</li>
                </ul>
            </details>
        </div>

        {/* Resource Hub */}
        <div id="resources" className="mt-12 pt-12 border-t scroll-mt-20">
           <ResourceHub />
        </div>
      </SidebarInset>
    </div>
  );
}

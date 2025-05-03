// src/components/ResourceHub.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from 'lucide-react';
import { ExternalLink } from 'lucide-react'; // Use ExternalLink for clarity

interface Resource {
  title: string;
  url: string;
  description: string;
}

interface ResourceCategory {
  category: string;
  resources: Resource[];
}

const resourceData: ResourceCategory[] = [
  {
    category: "Business Planning",
    resources: [
      { title: "SBA Business Plan Guide", url: "https://www.sba.gov/business-guide/plan-your-business/write-your-business-plan", description: "Official SBA guide to writing a comprehensive business plan." },
      { title: "SCORE Business Plan Templates", url: "https://www.score.org/business-plan-templates", description: "Free templates and resources from SCORE mentors." },
      { title: "LivePlan Software", url: "https://www.liveplan.com/", description: "Popular software for creating business plans (paid service)." },
    ],
  },
   {
    category: "Funding",
    resources: [
       { title: "SBA Loan Programs", url: "https://www.sba.gov/funding-programs/loans", description: "Explore various SBA-backed loan options." },
       { title: "Grants.gov", url: "https://www.grants.gov/", description: "Federal grant opportunities database." },
       { title: "AngelList", url: "https://www.angellist.com/", description: "Platform connecting startups with angel investors and venture capital." },
    ],
  },
   {
    category: "Legal & Registration",
    resources: [
       { title: "Choose Your Business Structure (SBA)", url: "https://www.sba.gov/business-guide/launch-your-business/choose-business-structure", description: "Guidance on selecting the right legal structure." },
       { title: "IRS Employer ID Numbers (EIN)", url: "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online", description: "Apply for your federal tax ID online." },
       { title: "SBA Licenses and Permits Tool", url: "https://www.sba.gov/business-guide/launch-your-business/apply-licenses-permits", description: "Find out which licenses and permits you need." },
    ],
  },
   {
    category: "Marketing & Sales",
    resources: [
       { title: "HubSpot Marketing Blog", url: "https://blog.hubspot.com/marketing", description: "Articles and insights on modern marketing strategies." },
       { title: "Google Digital Garage", url: "https://learndigital.withgoogle.com/digitalgarage/", description: "Free online courses on digital marketing from Google." },
       { title: "Neil Patel's Blog", url: "https://neilpatel.com/blog/", description: "Actionable advice on SEO, content marketing, and more." },
    ],
  },
];

export function ResourceHub() {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2 text-primary">
          <Link className="w-5 h-5" />
          Resource Hub
        </CardTitle>
        <CardDescription>
          Curated links to helpful articles, tools, and services for your business journey.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {resourceData.map((categoryData) => (
          <div key={categoryData.category}>
            <h3 className="text-lg font-semibold mb-3 text-foreground border-b pb-1">{categoryData.category}</h3>
            <ul className="space-y-3">
              {categoryData.resources.map((resource) => (
                <li key={resource.title} className="flex items-start space-x-3">
                   <ExternalLink className="w-4 h-4 mt-1 text-accent flex-shrink-0" />
                  <div>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline hover:text-accent transition-colors"
                    >
                      {resource.title}
                    </a>
                    <p className="text-xs text-muted-foreground mt-0.5">{resource.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

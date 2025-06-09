
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Brain, Save, FolderOpen, Printer, Loader2, Wand2, History, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { generateBusinessPlanSection, type GenerateSectionInput, type GenerateSectionOutput } from '@/ai/flows/business-plan-generator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

const BUSINESS_PLAN_STORAGE_KEY = 'bizlaunch_interactiveBusinessPlan_v2'; // Updated key for new structure
const MAX_HISTORY_ITEMS_PER_SECTION = 7;

interface VersionEntry {
  timestamp: number;
  content: string;
}

interface BusinessPlanSection {
  id: string;
  title: string;
  content: string;
  placeholder: string;
  history: VersionEntry[];
}

const initialSectionsData: Omit<BusinessPlanSection, 'history'>[] = [
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

const initialSections: BusinessPlanSection[] = initialSectionsData.map(section => ({
  ...section,
  history: [],
}));

export default function InteractiveBusinessPlanPage() {
  const [overallConcept, setOverallConcept] = useState<string>('');
  const [sections, setSections] = useState<BusinessPlanSection[]>(initialSections);
  const [isLoadingAI, setIsLoadingAI] = useState<Record<string, boolean>>({});
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [isVersionHistoryModalOpen, setIsVersionHistoryModalOpen] = useState<boolean>(false);
  const [currentSectionForHistory, setCurrentSectionForHistory] = useState<BusinessPlanSection | null>(null);

  const handleSectionContentChange = (id: string, newContent: string) => {
    setSections(prevSections =>
      prevSections.map(section =>
        section.id === id ? { ...section, content: newContent } : section
      )
    );
  };

  const saveToLocalStorage = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const dataToSave = { overallConcept, sections };
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
        const savedData = localStorage.getItem(BUSINESS_PLAN_STORAGE_KEY);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          if (parsedData.overallConcept) setOverallConcept(parsedData.overallConcept);
          if (parsedData.sections) {
            const updatedSections = initialSectionsData.map(initSection => {
              const savedSection = parsedData.sections.find((s: BusinessPlanSection) => s.id === initSection.id);
              return savedSection 
                ? { ...initSection, content: savedSection.content, history: savedSection.history || [] } 
                : { ...initSection, history: [] };
            });
            setSections(updatedSections);
          }
          toast({ title: "Plan Loaded!", description: "Your business plan has been loaded from your browser." });
        } else {
          toast({ title: "No Saved Plan", description: "No saved business plan found. Starting fresh!" });
          setSections(initialSectionsData.map(section => ({ ...section, history: [] }))); // Ensure history is initialized
        }
      } catch (error) {
        console.error("Error loading from localStorage:", error);
        toast({ variant: "destructive", title: "Load Failed", description: "Could not load your plan." });
        setSections(initialSectionsData.map(section => ({ ...section, history: [] }))); // Ensure history is initialized on error
      }
    }
  }, []);

  useEffect(() => {
    loadFromLocalStorage();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Load once on mount


  const handleAIAssist = async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    if (!overallConcept.trim() && section.title !== "Executive Summary") { // Allow Executive Summary to be generated without concept if user wishes.
      // toast({ variant: "destructive", title: "Missing Concept", description: "Please enter your overall business concept first to guide the AI for most sections." });
      // return;
    }

    setIsLoadingAI(prev => ({ ...prev, [sectionId]: true }));
    try {
      const input: GenerateSectionInput = {
        overallBusinessConcept: overallConcept,
        sectionName: section.title as any,
        existingContent: section.content,
      };
      const result: GenerateSectionOutput = await generateBusinessPlanSection(input);
      handleSectionContentChange(sectionId, result.generatedContent);
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

  const handleSaveVersion = (sectionId: string) => {
    setSections(prevSections => 
      prevSections.map(section => {
        if (section.id === sectionId) {
          const newHistoryEntry: VersionEntry = {
            timestamp: Date.now(),
            content: section.content,
          };
          // Add to beginning and trim if over limit
          const updatedHistory = [newHistoryEntry, ...section.history].slice(0, MAX_HISTORY_ITEMS_PER_SECTION);
          return { ...section, history: updatedHistory };
        }
        return section;
      })
    );
    toast({ title: "Version Saved", description: `A new version for "${sections.find(s=>s.id === sectionId)?.title}" has been saved.` });
  };

  const handleRestoreVersion = (sectionId: string, timestamp: number) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      const versionToRestore = section.history.find(v => v.timestamp === timestamp);
      if (versionToRestore) {
        handleSectionContentChange(sectionId, versionToRestore.content);
        toast({ title: "Version Restored", description: `Content for "${section.title}" has been restored.` });
        setIsVersionHistoryModalOpen(false);
      }
    }
  };
  
  const handleDeleteVersion = (sectionId: string, timestamp: number) => {
    setSections(prevSections =>
      prevSections.map(section => {
        if (section.id === sectionId) {
          const updatedHistory = section.history.filter(v => v.timestamp !== timestamp);
          return { ...section, history: updatedHistory };
        }
        return section;
      })
    );
    // Update currentSectionForHistory if the deleted version was part of it
    if (currentSectionForHistory && currentSectionForHistory.id === sectionId) {
        setCurrentSectionForHistory(prev => prev ? {...prev, history: prev.history.filter(v => v.timestamp !== timestamp)} : null);
    }
    toast({ title: "Version Deleted", description: `A version for "${sections.find(s=>s.id === sectionId)?.title}" has been deleted.` });
  };


  const openVersionHistoryModal = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      setCurrentSectionForHistory(section);
      setIsVersionHistoryModalOpen(true);
    }
  };


  return (
    <div className="container mx-auto p-4 sm:p-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
            <Wand2 /> Interactive Business Plan Builder
          </CardTitle>
          <CardDescription>
            Craft your business plan section by section with AI assistance. Save versions and your progress!
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

          <Accordion type="multiple" className="w-full space-y-4">
            {sections.map((section) => (
              <AccordionItem value={section.id} key={section.id} className="border rounded-lg bg-card overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline text-left text-primary font-semibold">
                  {section.title}
                </AccordionTrigger>
                <AccordionContent className="p-4 border-t bg-background">
                  <div className="space-y-3">
                    <Textarea
                      placeholder={section.placeholder}
                      value={section.content}
                      onChange={(e) => handleSectionContentChange(section.id, e.target.value)}
                      className="min-h-[200px] text-sm"
                      aria-label={`${section.title} content`}
                    />
                    <div className="flex flex-wrap gap-2 items-center">
                        <Button 
                          onClick={() => handleAIAssist(section.id)} 
                          disabled={isLoadingAI[section.id]}
                          size="sm"
                          className="bg-accent hover:bg-accent/90 text-accent-foreground"
                        >
                          {isLoadingAI[section.id] ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Brain className="mr-2 h-4 w-4" />
                          )}
                          AI Assist
                        </Button>
                        <Button 
                            onClick={() => handleSaveVersion(section.id)}
                            variant="outline"
                            size="sm"
                        >
                            <Save className="mr-2 h-4 w-4" /> Save Version
                        </Button>
                         <Button 
                            onClick={() => openVersionHistoryModal(section.id)}
                            variant="outline"
                            size="sm"
                            disabled={!section.history || section.history.length === 0}
                        >
                            <History className="mr-2 h-4 w-4" /> Manage Versions ({section.history?.length || 0})
                        </Button>
                    </div>
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
              {sections.map((section) => (
                section.content.trim() && (
                  <section key={section.id}>
                    <h2 className="text-lg font-semibold mb-2 border-b pb-1 text-foreground">{section.title}</h2>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{section.content}</p>
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

      {/* Version History Modal */}
      <Dialog open={isVersionHistoryModalOpen} onOpenChange={setIsVersionHistoryModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl text-primary">
              Version History: {currentSectionForHistory?.title}
            </DialogTitle>
            <DialogDescription>
              Review and restore previous versions of this section. Only the last {MAX_HISTORY_ITEMS_PER_SECTION} versions are kept.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-grow pr-6 -mr-6 mt-4">
            {currentSectionForHistory && currentSectionForHistory.history.length > 0 ? (
              <ul className="space-y-3">
                {currentSectionForHistory.history.map((version) => (
                  <li key={version.timestamp} className="p-3 border rounded-md bg-secondary/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Saved: {format(new Date(version.timestamp), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 max-h-20 overflow-y-auto whitespace-pre-wrap">
                          {version.content.substring(0, 150)}{version.content.length > 150 ? '...' : ''}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 ml-2 flex-shrink-0">
                         <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleRestoreVersion(currentSectionForHistory.id, version.timestamp)}
                         >
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restore
                         </Button>
                         <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteVersion(currentSectionForHistory.id, version.timestamp)}
                          >
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                          </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No saved versions for this section yet.</p>
            )}
          </ScrollArea>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
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
      `}</style>

    </div>
  );
}

    

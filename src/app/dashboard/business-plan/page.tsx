
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input"; // Added for team member inputs
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Brain, Save, FolderOpen, Printer, Loader2, Wand2, Undo2, Redo2, UserPlus, Trash2, Users } from 'lucide-react'; // Added UserPlus, Trash2, Users
import { toast } from "@/hooks/use-toast";
import { generateBusinessPlanSection, type GenerateSectionInput, type GenerateSectionOutput } from '@/ai/flows/business-plan-generator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator'; // Added for visual separation

const BUSINESS_PLAN_STORAGE_KEY = 'bizlaunch_interactiveBusinessPlan_v2';
const MAX_UNDO_REDO_STEPS = 10;

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
}

interface BusinessPlanSection {
  id: string;
  title: string;
  content: string;
  placeholder: string;
  undoStack: string[];
  redoStack: string[];
  teamMembers?: TeamMember[]; // Optional: only for Organization and Management section
}

const initialSectionsData: Omit<BusinessPlanSection, 'undoStack' | 'redoStack' | 'teamMembers'>[] = [
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
  undoStack: [],
  redoStack: [],
  teamMembers: section.id === 'organizationManagement' ? [] : undefined,
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
              return {
                ...initSection,
                content: savedSection?.content || '',
                undoStack: savedSection?.undoStack || [],
                redoStack: savedSection?.redoStack || [],
                teamMembers: initSection.id === 'organizationManagement' ? (savedSection?.teamMembers || []) : undefined,
              };
            });
            setSections(updatedSections);
          }
          toast({ title: "Plan Loaded!", description: "Your business plan has been loaded from your browser." });
        } else {
          toast({ title: "No Saved Plan", description: "No saved business plan found. Starting fresh!" });
          setSections(initialSectionsData.map(section => ({
             ...section,
             undoStack: [],
             redoStack: [],
             teamMembers: section.id === 'organizationManagement' ? [] : undefined,
            })));
        }
      } catch (error) {
        console.error("Error loading from localStorage:", error);
        toast({ variant: "destructive", title: "Load Failed", description: "Could not load your plan." });
        setSections(initialSectionsData.map(section => ({
          ...section,
          undoStack: [],
          redoStack: [],
          teamMembers: section.id === 'organizationManagement' ? [] : undefined,
         })));
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
      // For "Organization and Management", we might want to pass teamMembers data to the AI
      // This is a placeholder for now; the Genkit flow would need to be updated to accept this
      let additionalContext = "";
      if (section.id === 'organizationManagement' && section.teamMembers && section.teamMembers.length > 0) {
        additionalContext = "\n\nKey Team Members:\n" + section.teamMembers.map(tm => `- ${tm.name} (${tm.role}): ${tm.bio}`).join("\n");
      }

      const input: GenerateSectionInput = {
        overallBusinessConcept: overallConcept,
        sectionName: section.title as any, // Ensure enum matches title
        existingContent: section.content + additionalContext, // Append team member info if relevant
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

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
            <Wand2 /> Interactive Business Plan Builder
          </CardTitle>
          <CardDescription>
            Craft your business plan section by section with AI assistance. Save your progress and manage versions!
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
                      className="min-h-[150px] text-sm"
                      aria-label={`${section.title} content`}
                    />
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
                          AI Assist
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

                    {/* Structured Input for Team Members in Organization & Management */}
                    {section.id === 'organizationManagement' && (
                      <div className="mt-6 pt-4 border-t">
                        <h4 className="text-md font-semibold mb-3 text-foreground flex items-center">
                          <Users className="mr-2 h-5 w-5 text-primary"/> Key Team Members
                        </h4>
                        {section.teamMembers && section.teamMembers.map((member, index) => (
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
              {sections.map((section) => (
                (section.content.trim() || (section.id === 'organizationManagement' && section.teamMembers && section.teamMembers.length > 0)) && (
                  <section key={section.id}>
                    <h2 className="text-lg font-semibold mb-2 border-b pb-1 text-foreground">{section.title}</h2>
                    {section.content.trim() && <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-3">{section.content}</p>}
                    
                    {section.id === 'organizationManagement' && section.teamMembers && section.teamMembers.length > 0 && (
                      <div className="mt-3">
                        <h3 className="text-md font-semibold mb-2 text-foreground">Key Team Members:</h3>
                        {section.teamMembers.map(member => (
                          member.name.trim() && ( // Only display if member has a name
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
      `}</style>

    </div>
  );
}

    
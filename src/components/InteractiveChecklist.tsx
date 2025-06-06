// src/components/InteractiveChecklist.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion"; // Using framer-motion for animation
import { cn } from "@/lib/utils";
import { updateAchievementStatus } from '@/lib/achievementUtils'; // Import achievement utility

// Extend Task type to include achievement details using icon name
export interface TaskWithAchievement {
  id: string;
  label: string;
  completed: boolean;
  achievementName: string;
  achievementDescription: string;
  achievementIconName: string; // Changed from achievementIcon to string
}

interface InteractiveChecklistProps {
  title: string;
  tasks: TaskWithAchievement[]; // Use the extended type
  stageKey: string; // Unique key for storing progress in localStorage
}

export function InteractiveChecklist({ title, tasks: initialTasks, stageKey }: InteractiveChecklistProps) {
  const [tasks, setTasks] = useState<TaskWithAchievement[]>(() => {
     // Load progress from localStorage on component mount
    if (typeof window !== 'undefined') {
       const savedProgress = localStorage.getItem(`bizlaunch_${stageKey}_progress`);
       if (savedProgress) {
         try {
           const parsedProgress = JSON.parse(savedProgress) as Record<string, boolean>;
           return initialTasks.map(task => ({
             ...task,
             completed: parsedProgress[task.id] ?? false,
           }));
         } catch (e) {
           console.error("Failed to parse saved progress:", e);
           // Fallback to initial state if parsing fails
         }
       }
    }
     // Default state if no saved progress or running on server
    return initialTasks.map(task => ({ ...task, completed: false }));
  });

   useEffect(() => {
     // Save progress to localStorage whenever tasks change
    if (typeof window !== 'undefined') {
      const progressToSave = tasks.reduce((acc, task) => {
        acc[task.id] = task.completed;
        return acc;
      }, {} as Record<string, boolean>);
       localStorage.setItem(`bizlaunch_${stageKey}_progress`, JSON.stringify(progressToSave));
    }
   }, [tasks, stageKey]);

  const handleCheckChange = (taskId: string) => {
    setTasks(prevTasks => {
       const updatedTasks = prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
      // Find the task that was just changed
      const changedTask = updatedTasks.find(task => task.id === taskId);
      if (changedTask) {
        // Update achievement status in localStorage
        updateAchievementStatus(changedTask.id, changedTask.completed);
        // Optionally dispatch an event or call a callback if needed elsewhere
         window.dispatchEvent(new CustomEvent('achievementUpdate', { detail: { taskId: changedTask.id, completed: changedTask.completed } }));
      }
      return updatedTasks;
    });
  };


  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="mb-8 p-4 border rounded-lg shadow-sm bg-card">
      <h4 className="text-lg font-semibold mb-3 text-card-foreground">{title}</h4>
       <div className="mb-3 flex items-center gap-2">
         <div className="w-full bg-secondary rounded-full h-2.5">
           <motion.div
            className="bg-accent h-2.5 rounded-full"
            initial={{ width: 0 }}
             animate={{ width: `${progress}%` }}
             transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
         <span className="text-sm text-muted-foreground whitespace-nowrap">
          {completedCount} / {totalCount}
        </span>
      </div>
      <ul className="space-y-3">
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.li
              key={task.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3 }}
              className={cn(
                "flex items-center space-x-3 p-2 rounded-md transition-colors",
                task.completed ? "bg-secondary" : "hover:bg-muted/50"
              )}
            >
              <Checkbox
                id={`${stageKey}-${task.id}`}
                checked={task.completed}
                onCheckedChange={() => handleCheckChange(task.id)}
                aria-labelledby={`${stageKey}-${task.id}-label`}
              />
              <Label
                htmlFor={`${stageKey}-${task.id}`}
                id={`${stageKey}-${task.id}-label`}
                className={cn(
                  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1",
                  task.completed ? "line-through text-muted-foreground" : "text-foreground"
                )}
              >
                {task.label}
              </Label>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

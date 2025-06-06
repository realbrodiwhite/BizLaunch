
// src/components/AchievementsDisplay.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Achievement } from '@/lib/achievementUtils'; // Import the Achievement type
import { getAchievementStatus } from '@/lib/achievementUtils'; // Import function to get status
import { Trophy, Lock } from 'lucide-react';
import { IconRenderer } from "@/components/IconRenderer"; // Import IconRenderer

interface AchievementsDisplayProps {
  allAchievements: Achievement[];
  stageKeys: string[]; // Keys used for localStorage ('plan', 'launch', etc.)
}

export function AchievementsDisplay({ allAchievements, stageKeys }: AchievementsDisplayProps) {
  const [achievedStatus, setAchievedStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Function to load all achievement statuses from localStorage
    const loadStatuses = () => {
      if (typeof window !== 'undefined') {
        const statusMap: Record<string, boolean> = {};
        allAchievements.forEach(achievement => {
          statusMap[achievement.id] = getAchievementStatus(achievement.id);
        });
        setAchievedStatus(statusMap);
      }
    };

    // Initial load
    loadStatuses();

    // Listen for custom event dispatched when a task is checked/unchecked
    const handleAchievementUpdate = (event: Event) => {
       if (event instanceof CustomEvent) {
           const { taskId, completed } = event.detail;
            setAchievedStatus(prevStatus => ({
                ...prevStatus,
                [taskId]: completed,
            }));
       }
    };

    window.addEventListener('achievementUpdate', handleAchievementUpdate);

    // Clean up listener on component unmount
    return () => {
      window.removeEventListener('achievementUpdate', handleAchievementUpdate);
    };
  }, [allAchievements, stageKeys]); // Rerun effect if achievements or keys change

  const earnedAchievements = allAchievements.filter(ach => achievedStatus[ach.id]);
  const lockedAchievements = allAchievements.filter(ach => !achievedStatus[ach.id]);

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-4">
         {/* CardTitle is handled in the parent page.tsx for section heading */}
        <CardDescription>
          Track your progress and unlock achievements as you complete tasks.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Earned Achievements */}
        <div>
          <h4 className="text-lg font-semibold mb-3 text-accent flex items-center gap-2">
            <Trophy className="w-5 h-5" /> Earned ({earnedAchievements.length})
          </h4>
          {earnedAchievements.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {earnedAchievements.map((ach) => (
                <Card key={ach.id} className="bg-secondary border-accent shadow-sm">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <IconRenderer iconName={ach.iconName} className="w-10 h-10 text-accent mb-2" />
                    <p className="text-sm font-semibold text-secondary-foreground">{ach.name}</p>
                    <p className="text-xs text-muted-foreground">{ach.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No achievements earned yet. Keep checking off tasks!</p>
          )}
        </div>

        {/* Locked Achievements */}
        <div>
          <h4 className="text-lg font-semibold mb-3 text-muted-foreground flex items-center gap-2">
            <Lock className="w-5 h-5" /> Locked ({lockedAchievements.length})
          </h4>
          {lockedAchievements.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {lockedAchievements.map((ach) => (
                 <Card key={ach.id} className="bg-card border-border shadow-sm opacity-60">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                     <IconRenderer iconName={ach.iconName} className="w-10 h-10 text-muted-foreground mb-2" />
                    <p className="text-sm font-semibold text-muted-foreground">{ach.name}</p>
                     <p className="text-xs text-muted-foreground">{ach.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-accent">Congratulations! You've unlocked all achievements!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


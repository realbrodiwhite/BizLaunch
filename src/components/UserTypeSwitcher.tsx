
"use client";

import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from '@/components/ui/label';
import { ShieldAlert, UserCog } from 'lucide-react'; // Added UserCog for Admin

const USER_TYPES = ["Free", "Pro", "Business", "Enterprise", "Admin"] as const; // Added Admin
type UserType = typeof USER_TYPES[number];
const LOCAL_STORAGE_KEY = "bizlaunch_simulatedUserType";

export function UserTypeSwitcher() {
  const [currentUserType, setCurrentUserType] = useState<UserType>("Free");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedUserType = localStorage.getItem(LOCAL_STORAGE_KEY) as UserType | null;
    if (storedUserType && USER_TYPES.includes(storedUserType)) {
      setCurrentUserType(storedUserType);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(LOCAL_STORAGE_KEY, currentUserType);
    }
  }, [currentUserType, isMounted]);

  const handleUserTypeChange = (value: string) => {
    if (USER_TYPES.includes(value as UserType)) {
      setCurrentUserType(value as UserType);
    }
  };

  if (!isMounted) {
    return null; // Don't render on the server or during initial client mount to avoid hydration mismatch
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 shadow-2xl w-64 bg-background border-primary print:hidden">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          {currentUserType === "Admin" ? <UserCog className="w-5 h-5 text-destructive" /> : <ShieldAlert className="w-5 h-5 text-accent" />}
          <Label htmlFor="userTypeSelect" className="text-sm font-semibold text-foreground">Simulated User Type:</Label>
        </div>
        <Select value={currentUserType} onValueChange={handleUserTypeChange}>
          <SelectTrigger id="userTypeSelect" className="w-full h-9 text-sm">
            <SelectValue placeholder="Select Type" />
          </SelectTrigger>
          <SelectContent>
            {USER_TYPES.map((type) => (
              <SelectItem key={type} value={type} className="text-sm">
                {type === "Admin" ? <div className="flex items-center gap-2"><UserCog className="w-4 h-4 text-destructive" /> {type}</div> : type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-2">
          (Dev tool for testing UI states. Does not affect backend logic.)
        </p>
      </CardContent>
    </Card>
  );
}


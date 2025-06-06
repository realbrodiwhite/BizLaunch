// src/components/IconRenderer.tsx
"use client"; // This component needs to be a Client Component to use dynamic imports/rendering

import React from 'react';
import * as Icons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

// Define a type for the valid icon names based on the Keys of the Icons object
export type IconName = keyof typeof Icons;

interface IconRendererProps extends LucideProps {
  iconName: IconName | string; // Allow string for flexibility, but prefer IconName
}

export function IconRenderer({ iconName, ...props }: IconRendererProps) {
  // Check if the iconName is a valid key in the Icons object
  if (iconName in Icons) {
    const LucideIcon = Icons[iconName as IconName] as React.ElementType; // Type assertion
    return <LucideIcon {...props} />;
  }

  // Fallback icon or null if the icon name is invalid
  console.warn(`Icon "${iconName}" not found in lucide-react. Rendering fallback.`);
  const FallbackIcon = Icons['HelpCircle']; // Or any other default icon
  return <FallbackIcon {...props} />;
}

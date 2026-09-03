import type React from 'react';

export type HomeSectionItem = {
  description: string;
  disabled?: boolean | undefined;
  icon: React.ReactNode;
  key: string;
  label: string;
  onClick?: (() => void) | undefined;
  to?: string | undefined;
};

export type HomeSection = {
  description: string;
  icon: React.ReactNode;
  id: string;
  items: HomeSectionItem[];
  title: string;
};

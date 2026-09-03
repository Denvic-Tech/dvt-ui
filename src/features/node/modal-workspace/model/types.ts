import type React from 'react';

export type NodeModalWorkspaceContentWidth = 'compact' | 'regular' | 'wide';

export type NodeModalWorkspaceSection = {
  id: string;
  label: React.ReactNode;
  icon: React.ReactNode;
  summary?: React.ReactNode;
  required?: boolean;
  complete?: boolean;
  error?: boolean;
  disabled?: boolean;
  disabledReason?: React.ReactNode;
  content: React.ReactNode;
};

export type NodeModalWorkspacePreviewTab = {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
};

export type NodeModalWorkspacePreview = {
  title: React.ReactNode;
  tabs?: NodeModalWorkspacePreviewTab[];
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  content?: React.ReactNode;
  state?: 'ready' | 'loading' | 'empty' | 'error';
  emptyState?: React.ReactNode;
  errorState?: React.ReactNode;
  loadingState?: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
};

export type NodeModalWorkspaceProps = {
  sections: NodeModalWorkspaceSection[];
  activeSectionId: string;
  onSectionChange: (sectionId: string) => void;
  contentWidth?: NodeModalWorkspaceContentWidth;
  preview?: NodeModalWorkspacePreview;
};

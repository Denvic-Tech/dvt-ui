import React from 'react';

import { ServiceRow } from './ServiceRow.tsx';
import {
  EmptyStatePanel,
  RowsStack,
  SectionCount,
  SectionHeader,
  SectionIconWrap,
  SectionSummary,
  SectionSummaryDot,
  SectionTitle,
  SectionWrap,
} from './styled.ts';
import type { ServiceStatusRowItem } from './types.ts';

interface ServicesStatusSectionProps {
  emptyText: string;
  icon: React.ReactNode;
  items: ServiceStatusRowItem[];
  title: string;
}

export const ServicesStatusSection: React.FC<ServicesStatusSectionProps> = ({
  emptyText,
  icon,
  items,
  title,
}) => {
  const onlineCount = items.filter(item => item.status === 'online').length;
  const offlineCount = items.length - onlineCount;

  return (
    <SectionWrap>
      <SectionHeader>
        <SectionIconWrap>{icon}</SectionIconWrap>
        <SectionTitle>{title}</SectionTitle>
        <SectionCount>{items.length}</SectionCount>
        {offlineCount > 0 ? (
          <SectionSummary>
            <SectionSummaryDot />
            {onlineCount} онлайн · {offlineCount} оффлайн
          </SectionSummary>
        ) : null}
      </SectionHeader>

      {items.length > 0 ? (
        <RowsStack>
          {items.map(item => (
            <ServiceRow key={item.key} item={item} />
          ))}
        </RowsStack>
      ) : (
        <EmptyStatePanel>{emptyText}</EmptyStatePanel>
      )}
    </SectionWrap>
  );
};

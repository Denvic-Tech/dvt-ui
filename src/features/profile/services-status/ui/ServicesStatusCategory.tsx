import React, { useState } from 'react';
import { Collapse } from '@mui/material';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';

import {
  CategoryContent,
  CategoryCount,
  CategoryHeader,
  CategoryIcon,
  CategorySection,
  CategoryTitle,
  CategoryTitleGroup,
  EmptyStateCard,
} from './styles';

interface ServicesStatsCategoryProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  children?: React.ReactNode;
  defaultExpanded?: boolean;
  emptyText?: string;
}

export const ServicesStatusCategory: React.FC<ServicesStatsCategoryProps> = ({
  title,
  count,
  icon,
  children,
  defaultExpanded = true,
  emptyText,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasChildren = React.Children.count(children) > 0;

  return (
    <CategorySection>
      <CategoryHeader
        type='button'
        onClick={() => setExpanded(prev => !prev)}
        aria-expanded={expanded}
      >
        <CategoryTitleGroup>
          <CategoryIcon>{icon}</CategoryIcon>
          <CategoryTitle>{title}</CategoryTitle>
          <CategoryCount>{count}</CategoryCount>
        </CategoryTitleGroup>

        <KeyboardArrowDownRoundedIcon
          sx={{
            width: 20,
            height: 20,
            color: '#9ca3af',
            transition: 'transform 200ms ease',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </CategoryHeader>

      <Collapse in={expanded} timeout='auto' unmountOnExit>
        {hasChildren ? (
          <CategoryContent>{children}</CategoryContent>
        ) : emptyText ? (
          <EmptyStateCard>{emptyText}</EmptyStateCard>
        ) : null}
      </Collapse>
    </CategorySection>
  );
};

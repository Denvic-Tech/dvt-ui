import { type ReactNode, useEffect, useState } from 'react';
import { Stack } from '@mui/material';
import { ChevronDown, ChevronRight } from 'lucide-react';

import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/primitives';

export function Additional({
  children,
  summary = '',
  reveal = 0,
}: {
  children: ReactNode;
  summary?: string;
  reveal?: number;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (reveal) setOpen(true);
  }, [reveal]);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger>
        <Button
          variant='ghost'
          size='sm'
          aria-expanded={open}
          startIcon={
            open ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          }
        >
          Дополнительно{!open && summary ? ' · ' + summary : ''}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Stack spacing={2} sx={{ pt: 2 }}>
          {children}
        </Stack>
      </CollapsibleContent>
    </Collapsible>
  );
}

import React, { useState } from 'react';
import Collapse from '@mui/material/Collapse';

import { OfflineServiceRow } from './OfflineServiceRow.tsx';
import { OnlineServiceRow } from './OnlineServiceRow.tsx';
import { ServiceRowExpanded } from './ServiceRowExpanded.tsx';
import { ServiceRowOfflineExpanded } from './ServiceRowOfflineExpanded.tsx';
import { RowWrap } from './styled.ts';
import type { ServiceStatusRowItem } from './types.ts';

interface ServiceRowProps {
  item: ServiceStatusRowItem;
}

export const ServiceRow: React.FC<ServiceRowProps> = ({ item }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <RowWrap offline={item.status === 'offline'}>
      {item.status === 'offline' ? (
        <OfflineServiceRow
          expanded={expanded}
          item={item}
          onToggle={() => setExpanded(prev => !prev)}
        />
      ) : (
        <OnlineServiceRow
          expanded={expanded}
          item={item}
          onToggle={() => setExpanded(prev => !prev)}
        />
      )}

      <Collapse in={expanded} timeout='auto' unmountOnExit>
        {item.status === 'offline' ? (
          <ServiceRowOfflineExpanded
            data={item.data}
            offlineSince={item.offlineSince}
          />
        ) : item.data ? (
          <ServiceRowExpanded data={item.data} />
        ) : null}
      </Collapse>
    </RowWrap>
  );
};

import { useMemo } from 'react';
import { useAppSelector } from '@/app/providers/store';
import { makeSelectNodeDefinitionByName } from '@/entities/node/node-definition';

export const useNodeDefinition = (nodeName: string | undefined | null) => {
  const selectByName = useMemo(makeSelectNodeDefinitionByName, []);
  return useAppSelector(state =>
    nodeName ? selectByName(state, nodeName) : null
  );
};

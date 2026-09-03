import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';
import { GroupByAggregationEditor } from './ui/GroupByAggEditor.tsx';

const DataFrameGroupByAggExtension: NodeExtension = {
  id: 'data_frame_group_by_agg',
  name: 'Data Frame Group By Agg',
  condition: nodeDefinition => {
    return nodeDefinition.name === 'DataFrameGroupByAgg';
  },
  type: 'modal',
  component: GroupByAggregationEditor,
};

export default DataFrameGroupByAggExtension;

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { graphActions } from '@/entities/project-editor/graph';
import { EdgeContextMenuExtension } from '@/app/providers/edge-extensions/lib/types.ts';

const EdgeDeleteConnectionExtension: EdgeContextMenuExtension = {
  id: 'edge-context-menu/delete',
  name: 'Удалить соединение',
  type: 'context_menu',
  order: 20,
  condition: edge => Boolean(edge),
  getItems: context => [
    {
      id: 'edge-context-menu/delete-action',
      type: 'action',
      label: 'Удалить соединение',
      icon: <DeleteOutlineIcon fontSize='small' />,
      closeOnSelect: false,
      onSelect: ({ dispatch, edge, reactFlow, closeMenu }) => {
        reactFlow.setEdges(edges => edges.filter(e => e.id !== edge.id));
        dispatch(graphActions.deleteEdges({ edges: [edge] }));
        closeMenu();
      },
    },
  ],
};

export default EdgeDeleteConnectionExtension;

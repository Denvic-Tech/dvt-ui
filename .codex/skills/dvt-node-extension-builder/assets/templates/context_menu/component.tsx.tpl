import type {
  NodeContextMenuBuildContext,
  NodeContextMenuItem,
} from '@/app/providers/node-extensions/lib/types';

export const build{{component_name}}Items = (
  _context: NodeContextMenuBuildContext
): NodeContextMenuItem[] => {
  return [
    {
      id: '{{extension_id}}-action',
      type: 'action',
      label: '{{node_display_name}}',
      onSelect: ({ closeMenu }) => {
        closeMenu();
      },
    },
  ];
};

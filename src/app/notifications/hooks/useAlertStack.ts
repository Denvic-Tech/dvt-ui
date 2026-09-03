import { Anchor, DEFAULT_ANCHOR } from '@/app/notifications/model/types.ts';
import { useNotificationStack } from '@/app/notifications';

type UseAlertStackParams = {
  anchor?: Anchor;
  maxVisible?: number;
};

export const useAlertStack = ({
  anchor = DEFAULT_ANCHOR,
  maxVisible,
}: UseAlertStackParams = {}) => {
  const stack = useNotificationStack({ anchor, maxVisible });

  return {
    visibleGroups: stack.visibleGroups,
    renderedGroups: stack.renderedGroups,
    onHideGroup: stack.dismissGroup,
    onHideAll: stack.onHideAll,
    onMouseEnter: stack.onMouseEnter,
    onMouseLeave: stack.onMouseLeave,
  };
};

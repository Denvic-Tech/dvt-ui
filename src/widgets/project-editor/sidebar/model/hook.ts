import { useAppDispatch, useAppSelector } from '@/app/providers/store';
import { selectSidebarUILayout, uiLayoutActions } from '@/features/ui-layout';
import { useCallback } from 'react';

export const useSidebar = () => {
  const dispatch = useAppDispatch();

  const sidebarUILayout = useAppSelector(selectSidebarUILayout);

  const toggle = useCallback(() => {
    dispatch(uiLayoutActions.toggleSidebar());
  }, [dispatch]);

  const setExpanded = useCallback(
    (expanded: boolean) => {
      dispatch(uiLayoutActions.setSidebarExpanded(expanded));
    },
    [dispatch]
  );

  const setCategoriesWidth = useCallback(
    (width: number) => {
      dispatch(uiLayoutActions.setSidebarCategoriesWidth(width));
    },
    [dispatch]
  );

  const setCategoriesContentWidth = useCallback(
    (width: number) => {
      dispatch(uiLayoutActions.setSidebarCategoriesContentWidth(width));
    },
    [dispatch]
  );

  return {
    ...sidebarUILayout,

    toggle,
    setExpanded,
    setCategoriesWidth,
    setCategoriesContentWidth,
  };
};

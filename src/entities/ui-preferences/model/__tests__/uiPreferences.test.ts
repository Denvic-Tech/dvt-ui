import { describe, expect, it } from 'vitest';

import {
  selectCollapsedNodeLibraryCategories,
  selectIsNodeLibraryCategoryCollapsed,
  selectIsNodePinned,
  selectNodeModalWorkspacePreviewWidth,
  selectPinnedNodeNames,
} from '../selectors';
import { uiPreferencesActions, uiPreferencesReducer } from '../slice';
import type { UIPreferencesState } from '../types';

describe('uiPreferences slice', () => {
  it('initializes node-library preferences with empty persisted values', () => {
    const state = uiPreferencesReducer(undefined, { type: 'unknown' });

    expect(state.nodeLibrary).toEqual({
      pinnedNodeNames: [],
      collapsedCategories: {},
    });
    expect(state.nodeModalWorkspace).toEqual({ previewWidth: 420 });
  });

  it('toggles pinned nodes and collapsed categories', () => {
    const pinnedState = uiPreferencesReducer(
      undefined,
      uiPreferencesActions.toggleNodeLibraryPinnedNode('load_csv')
    );

    expect(pinnedState.nodeLibrary.pinnedNodeNames).toEqual(['load_csv']);

    const unpinnedState = uiPreferencesReducer(
      pinnedState,
      uiPreferencesActions.toggleNodeLibraryPinnedNode('load_csv')
    );
    expect(unpinnedState.nodeLibrary.pinnedNodeNames).toEqual([]);

    const collapsedState = uiPreferencesReducer(
      undefined,
      uiPreferencesActions.toggleNodeLibraryCategoryCollapsed('Extraction')
    );
    expect(collapsedState.nodeLibrary.collapsedCategories).toEqual({
      Extraction: true,
    });

    const expandedState = uiPreferencesReducer(
      collapsedState,
      uiPreferencesActions.toggleNodeLibraryCategoryCollapsed('Extraction')
    );
    expect(expandedState.nodeLibrary.collapsedCategories).toEqual({});
  });

  it('falls back safely when legacy persisted state has no nodeLibrary block', () => {
    const legacyRootState = {
      uiPreferences: {
        themeMode: 'light',
        projectsPage: {
          viewMode: 'grid',
        },
        skipHardStopConfirm: false,
        suppressedPrompts: {},
      },
    } as any;

    expect(selectPinnedNodeNames(legacyRootState)).toEqual([]);
    expect(selectCollapsedNodeLibraryCategories(legacyRootState)).toEqual({});
    expect(selectIsNodePinned(legacyRootState, 'load_csv')).toBe(false);
    expect(
      selectIsNodeLibraryCategoryCollapsed(legacyRootState, 'Extraction')
    ).toBe(false);
    expect(selectNodeModalWorkspacePreviewWidth(legacyRootState)).toBe(420);
  });

  it('updates workspace preview width for current and legacy state', () => {
    const currentState = uiPreferencesReducer(
      undefined,
      uiPreferencesActions.setNodeModalWorkspacePreviewWidth(536)
    );
    expect(currentState.nodeModalWorkspace.previewWidth).toBe(536);

    const legacyState = {
      themeMode: 'light',
      projectsPage: { viewMode: 'grid' },
      nodeLibrary: { pinnedNodeNames: [], collapsedCategories: {} },
      skipHardStopConfirm: false,
      suppressedPrompts: {},
    } as any;
    const migratedState = uiPreferencesReducer(
      legacyState,
      uiPreferencesActions.setNodeModalWorkspacePreviewWidth(464)
    );
    expect(migratedState.nodeModalWorkspace.previewWidth).toBe(464);
  });

  it('counts home section usage and resets it', () => {
    const once = uiPreferencesReducer(
      undefined,
      uiPreferencesActions.incrementHomeSectionUse('projects')
    );
    const twice = uiPreferencesReducer(
      once,
      uiPreferencesActions.incrementHomeSectionUse('projects')
    );

    expect(twice.homeDashboard.sectionUses).toEqual({ projects: 2 });

    const reset = uiPreferencesReducer(
      twice,
      uiPreferencesActions.resetHomeSectionUses()
    );
    expect(reset.homeDashboard.sectionUses).toEqual({});
  });

  it('restores home dashboard preferences missing in persisted state', () => {
    const { homeDashboard: _omitted, ...legacyState } = uiPreferencesReducer(
      undefined,
      { type: 'unknown' }
    );

    const state = uiPreferencesReducer(
      legacyState as UIPreferencesState,
      uiPreferencesActions.incrementHomeSectionUse('admin')
    );

    expect(state.homeDashboard.sectionUses).toEqual({ admin: 1 });
  });

  it('stores the ordered home widget ids', () => {
    const initial = uiPreferencesReducer(undefined, { type: 'unknown' });
    expect(initial.homeDashboard.widgetIds).toBeUndefined();

    const state = uiPreferencesReducer(
      initial,
      uiPreferencesActions.setHomeWidgetIds(['runs-24h', 'services'])
    );
    expect(state.homeDashboard.widgetIds).toEqual(['runs-24h', 'services']);

    const { homeDashboard: _omitted, ...legacyState } = initial;
    const migrated = uiPreferencesReducer(
      legacyState as UIPreferencesState,
      uiPreferencesActions.setHomeWidgetIds([])
    );
    expect(migrated.homeDashboard).toEqual({ sectionUses: {}, widgetIds: [] });
  });
});

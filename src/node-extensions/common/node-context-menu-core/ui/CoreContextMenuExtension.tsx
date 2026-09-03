import AbcIcon from '@mui/icons-material/Abc';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DataObjectIcon from '@mui/icons-material/DataObject';
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import SensorsIcon from '@mui/icons-material/Sensors';
import StopIcon from '@mui/icons-material/Stop';
import TableChartIcon from '@mui/icons-material/TableChart';

import {
  NodeContextMenuExtension,
  NodeContextMenuItem,
} from '@/app/providers/node-extensions';
import { store } from '@/app/providers/store';

import { clearNodeMetadata } from '@/features/node/reset-node-metadata';
import { selectNodeActions } from '@/features/project-editor/select-node';
import { uiLayoutActions } from '@/features/ui-layout';

import { nodeDataFrameViewerActions } from '@/entities/node/node-dataframe-viewer';
import { nodeJsonViewerActions } from '@/entities/node/node-json-viewer';
import { nodeMetaViewerActions } from '@/entities/node/node-meta-viewer';
import { nodePayloadViewerActions } from '@/entities/node/node-payload-viewer/ui/slice';
import { cancelProjectTask, runToNode } from '@/entities/project/project-task';
import { selectTaskExecutionStatus } from '@/entities/project/task-execution-status';
import { graphActions } from '@/entities/project-editor/graph';

import {
  buildBooleanToggleItem,
  canUseClipboard,
  getStoreEnabledDefault,
  resolveStoreEnabled,
} from '../lib/helpers';

import { IconWrapper } from './nodeContextMenuStyles';

const CoreContextMenuExtension: NodeContextMenuExtension = {
  id: 'core-node-context-menu',
  name: 'Базовое контекстное меню ноды',
  description: 'Базовые действия над нодой на канвасе',
  type: 'context_menu',
  order: 0,
  condition: () => true,
  getItems: context => {
    const { dispatch, nodeID, nodeDefinition, data } = context;
    const state = store.getState();

    const isWidget = nodeDefinition?.category === 'Widgets';
    const inputDefinitions = Object.values(
      nodeDefinition?.input_definitions ?? {}
    );
    const outputDefinitions = Object.values(
      nodeDefinition?.output_definitions ?? {}
    );
    const hasDataframeOutput = Boolean(
      outputDefinitions.some(def =>
        Array.isArray(def.type)
          ? def.type.includes('DATAFRAME')
          : def.type === 'DATAFRAME'
      )
    );
    const hasJsonOutput = Boolean(
      outputDefinitions.some(def =>
        Array.isArray(def.type)
          ? def.type.includes('JSON') || def.type.includes('DICT')
          : def.type === 'JSON' || def.type === 'DICT'
      )
    );
    const hasSignalIO = Boolean(
      inputDefinitions.some(def =>
        Array.isArray(def.type)
          ? def.type.includes('SIGNAL')
          : def.type === 'SIGNAL'
      ) ||
      outputDefinitions.some(def =>
        Array.isArray(def.type)
          ? def.type.includes('SIGNAL')
          : def.type === 'SIGNAL'
      )
    );
    const hasVariablesIO = Boolean(
      inputDefinitions.some(def =>
        Array.isArray(def.type)
          ? def.type.includes('VARIABLE')
          : def.type === 'VARIABLE'
      ) ||
      outputDefinitions.some(def =>
        Array.isArray(def.type)
          ? def.type.includes('VARIABLE')
          : def.type === 'VARIABLE'
      )
    );

    const storeEnabledDefault = getStoreEnabledDefault(nodeDefinition);
    const cacheEnabled = resolveStoreEnabled(
      data?.storeEnabled,
      storeEnabledDefault
    );

    const taskStatus = selectTaskExecutionStatus(state);
    const projectTaskPending = state.projectTask?.pending;
    const activeTaskId = state.projectTask?.lastTaskID;
    const currentProjectId = state.projects?.selectedProject?.id;

    let label = 'Запустить до этой ноды';
    let icon = (
      <IconWrapper variant='primary'>
        <PlayArrowIcon />
      </IconWrapper>
    );
    let isDisabled = false;
    let actionType: 'run' | 'cancel' = 'run';

    if (!isWidget) {
      switch (taskStatus) {
        case 'PENDING':
          isDisabled = true;
          label = 'Запуск...';
          break;
        case 'STARTED':
        case 'RUNNING':
          label = 'Остановить выполнение';
          icon = (
            <IconWrapper variant='error'>
              <StopIcon />
            </IconWrapper>
          );
          actionType = 'cancel';
          if (!activeTaskId) isDisabled = true;
          break;
      }
      if (projectTaskPending) {
        isDisabled = true;
      }
    }

    const items: NodeContextMenuItem[] = [];

    if (!isWidget) {
      items.push({
        id: actionType === 'run' ? 'run-to-node' : 'cancel-execution',
        type: 'action',
        label: label,
        icon: icon,
        disabled: isDisabled,
        onSelect: async ({ closeMenu }) => {
          if (actionType === 'cancel') {
            if (currentProjectId && activeTaskId) {
              try {
                await dispatch(
                  cancelProjectTask({
                    projectID: currentProjectId,
                    taskID: activeTaskId,
                  })
                ).unwrap();
              } catch (e) {
                console.error(e);
              }
            }
          } else {
            dispatch(runToNode(nodeID));
          }
          closeMenu();
        },
      });
    }

    items.push({
      id: 'open-node-settings',
      type: 'action',
      label: 'Открыть настройки',
      icon: (
        <IconWrapper>
          <OpenInNewIcon />
        </IconWrapper>
      ),
      onSelect: ({ dispatch, nodeID }) => {
        dispatch(selectNodeActions.selectNode(nodeID));
        dispatch(uiLayoutActions.setNodeDataModalOpen(true));
      },
    });

    items.push({
      id: 'duplicate-node',
      type: 'action',
      label: 'Дублировать ноду',
      icon: (
        <IconWrapper>
          <FileCopyOutlinedIcon />
        </IconWrapper>
      ),
      disabled: !context.duplicateNode,
      tooltip: context.duplicateNode
        ? undefined
        : 'Дублирование недоступно в текущем контексте',
      onSelect: async ({ duplicateNode, nodeID }) => {
        if (duplicateNode) {
          await duplicateNode(nodeID);
        }
      },
    });

    if (!isWidget && hasDataframeOutput) {
      items.push({
        id: 'open-node-dataframe',
        type: 'action',
        label: 'Показать датафреймы',
        icon: (
          <IconWrapper>
            <TableChartIcon />
          </IconWrapper>
        ),
        disabled: !cacheEnabled,
        tooltip: cacheEnabled
          ? undefined
          : 'Включите кэширование для просмотра датафреймов',
        onSelect: ({ dispatch, nodeID }) => {
          dispatch(selectNodeActions.selectNode(nodeID));
          dispatch(nodeDataFrameViewerActions.open(nodeID));
        },
      });
    }

    if (!isWidget && hasJsonOutput) {
      items.push({
        id: 'open-node-json-output',
        type: 'action',
        label: 'Показать JSON-выход',
        icon: (
          <IconWrapper>
            <DataObjectIcon />
          </IconWrapper>
        ),
        disabled: !cacheEnabled,
        tooltip: cacheEnabled
          ? undefined
          : 'Включите кэширование для просмотра JSON-выхода',
        onSelect: ({ dispatch, nodeID }) => {
          dispatch(selectNodeActions.selectNode(nodeID));
          dispatch(nodeJsonViewerActions.open(nodeID));
        },
      });
    }

    items.push({
      id: 'open-node-payload',
      type: 'action',
      label: 'Показать JSON Payload',
      icon: (
        <IconWrapper>
          <DataObjectIcon />
        </IconWrapper>
      ),
      onSelect: ({ dispatch, nodeID }) => {
        dispatch(selectNodeActions.selectNode(nodeID));
        dispatch(nodePayloadViewerActions.open(nodeID));
      },
    });

    if (!isWidget) {
      items.push(
        {
          id: 'open-node-metadata',
          type: 'action',
          label: 'Показать метаданные',
          icon: (
            <IconWrapper>
              <InfoOutlinedIcon />
            </IconWrapper>
          ),
          onSelect: ({ dispatch, nodeID }) => {
            dispatch(selectNodeActions.selectNode(nodeID));
            dispatch(nodeMetaViewerActions.open(nodeID));
          },
        },
        {
          id: 'reset-node-metadata',
          type: 'action',
          label: 'Сбросить метаданные',
          icon: (
            <IconWrapper>
              <RefreshIcon />
            </IconWrapper>
          ),
          closeOnSelect: false,
          tooltip: 'Очистить закешированные метаданные ноды',
          onSelect: async ({ dispatch, nodeID, closeMenu }) => {
            dispatch(selectNodeActions.selectNode(nodeID));
            try {
              await dispatch(clearNodeMetadata({ nodeID: nodeID })).unwrap();
            } catch (error) {
              console.error('Не удалось сбросить метаданные ноды', error);
            } finally {
              closeMenu();
            }
          },
        }
      );

      if (hasDataframeOutput || hasJsonOutput) {
        items.push(
          buildBooleanToggleItem({
            id: 'toggle-node-cache',
            label: 'Кэширование',
            checked: cacheEnabled,
            icon: (
              <IconWrapper>
                <SaveIcon />
              </IconWrapper>
            ),
            onToggle: ({ dispatch }, nextChecked) => {
              dispatch(
                graphActions.updateStoreEnabled({
                  nodeID,
                  storeEnabled: nextChecked,
                })
              );
            },
          })
        );
      }
    }

    if (hasSignalIO) {
      items.push(
        buildBooleanToggleItem({
          id: 'toggle-signal-io',
          label: 'Показывать SIGNAL порты',
          checked: Boolean(data?.showSignalIo),
          icon: (
            <IconWrapper>
              <SensorsIcon />
            </IconWrapper>
          ),
          onToggle: ({ dispatch }, nextChecked) => {
            dispatch(
              graphActions.updateShowSignalIo({
                nodeID,
                showSignalIo: nextChecked,
              })
            );
          },
        })
      );
    }

    if (hasVariablesIO) {
      items.push(
        buildBooleanToggleItem({
          id: 'toggle-variables-io',
          label: 'Показывать VARIABLE порты',
          checked: Boolean(data?.showVariablesIo),
          icon: (
            <IconWrapper>
              <AbcIcon />
            </IconWrapper>
          ),
          onToggle: ({ dispatch }, nextChecked) => {
            dispatch(
              graphActions.updateShowVariablesIo({
                nodeID,
                showVariablesIo: nextChecked,
              })
            );
          },
        })
      );
    }

    // Разделитель перед "Скопировать"
    items.push({
      id: 'divider-before-copy',
      type: 'separator',
    });

    items.push({
      id: 'clipboard-actions',
      type: 'submenu',
      label: 'Скопировать',
      icon: (
        <IconWrapper>
          <ContentCopyIcon />
        </IconWrapper>
      ),
      items: [
        {
          id: 'copy-node-id',
          type: 'action',
          label: 'ID ноды',
          icon: (
            <IconWrapper>
              <ContentCopyIcon />
            </IconWrapper>
          ),
          disabled: !canUseClipboard(),
          tooltip: canUseClipboard()
            ? undefined
            : 'Буфер обмена недоступен в этом окружении',
          onSelect: async ({ nodeID }) => {
            if (canUseClipboard()) {
              await navigator.clipboard.writeText(nodeID);
            }
          },
        },
        {
          id: 'copy-node-name',
          type: 'action',
          label: 'Имя шаблона',
          icon: (
            <IconWrapper>
              <ContentCopyIcon />
            </IconWrapper>
          ),
          disabled: !canUseClipboard(),
          tooltip: canUseClipboard()
            ? undefined
            : 'Буфер обмена недоступен в этом окружении',
          onSelect: async ({ nodeDefinition }) => {
            if (canUseClipboard()) {
              await navigator.clipboard.writeText(nodeDefinition.name);
            }
          },
        },
      ],
    });

    return items;
  },
};

export default CoreContextMenuExtension;

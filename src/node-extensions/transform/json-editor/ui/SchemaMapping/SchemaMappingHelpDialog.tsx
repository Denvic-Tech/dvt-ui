import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  IconButton,
} from '@/shared/ui/primitives';

import { ACTION_PALETTE } from './helpers';
import {
  CloseIcon,
  ExcludeIcon,
  ExplodeIcon,
  KeepIcon,
  MetaIcon,
  RecordIcon,
} from './icons';
import {
  HelpActionCard,
  HelpActionCopy,
  HelpActionDescription,
  HelpActionList,
  HelpActionPreview,
  HelpActionTitle,
  HelpBulletList,
  HelpDialogBody,
  HelpLead,
  HelpSection,
  HelpSectionTitle,
} from './styled';

interface SchemaMappingHelpDialogProps {
  onClose: () => void;
  open: boolean;
}

const ACTION_HELP = [
  {
    action: 'record',
    title: 'Источник строк',
    description: 'выбирает, откуда брать строки результата.',
    Icon: RecordIcon,
  },
  {
    action: 'meta',
    title: 'Добавить в строки',
    description: 'добавляет выбранные поля в каждую строку результата.',
    Icon: MetaIcon,
  },
  {
    action: 'explode',
    title: 'Размножить строки',
    description: 'разворачивает массив в несколько строк.',
    Icon: ExplodeIcon,
  },
  {
    action: 'keep',
    title: 'Оставить как JSON',
    description: 'сохраняет ветку как вложенный JSON без разворачивания.',
    Icon: KeepIcon,
  },
  {
    action: 'exclude',
    title: 'Исключить',
    description: 'полностью убирает ветку из результата.',
    Icon: ExcludeIcon,
  },
] as const;

export const SchemaMappingHelpDialog = ({
  onClose,
  open,
}: SchemaMappingHelpDialogProps) => {
  return (
    <Dialog
      open={open}
      maxWidth='md'
      onClose={onClose}
      PaperProps={{
        sx: {
          maxHeight: 'calc(100vh - 32px)',
          borderRadius: '16px',
        },
      }}
    >
      <DialogHeader
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <DialogTitle>Как работает JSON Editor</DialogTitle>
        <IconButton
          aria-label='Закрыть окно помощи'
          size='xs'
          variant='ghost'
          onClick={onClose}
          sx={{
            width: 28,
            minWidth: 28,
            height: 28,
            minHeight: 28,
            color: '#6b7280',
            flexShrink: 0,
            '&:hover': {
              backgroundColor: '#f3f4f6',
              color: '#111827',
            },
          }}
        >
          <CloseIcon width={12} height={12} />
        </IconButton>
      </DialogHeader>

      <DialogContent
        sx={{
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 132px)',
        }}
      >
        <HelpDialogBody>
          <HelpLead>
            JSON Editor подготавливает JSON к превращению в таблицу.
          </HelpLead>

          <HelpSection>
            <HelpSectionTitle>Что делает нода</HelpSectionTitle>
            <HelpBulletList>
              <li>выбирает, какая часть JSON станет строками;</li>
              <li>добавляет общие поля в каждую строку;</li>
              <li>
                при необходимости разворачивает массивы в дополнительные строки;
              </li>
              <li>оставляет сложные ветки как JSON;</li>
              <li>убирает ненужные поля.</li>
            </HelpBulletList>
          </HelpSection>

          <HelpSection>
            <HelpSectionTitle>Как это работает</HelpSectionTitle>
            <HelpActionList>
              {ACTION_HELP.map(({ action, description, Icon, title }) => {
                return (
                  <HelpActionCard key={action}>
                    <HelpActionPreview color={ACTION_PALETTE[action].active}>
                      <Icon />
                    </HelpActionPreview>
                    <HelpActionCopy>
                      <HelpActionTitle>{title}</HelpActionTitle>
                      <HelpActionDescription>
                        {description}
                      </HelpActionDescription>
                    </HelpActionCopy>
                  </HelpActionCard>
                );
              })}
            </HelpActionList>
          </HelpSection>

          <HelpSection>
            <HelpSectionTitle>
              Если для элемента ничего не выбрано
            </HelpSectionTitle>
            <HelpBulletList>
              <li>он не исключается и не сохраняется как JSON;</li>
              <li>нода обрабатывает его обычным способом;</li>
              <li>
                простые значения попадают в плоский результат как обычные поля;
              </li>
              <li>вложенные объекты разворачиваются дальше;</li>
              <li>
                массивы без «Размножить строки» не превращаются в дополнительные
                строки автоматически.
              </li>
            </HelpBulletList>
          </HelpSection>

          <HelpSection>
            <HelpSectionTitle>Важные правила</HelpSectionTitle>
            <HelpBulletList>
              <li>источник строк может быть только один;</li>
              <li>
                один и тот же путь нельзя использовать сразу для нескольких
                действий;
              </li>
              <li>если путь исключён, он не попадёт в результат;</li>
              <li>если путь оставлен как JSON, он не будет разворачиваться;</li>
              <li>«Добавить в строки» не меняет число строк;</li>
              <li>«Размножить строки» увеличивает число строк.</li>
            </HelpBulletList>
          </HelpSection>

          <HelpSection>
            <HelpSectionTitle>Дополнительно</HelpSectionTitle>
            <HelpBulletList>
              <li>Разделитель задаёт формат имён плоских полей;</li>
              <li>
                Определить источник строк автоматически пытается сам выбрать
                подходящий массив объектов;
              </li>
              <li>
                Максимум строк ограничивает размер результата после
                разворачивания.
              </li>
            </HelpBulletList>
          </HelpSection>

          <HelpSection>
            <HelpSectionTitle>Результат</HelpSectionTitle>
            <HelpLead>
              Результат ноды — JSON в виде списка объектов, удобный для
              дальнейшего преобразования в таблицу.
            </HelpLead>
          </HelpSection>
        </HelpDialogBody>
      </DialogContent>
    </Dialog>
  );
};

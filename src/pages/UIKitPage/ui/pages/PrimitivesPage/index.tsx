import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Copy,
  MoreHorizontal,
  Search,
} from 'lucide-react';

import {
  dataframeFieldOptions,
  projectOptions,
  reviewRows,
  userOptions,
} from '@/pages/UIKitPage/model/demo-data';
import { SectionCard } from '@/pages/UIKitPage/ui/SectionCard';
import {
  uikitNestedSurfaceSx,
  uikitSelectableRowSx,
} from '@/pages/UIKitPage/ui/uikit-styles';
import {
  UIKitCodeBlock,
  UIKitPageLead,
} from '@/pages/UIKitPage/ui/UIKitShowcase';

import {
  Alert,
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Chip,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Combobox,
  DateTimeField,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Field,
  IconButton,
  Input,
  Popover,
  Progress,
  RadioGroup,
  RadioGroupItem,
  Select,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Skeleton,
  Spinner,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
} from '@/shared/ui/primitives';

const infoSurfaceSx = (theme: Parameters<typeof uikitNestedSurfaceSx>[0]) => ({
  ...uikitNestedSurfaceSx(theme),
  display: 'grid',
  gap: 1.5,
  p: 2,
});

export const PrimitivesPageLead = () => (
  <UIKitPageLead
    description='Опорный набор примитивов для новых экранов DVT. Здесь важны дефолты темы, читаемая иерархия и минимум локальных style overrides.'
    title='Primitives'
  >
    <UIKitCodeBlock>
      {"import { Button, Field, Input, Select } from '@/shared/ui/primitives';"}
    </UIKitCodeBlock>
  </UIKitPageLead>
);

export const PrimitivesActionsSection = () => (
  <>
    <SectionCard description='Основные и вторичные действия.' title='Buttons'>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        <Button>Primary</Button>
        <Button variant='outline'>Outline</Button>
        <Button variant='secondary'>Secondary</Button>
        <Button variant='subtle'>Subtle</Button>
        <Button variant='destructive'>Destructive</Button>
        <Button variant='link'>Link</Button>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        <Button size='xs'>XS</Button>
        <Button size='sm' variant='outline'>
          Small
        </Button>
        <Button size='default' variant='secondary'>
          Default
        </Button>
        <Button size='lg'>Large</Button>
      </Box>
    </SectionCard>

    <SectionCard
      description='Icon actions используют тот же язык.'
      title='Icon buttons'
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        <IconButton aria-label='Open notifications' size='xs'>
          <Bell size={14} />
        </IconButton>
        <IconButton aria-label='Search' size='sm' variant='outline'>
          <Search size={16} />
        </IconButton>
        <IconButton aria-label='Copy' variant='toolbar'>
          <Copy size={16} />
        </IconButton>
        <IconButton aria-label='More' size='lg' variant='ghost'>
          <MoreHorizontal size={18} />
        </IconButton>
      </Box>
    </SectionCard>
  </>
);

export const PrimitivesFormsSection = () => {
  const [selectValue, setSelectValue] = React.useState('alice');
  const [comboboxValue, setComboboxValue] = React.useState('customer-360');
  const [dateValue, setDateValue] = React.useState<string | null>(
    '2026-03-26T10:30:00.000Z'
  );
  const [switchChecked, setSwitchChecked] = React.useState(true);
  const [checkboxChecked, setCheckboxChecked] = React.useState(true);
  const [radioValue, setRadioValue] = React.useState('balanced');

  return (
    <>
      <SectionCard
        description='Базовая форма через `Field` и стандартные контролы.'
        title='Text fields'
      >
        <Field label='Pipeline name' required>
          <Input
            defaultValue='Customer 360 Refresh'
            startAdornment={<Search size={16} />}
          />
        </Field>
        <Field label='Operator note'>
          <Textarea defaultValue='Используйте примитивы из shared/ui/primitives и дефолты темы.' />
        </Field>
      </SectionCard>

      <SectionCard
        description='Select-like контролы для выбора и поиска.'
        title='Selects'
      >
        <Field label='Owner'>
          <Select
            options={userOptions}
            placeholder='Select owner'
            value={selectValue}
            onChange={setSelectValue}
          />
        </Field>
        <Field label='Project'>
          <Combobox
            options={[...projectOptions]}
            value={comboboxValue}
            onValueChange={value => setComboboxValue(String(value))}
          />
        </Field>
        <Field label='Run window'>
          <DateTimeField value={dateValue} onValueChange={setDateValue} />
        </Field>
      </SectionCard>

      <SectionCard
        description='Toggle-состояния должны оставаться спокойными.'
        title='Toggles'
      >
        <Box sx={infoSurfaceSx}>
          <Box
            component='label'
            sx={{
              alignItems: 'center',
              display: 'flex',
              gap: 2,
              justifyContent: 'space-between',
            }}
          >
            <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
              Auto review
            </Typography>
            <Switch
              checked={switchChecked}
              onCheckedChange={setSwitchChecked}
            />
          </Box>

          <Box
            component='label'
            sx={{ alignItems: 'center', display: 'flex', gap: 1.5 }}
          >
            <Checkbox
              checked={checkboxChecked}
              onCheckedChange={checked => setCheckboxChecked(checked === true)}
            />
            <Typography sx={{ fontSize: 14 }}>
              Закрепить конфиг в быстром доступе
            </Typography>
          </Box>

          <RadioGroup value={radioValue} onValueChange={setRadioValue}>
            {[
              { value: 'balanced', label: 'Balanced' },
              { value: 'compact', label: 'Compact' },
            ].map(option => (
              <Box
                key={option.value}
                component='label'
                sx={uikitSelectableRowSx}
              >
                <RadioGroupItem value={option.value} />
                <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                  {option.label}
                </Typography>
              </Box>
            ))}
          </RadioGroup>
        </Box>
      </SectionCard>
    </>
  );
};

export const PrimitivesFeedbackSection = () => (
  <>
    <SectionCard
      description='Короткие status-сигналы для inline и form feedback.'
      title='Status'
    >
      <Alert variant='info'>Системная подсказка для текущего шага.</Alert>
      <Alert variant='success'>Изменения сохранены.</Alert>
      <Alert variant='warning'>Перед публикацией требуется ревью.</Alert>
      <Alert variant='destructive'>
        Последняя синхронизация завершилась с ошибкой.
      </Alert>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Badge variant='primary'>Primary</Badge>
        <Badge variant='success'>Success</Badge>
        <Chip variant='outline'>Neutral</Chip>
        <Chip variant='warning'>Pending</Chip>
      </Box>
    </SectionCard>

    <SectionCard
      description='Loading-состояния должны быть мягкими и предсказуемыми.'
      title='Loading'
    >
      <Box sx={{ display: 'grid', gap: 1.5 }}>
        <Skeleton height={20} width={128} />
        <Skeleton height={40} width='100%' />
        <Skeleton height={96} width='100%' />
      </Box>
      <Box sx={{ alignItems: 'center', display: 'flex', gap: 1.5 }}>
        <Spinner color='primary' size={16} />
        <Typography sx={{ fontSize: 14 }}>Обновление предпросмотра</Typography>
      </Box>
      <Progress value={68} />
    </SectionCard>
  </>
);

export const PrimitivesOverlaysSection = () => {
  const menuAnchorRef = React.useRef<HTMLButtonElement | null>(null);
  const popoverAnchorRef = React.useRef<HTMLButtonElement | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  return (
    <>
      <SectionCard
        description='Компактные overlay-сценарии.'
        title='Menus and help'
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          <Button
            ref={menuAnchorRef}
            variant='secondary'
            onClick={() => setMenuOpen(true)}
          >
            Actions
            <ChevronDown size={16} />
          </Button>
          <DropdownMenu
            anchorEl={menuAnchorRef.current}
            anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
            open={menuOpen}
            transformOrigin={{ horizontal: 'left', vertical: 'top' }}
            onClose={() => setMenuOpen(false)}
          >
            <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
            <DropdownMenuItem>Open inspector</DropdownMenuItem>
            <DropdownMenuItem>Duplicate pipeline</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Archive</DropdownMenuItem>
          </DropdownMenu>

          <Button
            ref={popoverAnchorRef}
            variant='outline'
            onClick={() => setPopoverOpen(true)}
          >
            Help
          </Button>
          <Popover
            anchorEl={popoverAnchorRef.current}
            anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
            contentSx={{ display: 'grid', gap: 1, p: 2 }}
            open={popoverOpen}
            transformOrigin={{ horizontal: 'left', vertical: 'top' }}
            onClose={() => setPopoverOpen(false)}
          >
            <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
              Inline help
            </Typography>
            <Typography color='text.secondary' sx={{ fontSize: 12 }}>
              Для коротких пояснений лучше использовать popover.
            </Typography>
          </Popover>

          <Tooltip title='Короткие подсказки не должны перетягивать внимание.'>
            <Box component='span'>
              <IconButton aria-label='Help' variant='toolbar'>
                <CircleHelp size={16} />
              </IconButton>
            </Box>
          </Tooltip>
        </Box>
      </SectionCard>

      <SectionCard
        description='Сценарии, которым нужно больше места.'
        title='Dialog and sheet'
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          <Button variant='outline' onClick={() => setDialogOpen(true)}>
            Open dialog
          </Button>
          <Button variant='secondary' onClick={() => setSheetOpen(true)}>
            Open sheet
          </Button>
        </Box>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Подтвердить изменение</DialogTitle>
            <DialogDescription>
              Диалог подходит для действий с primary CTA.
            </DialogDescription>
          </DialogHeader>
          <DialogContent>
            <Field label='Approver'>
              <Combobox
                options={[...userOptions]}
                value='alice'
                onValueChange={() => undefined}
              />
            </Field>
          </DialogContent>
          <DialogFooter>
            <Button variant='secondary' onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={() => setDialogOpen(false)}>Применить</Button>
          </DialogFooter>
        </Dialog>

        <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
          <SheetHeader>
            <SheetTitle>Inspector</SheetTitle>
            <SheetDescription>
              Боковая панель для локального редактирования.
            </SheetDescription>
          </SheetHeader>
          <SheetContent>
            <Field label='Field'>
              <Combobox
                options={[...dataframeFieldOptions]}
                value={dataframeFieldOptions[0].value}
                onValueChange={() => undefined}
              />
            </Field>
          </SheetContent>
        </Sheet>
      </SectionCard>

      <SectionCard
        description='Helpers для организации контента.'
        title='Structure helpers'
      >
        <Tabs defaultValue='overview'>
          <TabsList>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='review'>Review</TabsTrigger>
          </TabsList>
          <TabsContent sx={{ display: 'grid', gap: 1.5 }} value='overview'>
            <Typography color='text.secondary' sx={{ fontSize: 14 }}>
              Tabs удобны для небольшого деления контента.
            </Typography>
            <Separator />
          </TabsContent>
          <TabsContent sx={{ display: 'grid', gap: 1.5 }} value='review'>
            <Typography color='text.secondary' sx={{ fontSize: 14 }}>
              Активная вкладка должна быть заметно сильнее соседних control
              элементов.
            </Typography>
            <Separator />
          </TabsContent>
        </Tabs>

        <Collapsible defaultOpen>
          <CollapsibleTrigger>
            <Button sx={{ justifyContent: 'space-between' }} variant='ghost'>
              Secondary details
              <ChevronRight size={16} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent sx={{ pt: 1.5 }}>
            <Typography color='text.secondary' sx={{ fontSize: 14 }}>
              Вторичные пояснения лучше сворачивать.
            </Typography>
          </CollapsibleContent>
        </Collapsible>
      </SectionCard>
    </>
  );
};

export const PrimitivesDataDisplaySection = () => (
  <>
    <SectionCard
      description='Card и Avatar покрывают большинство list/detail сценариев.'
      title='Cards'
    >
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Avatar>
          <AvatarFallback>AJ</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>ML</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>PR</AvatarFallback>
        </Avatar>
      </Box>
      <Card>
        <CardHeader>
          <CardTitle sx={{ fontSize: 14 }}>Вложенная карточка</CardTitle>
        </CardHeader>
        <CardContent>
          <Typography color='text.secondary' sx={{ fontSize: 14 }}>
            Card уже несёт в себе surface-стилистику и spacing.
          </Typography>
        </CardContent>
        <CardFooter>
          <Button size='sm' variant='secondary'>
            Review
          </Button>
          <Button size='sm'>Apply</Button>
        </CardFooter>
      </Card>
    </SectionCard>

    <SectionCard description='Плотная, но читаемая таблица.' title='Table'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pipeline</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Status</TableHead>
            <TableHead sx={{ textAlign: 'right' }}>Rows</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviewRows.map(row => (
            <TableRow key={row.id}>
              <TableCell sx={{ fontWeight: 600 }}>{row.id}</TableCell>
              <TableCell>{row.owner}</TableCell>
              <TableCell>
                <Chip variant={row.healthTone}>{row.healthLabel}</Chip>
              </TableCell>
              <TableCell sx={{ textAlign: 'right' }}>{row.records}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  </>
);

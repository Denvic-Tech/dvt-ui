import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  ChevronDown,
  Filter,
  MoreHorizontal,
  PanelRightOpen,
  Plus,
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
  uikitElevatedSurfaceSx,
  uikitNestedSurfaceSx,
} from '@/pages/UIKitPage/ui/uikit-styles';
import { UIKitPageLead } from '@/pages/UIKitPage/ui/UIKitShowcase';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Chip,
  Combobox,
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
  Panel,
  Popover,
  Select,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
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
  Tooltip,
} from '@/shared/ui/primitives';

const topMetrics = [
  { label: 'Active DAGs', value: '128', note: 'production' },
  { label: 'SLA drift', value: '1.8%', note: 'last window' },
  { label: 'Backfill queue', value: '42', note: 'avg delay' },
] as const;

const queueRows = [
  {
    pipeline: 'customer_segments.refresh',
    owner: 'Marcus Lee',
    status: 'Running',
    tone: 'success' as const,
  },
  {
    pipeline: 'finance.margin_rollup',
    owner: 'Alice Johnson',
    status: 'Needs review',
    tone: 'warning' as const,
  },
  {
    pipeline: 'ad_events.stitching',
    owner: 'Priya Raman',
    status: 'Risk',
    tone: 'destructive' as const,
  },
] as const;

const panelCardSx = uikitElevatedSurfaceSx;
const nestedSx = (theme: Parameters<typeof uikitNestedSurfaceSx>[0]) => ({
  ...uikitNestedSurfaceSx(theme),
  p: 2,
});

export const MoodboardPageLead = () => (
  <UIKitPageLead
    description='Спокойный desktop moodboard для review и operational surfaces. Фокус на таблицах, фильтрах и вторичных панелях без витринного hero-слоя.'
    title='Moodboard'
  />
);

export const MoodboardSummarySection = () => (
  <Box
    sx={{
      display: 'grid',
      gap: 3,
      gridTemplateColumns: 'minmax(0, 1.5fr) minmax(18rem, 0.9fr)',
    }}
  >
    <Panel sx={{ minWidth: 0 }}>
      <Box sx={{ display: 'grid', gap: 3, p: 3 }}>
        <Box
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            gap: 3,
            justifyContent: 'space-between',
            pb: 3,
          }}
        >
          <Box sx={{ display: 'grid', gap: 0.75 }}>
            <Typography component='h3' sx={{ fontSize: 24, fontWeight: 600 }}>
              Operations console
            </Typography>
            <Typography color='text.secondary' sx={{ fontSize: 14 }}>
              Рабочая поверхность с коротким статусным контекстом и быстрыми
              действиями.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            <Button>
              <Plus size={16} />
              New run
            </Button>
            <Button variant='outline'>
              <PanelRightOpen size={16} />
              Inspector
            </Button>
            <IconButton aria-label='More actions' variant='toolbar'>
              <MoreHorizontal size={16} />
            </IconButton>
          </Box>
        </Box>

        <Card sx={panelCardSx}>
          <CardHeader>
            <CardTitle sx={{ fontSize: 18 }}>Control ribbon</CardTitle>
            <CardDescription>
              Верхняя зона с поиском и быстрыми фильтрами.
            </CardDescription>
          </CardHeader>
          <CardContent sx={{ display: 'grid', gap: 2 }}>
            <Input
              placeholder='Найти pipeline, owner или источник'
              startAdornment={<Search size={16} />}
            />
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              }}
            >
              {topMetrics.map(metric => (
                <Card key={metric.label} sx={nestedSx}>
                  <CardContent sx={{ display: 'grid', gap: 1, p: 0 }}>
                    <Typography color='text.secondary' sx={{ fontSize: 12 }}>
                      {metric.label}
                    </Typography>
                    <Typography sx={{ fontSize: 28, fontWeight: 600 }}>
                      {metric.value}
                    </Typography>
                    <Typography color='text.secondary' sx={{ fontSize: 12 }}>
                      {metric.note}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              <Button variant='secondary'>
                <Filter size={16} />
                Add filter
              </Button>
              <Button variant='subtle'>Suggest config</Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Panel>

    <SectionCard
      description='Короткий handoff перед подтверждением окна.'
      sx={{ alignSelf: 'start' }}
      title='Handoff summary'
    >
      {queueRows.map(row => (
        <Box key={row.pipeline} sx={nestedSx}>
          <Box
            sx={{
              alignItems: 'center',
              display: 'flex',
              gap: 2,
              justifyContent: 'space-between',
            }}
          >
            <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
              {row.pipeline}
            </Typography>
            <Chip variant={row.tone}>{row.status}</Chip>
          </Box>
          <Typography color='text.secondary' sx={{ fontSize: 12, mt: 1 }}>
            {row.owner}
          </Typography>
        </Box>
      ))}
    </SectionCard>
  </Box>
);

export const MoodboardQueueSection = () => (
  <SectionCard
    description='Компактный список задач с мягким разделением по статусу.'
    title='Run queue'
  >
    {queueRows.map(row => (
      <Box key={`${row.pipeline}-${row.status}`} sx={nestedSx}>
        <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
          {row.pipeline}
        </Typography>
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            gap: 2,
            justifyContent: 'space-between',
            mt: 1,
          }}
        >
          <Typography color='text.secondary' sx={{ fontSize: 12 }}>
            {row.owner}
          </Typography>
          <Chip variant={row.tone}>{row.status}</Chip>
        </Box>
      </Box>
    ))}
  </SectionCard>
);

export const MoodboardFiltersSection = () => {
  const [project, setProject] = React.useState(projectOptions[0].value);
  const [owner, setOwner] = React.useState(userOptions[1].value);
  const [field, setField] = React.useState(dataframeFieldOptions[1].value);

  return (
    <SectionCard
      description='Инспекторная форма без лишних decoration layers.'
      title='Filter workbench'
    >
      <Field label='Project'>
        <Combobox
          options={[...projectOptions]}
          value={project}
          onValueChange={value => setProject(String(value))}
        />
      </Field>
      <Field label='Owner'>
        <Select
          options={userOptions}
          placeholder='Select owner'
          value={owner}
          onChange={setOwner}
        />
      </Field>
      <Field label='Field'>
        <Combobox
          options={[...dataframeFieldOptions]}
          value={field}
          onValueChange={value => setField(String(value))}
        />
      </Field>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        <Button>Apply</Button>
        <Button variant='secondary'>Save view</Button>
      </Box>
    </SectionCard>
  );
};

export const MoodboardReviewSection = () => (
  <SectionCard
    description='Таблица и toolbar оформлены как один рабочий аналитический контур.'
    title='Review dataset'
  >
    <Input
      placeholder='Искать pipeline или owner'
      startAdornment={<Search size={16} />}
    />
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pipeline</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Updated</TableHead>
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
            <TableCell>{row.updatedAt}</TableCell>
            <TableCell sx={{ textAlign: 'right' }}>{row.records}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </SectionCard>
);

export const MoodboardOverlaysSection = () => {
  const menuAnchorRef = React.useRef<HTMLButtonElement | null>(null);
  const popoverAnchorRef = React.useRef<HTMLButtonElement | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [environment, setEnvironment] = React.useState('production');

  return (
    <SectionCard
      description='Диалоги, меню и панели должны наследовать ту же restrained surface language.'
      title='Overlay behavior'
    >
      <Tabs defaultValue='dialog'>
        <TabsList>
          <TabsTrigger value='dialog'>Dialog</TabsTrigger>
          <TabsTrigger value='sheet'>Sheet</TabsTrigger>
          <TabsTrigger value='menu'>Menu</TabsTrigger>
        </TabsList>

        <TabsContent sx={{ display: 'grid', gap: 2 }} value='dialog'>
          <Button variant='outline' onClick={() => setDialogOpen(true)}>
            Open confirmation
          </Button>
          <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
            <DialogHeader>
              <DialogTitle>Подтвердить запуск окна</DialogTitle>
              <DialogDescription>
                Редкое, но важное решение внутри операционного контура.
              </DialogDescription>
            </DialogHeader>
            <DialogContent>
              <Field label='Environment'>
                <Select
                  options={[
                    { label: 'Staging', value: 'staging' },
                    { label: 'Production', value: 'production' },
                  ]}
                  placeholder='Select environment'
                  value={environment}
                  onChange={setEnvironment}
                />
              </Field>
            </DialogContent>
            <DialogFooter>
              <Button variant='secondary' onClick={() => setDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={() => setDialogOpen(false)}>Подтвердить</Button>
            </DialogFooter>
          </Dialog>
          <Tooltip title='Tooltip остаётся вторичным слоем интерфейса.'>
            <Box component='span'>
              <Button variant='secondary'>Show tooltip</Button>
            </Box>
          </Tooltip>
        </TabsContent>

        <TabsContent sx={{ display: 'grid', gap: 2 }} value='sheet'>
          <Button variant='outline' onClick={() => setSheetOpen(true)}>
            Open side panel
          </Button>
          <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
            <SheetHeader>
              <SheetTitle>Inspector panel</SheetTitle>
              <SheetDescription>
                Вторичный слой для локального редактирования.
              </SheetDescription>
            </SheetHeader>
            <SheetContent>
              <Field label='Workspace name'>
                <Input defaultValue='Customer 360 Refresh' />
              </Field>
            </SheetContent>
          </Sheet>
        </TabsContent>

        <TabsContent sx={{ display: 'grid', gap: 2 }} value='menu'>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            <Button
              ref={menuAnchorRef}
              variant='secondary'
              onClick={() => setMenuOpen(true)}
            >
              Quick actions
              <ChevronDown size={16} />
            </Button>
            <DropdownMenu
              anchorEl={menuAnchorRef.current}
              anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
              open={menuOpen}
              transformOrigin={{ horizontal: 'left', vertical: 'top' }}
              onClose={() => setMenuOpen(false)}
            >
              <DropdownMenuLabel>Pipeline</DropdownMenuLabel>
              <DropdownMenuItem>Duplicate scenario</DropdownMenuItem>
              <DropdownMenuItem>Open execution logs</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Archive draft</DropdownMenuItem>
            </DropdownMenu>

            <Button
              ref={popoverAnchorRef}
              variant='outline'
              onClick={() => setPopoverOpen(true)}
            >
              Open hint
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
                Runbook note
              </Typography>
              <Typography color='text.secondary' sx={{ fontSize: 12 }}>
                Popover остаётся лёгким продолжением панели и таблиц.
              </Typography>
            </Popover>
          </Box>
        </TabsContent>
      </Tabs>
    </SectionCard>
  );
};

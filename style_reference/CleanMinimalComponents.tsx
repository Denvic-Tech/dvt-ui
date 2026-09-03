import type { ComponentType } from 'react';
import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  AlertCircle,
  AppWindow,
  Bell,
  Boxes,
  Database,
  MoreHorizontal,
  Play,
  Search,
  Settings2,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Page,
  Panel,
  Separator,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/primitives';
import {
  createUIKitNavIconSx,
  createUIKitNavItemSx,
  uikitBrandTileSx,
  uikitNestedSurfaceSx,
} from '@/pages/UIKitPage/ui/uikit-styles';

const ReferenceStubPage = () => null;

export interface ReferenceUIKitPageConfig {
  description: string;
  disabled?: boolean;
  icon: LucideIcon;
  key: 'components' | 'moodboard' | 'primitives';
  label: string;
  page: ComponentType;
  to: string;
}

export const referenceUIKitPageConfigs: readonly ReferenceUIKitPageConfig[] = [
  {
    key: 'moodboard',
    label: 'Moodboard',
    description: 'Scene-level references for the visual tone of the app.',
    icon: Sparkles,
    page: ReferenceStubPage,
    to: '/ui-kit/moodboard',
  },
  {
    key: 'primitives',
    label: 'Primitives',
    description: 'Base controls exported from the shared primitive layer.',
    icon: Boxes,
    page: ReferenceStubPage,
    to: '/ui-kit/primitives',
  },
  {
    key: 'components',
    label: 'Components',
    description: 'Entity-oriented widgets and domain-aware control groups.',
    icon: AppWindow,
    page: ReferenceStubPage,
    to: '/ui-kit/components',
  },
] as const;

const sampleRows = [
  { node: 'Load Orders', status: 'Ready', mode: 'full' },
  { node: 'Filter Refunds', status: 'Warning', mode: 'metadata only' },
  { node: 'Save Snapshot', status: 'Running', mode: 'full' },
] as const;

const nestedSurfaceSx = (theme: Parameters<typeof uikitNestedSurfaceSx>[0]) => ({
  ...uikitNestedSurfaceSx(theme),
  p: 2,
});

export function ReferenceCard(): React.JSX.Element {
  return (
    <Card sx={{ maxWidth: 720 }}>
      <CardHeader sx={{ gap: 2 }}>
        <Box
          sx={{
            alignItems: { sm: 'flex-start', xs: 'stretch' },
            display: 'flex',
            flexDirection: { sm: 'row', xs: 'column' },
            gap: 2,
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'grid', gap: 0.75 }}>
            <CardTitle sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
              <Sparkles size={16} />
              Runtime preset
            </CardTitle>
            <CardDescription>
              Build cards from shared primitives first, then add only local,
              scene-level layout via `sx` or narrow wrappers.
            </CardDescription>
          </Box>
          <Badge variant='primary'>DVT UI</Badge>
        </Box>
      </CardHeader>
      <CardContent sx={{ display: 'grid', gap: 2 }}>
        <Box sx={nestedSurfaceSx}>
          <Box
            sx={{
              alignItems: { sm: 'center', xs: 'flex-start' },
              display: 'flex',
              flexDirection: { sm: 'row', xs: 'column' },
              gap: 1.5,
              justifyContent: 'space-between',
              mb: 1.5,
            }}
          >
            <Box sx={{ display: 'grid', gap: 0.5 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                Execution target
              </Typography>
              <Typography color='text.secondary' sx={{ fontSize: 13, lineHeight: 1.6 }}>
                Quiet nested surfaces should still come from shared primitives
                and theme tokens, not from a bespoke CSS block.
              </Typography>
            </Box>
            <Badge>metadata only</Badge>
          </Box>
          <Input
            placeholder='analytics.orders_snapshot'
            startAdornment={<Database size={16} />}
          />
        </Box>
      </CardContent>
      <CardFooter sx={{ justifyContent: 'flex-end' }}>
        <Button variant='outline'>Cancel</Button>
        <Button startIcon={<Play size={16} />}>Save preset</Button>
      </CardFooter>
    </Card>
  );
}

export function ReferenceToolbar(): React.JSX.Element {
  return (
    <Box
      sx={{
        alignItems: { sm: 'center', xs: 'stretch' },
        display: 'flex',
        flexDirection: { sm: 'row', xs: 'column' },
        flexWrap: 'wrap',
        gap: 1.5,
      }}
    >
      <Box sx={{ minWidth: 0, width: { sm: 288, xs: '100%' } }}>
        <Input placeholder='Search nodes' startAdornment={<Search size={16} />} />
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        <Button size='sm' startIcon={<Bell size={16} />} variant='toolbar'>
          Alerts
        </Button>
        <Button size='sm' startIcon={<Settings2 size={16} />} variant='secondary'>
          Settings
        </Button>
        <Button aria-label='More actions' size='icon-sm' variant='ghost'>
          <MoreHorizontal size={16} />
        </Button>
      </Box>
    </Box>
  );
}

export function ReferenceSettingsBlock(): React.JSX.Element {
  return (
    <Panel padding='lg' variant='muted' sx={{ maxWidth: 640 }}>
      <Box sx={{ display: 'grid', gap: 2 }}>
        <Box sx={{ display: 'grid', gap: 0.75 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em' }}>
            Background sync
          </Typography>
          <Typography color='text.secondary' sx={{ fontSize: 14, lineHeight: 1.6 }}>
            Compose medium-complex settings blocks from `Panel`, `Switch`,
            `Badge`, `Separator`, and the shared typography scale.
          </Typography>
        </Box>
        <Separator />
        <Box
          sx={{
            alignItems: { sm: 'center', xs: 'flex-start' },
            display: 'flex',
            flexDirection: { sm: 'row', xs: 'column' },
            gap: 2,
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'grid', gap: 0.5 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
              Auto flush graph operations
            </Typography>
            <Typography color='text.secondary' sx={{ fontSize: 13, lineHeight: 1.6 }}>
              Uses the debounced sync pipeline and retry listener middleware.
            </Typography>
          </Box>
          <Switch defaultChecked />
        </Box>
      </Box>
    </Panel>
  );
}

export function ReferenceDialog(): React.JSX.Element {
  const [open, setOpen] = React.useState(false);

  return (
    <Box sx={{ display: 'grid', gap: 1.5 }}>
      <Button variant='subtle' onClick={() => setOpen(true)}>
        Open dialog reference
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogHeader>
          <DialogTitle sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
            <AlertCircle size={18} />
            Delete execution profile
          </DialogTitle>
          <DialogDescription>
            Prefer shared `Dialog` primitives and shape the content region with
            composition. Do not rebuild a separate modal shell in feature code.
          </DialogDescription>
        </DialogHeader>
        <DialogContent>
          <Box sx={nestedSurfaceSx}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>
              This removes saved credentials and local runtime defaults.
            </Typography>
            <Typography color='text.secondary' sx={{ fontSize: 14, lineHeight: 1.6 }}>
              Connected nodes remain in the graph, but new runs require manual
              configuration.
            </Typography>
          </Box>
        </DialogContent>
        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant='destructive' onClick={() => setOpen(false)}>
            Delete profile
          </Button>
        </DialogFooter>
      </Dialog>
    </Box>
  );
}

export function ReferenceTable(): React.JSX.Element {
  return (
    <Card sx={{ maxWidth: 880 }}>
      <CardHeader>
        <CardTitle>Node execution overview</CardTitle>
        <CardDescription>
          Tables should use the shared `Table*` primitives and stay visually
          aligned with cards, panels, and overlays.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Node</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Mode</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sampleRows.map(row => (
              <TableRow key={row.node}>
                <TableCell sx={{ fontWeight: 600 }}>{row.node}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>{row.mode}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function ReferenceUIKitSidebar(): React.JSX.Element {
  return (
    <Panel
      component='aside'
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        height: '100%',
        minHeight: 0,
        p: 2,
      }}
    >
      <Box sx={{ display: 'grid', gap: 1.5 }}>
        <Box sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
          <Box
            sx={[
              uikitBrandTileSx,
              {
                height: 40,
                width: 40,
              },
            ]}
          >
            <Sparkles size={18} />
          </Box>
          <Badge variant='primary'>Reference</Badge>
        </Box>
        <Box sx={{ display: 'grid', gap: 0.75 }}>
          <Typography sx={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>
            UI Kit
          </Typography>
          <Typography color='text.secondary' sx={{ fontSize: 14, lineHeight: 1.6 }}>
            Keep sidebar navigation in a dedicated module and render it from a
            shared page config list.
          </Typography>
        </Box>
      </Box>

      <Separator />

      <Box sx={{ display: 'grid', gap: 1 }}>
        {referenceUIKitPageConfigs.map(page => {
          const Icon = page.icon;
          const isActive = page.key === 'components';

          return (
            <Box
              key={page.key}
              sx={[
                createUIKitNavItemSx(isActive),
                { p: 1.5 },
              ]}
            >
              <Box sx={createUIKitNavIconSx(isActive)}>
                <Icon size={18} />
              </Box>
              <Box sx={{ display: 'grid', gap: 0.5, minWidth: 0 }}>
                <Box sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                    {page.label}
                  </Typography>
                  {page.disabled ? <Badge>Soon</Badge> : null}
                </Box>
                <Typography color='text.secondary' sx={{ fontSize: 12, lineHeight: 1.6 }}>
                  {page.description}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Panel>
  );
}

export function ReferencePageConfigCard(): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Config-driven pages</CardTitle>
        <CardDescription>
          Keep page routing and navigation metadata in one object list with
          `label`, `description`, `disabled`, `icon`, `page`, and `to`.
        </CardDescription>
      </CardHeader>
      <CardContent sx={{ display: 'grid', gap: 1.5 }}>
        {referenceUIKitPageConfigs.map(page => (
            <Box
              key={page.key}
              sx={theme => ({
                ...nestedSurfaceSx(theme),
                alignItems: 'center',
                display: 'flex',
                gap: 1.5,
              })}
          >
            <page.icon size={18} />
            <Box sx={{ display: 'grid', gap: 0.35, minWidth: 0 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                {page.label}
              </Typography>
              <Typography color='text.secondary' sx={{ fontSize: 13, lineHeight: 1.5 }}>
                {page.to}
              </Typography>
            </Box>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}

export function ReferenceUIKitShell(): React.JSX.Element {
  return (
    <Page size='full' sx={{ px: { lg: 3, xs: 2 }, py: 2 }}>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { lg: '320px minmax(0, 1fr)', xs: '1fr' },
        }}
      >
        <ReferenceUIKitSidebar />
        <Box sx={{ display: 'grid', gap: 2 }}>
          <ReferencePageConfigCard />
          <ReferenceToolbar />
          <ReferenceCard />
          <ReferenceSettingsBlock />
          <ReferenceTable />
          <ReferenceDialog />
        </Box>
      </Box>
    </Page>
  );
}

export function ReferenceLayout(): React.JSX.Element {
  return <ReferenceUIKitShell />;
}

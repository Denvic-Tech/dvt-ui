import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { OrganizationReadSchema } from '@/shared/gatewayClient';

import {
  AllOrgsButton,
  CountBadge,
  MeasureLayer,
  OrgBar,
  OrgBarControls,
  OrgLogo,
  OrgPill,
  OrgPillName,
  OrgPopover,
  OrgPopoverEmpty,
  OrgPopoverList,
  OrgPopoverRow,
  OrgPopoverRowMeta,
  OrgPopoverRowName,
  OrgPopoverRowText,
  OrgPopoverSearch,
  OrgPopoverSearchInput,
  OrgPopoverWrap,
  PillRow,
} from './styles';

const ORG_COLOR_PALETTE = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#0ea5e9',
] as const;

const GAP = 8;
const MORE_BUTTON_WIDTH = 96;

type LayoutState = {
  order: OrganizationReadSchema[];
  visibleCount: number;
};

type OrganizationSwitcherBarProps = {
  organizations: OrganizationReadSchema[];
  selectedOrganizationId: string | null;
  onSelectOrganization: (organizationId: string) => void;
};

const GridIcon = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox='0 0 16 16' fill='none'>
    <rect
      x='2'
      y='2'
      width='5'
      height='5'
      rx='1.3'
      stroke={color}
      strokeWidth='1.4'
    />
    <rect
      x='9'
      y='2'
      width='5'
      height='5'
      rx='1.3'
      stroke={color}
      strokeWidth='1.4'
    />
    <rect
      x='2'
      y='9'
      width='5'
      height='5'
      rx='1.3'
      stroke={color}
      strokeWidth='1.4'
    />
    <rect
      x='9'
      y='9'
      width='5'
      height='5'
      rx='1.3'
      stroke={color}
      strokeWidth='1.4'
    />
  </svg>
);

const ChevronIcon = ({
  size = 12,
  color = 'currentColor',
  open = false,
}: {
  size?: number;
  color?: string;
  open?: boolean;
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 16 16'
    fill='none'
    style={{
      transform: open ? 'rotate(180deg)' : 'none',
      transition: 'transform 150ms ease',
    }}
  >
    <path
      d='M4 6l4 4 4-4'
      stroke={color}
      strokeWidth='1.6'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const SearchIcon = ({ size = 15, color = '#94a3b8' }) => (
  <svg width={size} height={size} viewBox='0 0 16 16' fill='none'>
    <circle cx='7' cy='7' r='5' stroke={color} strokeWidth='1.5' />
    <path
      d='M11 11l3 3'
      stroke={color}
      strokeWidth='1.5'
      strokeLinecap='round'
    />
  </svg>
);

const PopoverCheckIcon = ({
  size = 15,
  color = 'currentColor',
}: {
  size?: number;
  color?: string;
}) => (
  <svg width={size} height={size} viewBox='0 0 16 16' fill='none'>
    <path
      d='M3 8.5l3.5 3.5L13 4'
      stroke={color}
      strokeWidth='1.8'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const getProjectsCount = (organization: OrganizationReadSchema): number =>
  organization.projects_count ?? 0;

const isOrganizationVisible = (organization: OrganizationReadSchema): boolean =>
  organization.is_active !== false;

const getInitials = (name: string): string => {
  const tokens = name.trim().split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return '?';
  }

  if (tokens.length === 1) {
    return tokens[0].slice(0, 2).toUpperCase();
  }

  return `${tokens[0][0] ?? ''}${tokens[1][0] ?? ''}`.toUpperCase();
};

const isHexColor = (value: string): boolean =>
  /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);

const expandHexColor = (value: string): string =>
  value.length === 4
    ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
    : value;

const hexToRgb = (
  value: string
): { red: number; green: number; blue: number } | null => {
  if (!isHexColor(value)) {
    return null;
  }

  const normalized = expandHexColor(value);
  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);

  return { red, green, blue };
};

const mixHexColors = (base: string, target: string, ratio: number): string => {
  const baseRgb = hexToRgb(base);
  const targetRgb = hexToRgb(target);

  if (!baseRgb || !targetRgb) {
    return base;
  }

  const mix = (baseChannel: number, targetChannel: number) =>
    Math.round(baseChannel * (1 - ratio) + targetChannel * ratio)
      .toString(16)
      .padStart(2, '0');

  return `#${mix(baseRgb.red, targetRgb.red)}${mix(baseRgb.green, targetRgb.green)}${mix(baseRgb.blue, targetRgb.blue)}`;
};

const getOrganizationColor = (organization: OrganizationReadSchema): string => {
  const possibleColor =
    (
      organization as {
        color?: string | null;
        brand_color?: string | null;
        primary_color?: string | null;
      }
    ).color ??
    (organization as { brand_color?: string | null }).brand_color ??
    (organization as { primary_color?: string | null }).primary_color;

  if (possibleColor && isHexColor(possibleColor)) {
    return possibleColor;
  }

  const seed = `${organization.id ?? organization.name}:${organization.name}`;
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return ORG_COLOR_PALETTE[hash % ORG_COLOR_PALETTE.length];
};

const getMutedOrganizationColor = (color: string): string =>
  mixHexColors(color, '#94a3b8', 0.58);

const getDisplayOrganizationColor = (color: string): string =>
  mixHexColors(color, '#94a3b8', 0.2);

const getActiveOrganizationColor = (color: string): string =>
  mixHexColors(color, '#94a3b8', 0.3);

const getActiveBadgeBackgroundColor = (color: string): string =>
  mixHexColors(color, '#ffffff', 0.84);

const fitCount = (
  widths: number[],
  totalWidth: number,
  reserveMoreButton: boolean
): number => {
  const availableWidth = reserveMoreButton
    ? totalWidth - MORE_BUTTON_WIDTH - GAP
    : totalWidth;

  let usedWidth = 0;
  let count = 0;

  for (let index = 0; index < widths.length; index += 1) {
    const nextWidth = usedWidth + (count > 0 ? GAP : 0) + widths[index];

    if (nextWidth > availableWidth) {
      break;
    }

    usedWidth = nextWidth;
    count += 1;
  }

  return count;
};

export const OrganizationSwitcherBar: React.FC<
  OrganizationSwitcherBarProps
> = ({ organizations, selectedOrganizationId, onSelectOrganization }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const availableOrganizations = useMemo(
    () => organizations.filter(isOrganizationVisible),
    [organizations]
  );
  const [layout, setLayout] = useState<LayoutState>({
    order: availableOrganizations,
    visibleCount: availableOrganizations.length,
  });
  const rowRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const filteredOrganizations = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return availableOrganizations;
    }

    return availableOrganizations.filter(organization =>
      organization.name.toLowerCase().includes(normalizedQuery)
    );
  }, [availableOrganizations, searchQuery]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!popoverRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    const recompute = () => {
      if (!rowRef.current || !measureRef.current) {
        return;
      }

      if (availableOrganizations.length === 0) {
        setLayout({
          order: availableOrganizations,
          visibleCount: 0,
        });
        return;
      }

      const totalWidth = rowRef.current.clientWidth;
      const naturalWidths = Array.from(measureRef.current.children).map(node =>
        Math.ceil((node as HTMLElement).getBoundingClientRect().width)
      );

      const fullWidth =
        naturalWidths.reduce((sum, width) => sum + width, 0) +
        GAP * Math.max(naturalWidths.length - 1, 0);
      const naturalVisibleCount =
        fullWidth <= totalWidth
          ? availableOrganizations.length
          : Math.max(fitCount(naturalWidths, totalWidth, true), 1);
      const selectedIndex = availableOrganizations.findIndex(
        organization => organization.id === selectedOrganizationId
      );
      const selectedVisible =
        selectedIndex >= 0 && selectedIndex < naturalVisibleCount;

      if (selectedIndex === -1 || selectedVisible) {
        setLayout({
          order: availableOrganizations,
          visibleCount: naturalVisibleCount,
        });
        return;
      }

      const selectedOrganization = availableOrganizations[selectedIndex];
      const pinnedOrder = [
        selectedOrganization,
        ...availableOrganizations.filter(
          organization => organization.id !== selectedOrganization.id
        ),
      ];
      const pinnedWidths = [
        naturalWidths[selectedIndex],
        ...naturalWidths.filter((_, index) => index !== selectedIndex),
      ];
      const pinnedVisibleCount = Math.max(
        fitCount(pinnedWidths, totalWidth, true),
        1
      );

      setLayout({
        order: pinnedOrder,
        visibleCount: pinnedVisibleCount,
      });
    };

    recompute();

    const resizeObserver = new ResizeObserver(recompute);
    if (rowRef.current) {
      resizeObserver.observe(rowRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [availableOrganizations, selectedOrganizationId]);

  const visibleOrganizations = layout.order.slice(0, layout.visibleCount);
  const hasHiddenOrganizations = layout.visibleCount < layout.order.length;

  return (
    <OrgBar>
      <OrgBarControls>
        <PillRow ref={rowRef}>
          {visibleOrganizations.map(organization => {
            if (!organization.id) {
              return null;
            }

            const baseOrganizationColor = getOrganizationColor(organization);
            const isActive = organization.id === selectedOrganizationId;
            const organizationColor = isActive
              ? getActiveOrganizationColor(baseOrganizationColor)
              : getDisplayOrganizationColor(baseOrganizationColor);
            const inactiveColor = getMutedOrganizationColor(organizationColor);
            const activeBadgeBackgroundColor =
              getActiveBadgeBackgroundColor(organizationColor);

            return (
              <OrgPill
                key={organization.id}
                type='button'
                active={isActive}
                orgColor={organizationColor}
                inactiveColor={inactiveColor}
                title={organization.name}
                onClick={() => onSelectOrganization(organization.id as string)}
              >
                <OrgLogo
                  active={isActive}
                  orgColor={organizationColor}
                  inactiveColor={inactiveColor}
                >
                  {getInitials(organization.name)}
                </OrgLogo>
                <OrgPillName active={isActive} inactiveColor={inactiveColor}>
                  {organization.name}
                </OrgPillName>
                <CountBadge
                  active={isActive}
                  orgColor={organizationColor}
                  activeBgColor={activeBadgeBackgroundColor}
                  inactiveColor={inactiveColor}
                >
                  {getProjectsCount(organization)}
                </CountBadge>
              </OrgPill>
            );
          })}

          <MeasureLayer ref={measureRef} aria-hidden='true'>
            {availableOrganizations.map(organization => {
              const organizationId = organization.id ?? organization.name;
              const organizationColor = getDisplayOrganizationColor(
                getOrganizationColor(organization)
              );
              const inactiveColor =
                getMutedOrganizationColor(organizationColor);
              const activeBadgeBackgroundColor =
                getActiveBadgeBackgroundColor(organizationColor);
              return (
                <OrgPill
                  key={organizationId}
                  type='button'
                  active={false}
                  orgColor={organizationColor}
                  inactiveColor={inactiveColor}
                  tabIndex={-1}
                >
                  <OrgLogo
                    active={false}
                    orgColor={organizationColor}
                    inactiveColor={inactiveColor}
                  >
                    {getInitials(organization.name)}
                  </OrgLogo>
                  <OrgPillName inactiveColor={inactiveColor}>
                    {organization.name}
                  </OrgPillName>
                  <CountBadge
                    active={false}
                    orgColor={organizationColor}
                    activeBgColor={activeBadgeBackgroundColor}
                    inactiveColor={inactiveColor}
                  >
                    {getProjectsCount(organization)}
                  </CountBadge>
                </OrgPill>
              );
            })}
          </MeasureLayer>
        </PillRow>

        {hasHiddenOrganizations ? (
          <OrgPopoverWrap ref={popoverRef}>
            <AllOrgsButton
              type='button'
              open={isOpen}
              onClick={() => setIsOpen(current => !current)}
            >
              <GridIcon />
              Все
              <CountBadge>{availableOrganizations.length}</CountBadge>
              <ChevronIcon open={isOpen} />
            </AllOrgsButton>

            {isOpen ? (
              <OrgPopover>
                <OrgPopoverSearch>
                  <SearchIcon />
                  <OrgPopoverSearchInput
                    autoFocus
                    placeholder='Поиск организации'
                    value={searchQuery}
                    onChange={event => setSearchQuery(event.target.value)}
                  />
                </OrgPopoverSearch>

                <OrgPopoverList>
                  {filteredOrganizations.length === 0 ? (
                    <OrgPopoverEmpty>Ничего не найдено</OrgPopoverEmpty>
                  ) : (
                    filteredOrganizations.map(organization => {
                      if (!organization.id) {
                        return null;
                      }

                      const baseOrganizationColor =
                        getOrganizationColor(organization);
                      const isActive =
                        organization.id === selectedOrganizationId;
                      const organizationColor = isActive
                        ? getActiveOrganizationColor(baseOrganizationColor)
                        : getDisplayOrganizationColor(baseOrganizationColor);

                      return (
                        <OrgPopoverRow
                          key={organization.id}
                          type='button'
                          active={isActive}
                          orgColor={organizationColor}
                          onClick={() => {
                            onSelectOrganization(organization.id as string);
                            setIsOpen(false);
                          }}
                        >
                          <OrgLogo orgColor={organizationColor} size={30}>
                            {getInitials(organization.name)}
                          </OrgLogo>

                          <OrgPopoverRowText>
                            <OrgPopoverRowName title={organization.name}>
                              {organization.name}
                            </OrgPopoverRowName>
                            <OrgPopoverRowMeta>
                              {getProjectsCount(organization)} проектов
                            </OrgPopoverRowMeta>
                          </OrgPopoverRowText>

                          {isActive ? (
                            <PopoverCheckIcon color={organizationColor} />
                          ) : null}
                        </OrgPopoverRow>
                      );
                    })
                  )}
                </OrgPopoverList>
              </OrgPopover>
            ) : null}
          </OrgPopoverWrap>
        ) : null}
      </OrgBarControls>
    </OrgBar>
  );
};

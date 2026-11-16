import { useMemo, useRef } from 'react';

/**
 * Выпадающие списки Clean Minimal. Меню открывается вниз, а если до нижней
 * границы (футера модалки) места не хватает — вверх; высота меню ограничена
 * свободным местом, но не больше 240px.
 *
 * Границу задаёт ближайший предок с атрибутом `data-cm-dropdown-boundary`
 * (обычно корень шага модалки — его низ совпадает с верхом футера). Без него
 * граница — окно браузера.
 */
export const DROPDOWN_BOUNDARY_ATTRIBUTE = 'data-cm-dropdown-boundary';
export const dropdownBoundaryProps = {
  [DROPDOWN_BOUNDARY_ATTRIBUTE]: 'true',
} as const;

export const DROPDOWN_MAX_HEIGHT = 240;
export const MENU_OFFSET = 4;
export const EDGE_GAP = 8;
const OPTION_HEIGHT = 31;
const MENU_CHROME = 10;
const MIN_MENU_HEIGHT = 72;

export type DropdownPlacement = {
  side: 'bottom' | 'top';
  maxHeight: number;
};

const DEFAULT_PLACEMENT: DropdownPlacement = {
  side: 'bottom',
  maxHeight: DROPDOWN_MAX_HEIGHT,
};

export const estimateDropdownHeight = (optionCount: number) =>
  optionCount * OPTION_HEIGHT + MENU_CHROME;

/** Куда открыть меню у `anchor` и какой высоты оно может быть. */
export const getDropdownPlacement = (
  anchor: HTMLElement,
  contentHeight: number
): DropdownPlacement => {
  const rect = anchor.getBoundingClientRect();
  const boundary = anchor
    .closest(`[${DROPDOWN_BOUNDARY_ATTRIBUTE}]`)
    ?.getBoundingClientRect();
  const top = boundary?.top ?? 0;
  const bottom = boundary?.bottom ?? window.innerHeight;
  const below = bottom - rect.bottom - MENU_OFFSET - EDGE_GAP;
  const above = rect.top - top - MENU_OFFSET - EDGE_GAP;
  const needed = Math.min(DROPDOWN_MAX_HEIGHT, contentHeight);
  const side = below >= needed || below >= above ? 'bottom' : 'top';
  const space = side === 'bottom' ? below : above;
  return {
    side,
    maxHeight: Math.max(
      Math.min(MIN_MENU_HEIGHT, contentHeight),
      Math.min(DROPDOWN_MAX_HEIGHT, space)
    ),
  };
};

/**
 * Расположение меню, пересчитываемое при каждом открытии. После закрытия
 * меню ещё доигрывает анимацию — держим последнее расположение, иначе
 * раскрытое вверх меню на исчезновении прыгает вниз.
 */
export const useDropdownPlacement = (
  anchorEl: HTMLElement | null,
  open: boolean,
  contentHeight: number
): DropdownPlacement => {
  const lastPlacementRef = useRef<DropdownPlacement>(DEFAULT_PLACEMENT);
  const placement = useMemo(
    () =>
      open && anchorEl ? getDropdownPlacement(anchorEl, contentHeight) : null,
    [anchorEl, contentHeight, open]
  );
  if (placement) lastPlacementRef.current = placement;
  return placement ?? lastPlacementRef.current;
};

/**
 * Ширина меню: фиксированная или как у якоря. Якорь обычно сбрасывают
 * в `null` при закрытии, а меню ещё доигрывает анимацию — держим последнюю
 * ширину якоря, иначе меню на исчезновении сужается по содержимому.
 */
export const useDropdownWidth = (
  anchorEl: HTMLElement | null,
  width: number | 'anchor'
): number => {
  const lastAnchorWidthRef = useRef(0);
  if (width !== 'anchor') return width;
  const anchorWidth = anchorEl?.getBoundingClientRect().width ?? 0;
  if (anchorWidth) lastAnchorWidthRef.current = anchorWidth;
  return lastAnchorWidthRef.current;
};

/** Пропсы MUI Menu/Popover, раскрывающие меню вверх или вниз от якоря. */
export const getDropdownMenuOrigin = (
  placement: DropdownPlacement,
  align: 'start' | 'end'
) => {
  const horizontal = align === 'end' ? 'right' : 'left';
  return {
    anchorOrigin: {
      vertical: placement.side === 'top' ? 'top' : 'bottom',
      horizontal,
    },
    transformOrigin: {
      vertical: placement.side === 'top' ? 'bottom' : 'top',
      horizontal,
    },
  } as const;
};

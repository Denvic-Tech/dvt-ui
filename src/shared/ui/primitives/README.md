# DVT UI Primitives

Единый слой примитивов на базе `@mui/material` для DVT UI.

## Зачем

- Убрать размазанные `sx`, `styled`, `PaperProps` и локальные style overrides.
- Дать один набор дефолтов для форм, оверлеев, статусов и action controls.
- Упростить использование `MUI -> DVT UI` без новой россыпи ad-hoc компонентов.
- Сделать `src/shared/theme.ts` первичным источником визуальных решений для примитивов.

## Где лежит публичный API

- Импортировать из `@/shared/ui/primitives`.
- Базовые реализации лежат в `@/shared/ui/primitives/components/*`.
- Основные визуальные дефолты задаются через `src/shared/theme.ts`.
- `src/index.css` оставлен как bridge-слой для Tailwind tokens, gradients и ограниченного числа CSS variables.

## Что найдено в репозитории

Аудит по JSX и импортам показывает, что основные MUI-примитивы используются так:

| MUI primitive | Usage count | Typical pattern | DVT replacement |
| --- | ---: | --- | --- |
| `TextField` | 111 | `fullWidth`, `size='small'`, `label`, `helperText`, `error` | `Field` + `Input` / `Textarea` |
| `Alert` | 86 | `severity='error/info/warning'`, иногда `variant='outlined'` | `Alert` |
| `Chip` | 85 | `size='small'`, `variant='outlined'`, `color=*`, иногда `onDelete` | `Chip`, `Badge` |
| `MenuItem` | 82 | dropdown actions / select options | `DropdownMenuItem`, `Select` with `options` |
| `Button` | 79 | `outlined`, `contained`, `text`, часто `size='small'` | `Button` |
| `Tooltip` | 69 | `title`, `placement`, `arrow` | `Tooltip` |
| `IconButton` | 65 | `size='small'`, icon-only actions | `IconButton` |
| `FormControl` + `Select` | 27 / 26 | `fullWidth`, `size='small'`, `label`, `helperText` | `Field` + `Select` |
| `Switch` | 15 | чаще в `FormControlLabel` | `Switch` + `Field` |
| `Dialog*` | 10-14 | `open`, `onClose`, `fullWidth`, `maxWidth='sm'` | `Dialog` + `DialogHeader/DialogContent/DialogFooter` |
| `Autocomplete` | 13 | single/multi select with search | `Combobox` |
| `Checkbox` | 11 | compact selection toggles | `Checkbox` |
| `Table*` | 12-12 | dense data tables | `Table*` |
| `Tabs` / `Tab` | 1 / 1 | horizontal switcher | `Tabs*` |
| `Radio` / `RadioGroup` | 4 / 2 | small option groups | `RadioGroup*` |
| `Drawer` | 2 | side panels | `Sheet*` |
| `DateTimePicker` | 3 | compact datetime input, UTC semantics | `DateTimeField` |
| `Skeleton` | 5 | placeholder loading blocks | `Skeleton` |
| `CircularProgress` | 28 imports | loading indicator in buttons/blocks | `Spinner` |

Отдельно:

- `Box`, `Stack`, `Typography`, `Paper`, `Divider` в основном используются как layout/containers.
- Для новых экранов вместо них лучше использовать обычные `div/section/header` + Tailwind utilities.
- Для surface/container-кейсов уже достаточно `Card`, `Separator`, `Field` и `Sheet/Dialog`.
- `DataGrid`, `SimpleTreeView`, `TreeItem`, `LocalizationProvider`, `AdapterDayjs` найдены в аудите, но это не базовые примитивы. Их стоит выносить в отдельные специализированные widgets/slices, а не смешивать с базовым UI-kit.

## Правила использования

- Формы: сначала `Field`, внутри `Input`, `Textarea`, `Select`, `Combobox`, `DateTimeField`.
- Иконки-действия: `IconButton`, а не отдельные `button` с ручной рамкой.
- Теги/статусы: `Chip` для интерактивных pill-элементов, `Badge` для компактных статусов.
- Модалки: `Dialog`; боковые панели: `Sheet`.
- Контекстные меню и action menus: `DropdownMenu`.
- Хинты: `Tooltip`, а не произвольные `title` / самописные popover-обвязки.
- Не использовать trigger/content/value compound API в стиле Radix/shadcn. Для `Dialog`, `Sheet`, `Popover`, `DropdownMenu` и `Select` состояние/anchor/placeholder задаются явно через props.

## Минимальная карта миграции

```tsx
// Было
<TextField
  label='Email'
  value={email}
  onChange={handleChange}
  error={Boolean(error)}
  helperText={error}
  fullWidth
  size='small'
/>

// Стало
<Field label='Email' error={error}>
  <Input value={email} onChange={handleChange} />
</Field>
```

```tsx
// Было
<FormControl fullWidth>
  <InputLabel id='role-label'>Role</InputLabel>
  <Select labelId='role-label' value={role} onChange={...}>
    <MenuItem value='admin'>Admin</MenuItem>
  </Select>
</FormControl>

// Стало
<Field label='Role'>
  <Select
    options={[{ label: 'Admin', value: 'admin' }]}
    placeholder='Select role'
    value={role}
    onValueChange={setRole}
  />
</Field>
```

## Как обновлять аудит

Использовать:

```bash
node ./scripts/audit-mui-primitives.mjs
```

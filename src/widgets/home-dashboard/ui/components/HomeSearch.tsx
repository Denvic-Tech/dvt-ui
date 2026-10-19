import * as React from 'react';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { Box, InputBase } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Direct import: the feature barrel would pull the whole projects page.
import { ProjectsSourceSearchDialog } from '@/features/projects/users-projects/ui/ProjectsSourceSearchDialog';

import type { ProjectReadSchema } from '@/shared/gatewayClient';

import { useProjectSearch } from '../../model/useProjectSearch';
import type { HomeSection } from '../config/sections';
import { useDismiss } from '../lib/useDismiss';
import { homePopAppearSx } from '../styles/motion';
import {
  hc,
  homeCaptionSx,
  homeEllipsisSx,
  homePopoverSx,
} from '../styles/tokens';

/** Same glyph as the «search by source» action on /projects. */
const DatabaseIcon = () => (
  <svg
    width='15'
    height='15'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden
  >
    <ellipse cx='12' cy='5.5' rx='7.5' ry='2.8' />
    <path d='M4.5 5.5v13c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-13M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8' />
  </svg>
);

const RECENT_SUGGESTIONS = 3;
const SECTION_SUGGESTIONS = 4;
const SEARCH_SUGGESTIONS = 5;
const SEARCH_OPTIONS = { limit: SEARCH_SUGGESTIONS };

type SearchResult =
  | { kind: 'project'; project: ProjectReadSchema }
  | { kind: 'source'; query: string }
  | { kind: 'section'; section: HomeSection };

type HomeSearchProps = {
  onPickSection: (section: HomeSection) => void;
  recentProjects: ProjectReadSchema[];
  sections: HomeSection[];
};

export const HomeSearch = ({
  onPickSection,
  recentProjects,
  sections,
}: HomeSearchProps) => {
  const navigate = useNavigate();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  // Query of the open «search by source» dialog; `null` while it is closed.
  const [sourceQuery, setSourceQuery] = React.useState<string | null>(null);
  const search = useProjectSearch(query, SEARCH_OPTIONS);
  const normalizedQuery = query.trim().toLowerCase();

  useDismiss(open, [wrapperRef], () => setOpen(false));

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const projectResults = normalizedQuery
    ? search.results
    : recentProjects.slice(0, RECENT_SUGGESTIONS);
  const sectionResults = normalizedQuery
    ? sections
        .filter(
          section =>
            !section.soon &&
            section.to &&
            section.label.toLowerCase().includes(normalizedQuery)
        )
        .slice(0, SECTION_SUGGESTIONS)
    : [];
  const trimmedQuery = query.trim();
  // Same action as on /projects: look the query up in data sources (tables,
  // files) and list the projects that use them. Shown after the projects.
  const sourceResult: SearchResult | null = trimmedQuery
    ? { kind: 'source', query: trimmedQuery }
    : null;
  const results: SearchResult[] = [
    ...projectResults.map(project => ({ kind: 'project' as const, project })),
    ...(sourceResult ? [sourceResult] : []),
    ...sectionResults.map(section => ({ kind: 'section' as const, section })),
  ];
  const sourceIndex = projectResults.length;
  const sectionsOffset = projectResults.length + (sourceResult ? 1 : 0);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [normalizedQuery, search.results]);

  const openResult = (result: SearchResult) => {
    setOpen(false);
    inputRef.current?.blur();

    if (result.kind === 'project') {
      navigate(`/project-editor/${result.project.id}`);
      return;
    }

    if (result.kind === 'source') {
      setSourceQuery(result.query);
      return;
    }

    onPickSection(result.section);
    if (result.section.to) {
      navigate(result.section.to);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      if (results.length) {
        const step = event.key === 'ArrowDown' ? 1 : -1;
        setActiveIndex(
          current => (current + step + results.length) % results.length
        );
      }
      return;
    }

    if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault();
      openResult(results[activeIndex]);
      return;
    }

    if (event.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const projectsEmptyText = !normalizedQuery
    ? 'Проектов пока нет'
    : search.loading
      ? 'Ищем…'
      : search.failed
        ? 'Поиск по проектам сейчас недоступен'
        : 'Ничего не найдено';

  return (
    <Box
      ref={wrapperRef}
      sx={{
        position: 'relative',
        flex: '1 1 340px',
        maxWidth: { xs: 'none', md: 440 },
      }}
    >
      <Box
        component='label'
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          height: 38,
          pl: 1.5,
          pr: 1.25,
          borderRadius: '10px',
          backgroundColor: hc.card,
          border: `1px solid ${open ? hc.brandFocus : hc.line}`,
          boxShadow: open ? `0 0 0 4px ${hc.brandSoft}` : 'none',
          cursor: 'text',
          transition: 'border-color .15s, box-shadow .15s',
        }}
      >
        <SearchRoundedIcon sx={{ fontSize: 18, color: hc.ink3 }} />
        <InputBase
          inputRef={inputRef}
          value={query}
          onChange={event => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder='Проект, раздел или поиск по источнику'
          inputProps={{
            'aria-label': 'Поиск по проектам, разделам и источникам данных',
            'aria-expanded': open,
            role: 'combobox',
          }}
          sx={{
            flex: 1,
            minWidth: 0,
            fontSize: 13.5,
            color: hc.ink,
            '& input': { p: 0, height: 'auto' },
            '& input::placeholder': { color: hc.ink3, opacity: 1 },
          }}
        />
      </Box>

      {open ? (
        <Box
          role='listbox'
          sx={{
            ...homePopoverSx,
            ...homePopAppearSx,
            position: 'absolute',
            zIndex: 20,
            left: 0,
            right: 0,
            top: 44,
            p: 0.75,
          }}
        >
          <Box sx={homeCaptionSx}>
            {normalizedQuery ? 'Проекты' : 'Недавние'}
          </Box>
          {projectResults.length ? (
            projectResults.map((project, index) => (
              <SearchRow
                key={project.id}
                active={activeIndex === index}
                icon={<FolderOutlinedIcon sx={{ fontSize: 15 }} />}
                label={project.name}
                onHover={() => setActiveIndex(index)}
                onSelect={() => openResult({ kind: 'project', project })}
              />
            ))
          ) : (
            <Box
              sx={{
                px: 1.25,
                pt: 0.75,
                pb: 1.25,
                fontSize: 12.5,
                color: hc.ink3,
              }}
            >
              {projectsEmptyText}
            </Box>
          )}
          {sourceResult ? (
            <>
              <Box sx={homeCaptionSx}>Источники</Box>
              <SearchRow
                active={activeIndex === sourceIndex}
                icon={<DatabaseIcon />}
                label={
                  <>
                    Найти проекты по источнику{' '}
                    <Box component='span' sx={{ color: hc.brand }}>
                      «{trimmedQuery}»
                    </Box>
                  </>
                }
                title={`Найти проекты по источнику «${trimmedQuery}»`}
                onHover={() => setActiveIndex(sourceIndex)}
                onSelect={() => openResult(sourceResult)}
              />
            </>
          ) : null}
          {sectionResults.length ? (
            <>
              <Box sx={homeCaptionSx}>Разделы</Box>
              {sectionResults.map((section, index) => {
                const resultIndex = sectionsOffset + index;
                const Icon = section.icon;

                return (
                  <SearchRow
                    key={section.id}
                    active={activeIndex === resultIndex}
                    icon={<Icon sx={{ fontSize: 15 }} />}
                    label={section.label}
                    meta={section.group}
                    onHover={() => setActiveIndex(resultIndex)}
                    onSelect={() => openResult({ kind: 'section', section })}
                  />
                );
              })}
            </>
          ) : null}
        </Box>
      ) : null}

      <ProjectsSourceSearchDialog
        open={sourceQuery != null}
        initialQuery={sourceQuery ?? ''}
        onClose={() => setSourceQuery(null)}
        onOpenProject={projectId => {
          setSourceQuery(null);
          navigate(`/project-editor/${projectId}`);
        }}
      />
    </Box>
  );
};

type SearchRowProps = {
  active: boolean;
  icon: React.ReactNode;
  label: React.ReactNode;
  meta?: string | undefined;
  onHover: () => void;
  onSelect: () => void;
  title?: string;
};

const SearchRow = ({
  active,
  icon,
  label,
  meta,
  onHover,
  onSelect,
  title,
}: SearchRowProps) => (
  <Box
    role='option'
    aria-selected={active}
    onMouseDown={event => event.preventDefault()}
    onMouseEnter={onHover}
    onClick={onSelect}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.25,
      px: 1.25,
      py: '7px',
      borderRadius: '9px',
      fontSize: 13,
      color: hc.ink,
      cursor: 'pointer',
      backgroundColor: active ? hc.brandHover : 'transparent',
      transition: 'background-color .14s',
      '& svg': { color: hc.ink3, flexShrink: 0 },
    }}
  >
    {icon}
    <Box
      component='span'
      title={title ?? (typeof label === 'string' ? label : undefined)}
      sx={{
        ...homeEllipsisSx,
        minWidth: 0,
      }}
    >
      {label}
    </Box>
    {meta ? (
      <Box
        component='span'
        sx={{
          ml: 'auto',
          pl: 1,
          fontSize: 11.5,
          color: hc.ink3,
          flexShrink: 0,
        }}
      >
        {meta}
      </Box>
    ) : null}
  </Box>
);

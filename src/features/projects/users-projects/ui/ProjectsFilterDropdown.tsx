import React from 'react';

import type { OrganizationReadSchema } from '@/shared/gatewayClient';

import {
  ActiveFilterBadge,
  ChevronIcon,
  DropdownHeader,
  DropdownTitle,
  FilterBadge,
  FilterCheckbox,
  FilterDropdown,
  FilterRoot,
  FilterSection,
  FilterSectionContent,
  FilterSectionHeader,
  FilterSectionIcon,
  FilterSectionLabel,
  FilterSectionMeta,
  FilterSectionName,
  FilterSections,
  FilterTrigger,
  FilterTriggerLabel,
  OptionItem,
  OptionLabel,
  OptionsList,
  ResetButton,
  SearchInput,
  SearchInputField,
  TriggerSpacer,
} from './ProjectsFilterDropdown.styles';

type ProjectsFilterDropdownProps = {
  organizations: OrganizationReadSchema[];
  selectedOrgIds: string[];
  onOrgChange: (orgIds: string[]) => void;
  onReset: () => void;
};

const FilterIcon = () => (
  <svg
    width='16'
    height='16'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <path d='M22 3H2l8 9.46V19l4 2v-8.54L22 3z' />
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    width='16'
    height='16'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <path d='M6 9l6 6 6-6' />
  </svg>
);

const BuildingIcon = () => (
  <svg
    width='16'
    height='16'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <path d='M3 21h18M5 21V7l8-4v18M19 21V11l-6-4' />
  </svg>
);

const SearchIcon = () => (
  <svg
    width='14'
    height='14'
    viewBox='0 0 24 24'
    fill='none'
    stroke='#94a3b8'
    strokeWidth='2'
  >
    <circle cx='11' cy='11' r='8' />
    <path d='M21 21l-4.35-4.35' />
  </svg>
);

const CheckmarkIcon = () => (
  <svg
    width='10'
    height='10'
    viewBox='0 0 24 24'
    fill='none'
    stroke='white'
    strokeWidth='3'
  >
    <path d='M20 6L9 17l-5-5' />
  </svg>
);

export const ProjectsFilterDropdown: React.FC<ProjectsFilterDropdownProps> = ({
  organizations,
  selectedOrgIds,
  onOrgChange,
  onReset,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [expandedSection, setExpandedSection] = React.useState<'org'>('org');
  const [searchQuery, setSearchQuery] = React.useState('');
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);

  const hasActiveFilters = selectedOrgIds.length > 0;
  const activeFiltersCount = selectedOrgIds.length;

  const selectedOrganizations = React.useMemo(
    () =>
      organizations.filter(
        org => org.id != null && selectedOrgIds.includes(org.id)
      ),
    [organizations, selectedOrgIds]
  );

  const filteredOrganizations = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return organizations.filter(org => {
      if (!org.id) {
        return false;
      }

      if (!query) {
        return true;
      }

      return org.name.toLowerCase().includes(query);
    });
  }, [organizations, searchQuery]);

  React.useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggleSection = (section: 'org') => {
    setExpandedSection(current => (current === section ? current : section));
  };

  const selectedOrganizationsLabel = React.useMemo(() => {
    if (selectedOrganizations.length === 0) {
      return null;
    }

    if (selectedOrganizations.length === 1) {
      return selectedOrganizations[0].name;
    }

    return `${selectedOrganizations.length} выбрано`;
  }, [selectedOrganizations]);

  const handleAllOrganizationsSelect = () => {
    onOrgChange([]);
  };

  const handleOrganizationToggle = (organizationId: string) => {
    if (selectedOrgIds.includes(organizationId)) {
      onOrgChange(selectedOrgIds.filter(id => id !== organizationId));
      return;
    }

    onOrgChange([...selectedOrgIds, organizationId]);
  };

  return (
    <FilterRoot ref={dropdownRef}>
      <FilterTrigger
        type='button'
        hasActiveFilters={hasActiveFilters}
        onClick={() => setIsOpen(current => !current)}
      >
        <FilterIcon />
        <FilterTriggerLabel>Фильтры</FilterTriggerLabel>
        {activeFiltersCount > 0 ? (
          <FilterBadge>{activeFiltersCount}</FilterBadge>
        ) : null}
        <TriggerSpacer />
        <ChevronIcon isExpanded={isOpen}>
          <ChevronDownIcon />
        </ChevronIcon>
      </FilterTrigger>

      {isOpen ? (
        <FilterDropdown>
          <DropdownHeader>
            <DropdownTitle>Фильтры</DropdownTitle>
            <ResetButton
              type='button'
              onClick={onReset}
              disabled={!hasActiveFilters}
            >
              Сбросить все
            </ResetButton>
          </DropdownHeader>

          <FilterSections>
            <FilterSection>
              <FilterSectionHeader
                type='button'
                isExpanded={expandedSection === 'org'}
                onClick={() => handleToggleSection('org')}
              >
                <FilterSectionLabel>
                  <FilterSectionIcon>
                    <BuildingIcon />
                  </FilterSectionIcon>
                  <FilterSectionName>Организация</FilterSectionName>
                </FilterSectionLabel>
                <FilterSectionMeta>
                  {selectedOrganizationsLabel ? (
                    <ActiveFilterBadge>
                      {selectedOrganizationsLabel}
                    </ActiveFilterBadge>
                  ) : null}
                  <ChevronIcon isExpanded={expandedSection === 'org'}>
                    <ChevronDownIcon />
                  </ChevronIcon>
                </FilterSectionMeta>
              </FilterSectionHeader>

              {expandedSection === 'org' ? (
                <FilterSectionContent>
                  <SearchInput>
                    <SearchIcon />
                    <SearchInputField
                      placeholder='Поиск...'
                      value={searchQuery}
                      onChange={event => setSearchQuery(event.target.value)}
                    />
                  </SearchInput>

                  <OptionsList>
                    <OptionItem
                      type='button'
                      isSelected={!hasActiveFilters}
                      onClick={handleAllOrganizationsSelect}
                    >
                      <FilterCheckbox isChecked={!hasActiveFilters}>
                        {!hasActiveFilters ? <CheckmarkIcon /> : null}
                      </FilterCheckbox>
                      <OptionLabel>Все организации</OptionLabel>
                    </OptionItem>

                    {filteredOrganizations.map(organization => (
                      <OptionItem
                        key={organization.id}
                        type='button'
                        isSelected={selectedOrgIds.includes(
                          organization.id as string
                        )}
                        onClick={() =>
                          handleOrganizationToggle(organization.id as string)
                        }
                      >
                        <FilterCheckbox
                          isChecked={selectedOrgIds.includes(
                            organization.id as string
                          )}
                        >
                          {selectedOrgIds.includes(organization.id as string) ? (
                            <CheckmarkIcon />
                          ) : null}
                        </FilterCheckbox>
                        <OptionLabel>{organization.name}</OptionLabel>
                      </OptionItem>
                    ))}
                  </OptionsList>
                </FilterSectionContent>
              ) : null}
            </FilterSection>

          </FilterSections>
        </FilterDropdown>
      ) : null}
    </FilterRoot>
  );
};

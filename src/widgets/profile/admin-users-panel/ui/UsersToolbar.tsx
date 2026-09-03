import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

import type { UsersToolbarProps } from '../model/types';
import {
  SearchButton,
  SearchClearButton,
  SearchIcon,
  SearchInput,
  SearchInputWrapper,
  SearchSection,
  SearchSectionContent,
} from './styles';

export const UsersToolbar = ({
  onApplySearch,
  onClearSearch,
  searchInput,
  setSearchInput,
}: UsersToolbarProps) => (
  <SearchSection>
    <SearchSectionContent>
      <SearchInputWrapper>
        <SearchIcon>
          <SearchRoundedIcon />
        </SearchIcon>
        <SearchInput
          placeholder='Поиск по email...'
          value={searchInput}
          onChange={event => setSearchInput(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onApplySearch();
            }
          }}
        />
        {searchInput ? (
          <SearchClearButton type='button' onClick={onClearSearch}>
            <CloseRoundedIcon />
          </SearchClearButton>
        ) : null}
      </SearchInputWrapper>

      <SearchButton type='button' onClick={onApplySearch}>
        <SearchRoundedIcon />
        Search
      </SearchButton>
    </SearchSectionContent>
  </SearchSection>
);

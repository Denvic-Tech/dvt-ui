import {
  SettingsActions,
  SettingsSaveButton,
  SettingsSavedNote,
} from './styles';

const SavedIcon = () => (
  <svg width='14' height='14' viewBox='0 0 16 16' fill='none' aria-hidden>
    <path
      d='M3.5 8.5l3 3 6-7'
      stroke='#1E9E63'
      strokeWidth='1.8'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

type SettingsSaveRowProps = {
  // The values differ from the loaded ones.
  isDirty: boolean;
  isSaving: boolean;
  showSaved: boolean;
  className?: string;
};

// «Сохранить» on the left under the fields, «Сохранено» next to it for a while
// after a save.
export const SettingsSaveRow = ({
  isDirty,
  isSaving,
  showSaved,
  className,
}: SettingsSaveRowProps) => (
  <SettingsActions className={className}>
    <SettingsSaveButton
      disableRipple
      type='submit'
      disabled={!isDirty || isSaving}
    >
      {isSaving ? 'Сохранение…' : 'Сохранить'}
    </SettingsSaveButton>
    {showSaved && !isDirty ? (
      <SettingsSavedNote role='status'>
        <SavedIcon />
        Сохранено
      </SettingsSavedNote>
    ) : null}
  </SettingsActions>
);

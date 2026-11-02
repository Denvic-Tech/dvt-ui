export {
  PROFILE_SECTION_PATHS,
  profileSectionGroups,
  type ProfileSectionPath,
  profileSections,
} from './model/profileSections.ts';
export {
  canAccessProfilePath,
  canAccessProfileSection,
  DEFAULT_PROFILE_SECTION_PATH,
  getAvailableProfileSectionGroups,
  getAvailableProfileSections,
  getProfileSectionByPath,
  resolveProfileEntryPath,
} from '@/features/profile/user-profile-navigation/model/helpers.ts';
export type {
  ProfileNavigationRole,
  ProfileSectionConfig,
  ProfileSectionGroup,
  ProfileSectionGroupConfig,
  ProfileSectionGroupId,
  ProfileSectionRoleRequirement,
} from '@/features/profile/user-profile-navigation/model/types.ts';

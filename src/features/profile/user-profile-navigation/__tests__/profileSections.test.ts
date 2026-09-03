import { describe, expect, it } from 'vitest';

import {
  canAccessProfilePath,
  canAccessProfileSection,
  getAvailableProfileSectionGroups,
  getAvailableProfileSections,
  getProfileSectionByPath,
  PROFILE_SECTION_PATHS,
} from '@/features/profile/user-profile-navigation';

describe('features/user-profile-navigation', () => {
  it('allows public sections for regular users', () => {
    const items = getAvailableProfileSections('user');

    expect(items.map(item => item.to)).toEqual([
      PROFILE_SECTION_PATHS.preferences,
      PROFILE_SECTION_PATHS.apiKeys,
    ]);
  });

  it('builds grouped navigation without changing role-based access', () => {
    expect(getAvailableProfileSectionGroups('user')).toEqual([
      {
        id: 'general',
        label: 'Основное',
        items: [
          expect.objectContaining({
            to: PROFILE_SECTION_PATHS.preferences,
            group: 'general',
          }),
          expect.objectContaining({
            to: PROFILE_SECTION_PATHS.apiKeys,
            group: 'general',
          }),
        ],
      },
    ]);
    expect(
      getAvailableProfileSectionGroups('superadmin').map(group => group.id)
    ).toEqual(['general', 'admin', 'system']);
  });

  it('allows admin sections for admin and superadmin roles', () => {
    expect(canAccessProfilePath('admin', PROFILE_SECTION_PATHS.admin)).toBe(
      true
    );
    expect(
      canAccessProfilePath('superadmin', PROFILE_SECTION_PATHS.organizations)
    ).toBe(true);
    expect(
      canAccessProfilePath('admin', PROFILE_SECTION_PATHS.organizations)
    ).toBe(false);
    expect(
      canAccessProfilePath('superadmin', PROFILE_SECTION_PATHS.services)
    ).toBe(true);
    expect(
      canAccessProfilePath('superadmin', PROFILE_SECTION_PATHS.update)
    ).toBe(true);
    expect(canAccessProfilePath('admin', PROFILE_SECTION_PATHS.update)).toBe(
      false
    );
    expect(canAccessProfilePath('user', PROFILE_SECTION_PATHS.update)).toBe(
      false
    );
    expect(
      canAccessProfilePath('user', PROFILE_SECTION_PATHS.appSettings)
    ).toBe(false);
    expect(
      canAccessProfilePath('superadmin', PROFILE_SECTION_PATHS.appSettings)
    ).toBe(true);
    expect(
      canAccessProfilePath('superadmin', '/profile/app-settings/runtime')
    ).toBe(true);
    expect(canAccessProfilePath('superadmin', '/profile/app-config')).toBe(
      true
    );
    expect(canAccessProfilePath(null, PROFILE_SECTION_PATHS.admin)).toBe(false);
  });

  it('keeps path-based lookup synchronized with section access rules', () => {
    const adminSection = getProfileSectionByPath(PROFILE_SECTION_PATHS.admin);
    const scheduleSection = getProfileSectionByPath(
      PROFILE_SECTION_PATHS.schedule
    );

    expect(adminSection).not.toBeNull();
    expect(scheduleSection).not.toBeNull();
    expect(
      adminSection != null && canAccessProfileSection('admin', adminSection)
    ).toBe(true);
    expect(
      adminSection != null && canAccessProfileSection('user', adminSection)
    ).toBe(false);
    expect(
      getProfileSectionByPath(PROFILE_SECTION_PATHS.organizations)
    ).not.toBeNull();
    expect(
      scheduleSection != null &&
        canAccessProfileSection(undefined, scheduleSection)
    ).toBe(false);
    expect(canAccessProfilePath('admin', '/profile/unknown')).toBe(false);
  });
});

import { z } from 'zod';

export const LanguageOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export type LanguageOption = z.infer<typeof LanguageOptionSchema>;

export const LanguageStateSchema = z.object({
  current: LanguageOptionSchema,
  options: z.array(LanguageOptionSchema),
});

export type LanguageState = z.infer<typeof LanguageStateSchema>;

export type LanguageContextValue = {
  language: LanguageOption;
  setLanguage: (language: LanguageOption) => void;
  languageOptions: LanguageOption[];
};


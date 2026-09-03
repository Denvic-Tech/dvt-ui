import { z } from 'zod';

import {
  IOConnectionRequiredTypeSchema,
  IOHasWidgetTypeSchema,
  IOPrimitiveTypeSchema,
} from './schemas';

export type IOPrimitiveType = z.infer<typeof IOPrimitiveTypeSchema>;

export type IOConnectionRequiredType = z.infer<
  typeof IOConnectionRequiredTypeSchema
>;

export type IOHasWidgetType = z.infer<typeof IOHasWidgetTypeSchema>;

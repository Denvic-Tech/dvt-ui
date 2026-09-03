import {
  IOConnectionRequiredTypeSchema,
  IOHasWidgetTypeSchema,
  IOPrimitiveTypeSchema,
} from './schemas';

export const PRIMITIVE_TYPES = IOPrimitiveTypeSchema.options;
export const CONNECTION_REQUIRED_TYPES = IOConnectionRequiredTypeSchema.options;
export const HAS_WIDGET_TYPES = IOHasWidgetTypeSchema.options;

import { OperationResult } from '@/shared/types/common';

export function handleCommandError(
  error: unknown,
  defaultMessage: string
): OperationResult<never> {
  console.error(defaultMessage, error);
  return {
    success: false,
    error: defaultMessage,
  };
}

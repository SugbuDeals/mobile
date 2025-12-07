import { useState, useCallback } from "react";

export interface UseFormSubmissionReturn {
  isSubmitting: boolean;
  error: string | null;
  submit: <T>(asyncFn: () => Promise<T>) => Promise<T | null>;
  reset: () => void;
  setError: (error: string | null) => void;
}

/**
 * Hook for managing form submission state
 * Handles loading, error, and submission logic
 * @returns Form submission state and control functions
 */
export function useFormSubmission(): UseFormSubmissionReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async <T,>(asyncFn: () => Promise<T>): Promise<T | null> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await asyncFn();
      setIsSubmitting(false);
      return result;
    } catch (err: any) {
      const errorMessage =
        err?.message || err?.payload?.message || "An error occurred";
      setError(errorMessage);
      setIsSubmitting(false);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setIsSubmitting(false);
    setError(null);
  }, []);

  return {
    isSubmitting,
    error,
    submit,
    reset,
    setError,
  };
}


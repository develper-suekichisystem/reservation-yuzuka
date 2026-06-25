import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  withLoading: (fn: () => Promise<void>) => Promise<void>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  const withLoading = async (fn: () => Promise<void>) => {
    setIsLoading(true);
    try {
      await fn();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoadingContext.Provider value={{ isLoading, withLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
}

import { createContext, useContext } from 'react';

export interface PageScrollLock {
  lock: () => void;
  unlock: () => void;
}

const noopLock: PageScrollLock = {
  lock: () => undefined,
  unlock: () => undefined,
};

export const PageScrollLockContext = createContext<PageScrollLock>(noopLock);

export function usePageScrollLock() {
  return useContext(PageScrollLockContext);
}

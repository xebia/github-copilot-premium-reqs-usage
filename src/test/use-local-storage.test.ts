import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../hooks/useLocalStorage';

// Some test environments provide a non-standard localStorage (e.g., no .clear()).
// Use a simple in-memory mock for predictable behaviour.
function createLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
}

describe('useLocalStorage', () => {
  let storageMock: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    storageMock = createLocalStorageMock();
    vi.stubGlobal('localStorage', storageMock);
  });

  it('should return the initial value when no value is stored', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('should return the stored value when one exists', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'));
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('stored-value');
  });

  it('should update the stored value when setValue is called', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    act(() => {
      result.current[1]('updated');
    });
    expect(result.current[0]).toBe('updated');
    expect(JSON.parse(localStorage.getItem('test-key')!)).toBe('updated');
  });

  it('should delete the stored value and reset to initial when deleteValue is called', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    act(() => {
      result.current[1]('stored');
    });
    expect(result.current[0]).toBe('stored');

    act(() => {
      result.current[2](); // deleteValue
    });
    // State resets to initialValue; the useEffect then re-syncs it to localStorage
    expect(result.current[0]).toBe('initial');
  });

  it('should handle object values', () => {
    const initial = { count: 0 };
    const { result } = renderHook(() => useLocalStorage('test-key', initial));
    act(() => {
      result.current[1]({ count: 42 });
    });
    expect(result.current[0]).toEqual({ count: 42 });
  });

  it('should handle array values', () => {
    const { result } = renderHook(() => useLocalStorage<string[]>('test-key', []));
    act(() => {
      result.current[1](['a', 'b', 'c']);
    });
    expect(result.current[0]).toEqual(['a', 'b', 'c']);
  });

  it('should return initial value when stored JSON is malformed', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('test-key', 'not-valid-json{');
    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));
    expect(result.current[0]).toBe('fallback');
    vi.restoreAllMocks();
  });

  it('should handle numeric initial values', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 0));
    expect(result.current[0]).toBe(0);
    act(() => {
      result.current[1](5);
    });
    expect(result.current[0]).toBe(5);
  });

  it('should handle boolean initial values', () => {
    const { result } = renderHook(() => useLocalStorage('flag', false));
    expect(result.current[0]).toBe(false);
    act(() => {
      result.current[1](true);
    });
    expect(result.current[0]).toBe(true);
  });
});

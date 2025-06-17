import { useState, useEffect } from 'react';

/**
 * A hook that mimics the Spark useKV hook but uses localStorage
 * This is used for the GitHub Pages build where Spark is not available
 * 
 * @param key The key to store the value under in localStorage
 * @param initialValue The initial value to use if no value is found in localStorage
 * @returns [value, setValue, deleteValue] A tuple containing the value, a setter, and a delete function
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void, () => void] {
  // Get from localStorage on initial render
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      // Parse stored json or return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when the state changes
  useEffect(() => {
    try {
      // Save to localStorage
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Return a wrapped version of useState's setter function
  const setValue = (value: T) => {
    try {
      // Save state
      setStoredValue(value);
    } catch (error) {
      console.error(`Error setting value for localStorage key "${key}":`, error);
    }
  };

  // Function to delete the value from localStorage
  const deleteValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error deleting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, deleteValue];
}

// For compatibility with GitHub Spark applications, export both hooks
// This allows applications to use the same hook name regardless of environment
export const useKV = useLocalStorage;
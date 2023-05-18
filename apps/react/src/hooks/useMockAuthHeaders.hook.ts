import { useEffect, useState } from 'react';
import { v4 } from 'uuid';

export default function useMockAuthHeaders() {
  const [mockUserId, setMockUserId] = useState('');

  const generateAndStoreNewMockUserId = () => {
    const newMockUserId: string = v4();
    localStorage.setItem('MOCK_USER_ID', newMockUserId);
    return newMockUserId;
  };
  const handleGenerateMockUserId = () => {
    setMockUserId(generateAndStoreNewMockUserId());
  };

  useEffect(() => {
    let mockUserIdFromStorage = localStorage.getItem('MOCK_USER_ID') || '';

    if (!mockUserIdFromStorage) {
      mockUserIdFromStorage = generateAndStoreNewMockUserId();
    }
    setMockUserId(mockUserIdFromStorage);
  }, []);

  return {
    generateNewHeaders: handleGenerateMockUserId,
    headers:
      typeof window !== 'undefined' && mockUserId ? { Authorization: `Basic ${window.btoa(mockUserId)}` } : undefined,
  };
}

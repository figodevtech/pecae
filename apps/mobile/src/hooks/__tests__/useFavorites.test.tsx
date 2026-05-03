import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFavorites } from '../useFavorites';
import { api } from '../../services/api';

jest.mock('../../services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: any) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

describe('useFavorites', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches favorites successfully', async () => {
    const mockData = { id: 'listing-1', title: 'Car 1' };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: [mockData] });

    const { result } = renderHook(() => useFavorites(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.getFavorites.isSuccess).toBe(true);
    });

    expect(result.current.getFavorites.data).toEqual([mockData]);
    expect(api.get).toHaveBeenCalledWith('/buyers/favorites');
  });

  it('toggles favorite successfully', async () => {
    const listingId = 'listing-123';
    (api.post as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

    const { result } = renderHook(() => useFavorites(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.toggleFavorite.mutateAsync(listingId);
    });

    expect(result.current.toggleFavorite.isSuccess).toBe(true);
    expect(api.post).toHaveBeenCalledWith(`/buyers/favorites/${listingId}`);
  });
});

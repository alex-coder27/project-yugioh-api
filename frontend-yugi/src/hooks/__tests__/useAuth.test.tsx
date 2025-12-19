import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../useAuth';
import api from '../../services/api';
import type { ReactNode } from 'react';

jest.mock('../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('deve inicializar com usuário não autenticado', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('deve fazer login com sucesso', async () => {
    const mockResponse = {
      data: {
        token: 'fake-token-123',
        userId: 1,
        username: 'testuser',
      },
    };

    mockedApi.post.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.login('testuser', 'password123');
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    expect(result.current.user).toEqual({
      userId: 1,
      username: 'testuser',
    });
    expect(localStorage.getItem('token')).toBe('fake-token-123');
    expect(localStorage.getItem('userId')).toBe('1');
    expect(localStorage.getItem('username')).toBe('testuser');
  });

  it('deve fazer registro com sucesso', async () => {
    const mockResponse = {
      data: {
        token: 'new-token-456',
        userId: 2,
        username: 'newuser',
      },
    };

    mockedApi.post.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.register('newuser', 'new@email.com', 'password123');
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    expect(result.current.user).toEqual({
      userId: 2,
      username: 'newuser',
    });
    expect(localStorage.getItem('token')).toBe('new-token-456');
  });

  it('deve lançar erro ao falhar no login', async () => {
    mockedApi.post.mockRejectedValueOnce(new Error('Unauthorized'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.login('wronguser', 'wrongpass');
      })
    ).rejects.toThrow();

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('deve fazer logout corretamente', async () => {
    const mockResponse = {
      data: {
        token: 'fake-token',
        userId: 1,
        username: 'testuser',
      },
    };

    mockedApi.post.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.login('testuser', 'password123');
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    act(() => {
      result.current.logout();
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('userId')).toBeNull();
    expect(localStorage.getItem('username')).toBeNull();
  });

  it('deve restaurar sessão do localStorage', async () => {
    localStorage.setItem('token', 'existing-token');
    localStorage.setItem('userId', '5');
    localStorage.setItem('username', 'existinguser');

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
    });

    expect(result.current.user).toEqual({
      userId: 5,
      username: 'existinguser',
    });
  });

  it('deve lançar erro quando usado fora do AuthProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth deve ser usado dentro de um AuthProvider');

    consoleError.mockRestore();
  });
});
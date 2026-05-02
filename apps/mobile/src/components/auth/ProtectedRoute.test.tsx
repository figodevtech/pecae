import React from 'react';
import TestRenderer from 'react-test-renderer';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '../../store/auth-store';
import { useRouter } from 'expo-router';
import { Text } from 'react-native';

const { act } = TestRenderer;

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

describe('ProtectedRoute', () => {
  let routerReplaceMock: jest.Mock;

  beforeEach(() => {
    routerReplaceMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ replace: routerReplaceMock });
    act(() => { useAuthStore.setState({ isLoading: false }); });
    jest.useFakeTimers();
  });

  afterEach(() => { jest.useRealTimers(); });

  it('[NAV-01] BUYER redirecionado ao tentar acessar rota de SELLER', () => {
    act(() => { useAuthStore.setState({ isAuthenticated: true, user: { id: '1', type: 'BUYER', email: 'test@test.com' } }); });
    act(() => { TestRenderer.create(<ProtectedRoute allowedRoles={['SELLER']}><Text>Protected Content</Text></ProtectedRoute>); });
    expect(routerReplaceMock).toHaveBeenCalledWith('/(tabs)/');
  });

  it('[NAV-02] usuário não autenticado redirecionado para /login', () => {
    act(() => { useAuthStore.setState({ isAuthenticated: false, user: null, token: null }); });
    act(() => { TestRenderer.create(<ProtectedRoute><Text>Protected Content</Text></ProtectedRoute>); });
    act(() => { jest.runAllTimers(); });
    expect(routerReplaceMock).toHaveBeenCalledWith('/(auth)/login');
  });

  it('[NAV-03] SELLER acessa rota de SELLER sem redirecionamento', () => {
    act(() => { useAuthStore.setState({ isAuthenticated: true, user: { id: '1', type: 'SELLER', email: 'test@test.com' } }); });
    let testRenderer: any;
    act(() => { testRenderer = TestRenderer.create(<ProtectedRoute allowedRoles={['SELLER']}><Text>Protected Content</Text></ProtectedRoute>); });
    expect(routerReplaceMock).not.toHaveBeenCalled();
    expect(testRenderer.root.findByType(Text).props.children).toBe('Protected Content');
  });
});

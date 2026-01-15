import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';

interface User {
    userId: number;
    username: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
    login: (identifier: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUserId = localStorage.getItem('userId');
        const savedUsername = localStorage.getItem('username');
        
        if (token && savedUserId && savedUsername) {
            setUser({ 
                userId: Number(savedUserId), 
                username: savedUsername 
            });
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    const login = useCallback(async (identifier: string, password: string) => {
        const response = await api.post('/auth/login', { identifier, password });
        const { token, userId, username: apiUsername } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('userId', String(userId));
        localStorage.setItem('username', apiUsername);
        
        setUser({ userId, username: apiUsername });
        setIsAuthenticated(true);
    }, []);

    const register = useCallback(async (username: string, email: string, password: string) => {
        const response = await api.post('/auth/register', { username, email, password }); 
        const { token, userId, username: apiUsername } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('userId', String(userId));
        localStorage.setItem('username', apiUsername);

        setUser({ userId, username: apiUsername });
        setIsAuthenticated(true);
    }, []);

    const logout = useCallback(() => {
        localStorage.clear();
        setIsAuthenticated(false);
        setUser(null);
    }, []);

    const contextValue = useMemo(() => ({
        isAuthenticated,
        user,
        loading,
        login,
        register,
        logout
    }), [isAuthenticated, user, loading, login, register, logout]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};
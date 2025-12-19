import React, { createContext, useState, useContext, useEffect } from 'react';
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
        const loadInitialData = () => {
            const token = localStorage.getItem('token');
            const savedUserId = localStorage.getItem('userId');
            const savedUsername = localStorage.getItem('username');
            
            if (token && savedUserId && savedUsername) {
                setIsAuthenticated(true);
                setUser({ 
                    userId: Number(savedUserId), 
                    username: savedUsername 
                });
            } else {
                // Se não tem todas as informações necessárias, limpa tudo
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                localStorage.removeItem('username');
                setIsAuthenticated(false);
                setUser(null);
            }
            setLoading(false);
        };
        loadInitialData();
    }, []); // Removi a dependência do user

    const login = async (identifier: string, password: string) => {
        const response = await api.post('/auth/login', { identifier, password });
        
        const { token, userId, username: apiUsername } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('userId', String(userId));
        localStorage.setItem('username', apiUsername);
        
        setIsAuthenticated(true);
        setUser({ userId, username: apiUsername });
    };

    const register = async (username: string, email: string, password: string) => {
        const response = await api.post('/auth/register', { username, email, password }); 
        
        const { token, userId, username: apiUsername } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('userId', String(userId));
        localStorage.setItem('username', apiUsername);

        setIsAuthenticated(true);
        setUser({ userId, username: apiUsername });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout, loading }}>
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
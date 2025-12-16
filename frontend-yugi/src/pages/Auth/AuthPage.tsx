import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom'; 
import './AuthPage.css';
import ThemeToggleButton from '../../components/shared/ThemeToggleButton/ThemeToggleButton';

type FormType = 'login' | 'register';

const AuthPage: React.FC = () => {
    const location = useLocation();
    const initialForm = location.pathname.includes('/register') ? 'register' : 'login';
    
    const [activeForm, setActiveForm] = useState<FormType>(initialForm); 

    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const [registerUsername, setRegisterUsername] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login, register, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate]);
    
    useEffect(() => {
        if (!isAuthenticated) {
            navigate(`/${activeForm}`, { replace: true });
        }
    }, [activeForm, isAuthenticated, navigate]);

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(loginIdentifier, loginPassword);
        } catch (err) {
            setError('Falha no LOGIN. Verifique seu ID de Duelista e Senha.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (registerPassword.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            setLoading(false);
            return;
        }

        try {
            await register(registerUsername, registerEmail, registerPassword);
        } catch (err) {
            setError('Falha no CADASTRO. Nome de Duelista ou Email já está em uso.');
        } finally {
            setLoading(false);
        }
    };

    if (isAuthenticated) {
        return null;
    }

    return (
        <div className="auth-page-wrapper">
            <ThemeToggleButton variant="fixed" />

            <div className="duelist-container">

                <div className="card-switcher">
                    <button 
                        onClick={() => setActiveForm('login')}
                        className={activeForm === 'login' ? 'active' : ''}
                    >
                        LOGIN
                    </button>
                    <button 
                        onClick={() => setActiveForm('register')}
                        className={activeForm === 'register' ? 'active' : ''}
                    >
                        REGISTER
                    </button>
                </div>

                <div 
                    className={`duelist-card ${activeForm === 'login' ? 'active-form' : 'hidden-form'}`}
                    id="login-form"
                >
                    <h2>LOGIN</h2>
                    {error && activeForm === 'login' && <p className="auth-error">{error}</p>}
                    <form onSubmit={handleLoginSubmit}>
                        <div className="input-group">
                            <label htmlFor="login-identifier">DUELIST ID</label>
                            <input 
                                type="text" 
                                id="login-identifier"
                                value={loginIdentifier}
                                onChange={(e) => setLoginIdentifier(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="login-password">PASSWORD</label>
                            <input 
                                type="password" 
                                id="login-password" 
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="duelist-button primary" disabled={loading}>
                            {loading && activeForm === 'login' ? 'CARREGANDO DECK...' : 'PREPARAR DECK'}
                        </button>
                    </form>
                </div>

                <div 
                    className={`duelist-card ${activeForm === 'register' ? 'active-form' : 'hidden-form'}`}
                    id="register-form"
                >
                    <h2>REGISTER</h2>
                    {error && activeForm === 'register' && <p className="auth-error">{error}</p>}
                    <form onSubmit={handleRegisterSubmit}>
                        <div className="input-group">
                            <label htmlFor="register-username">CHOOSE DUELIST USERNAME</label>
                            <input 
                                type="text" 
                                id="register-username" 
                                value={registerUsername}
                                onChange={(e) => setRegisterUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="register-email">DUELIST ID (EMAIL)</label>
                            <input 
                                type="email" 
                                id="register-email" 
                                value={registerEmail}
                                onChange={(e) => setRegisterEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="register-password">CREATE PASSWORD</label>
                            <input 
                                type="password" 
                                id="register-password" 
                                value={registerPassword}
                                onChange={(e) => setRegisterPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="duelist-button primary" disabled={loading}>
                            {loading && activeForm === 'register' ? 'CRIANDO CONTA...' : 'CRIAR CONTA DUELISTA'}
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default AuthPage;
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // Dados da tabela profiles (role, name, etc)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false); // Mantido por compatibilidade de layout
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Busca os dados adicionais da tabela profiles (incluindo se é admin ou user)
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (err) {
      console.error('Erro ao carregar perfil do usuário:', err);
    }
  };

  useEffect(() => {
    setIsLoadingAuth(true);

    // 1. Checa a sessão atual ao carregar o componente
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);

      if (currentUser) {
        fetchUserProfile(currentUser.id);
      }

      setIsLoadingAuth(false);
      setAuthChecked(true);
    });

    // 2. Escuta mudanças de estado em tempo real (Login, Logout, Token Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);

      if (currentUser) {
        await fetchUserProfile(currentUser.id);
      } else {
        setUserProfile(null);
      }

      setIsLoadingAuth(false);
      setAuthChecked(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Método de Logout com Supabase
  const logout = async (shouldRedirect = true) => {
    setIsLoadingAuth(true);
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    setIsAuthenticated(false);
    setIsLoadingAuth(false);

    if (shouldRedirect) {
      window.location.href = '/login';
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        authChecked,
        logout,
        navigateToLogin,
        isAdmin: userProfile?.role === 'admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
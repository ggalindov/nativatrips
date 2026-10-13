import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  fullName: string;
  email: string;
  phone: string;
  docNumber: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: User, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: User = {
  fullName: 'Juan Sebastián Mora',
  email: 'senderista.andino@gmail.com',
  phone: '+57 312 456 7890',
  docNumber: 'C.C. 1.018.452.339',
  role: 'Ecoturista Frecuente'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('nativatrips_user');
      return stored ? JSON.parse(stored) : DEMO_USER; // Default logged in for smooth preview
    } catch {
      return DEMO_USER;
    }
  });

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('nativatrips_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('nativatrips_user');
      }
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    // Simulated network delay for realism
    await new Promise(res => setTimeout(res, 600));

    if (email.includes('incorrecto') || pass.length < 4) {
      return { success: false, error: 'Credenciales inválidas. Verifica tu correo y contraseña.' };
    }

    const loggedUser: User = {
      fullName: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      email: email,
      phone: '+57 312 456 7890',
      docNumber: 'C.C. 1.018.452.339',
      role: 'Ecoturista Autorizado'
    };
    setUser(loggedUser);
    return { success: true };
  };

  const register = async (userData: User, _pass: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise(res => setTimeout(res, 800));
    setUser(userData);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
    await new Promise(res => setTimeout(res, 600));
    return {
      success: true,
      message: `Enlace de recuperación enviado con éxito a ${email}. Revisa tu bandeja de entrada.`
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        requestPasswordReset
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

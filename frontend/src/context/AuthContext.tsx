import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { api } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
}

interface LoginResponse {
  accessToken: string;
  user: User;
}

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextData | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('fitfisio_user');

    return storedUser
      ? JSON.parse(storedUser)
      : null;
  });

  const isAuthenticated = !!user;

  useEffect(() => {
    const token = localStorage.getItem('fitfisio_token');

    if (!token) {
      setUser(null);
    }
  }, []);

  async function login(
    email: string,
    password: string,
  ) {
    const response = await api.post<LoginResponse>(
      '/auth/login',
      {
        email,
        password,
      },
    );

    const { accessToken, user } = response.data;

    localStorage.setItem(
      'fitfisio_token',
      accessToken,
    );

    localStorage.setItem(
      'fitfisio_user',
      JSON.stringify(user),
    );

    setUser(user);
  }

  function logout() {
    localStorage.removeItem('fitfisio_token');
    localStorage.removeItem('fitfisio_user');

    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth deve ser usado dentro de AuthProvider.',
    );
  }

  return context;
}
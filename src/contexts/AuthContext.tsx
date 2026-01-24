import React, { createContext, useContext, useEffect, useState } from 'react';

// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// const API_URL = 'http://localhost:3000';
const API_URL = 'https://eduspace-portal-backend.onrender.com';


interface User {
  id: string;
  email: string;
  fullName: string;
  name?: string; // ADD THIS for teachers
  isEmailVerified: boolean;
  role: string; // Add this line
  // ADD THESE TWO LINES:
  schoolId?: string;
  schoolName?: string;
  created_at?: string; // ADD THIS for teachers
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        localStorage.removeItem('token');
        setToken(null);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  // const signIn = async (email: string, password: string) => {
  //   try {
  //     const response = await fetch(`${API_URL}/auth/login`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ email, password }),
  //     });

  //     const data = await response.json();
  //     console.log('Login response:', data); // Add this line

  //     // if (!response.ok) {
  //     //   const errorData = await response.json();

  //     //   return {
  //     //     error: {
  //     //       message: errorData.message || 'Login failed. Please try again.',
  //     //     } as Error,
  //     //   };
  //     // }
  //     if (!response.ok) {
  //       return {
  //         error: {
  //           message: data.message || 'Login failed. Please try again.',
  //         } as Error,
  //       };
  //     }

  //     // const data = await response.json();
  //     localStorage.setItem('token', data.access_token);
  //     localStorage.setItem('user', JSON.stringify(data.user)); // Add this line
  //     setToken(data.access_token);
  //     setUser(data.user);

  //     return { error: null };
  //   } catch (error: any) {
  //     return {
  //       error: {
  //         message: 'Login failed. Please try again.',
  //       } as Error,
  //     };
  //   }
  // };
  const signIn = async (email: string, password: string) => {
    try {
      // First try regular login (admin/school_admin)
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Regular login response:', data);

        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.access_token);
        setUser(data.user);

        return { error: null };
      }

      // If regular login fails, try teacher login
      console.log('Regular login failed, trying teacher login...');
      const teacherResponse = await fetch(`${API_URL}/auth/teachers/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (teacherResponse.ok) {
        const data = await teacherResponse.json();
        console.log('Teacher login response:', data);

        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.access_token);
        setUser(data.user);

        return { error: null };
      }

      // Both logins failed
      const errorData = await teacherResponse.json();
      return {
        error: {
          message: errorData.message || 'Invalid credentials',
        } as Error,
      };

    } catch (error: any) {
      return {
        error: {
          message: error.message || 'Login failed. Please try again.',
        } as Error,
      };
    }
  };
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          error: {
            message: errorData.message || 'Registration failed. Please try again.',
          } as Error,
        };
      }

      return { error: null };
    } catch (error: any) {
      return {
        error: {
          message: 'Registration failed. Please try again.',
        } as Error,
      };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          error: {
            message: errorData.message || 'Failed to send reset email.',
          } as Error,
        };
      }

      return { error: null };
    } catch (error: any) {
      return {
        error: {
          message: 'Failed to send reset email.',
        } as Error,
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { User, Session } from '@supabase/supabase-js';

// // --- MOCK DATA FOR BYPASS ---
// // This defines what a "logged in" user looks like to the rest of your app.
// const MOCK_USER: any = {
//   id: 'mock-user-123',
//   email: 'admin@example.com',
//   user_metadata: {
//     full_name: 'Admin Developer',
//   },
//   role: 'authenticated',
//   aud: 'authenticated',
//   created_at: new Date().toISOString(),
// };

// const MOCK_SESSION: any = {
//   access_token: 'mock-session-token',
//   refresh_token: 'mock-refresh-token',
//   expires_in: 3600,
//   token_type: 'bearer',
//   user: MOCK_USER,
// };

// interface AuthContextType {
//   user: User | null;
//   session: Session | null;
//   loading: boolean;
//   signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
//   signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
//   signOut: () => Promise<void>;
//   resetPassword: (email: string) => Promise<{ error: Error | null }>;
//   updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   // We initialize with the mock user so Protected Routes don't redirect to /login
//   const [user, setUser] = useState<User | null>(MOCK_USER);
//   const [session, setSession] = useState<Session | null>(MOCK_SESSION);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     // We have removed the supabase.auth.getSession() and onAuthStateChange calls
//     // because the backend project is deleted.
//     console.log("Auth is running in Mock/Development mode (Bypass active).");
//     setLoading(false);
//   }, []);

//   const signIn = async (email: string, password: string) => {
//     // Instantly successful login
//     setUser(MOCK_USER);
//     setSession(MOCK_SESSION);
//     return { error: null };
//   };

//   const signUp = async (email: string, password: string, fullName: string) => {
//     // Instantly successful signup
//     const newUser = { ...MOCK_USER, email, user_metadata: { full_name: fullName } };
//     setUser(newUser);
//     setSession({ ...MOCK_SESSION, user: newUser });
//     return { error: null };
//   };

//   const signOut = async () => {
//     setUser(null);
//     setSession(null);
//     console.log("Logged out of Mock Auth");
//     // Force a redirect to login if necessary
//     window.location.href = '/login';
//   };

//   const resetPassword = async (email: string) => {
//     console.log("Mock reset password request for:", email);
//     return { error: null };
//   };

//   const updatePassword = async (newPassword: string) => {
//     console.log("Mock password update successful");
//     return { error: null };
//   };

//   const value = {
//     user,
//     session,
//     loading,
//     signIn,
//     signUp,
//     signOut,
//     resetPassword,
//     updatePassword,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { User, Session } from '@supabase/supabase-js';
// import { supabase } from '@/lib/supabase';

// interface AuthContextType {
//   user: User | null;
//   session: Session | null;
//   loading: boolean;
//   signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
//   signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
//   signOut: () => Promise<void>;
//   resetPassword: (email: string) => Promise<{ error: Error | null }>;
//   updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [session, setSession] = useState<Session | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // Get initial session
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setSession(session);
//       setUser(session?.user ?? null);
//       setLoading(false);
//     });

//     // Listen for auth changes
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(
//       async (event, session) => {
//         setSession(session);
//         setUser(session?.user ?? null);
//         setLoading(false);
//       }
//     );

//     return () => subscription.unsubscribe();
//   }, []);

//   const signIn = async (email: string, password: string) => {
//     try {
//       const { error } = await supabase.auth.signInWithPassword({
//         email,
//         password,
//       });
//       return { error };
//     } catch (error) {
//       return { error: error as Error };
//     }
//   };

//   const signUp = async (email: string, password: string, fullName: string) => {
//     try {
//       const { data, error } = await supabase.auth.signUp({
//         email,
//         password,
//         options: {
//           data: {
//             full_name: fullName,
//           },
//         },
//       });

//       if (error) return { error };

//       // Create parent profile after successful signup
//       if (data.user) {
//         const { error: profileError } = await supabase
//           .from('parents')
//           .insert({
//             id: data.user.id,
//             email: email,
//             full_name: fullName,
//           });

//         if (profileError) {
//           console.error('Error creating parent profile:', profileError);
//         }
//       }

//       return { error: null };
//     } catch (error) {
//       return { error: error as Error };
//     }
//   };

//   const signOut = async () => {
//     await supabase.auth.signOut();
//   };

//   const resetPassword = async (email: string) => {
//     try {
//       const { error } = await supabase.auth.resetPasswordForEmail(email, {
//         redirectTo: `${window.location.origin}/reset-password`,
//       });
//       return { error };
//     } catch (error) {
//       return { error: error as Error };
//     }
//   };

//   const updatePassword = async (newPassword: string) => {
//     try {
//       const { error } = await supabase.auth.updateUser({
//         password: newPassword,
//       });
//       return { error };
//     } catch (error) {
//       return { error: error as Error };
//     }
//   };

//   const value = {
//     user,
//     session,
//     loading,
//     signIn,
//     signUp,
//     signOut,
//     resetPassword,
//     updatePassword,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

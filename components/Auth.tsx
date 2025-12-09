import React, { useState } from 'react';
import { auth, googleProvider } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, AuthError } from 'firebase/auth';
import { Card3D } from './ui/Card3D';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Save the name to the Firebase Profile
        if (name && userCredential.user) {
            await updateProfile(userCredential.user, {
                displayName: name
            });
        }
      }
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
        handleAuthError(err);
    } finally {
        setLoading(false);
    }
  };

  const handleAuthError = (err: any) => {
      const firebaseError = err as AuthError;
      console.error("Firebase Auth Error:", firebaseError.code, firebaseError.message);
      
      let msg = "An error occurred.";
      
      switch (firebaseError.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          msg = "Invalid email or password.";
          break;
        case 'auth/email-already-in-use':
          msg = "This email is already registered. Please sign in.";
          break;
        case 'auth/weak-password':
          msg = "Password should be at least 6 characters.";
          break;
        case 'auth/popup-closed-by-user':
          msg = "Sign-in cancelled.";
          break;
        case 'auth/configuration-not-found':
        case 'auth/operation-not-allowed':
          msg = "⚠️ Authentication provider is not enabled in Firebase Console.";
          break;
        case 'auth/network-request-failed':
          msg = "Network error. Please check your internet connection.";
          break;
        case 'auth/too-many-requests':
          msg = "Too many failed attempts. Please try again later.";
          break;
        default:
          msg = firebaseError.message || "An unknown error occurred.";
      }
      setError(msg);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
        {/* Background Effects */}
       <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]" />
       <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[120px]" />

       <div className="w-full max-w-md">
           <div className="text-center mb-8">
               <h1 className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tighter mb-2">ZenBudget</h1>
               <p className="text-muted">Smart, minimalist expense tracking.</p>
           </div>
           
           <Card3D className="bg-surface border-border">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6 text-center">
                  {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>

              <div className="space-y-4">
                  <button 
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-border hover:bg-zinc-50 dark:hover:bg-zinc-700 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-3 relative"
                  >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Sign in with Google
                  </button>
                  
                  <div className="flex items-center gap-2">
                      <div className="h-px bg-border flex-1" />
                      <span className="text-xs text-muted">OR</span>
                      <div className="h-px bg-border flex-1" />
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                      {!isLogin && (
                          <div>
                              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
                              <input 
                                type="text" 
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-zinc-900 dark:text-white"
                                placeholder="Your Name"
                              />
                          </div>
                      )}
                      <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
                          <input 
                            type="email" 
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-zinc-900 dark:text-white"
                            placeholder="you@example.com"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Password</label>
                          <input 
                            type="password" 
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-zinc-900 dark:text-white"
                            placeholder="••••••••"
                          />
                      </div>

                      {error && (
                          <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-xs border border-red-500/20 leading-relaxed">
                              {error}
                          </div>
                      )}

                      <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primaryHover text-white py-3 rounded-xl font-medium transition-all shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                          {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                      </button>
                  </form>
              </div>

              <div className="mt-6 text-center">
                  <p className="text-xs text-muted">
                      {isLogin ? "Don't have an account? " : "Already have an account? "}
                      <button 
                        onClick={() => { setIsLogin(!isLogin); setError(null); }}
                        className="text-primary hover:underline font-medium"
                      >
                          {isLogin ? 'Sign up' : 'Sign in'}
                      </button>
                  </p>
              </div>
           </Card3D>
       </div>
    </div>
  );
};
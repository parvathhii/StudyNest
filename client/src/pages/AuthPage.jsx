import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
export default function AuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register';
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [name,setName] = useState(''); const [email,setEmail] = useState(''); const [password,setPassword] = useState('');
  const [error,setError] = useState(''); const [busy,setBusy] = useState(false);
  if (user) return <Navigate to="/app" replace/>;
  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try { if (isRegister) await register(name,email,password); else await login(email,password); navigate('/app'); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <div className="auth-page"><Link to="/" className="back-link"><ArrowLeft size={16}/> Back to home</Link><div className="auth-card"><Link to="/" className="brand auth-brand"><span className="brand-mark"><BookOpen size={21}/></span><span>StudyNest</span></Link><div className="auth-heading"><h1>{isRegister ? 'Make room to grow.' : 'Welcome back.'}</h1><p>{isRegister ? 'Create your space for a calmer study routine.' : 'Pick up where your study journey left off.'}</p></div>
    <form onSubmit={submit} className="auth-form">{isRegister && <label>Your name<input autoComplete="name" value={name} onChange={e=>setName(e.target.value)} required minLength={2} maxLength={60} placeholder="How should we call you?"/></label>}<label>Email address<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required maxLength={120} placeholder="you@example.com"/></label><label>Password<input type="password" autoComplete={isRegister?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} required minLength={isRegister?8:1} maxLength={128} placeholder={isRegister?'At least 8 characters':'Your password'}/></label>{error && <div className="alert error" role="alert">{error}</div>}<button className="button primary full-width" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}</button></form><p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to StudyNest?'} <Link to={isRegister?'/login':'/register'}>{isRegister?'Log in':'Create an account'}</Link></p><p className="auth-privacy">Your study space is personal. Your data belongs to you.</p></div></div>;
}

import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import Landing from './pages/Landing.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Tasks from './pages/Tasks.jsx';
import Subjects from './pages/Subjects.jsx';
import TimerPage from './pages/TimerPage.jsx';
import Analytics from './pages/Analytics.jsx';
import Exams from './pages/Exams.jsx';
import DailyGoals from './pages/DailyGoals.jsx';
export default function App(){
 const { user } = useAuth();
 return <Routes><Route path="/" element={<Landing/>}/><Route path="/login" element={<AuthPage/>}/><Route path="/register" element={<AuthPage mode="register"/>}/><Route element={<ProtectedRoute/>}><Route path="/app" element={<Layout/>}><Route index element={<Dashboard/>}/><Route path="tasks" element={<Tasks/>}/><Route path="subjects" element={<Subjects/>}/><Route path="exams" element={<Exams/>}/><Route path="goals" element={<DailyGoals/>}/><Route path="timer" element={<TimerPage/>}/><Route path="analytics" element={<Analytics/>}/></Route></Route><Route path="*" element={<Navigate to={user?'/app':'/'} replace/>}/></Routes>;
}

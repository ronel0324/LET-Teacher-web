import { useState, useEffect, useRef } from 'react';

import {
  LayoutDashboard, BookOpen, Layers, BarChart3, Users, RefreshCw, LogOut,
  Plus, FileText, Target, Activity, Award,
  CheckCircle, AlertCircle, Info, ShieldCheck, UserCircle, X, Upload, Image,
  GraduationCap, Pencil, Trash2, Eye, EyeOff, Lock, Mail, User
} from 'lucide-react';

import { db, storage } from './firebase';

import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// FIREBASE AUTH 
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser
} from 'firebase/auth';

const auth = getAuth();

// ROOT APP
export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  if (authLoading) return <SplashScreen />;
  if (!user) return <AuthScreen />;
  return <AdminApp user={user} />;
}

// SPLASH SCREEN
function SplashScreen() {
  return (
    <div className="min-h-screen bg-[#73736B] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/70 font-bold text-sm tracking-widest uppercase">Loading...</p>
      </div>
    </div>
  );
}

// AUTH SCREEN
function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // LOGIN STATE
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);

  // REGISTER STATE
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) { setLoginError('Please fill in all fields.'); return; }
    setLoginLoading(true);
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (err: any) {
      const msg: Record<string, string> = {
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
        'auth/invalid-email': 'Please enter a valid email address.',
      };
      setLoginError(msg[err.code] || 'Login failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword || !regConfirm) { setRegError('Please fill in all fields.'); return; }
    if (regPassword.length < 6) { setRegError('Password must be at least 6 characters.'); return; }
    if (regPassword !== regConfirm) { setRegError('Passwords do not match.'); return; }
    setRegLoading(true);
    setRegError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
      await updateProfile(cred.user, { displayName: regName });
      await addDoc(collection(db, 'users'), {
        name: regName,
        email: regEmail,
        role: 'Admin',
        createdAt: Date.now(),
        uid: cred.user.uid,
      });
      setRegSuccess(true);
      setTimeout(() => {
        setMode('login');
        setLoginEmail(regEmail);
        setRegSuccess(false);
        setRegName(''); setRegEmail(''); setRegPassword(''); setRegConfirm('');
      }, 2000);
    } catch (err: any) {
      const msg: Record<string, string> = {
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password must be at least 6 characters.',
      };
      setRegError(msg[err.code] || 'Registration failed. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F5EF] flex font-sans">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-[45%] bg-[#73736B] flex-col justify-between p-14 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute bottom-20 -right-10 w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/[0.03]" />

        <div className="relative z-10">
          <div className="w-12 h-12 bg-[#EF4444] rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-red-500/30">
            <GraduationCap size={24} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-white leading-tight tracking-tight">
            LET Review<br />Admin Panel
          </h1>
          <p className="text-white/50 mt-4 text-sm font-medium leading-relaxed max-w-xs">
            Manage your LET review content, monitor student performance, and push updates to all devices.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            { icon: <FileText size={16} />, label: 'Manage Questions & Categories' },
            { icon: <BarChart3 size={16} />, label: 'View Analytics & Performance' },
            { icon: <RefreshCw size={16} />, label: 'Sync Content to Student Devices' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white/70">
                {f.icon}
              </div>
              <span className="text-white/60 text-xs font-bold">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          {/* TABS */}
          <div className="flex bg-white rounded-2xl p-1 mb-8 shadow-sm border border-gray-100">
            <button
              onClick={() => { setMode('login'); setLoginError(''); setRegError(''); }}
              className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${mode === 'login' ? 'bg-[#73736B] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setLoginError(''); setRegError(''); }}
              className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${mode === 'register' ? 'bg-[#73736B] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Create Account
            </button>
          </div>

          {/* ── LOGIN FORM ── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-black text-gray-800 mb-1">Welcome back</h2>
              <p className="text-gray-400 text-sm mb-8">Sign in to your admin account</p>

              {loginError && (
                <div className="mb-5 flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 text-sm font-bold p-4 rounded-2xl">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {loginError}
                </div>
              )}

              <div className="space-y-4">
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-11 pr-4 py-4 text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-[#73736B] transition"
                  />
                </div>

                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-11 pr-12 py-4 text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-[#73736B] transition"
                  />
                  <button type="button" onClick={() => setShowLoginPass(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition">
                    {showLoginPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full mt-6 bg-[#73736B] text-white py-4 rounded-2xl font-black text-sm tracking-wide shadow-lg hover:bg-[#5a5a54] active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>

              <p className="text-center text-xs text-gray-400 mt-6">
                No account yet?{' '}
                <button type="button" onClick={() => setMode('register')} className="text-[#73736B] font-black hover:underline">
                  Create one
                </button>
              </p>
            </form>
          )}

          {/* ── REGISTER FORM ── */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-black text-gray-800 mb-1">Create account</h2>
              <p className="text-gray-400 text-sm mb-8">Register a new admin account</p>

              {regSuccess && (
                <div className="mb-5 flex items-center gap-3 bg-green-50 border border-green-100 text-green-600 text-sm font-bold p-4 rounded-2xl">
                  <CheckCircle size={16} className="flex-shrink-0" />
                  Account created! Redirecting to login...
                </div>
              )}

              {regError && (
                <div className="mb-5 flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 text-sm font-bold p-4 rounded-2xl">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {regError}
                </div>
              )}

              <div className="space-y-4">
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type="text"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="Full name"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-11 pr-4 py-4 text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-[#73736B] transition"
                  />
                </div>

                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-11 pr-4 py-4 text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-[#73736B] transition"
                  />
                </div>

                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type={showRegPass ? 'text' : 'password'}
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="Password (min. 6 characters)"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-11 pr-12 py-4 text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-[#73736B] transition"
                  />
                  <button type="button" onClick={() => setShowRegPass(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition">
                    {showRegPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type={showRegConfirm ? 'text' : 'password'}
                    value={regConfirm}
                    onChange={e => setRegConfirm(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-11 pr-12 py-4 text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-[#73736B] transition"
                  />
                  <button type="button" onClick={() => setShowRegConfirm(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition">
                    {showRegConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={regLoading || regSuccess}
                className="w-full mt-6 bg-[#EF4444] text-white py-4 rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-red-500/20 hover:bg-red-600 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {regLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : 'Create Account'}
              </button>

              <p className="text-center text-xs text-gray-400 mt-6">
                Already have an account?{' '}
                <button type="button" onClick={() => setMode('login')} className="text-[#73736B] font-black hover:underline">
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// MAIN ADMIN APP (requires auth)
function AdminApp({ user }: { user: FirebaseUser }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut(auth);
    } catch {
      setSigningOut(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView onNavigate={(tab) => setActiveTab(tab)} />;
      case 'questions': return <QuestionsView />;
      case 'categories': return <CategoriesView />;
      case 'modules': return <ModulesView />;
      case 'analytics': return <AnalyticsView />;
      case 'users': return <UserManagementView />;
      case 'sync': return <SyncView />;
      default: return <DashboardView onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F6F5EF] font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#73736B] text-white flex flex-col p-6 fixed h-full shadow-2xl">
        <div className="mb-10">
          <h1 className="text-xl font-bold tracking-tight">LET Admin Panel</h1>
          <p className="text-[10px] text-gray-300 uppercase tracking-widest">Content Management</p>
        </div>

        <nav className="flex-1 space-y-1">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<BookOpen size={20} />} label="Questions" active={activeTab === 'questions'} onClick={() => setActiveTab('questions')} />
          <NavItem icon={<Layers size={20} />} label="Categories" active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} />
          <NavItem icon={<GraduationCap size={20} />} label="Modules" active={activeTab === 'modules'} onClick={() => setActiveTab('modules')} />
          <NavItem icon={<BarChart3 size={20} />} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
          <NavItem icon={<Users size={20} />} label="Users" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <NavItem icon={<RefreshCw size={20} />} label="Sync" active={activeTab === 'sync'} onClick={() => setActiveTab('sync')} />
        </nav>

        {/* USER INFO + SIGN OUT */}
        <div className="mt-auto border-t border-white/10 pt-5">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className="w-9 h-9 rounded-full bg-[#EF4444] flex items-center justify-center text-white font-black text-sm flex-shrink-0">
              {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-black truncate">{user.displayName || 'Admin'}</p>
              <p className="text-gray-400 text-[10px] truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-3 text-gray-300 hover:text-white hover:bg-white/10 p-3 rounded-2xl w-full transition disabled:opacity-50"
          >
            {signingOut
              ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <LogOut size={20} />
            }
            <span className="font-medium text-sm">{signingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 ml-64 p-10">
        {renderContent()}
      </main>
    </div>
  );
}

// ALL ORIGINAL VIEWS

function DashboardView({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [categoriesCount, setCategoriesCount] = useState(0);
  const [quizAttempts, setQuizAttempts] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const qSnap = await getDocs(collection(db, "questions"));
      const questions = qSnap.docs.map(doc => doc.data());
      setTotalQuestions(questions.length);
      const categories = new Set(questions.map((q: any) => q.category).filter(Boolean));
      setCategoriesCount(categories.size);
      const counts: Record<string, number> = {};
      questions.forEach((q: any) => {
        const cat = q.category?.trim();
        if (cat) counts[cat] = (counts[cat] || 0) + 1;
      });
      setCategoryCounts(counts);
      const aSnap = await getDocs(collection(db, "attempts"));
      const attempts = aSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQuizAttempts(attempts.length);
      if (attempts.length > 0) {
        const total = attempts.reduce((sum: number, a: any) => {
          const score = typeof a.score === "string" ? parseInt(a.score) : a.score || 0;
          return sum + score;
        }, 0);
        setAvgScore(Math.round(total / attempts.length));
      } else { setAvgScore(0); }
      const sorted = [...attempts].sort((a: any, b: any) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
      setRecentAttempts(sorted.slice(0, 5));
    } catch (err) { console.error("Dashboard fetch error:", err); }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-8">
        <h2 className="text-3xl font-black text-gray-800 tracking-tight">Admin Dashboard</h2>
        <p className="text-gray-500 font-medium">Manage your LET review content and monitor performance</p>
      </header>
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard icon={<FileText className="text-blue-500" />} label="Total Questions" value={totalQuestions} bgColor="bg-blue-50" />
        <StatCard icon={<Target className="text-green-500" />} label="Categories" value={categoriesCount} bgColor="bg-green-50" />
        <StatCard icon={<Activity className="text-purple-500" />} label="Quiz Attempts" value={quizAttempts} bgColor="bg-purple-50" />
        <StatCard icon={<Award className="text-orange-500" />} label="Avg Score" value={`${avgScore}%`} bgColor="bg-orange-50" />
      </div>
      <div className="grid grid-cols-2 gap-8 mb-10">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-6 text-gray-800">Questions by Category</h3>
          <div className="space-y-5">
            <ProgressItem label="General Education" value={categoryCounts["General Education"] || 0} max={totalQuestions || 1} color="bg-blue-500" />
            <ProgressItem label="Major/Specialization" value={categoryCounts["Major/Specialization"] || 0} max={totalQuestions || 1} color="bg-green-500" />
            <ProgressItem label="Professional Education" value={categoryCounts["Professional Education"] || 0} max={totalQuestions || 1} color="bg-purple-500" />
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-6 text-gray-800">Recent Quiz Attempts</h3>
          <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
            {recentAttempts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No quiz attempts yet.</p>
            ) : (
              recentAttempts.map((attempt: any, i: number) => (
                <AttemptItem key={attempt.id || i} label={attempt.category || "Quiz"} date={attempt.date || "—"} score={`${typeof attempt.score === "number" ? attempt.score : parseInt(attempt.score) || 0}%`} />
              ))
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div onClick={() => onNavigate("questions")} className="cursor-pointer hover:scale-[1.02] transition-transform active:scale-95">
          <ActionCard icon={<FileText size={24} />} title="Manage Questions" desc="Add, edit, and organize quiz questions" color="bg-blue-600 shadow-xl shadow-blue-100" />
        </div>
        <div onClick={() => onNavigate("analytics")} className="cursor-pointer hover:scale-[1.02] transition-transform active:scale-95">
          <ActionCard icon={<BarChart3 size={24} />} title="View Analytics" desc="Monitor student performance and trends" color="bg-purple-600 shadow-xl shadow-purple-100" />
        </div>
        <div onClick={() => onNavigate("sync")} className="cursor-pointer hover:scale-[1.02] transition-transform active:scale-95">
          <ActionCard icon={<RefreshCw size={24} />} title="Sync Content" desc="Push updates to student devices" color="bg-green-600 shadow-xl shadow-green-100" />
        </div>
      </div>
    </div>
  );
}

function QuestionsView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [question, setQuestion] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [answer, setAnswer] = useState('A');
  const [category, setCategory] = useState('General Education');
  const [difficulty, setDifficulty] = useState('easy');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkPreview, setBulkPreview] = useState<any[]>([]);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ saved: number; failed: number } | null>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchQuestions(); }, []);

  const fetchQuestions = async () => {
    const snapshot = await getDocs(collection(db, 'questions'));
    setQuestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    setUploadingImage(true);
    try {
      const storageRef = ref(storage, `question-images/${Date.now()}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      return await getDownloadURL(storageRef);
    } catch { return null; }
    finally { setUploadingImage(false); }
  };

  const saveQuestion = async () => {
    if (!question) { alert('Question is required'); return; }
    try {
      let imageUrl: string | null = null;
      if (imageFile) imageUrl = await uploadImage();
      await addDoc(collection(db, 'questions'), {
        question, optionA, optionB, optionC, optionD, answer, category, difficulty,
        ...(imageUrl ? { imageUrl } : {}), createdAt: Date.now()
      });
      alert('Question saved!');
      setQuestion(''); setOptionA(''); setOptionB(''); setOptionC(''); setOptionD(''); setAnswer('A');
      setImageFile(null); setImagePreview(null); setIsModalOpen(false); fetchQuestions();
    } catch (error) { console.error(error); alert('Failed to save'); }
  };

  const VALID_ANSWERS = ['A', 'B', 'C', 'D'];
  const VALID_CATEGORIES = ['General Education', 'Professional Education', 'Major/Specialization'];
  const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];
  const REQUIRED_COLS = ['question', 'optiona', 'optionb', 'optionc', 'optiond', 'answer', 'category', 'difficulty'];

  const handleBulkFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { XLSX } = window as any;
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFile(file); setBulkResult(null); setBulkErrors([]); setBulkPreview([]);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        if (rows.length === 0) { setBulkErrors(['File is empty.']); return; }
        const headers = Object.keys(rows[0]).map(h => h.trim().toLowerCase());
        const missingCols = REQUIRED_COLS.filter(c => !headers.includes(c));
        if (missingCols.length > 0) { setBulkErrors([`Missing columns: ${missingCols.join(', ')}`]); return; }
        const errors: string[] = [];
        const valid: any[] = [];
        rows.forEach((row, i) => {
          const rowNum = i + 2;
          const r: any = {};
          Object.keys(row).forEach(k => { r[k.trim()] = String(row[k]).trim(); });
          if (!r.question) { errors.push(`Row ${rowNum}: question is empty`); return; }
          if (!VALID_ANSWERS.includes(r.answer?.toUpperCase())) { errors.push(`Row ${rowNum}: answer must be A, B, C, or D`); return; }
          if (!VALID_CATEGORIES.includes(r.category)) { errors.push(`Row ${rowNum}: category must be one of: ${VALID_CATEGORIES.join(', ')}`); return; }
          if (!VALID_DIFFICULTIES.includes(r.difficulty?.toLowerCase())) { errors.push(`Row ${rowNum}: difficulty must be easy, medium, or hard`); return; }
          valid.push({
            question: r.question,
            optionA: r.optionA || r.optiona || '',
            optionB: r.optionB || r.optionb || '',
            optionC: r.optionC || r.optionc || '',
            optionD: r.optionD || r.optiond || '',
            answer: r.answer.toUpperCase(),
            category: r.category,
            difficulty: r.difficulty.toLowerCase(),
            createdAt: Date.now()
          });
        });
        setBulkErrors(errors); setBulkPreview(valid);
      } catch { setBulkErrors(['Failed to parse file.']); }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleBulkSave = async () => {
    if (bulkPreview.length === 0) return;
    setBulkUploading(true);
    let saved = 0; let failed = 0;
    for (const q of bulkPreview) {
      try { await addDoc(collection(db, 'questions'), q); saved++; }
      catch { failed++; }
    }
    setBulkUploading(false);
    setBulkResult({ saved, failed });
    setBulkPreview([]); setBulkFile(null); fetchQuestions();
  };

  const resetBulkModal = () => {
    setIsBulkModalOpen(false);
    setBulkFile(null); setBulkPreview([]); setBulkErrors([]); setBulkResult(null);
    if (bulkInputRef.current) bulkInputRef.current.value = '';
  };

  const downloadTemplate = () => {
    const { XLSX } = window as any;
    const ws = XLSX.utils.aoa_to_sheet([
      ['question', 'optionA', 'optionB', 'optionC', 'optionD', 'answer', 'category', 'difficulty'],
      ['Sample question?', 'Choice A', 'Choice B', 'Choice C', 'Choice D', 'A', 'General Education', 'easy'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    XLSX.writeFile(wb, 'questions_template.xlsx');
  };

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-800">Question Management</h2>
          <p className="text-gray-500">{questions.length} total questions</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsBulkModalOpen(true)} className="bg-green-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:bg-green-700 transition active:scale-95">
            <Upload size={20} /> Bulk Upload
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:bg-blue-700 transition active:scale-95">
            <Plus size={20} /> Add Question
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-xl shadow-2xl relative z-[10000] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-800">New Question</h3>
              <button onClick={() => { setIsModalOpen(false); setImageFile(null); setImagePreview(null); }} className="p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <textarea value={question} onChange={e => setQuestion(e.target.value)} className="w-full bg-gray-50 border rounded-2xl p-4" rows={3} placeholder="Enter question" />
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Image size={16} /> Question Image <span className="text-gray-400 font-normal">(optional)</span></label>
                <div onClick={() => imageInputRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition">
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="preview" className="max-h-40 mx-auto rounded-xl object-contain" />
                      <button onClick={e => { e.stopPropagation(); setImageFile(null); setImagePreview(null); if (imageInputRef.current) imageInputRef.current.value = ''; }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><X size={14} /></button>
                    </div>
                  ) : (
                    <div className="text-gray-400"><Image size={32} className="mx-auto mb-2 opacity-40" /><p className="text-xs font-bold">Click to upload image</p></div>
                  )}
                </div>
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>
              <input value={optionA} onChange={e => setOptionA(e.target.value)} className="w-full bg-gray-50 border rounded-xl p-3" placeholder="Option A" />
              <input value={optionB} onChange={e => setOptionB(e.target.value)} className="w-full bg-gray-50 border rounded-xl p-3" placeholder="Option B" />
              <input value={optionC} onChange={e => setOptionC(e.target.value)} className="w-full bg-gray-50 border rounded-xl p-3" placeholder="Option C" />
              <input value={optionD} onChange={e => setOptionD(e.target.value)} className="w-full bg-gray-50 border rounded-xl p-3" placeholder="Option D" />
              <div>
                <label className="text-sm font-bold text-gray-700">Correct Answer</label>
                <select value={answer} onChange={e => setAnswer(e.target.value)} className="w-full bg-gray-50 border rounded-xl p-3 mt-2">
                  <option value="A">Option A</option><option value="B">Option B</option><option value="C">Option C</option><option value="D">Option D</option>
                </select>
              </div>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-50 border rounded-xl p-3">
                <option>General Education</option><option>Professional Education</option><option>Major/Specialization</option>
              </select>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full bg-gray-50 border rounded-xl p-3">
                <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
              </select>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => { setIsModalOpen(false); setImageFile(null); setImagePreview(null); }} className="flex-1 py-4 font-bold text-gray-400">Cancel</button>
              <button onClick={saveQuestion} disabled={uploadingImage} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black disabled:opacity-50">
                {uploadingImage ? 'Uploading image...' : 'Save to Firebase'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-2xl shadow-2xl relative z-[10000] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-800">Bulk Upload Questions</h3>
              <button onClick={resetBulkModal} className="p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>
            </div>
            {bulkResult && (
              <div className={`mb-6 p-5 rounded-2xl flex items-center gap-4 ${bulkResult.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <CheckCircle className={bulkResult.failed === 0 ? 'text-green-500' : 'text-yellow-500'} size={28} />
                <div>
                  <p className="font-black text-gray-800">{bulkResult.saved} questions saved!</p>
                  {bulkResult.failed > 0 && <p className="text-sm text-red-500">{bulkResult.failed} failed.</p>}
                </div>
              </div>
            )}
            <div className="bg-gray-50 rounded-2xl p-5 mb-5">
              <p className="font-bold text-gray-700 mb-3 text-sm">Step 1 — Download the template</p>
              <button onClick={downloadTemplate} className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-100 transition">
                <FileText size={16} /> Download Excel Template (.xlsx)
              </button>
            </div>
            <div className="mb-5">
              <p className="font-bold text-gray-700 mb-3 text-sm">Step 2 — Upload your file</p>
              <div onClick={() => bulkInputRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/30 transition">
                <Upload size={36} className="mx-auto mb-3 text-gray-300" />
                <p className="font-bold text-gray-500 text-sm">{bulkFile ? bulkFile.name : 'Click to select CSV or Excel file'}</p>
              </div>
              <input ref={bulkInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleBulkFile} />
            </div>
            {bulkErrors.length > 0 && (
              <div className="mb-5 bg-red-50 border border-red-200 rounded-2xl p-5">
                <p className="font-black text-red-700 mb-2 flex items-center gap-2"><AlertCircle size={16} /> {bulkErrors.length} issue(s)</p>
                <ul className="space-y-1 max-h-32 overflow-y-auto">{bulkErrors.map((e, i) => <li key={i} className="text-xs text-red-600 font-bold">• {e}</li>)}</ul>
              </div>
            )}
            {bulkPreview.length > 0 && (
              <div className="mb-5">
                <p className="font-bold text-gray-700 mb-3 text-sm flex items-center gap-2"><CheckCircle size={16} className="text-green-500" />{bulkPreview.length} valid questions ready</p>
                <div className="border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="max-h-52 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50 text-gray-400 uppercase tracking-widest sticky top-0">
                        <tr><th className="p-3">#</th><th className="p-3">Question</th><th className="p-3">Category</th><th className="p-3">Difficulty</th><th className="p-3">Answer</th></tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {bulkPreview.map((q, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="p-3 text-gray-400">{i + 1}</td>
                            <td className="p-3 font-medium text-gray-700 max-w-[200px] truncate">{q.question}</td>
                            <td className="p-3 text-gray-500">{q.category}</td>
                            <td className="p-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${q.difficulty === 'easy' ? 'bg-green-100 text-green-600' : q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>{q.difficulty}</span></td>
                            <td className="p-3 font-black text-blue-600">{q.answer}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-4 mt-4">
              <button onClick={resetBulkModal} className="flex-1 py-4 font-bold text-gray-400">Cancel</button>
              <button onClick={handleBulkSave} disabled={bulkPreview.length === 0 || bulkUploading} className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black disabled:opacity-40 flex items-center justify-center gap-2">
                <Upload size={18} />{bulkUploading ? 'Saving...' : `Import ${bulkPreview.length} Questions`}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-gray-400 border-b border-gray-50 bg-gray-50/50">
              <th className="p-6">Question</th><th className="p-6 text-center">Image</th><th className="p-6">Category</th><th className="p-6 text-center">Difficulty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {questions.map((item: any, i) => (
              <tr key={i} className="hover:bg-gray-50/50 transition">
                <td className="p-6 text-sm text-gray-700 font-medium">{item.question}</td>
                <td className="p-6 text-center">
                  {item.imageUrl ? <img src={item.imageUrl} alt="question" className="w-12 h-12 object-cover rounded-xl mx-auto border border-gray-100" /> : <span className="text-gray-300 text-xs">—</span>}
                </td>
                <td className="p-6 text-sm text-gray-500">{item.category}</td>
                <td className="p-6 text-center">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${item.difficulty === 'easy' ? 'bg-green-100 text-green-600' : item.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>{item.difficulty}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ModulesView() {
  const [modules, setModules] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<any | null>(null);
  const [viewingModule, setViewingModule] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General Education');
  const [content, setContent] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => { fetchModules(); }, []);

  const fetchModules = async () => {
    const snap = await getDocs(collection(db, 'modules'));
    setModules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
    setCoverFile(file); setCoverPreview(URL.createObjectURL(file));
  };

  const uploadCover = async (): Promise<string | null> => {
    if (!coverFile) return null;
    setUploadingCover(true);
    try {
      const storageRef = ref(storage, `module-covers/${Date.now()}_${coverFile.name}`);
      await uploadBytes(storageRef, coverFile);
      return await getDownloadURL(storageRef);
    } catch { return null; }
    finally { setUploadingCover(false); }
  };

  const uploadPdf = async (): Promise<string | null> => {
    if (!pdfFile) return null;
    setUploadingPdf(true);
    try {
      const storageRef = ref(storage, `module-pdfs/${Date.now()}_${pdfFile.name}`);
      await uploadBytes(storageRef, pdfFile);
      return await getDownloadURL(storageRef);
    } catch { return null; }
    finally { setUploadingPdf(false); }
  };

  const handleDownloadPdf = async (moduleData: any) => {
    if (!moduleData?.pdfUrl) return;
    
    setDownloadingPdf(true);
    try {
      let pdfUrl = moduleData.pdfUrl;
      
      if (!moduleData.pdfUrl.startsWith('http')) {
        const storageRef = ref(storage, moduleData.pdfUrl);
        pdfUrl = await getDownloadURL(storageRef);
      }
      
      window.open(pdfUrl, '_blank');
    } catch (err) {
      console.error("Error opening PDF:", err);
      alert("Hindi mabuksan ang PDF. May error.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const openAddModal = () => {
    setEditingModule(null); setTitle(''); setCategory('General Education');
    setContent(''); setCoverFile(null); setCoverPreview(null);
    setPdfFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (m: any) => {
    setEditingModule(m); setTitle(m.title || ''); setCategory(m.category || 'General Education');
    setContent(m.content || ''); setCoverFile(null); setCoverPreview(m.coverUrl || null);
    setPdfFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false); setEditingModule(null);
    setCoverFile(null); setCoverPreview(null);
    setPdfFile(null);
  };

  const saveModule = async () => {
    if (!title.trim()) { alert('Title is required'); return; }
    setSaving(true);
    try {
      let coverUrl = editingModule?.coverUrl || null;
      if (coverFile) coverUrl = await uploadCover();

      let pdfUrl = editingModule?.pdfUrl || null;
      if (pdfFile) pdfUrl = await uploadPdf();

      const payload: any = {
        title: title.trim(),
        category,
        content: content.trim(),
        updatedAt: serverTimestamp()
      };
      if (coverUrl) payload.coverUrl = coverUrl;
      if (pdfUrl) payload.pdfUrl = pdfUrl;

      if (editingModule) { await updateDoc(doc(db, 'modules', editingModule.id), payload); }
      else { payload.createdAt = serverTimestamp(); await addDoc(collection(db, 'modules'), payload); }
      closeModal(); fetchModules();
    } catch (err) { console.error(err); alert('Failed to save module'); }
    finally { setSaving(false); }
  };

  const deleteModule = async (id: string) => {
    if (!confirm('Delete this module?')) return;
    setDeleting(id);
    try { await deleteDoc(doc(db, 'modules', id)); fetchModules(); }
    catch { alert('Failed to delete'); }
    finally { setDeleting(null); }
  };

  const CAT_COLOR: Record<string, string> = { 'General Education': 'bg-blue-500', 'Professional Education': 'bg-purple-600', 'Major/Specialization': 'bg-orange-500' };
  const CAT_ICON: Record<string, string> = { 'General Education': '📚', 'Professional Education': '🎓', 'Major/Specialization': '⭐' };
  const grouped = ['General Education', 'Professional Education', 'Major/Specialization'].map(cat => ({ cat, items: modules.filter(m => m.category === cat) }));

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-800">Study Modules</h2>
          <p className="text-gray-500">{modules.length} module{modules.length !== 1 ? 's' : ''} — reading materials for students</p>
        </div>
        <button onClick={openAddModal} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:bg-blue-700 transition active:scale-95">
          <Plus size={20} /> Add Module
        </button>
      </div>
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard icon={<GraduationCap className="text-blue-500" />} label="Total Modules" value={modules.length} bgColor="bg-blue-50" />
        <StatCard icon={<BookOpen className="text-blue-400" />} label="Gen. Education" value={modules.filter(m => m.category === 'General Education').length} bgColor="bg-blue-50" />
        <StatCard icon={<BookOpen className="text-purple-500" />} label="Prof. Education" value={modules.filter(m => m.category === 'Professional Education').length} bgColor="bg-purple-50" />
        <StatCard icon={<BookOpen className="text-orange-500" />} label="Major/Spec." value={modules.filter(m => m.category === 'Major/Specialization').length} bgColor="bg-orange-50" />
      </div>
      {modules.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-16 text-center border border-gray-100 shadow-sm">
          <GraduationCap size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="font-bold text-gray-400">No modules yet.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {grouped.map(({ cat, items }) => items.length === 0 ? null : (
            <div key={cat}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl">{CAT_ICON[cat]}</span>
                <h3 className="font-black text-gray-700 text-lg">{cat}</h3>
                <span className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full">{items.length}</span>
              </div>
              <div className="grid grid-cols-3 gap-5">
                {items.map(m => (
                  <div key={m.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition">
                    {m.coverUrl ? <img src={m.coverUrl} alt={m.title} className="w-full h-36 object-cover" /> : <div className={`${CAT_COLOR[m.category] || 'bg-gray-400'} h-36 flex items-center justify-center`}><span className="text-5xl opacity-30">{CAT_ICON[m.category] || '📖'}</span></div>}
                    <div className="p-5">
                      <p className="font-black text-gray-800 text-sm mb-1 line-clamp-2">{m.title}</p>
                      <p className="text-xs text-gray-400 line-clamp-3 mb-4">{m.content}</p>
                      {/* PDF Indicator */}
                      {m.pdfUrl && (
                        <div className="flex items-center gap-1 text-xs text-red-600 font-bold mb-3">
                          <FileText size={14} /> PDF Material
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => { setViewingModule(m); setIsViewModalOpen(true); }} className="flex-1 text-xs font-bold bg-gray-50 hover:bg-blue-50 hover:text-blue-600 text-gray-600 py-2 rounded-xl transition">View</button>
                        <button onClick={() => openEditModal(m)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"><Pencil size={14} /></button>
                        <button onClick={() => deleteModule(m.id)} disabled={deleting === m.id} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition disabled:opacity-40"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-2xl shadow-2xl z-[10000] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-800">{editingModule ? 'Edit Module' : 'New Study Module'}</h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-gray-50 border rounded-2xl p-4 font-bold text-gray-800 placeholder:font-normal" placeholder="Module title" />
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-50 border rounded-xl p-3">
                <option>General Education</option><option>Professional Education</option><option>Major/Specialization</option>
              </select>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Image size={16} /> Cover Image <span className="text-gray-400 font-normal">(optional)</span></label>
                <div onClick={() => coverInputRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition">
                  {coverPreview ? (
                    <div className="relative">
                      <img src={coverPreview} alt="cover" className="max-h-40 mx-auto rounded-xl object-cover w-full" />
                      <button onClick={e => { e.stopPropagation(); setCoverFile(null); setCoverPreview(null); if (coverInputRef.current) coverInputRef.current.value = ''; }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><X size={14} /></button>
                    </div>
                  ) : (
                    <div className="text-gray-400 py-4"><Image size={32} className="mx-auto mb-2 opacity-40" /><p className="text-xs font-bold">Click to upload cover</p></div>
                  )}
                </div>
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
              </div>
              {/* PDF Upload */}
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText size={16} /> PDF File
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div
                  onClick={() => pdfInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center cursor-pointer hover:border-red-400 hover:bg-red-50/30 transition"
                >
                  {pdfFile ? (
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <FileText size={20} className="text-red-500" />
                        <span className="text-sm font-bold text-gray-700 truncate max-w-[200px]">{pdfFile.name}</span>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setPdfFile(null);
                          if (pdfInputRef.current) pdfInputRef.current.value = '';
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : editingModule?.pdfUrl ? (
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <FileText size={20} className="text-red-500" />
                        <span className="text-sm font-bold text-gray-600">PDF already uploaded — click to replace</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400 py-2">
                      <FileText size={32} className="mx-auto mb-2 opacity-40" />
                      <p className="text-xs font-bold">Click to upload PDF</p>
                    </div>
                  )}
                </div>
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.type !== 'application/pdf') { alert('Please select a PDF file.'); return; }
                    setPdfFile(file);
                  }}
                />
             
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Study Content</label>
                <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full bg-gray-50 border rounded-2xl p-4 text-sm leading-relaxed resize-none" rows={10} placeholder="Write the study material here..." />
                <p className="text-xs text-gray-400 mt-1">{content.length} characters</p>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={closeModal} className="flex-1 py-4 font-bold text-gray-400">Cancel</button>
              <button onClick={saveModule} disabled={saving || uploadingCover || uploadingPdf} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black disabled:opacity-50">
                {saving || uploadingCover || uploadingPdf ? 'Saving...' : editingModule ? 'Save Changes' : 'Publish Module'}
              </button>
            </div>
          </div>
        </div>
      )}
      {isViewModalOpen && viewingModule && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4" onClick={() => setIsViewModalOpen(false)}>
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl z-[10000] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {viewingModule.coverUrl && <img src={viewingModule.coverUrl} alt={viewingModule.title} className="w-full h-52 object-cover rounded-t-[2.5rem]" />}
            <div className="p-8">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest text-white ${CAT_COLOR[viewingModule.category] || 'bg-gray-400'}`}>{viewingModule.category}</span>
                  <h3 className="text-2xl font-black text-gray-800 mt-3">{viewingModule.title}</h3>
                </div>
                <button onClick={() => setIsViewModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full ml-4 flex-shrink-0"><X size={24} /></button>
              </div>
              <div className="mt-6 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap border-t border-gray-50 pt-6">{viewingModule.content}</div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => { setIsViewModalOpen(false); openEditModal(viewingModule); }} className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-black flex items-center justify-center gap-2"><Pencil size={16} /> Edit Module</button>
                <button onClick={() => setIsViewModalOpen(false)} className="flex-1 py-3 font-bold text-gray-400 border border-gray-100 rounded-2xl">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoriesView() {
  const [categories, setCategories] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filteredQuestions, setFilteredQuestions] = useState<any[]>([]);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const snapshot = await getDocs(collection(db, "questions"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as any[];
      setQuestions(data);
      if (!data.length) { setCategories([]); setStats([]); return; }
      const grouped: Record<string, { title: string; count: number }> = {};
      data.forEach((q) => { const cat = q.category?.trim() || "Uncategorized"; if (!grouped[cat]) grouped[cat] = { title: cat, count: 0 }; grouped[cat].count += 1; });
      const result = Object.values(grouped);
      setCategories(result);
      const total = data.length;
      setStats(result.map((c) => ({ name: c.title, count: c.count, percent: Math.round((c.count / total) * 100) })));
    } catch (err) { console.error(err); }
  };

  const openCategoryModal = (category: string) => {
    setSelectedCategory(category);
    setFilteredQuestions(questions.filter((q) => (q.category?.trim() || "Uncategorized") === category));
    setModalOpen(true);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-3xl font-black text-gray-800 mb-2">Category Management</h2>
      <p className="text-gray-500 mb-8">Organize quiz content by subject areas</p>
      <div className="grid grid-cols-3 gap-6 mb-10">
        {categories.map((c, i) => (
          <div key={c.title || i} onClick={() => openCategoryModal(c.title)} className="cursor-pointer">
            <CategoryCard title={c.title} desc="Automatically generated from questions" count={c.count}
              color={c.title === "General Education" ? "bg-blue-500" : c.title === "Professional Education" ? "bg-purple-600" : "bg-orange-500"}
              icon={c.title === "General Education" ? "📚" : c.title === "Professional Education" ? "🎓" : "⭐"} />
          </div>
        ))}
      </div>
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg mb-6">Category Statistics</h3>
        <table className="w-full text-left text-sm">
          <thead className="text-gray-400 uppercase text-[10px] tracking-widest border-b border-gray-50">
            <tr><th className="pb-4">Category</th><th className="pb-4 text-center">Questions</th><th className="pb-4 text-center">Percentage</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
            {stats.length > 0 ? stats.map((s, i) => (
              <tr key={i}>
                <td className="py-4 flex items-center gap-3">{s.name === "General Education" ? "📚" : s.name === "Professional Education" ? "🎓" : "⭐"}{s.name}</td>
                <td className="py-4 text-center font-bold">{s.count}</td>
                <td className="py-4 text-center">{s.percent}%</td>
              </tr>
            )) : <tr><td colSpan={3} className="text-center py-6 text-gray-400">No categories found</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="mt-8 bg-blue-50 border border-blue-100 p-6 rounded-[1.5rem] flex gap-4">
        <div className="text-blue-600 p-2 bg-white rounded-xl h-fit shadow-sm"><Info size={24} /></div>
        <div><h4 className="font-bold text-blue-900 mb-1">About Categories</h4><p className="text-sm text-blue-800 opacity-80">The LET exam is divided into three main categories: Gen Ed, Prof Ed, and Major.</p></div>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]" onClick={() => setModalOpen(false)}>
          <div className="bg-white w-[600px] max-h-[80vh] overflow-y-auto rounded-3xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black">{selectedCategory} Questions</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-black text-xl">✕</button>
            </div>
            {filteredQuestions.length > 0 ? (
              <div className="space-y-3">
                {filteredQuestions.map((q, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl border">
                    <p className="font-bold text-gray-800">{q.question}</p>
                    <p className="text-sm text-gray-500 mt-1">Answer: <span className="font-black">{q.answer}</span></p>
                    <p className="text-xs text-gray-400">Difficulty: {q.difficulty}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-400">No questions found</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsView() {
  const [stats, setStats] = useState({ totalAttempts: 0, avgScore: 0, totalQuestions: 0, correctAnswers: 0 });
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);
  const [distribution, setDistribution] = useState({ excellent: 0, good: 0, fair: 0, needsWork: 0 });

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      const qSnap = await getDocs(collection(db, "questions"));
      const qData = qSnap.docs.map((d) => d.data()) as any[];
      let aData: any[] = [];
      try { const aSnap = await getDocs(collection(db, "attempts")); aData = aSnap.docs.map((d) => d.data()) as any[]; } catch { aData = []; }
      const totalQuestions = qData.length;
      const totalAttempts = aData.length;
      const correctAnswers = aData.reduce((sum, a) => sum + (a.correct || 0), 0) || 0;
      const avgScore = totalAttempts > 0 ? Math.round(aData.reduce((sum, a) => sum + (a.score || 0), 0) / totalAttempts) : 0;
      setStats({ totalAttempts, avgScore, totalQuestions, correctAnswers });
      const grouped: Record<string, { scoreSum: number; attemptCount: number }> = {};
      qData.forEach((q) => { const cat = q.category || "Uncategorized"; if (!grouped[cat]) grouped[cat] = { scoreSum: 0, attemptCount: 0 }; });
      aData.forEach((a) => { const cat = a.category || "Uncategorized"; if (!grouped[cat]) grouped[cat] = { scoreSum: 0, attemptCount: 0 }; const score = typeof a.score === "string" ? parseInt(a.score) : a.score || 0; grouped[cat].scoreSum += score; grouped[cat].attemptCount += 1; });
      setCategoryStats(Object.keys(grouped).map((key) => { const g = grouped[key]; return { label: key, value: g.attemptCount > 0 ? Math.min(100, Math.round(g.scoreSum / g.attemptCount)) : 0 }; }));
      setTrend([...aData].slice(-3).reverse().map((t, i) => ({ rank: i + 1, label: t.category || "Unknown", score: `${t.score || 0}%`, date: t.date || "N/A" })));
      const dist = { excellent: 0, good: 0, fair: 0, needsWork: 0 };
      aData.forEach((a) => { const s = a.score || 0; if (s >= 90) dist.excellent++; else if (s >= 75) dist.good++; else if (s >= 60) dist.fair++; else dist.needsWork++; });
      setDistribution(dist);
    } catch (err) { console.error("Analytics error:", err); }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-3xl font-black text-gray-800 mb-2">Analytics Dashboard</h2>
      <p className="text-gray-500 mb-8">Monitor student performance and learning trends</p>
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard icon={<BarChart3 className="text-blue-500" />} label="Total Attempts" value={stats.totalAttempts} bgColor="bg-blue-50" />
        <StatCard icon={<Activity className="text-green-500" />} label="Overall Average" value={`${stats.avgScore}%`} bgColor="bg-green-50" />
        <StatCard icon={<FileText className="text-purple-500" />} label="Total Questions" value={stats.totalQuestions} bgColor="bg-purple-50" />
        <StatCard icon={<Users className="text-orange-500" />} label="Correct Answers" value={stats.correctAnswers} bgColor="bg-orange-50" />
      </div>
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-6 text-gray-800">Average Score by Category</h3>
          <div className="space-y-6">{categoryStats.map((c, i) => <ProgressItem key={i} label={c.label} value={c.value} max={100} color="bg-orange-500" suffix="%" />)}</div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-6 text-gray-800">Recent Performance Trend</h3>
          <div className="space-y-4">{trend.map((t, i) => <TrendItem key={i} rank={t.rank} label={t.label} score={t.score} date={t.date} color="bg-blue-50 text-blue-600" badge="bg-orange-100 text-orange-600" />)}</div>
        </div>
      </div>
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 mb-8">
        <h3 className="font-bold text-lg mb-6">Performance Distribution</h3>
        <div className="grid grid-cols-4 gap-4">
          <DistCard label="Excellent (90-100%)" value={distribution.excellent} color="border-green-200 text-green-600 bg-green-50/30" />
          <DistCard label="Good (75-89%)" value={distribution.good} color="border-blue-200 text-blue-600 bg-blue-50/30" />
          <DistCard label="Fair (60-74%)" value={distribution.fair} color="border-yellow-200 text-yellow-600 bg-yellow-50/30" />
          <DistCard label="Needs Work (<60%)" value={distribution.needsWork} color="border-red-200 text-red-600 bg-red-50/30" />
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-100 p-8 rounded-[2rem]">
        <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2"><Target size={20} />Insights & Recommendations</h4>
        <ul className="space-y-3 text-sm text-blue-800">
          <li className="flex items-center gap-2"><AlertCircle size={16} />Overall performance is below target.</li>
          <li className="flex items-center gap-2"><AlertCircle size={16} />Some categories need more practice materials.</li>
          <li className="flex items-center gap-2"><Info size={16} />Encourage more quiz attempts for better analytics.</li>
        </ul>
      </div>
    </div>
  );
}

function UserManagementView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Admin');
  const [users, setUsers] = useState<any[]>([]);


  // Edit/Delete state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'Admin' | 'Teacher'>('Admin');
  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    setUsers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    try {
      if (!name || !email || !password) { alert("Name, email, and password are required"); return; }
      if (password.length < 6) { alert("Password must be at least 6 characters"); return; }

      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await addDoc(collection(db, "users"), {
        name,
        email,
        role,
        createdAt: Date.now(),
        uid: cred.user.uid,
      });

      alert("User created successfully!");
      setName(''); setEmail(''); setPassword(''); setRole('Admin');
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      alert(err?.code ? String(err.code) : "Failed to create user");
    }
  };

  const openEditUser = (u: any) => {
    setEditingUserId(u.id);
    setEditName(u.name || '');
    setEditEmail(u.email || '');
    setEditRole((u.role === 'Teacher' ? 'Teacher' : 'Admin') as any);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUserId(null);
    setEditName('');
    setEditEmail('');
    setEditRole('Admin');
  };

  const handleEditUser = async () => {
    if (!editingUserId) return;
    if (!editName || !editEmail) { alert("Name and email are required"); return; }

    setSavingEdit(true);
    try {
      await updateDoc(doc(db, 'users', editingUserId), {
        name: editName,
        email: editEmail,
        role: editRole,
        updatedAt: Date.now(),
      });
      alert('User updated successfully!');
      closeEditModal();
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Failed to update user');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'users', id));
      alert('User deleted successfully!');
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="animate-in slide-in-from-top-4 duration-500">
      <div className="flex justify-between items-end mb-8">
        <div><h2 className="text-3xl font-black text-gray-800">User Management</h2><p className="text-gray-500">Manage teacher and admin accounts</p></div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:bg-blue-700 transition active:scale-95"><Plus size={20} />Add User</button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-800">Add New User</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={24} /></button>
            </div>
            <div className="space-y-5">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="w-full bg-gray-50 border rounded-2xl p-4" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full bg-gray-50 border rounded-2xl p-4" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min. 6 chars)"
                className="w-full bg-gray-50 border rounded-2xl p-4"
              />
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-gray-50 border rounded-2xl p-4"><option>Admin</option><option>Teacher</option></select>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-bold text-gray-400">Cancel</button>
              <button onClick={handleCreateUser} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black">Create User</button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && editingUserId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-800">Edit User</h3>
              <button onClick={closeEditModal} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={24} /></button>
            </div>
            <div className="space-y-5">
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Full Name" className="w-full bg-gray-50 border rounded-2xl p-4" />
              <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email" className="w-full bg-gray-50 border rounded-2xl p-4" />
              <select value={editRole} onChange={(e) => setEditRole(e.target.value as any)} className="w-full bg-gray-50 border rounded-2xl p-4"><option>Admin</option><option>Teacher</option></select>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={closeEditModal} disabled={savingEdit} className="flex-1 py-4 font-bold text-gray-400 disabled:opacity-60">Cancel</button>
              <button onClick={handleEditUser} disabled={savingEdit} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black disabled:opacity-60">{savingEdit ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6 mb-8">
        <StatCard icon={<Users className="text-blue-500" />} label="Total Users" value={users.length} bgColor="bg-blue-50" />
        <StatCard icon={<ShieldCheck className="text-purple-500" />} label="Admins" value={users.filter(u => u.role === "Admin").length} bgColor="bg-purple-50" />
        <StatCard icon={<UserCircle className="text-green-500" />} label="Teachers" value={users.filter(u => u.role === "Teacher").length} bgColor="bg-green-50" />
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6">
        <table className="w-full text-left">
          <thead className="text-[10px] text-gray-400 uppercase tracking-widest border-b border-gray-50">
            <tr><th className="p-4">User</th><th className="p-4 text-center">Role</th><th className="p-4 text-center">Status</th><th className="p-4">Last Active</th><th className="p-4">Actions</th></tr>
          </thead>
          <tbody className="text-sm font-medium text-gray-700">
            {users.map((u) => (
              <UserRow
                key={u.id}
                initials={u.name?.charAt(0)}
                name={u.name}
                email={u.email}
                role={u.role}
                color="bg-blue-500"
                rColor="bg-blue-100 text-blue-600"
                onEdit={() => openEditUser(u)}
                onDelete={() => handleDeleteUser(u.id)}
                deleting={deletingId === u.id}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-100 p-8 rounded-[2rem]">
        <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2"><ShieldCheck size={20} />User Roles</h4>
        <div className="space-y-2 text-sm text-blue-900">
          <p><span className="font-black">Admin:</span> Full access to all features, can manage users and content.</p>
          <p><span className="font-black">Teacher:</span> Can create and manage questions, view analytics.</p>
        </div>
      </div>
    </div>
  );
}

function SyncView() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [lastSync, setLastSync] = useState("Never");
  const [syncVersion, setSyncVersion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [syncLog, setSyncLog] = useState<{ time: string; count: number; version: number }[]>([]);
  const [syncResult, setSyncResult] = useState<"success" | "error" | null>(null);
  const [categoryTimers, setCategoryTimers] = useState({
    generalEd: 30,
    profEd: 30,
    major: 30,
  });
  const [savingTimer, setSavingTimer] = useState<string | null>(null);
  const [timerSaved, setTimerSaved] = useState<string | null>(null);

  useEffect(() => { fetchQuestions(); fetchSyncMeta(); }, []);

  const fetchQuestions = async () => {
    try { const snap = await getDocs(collection(db, "questions")); setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() }))); } catch (err) { console.log(err); }
  };

  const fetchSyncMeta = async () => {
    try {
      const snap = await getDoc(doc(db, "settings", "sync"));
      if (snap.exists()) {
        const data = snap.data();
        setLastSync(data.lastSync || "Never");
        setSyncVersion(data.version || 0);
        setSyncLog(data.log || []);
      }
      const timerSnap = await getDoc(doc(db, "settings", "quiz"));
      if (timerSnap.exists()) {
        const d = timerSnap.data();
        setCategoryTimers({
          generalEd: d.generalEd || 30,
          profEd: d.profEd || 30,
          major: d.major || 30,
        });
      }
    } catch (err) { console.log(err); }
  };

  const handleSync = async () => {
    try {
      setLoading(true); setSyncResult(null);
      const now = new Date().toLocaleString();
      const newVersion = syncVersion + 1;
      const snap = await getDocs(collection(db, "questions"));
      const freshQuestions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      await setDoc(doc(db, "published_content", "latest"), { questions: freshQuestions, version: newVersion, publishedAt: now, updatedAt: serverTimestamp(), totalQuestions: freshQuestions.length, categories: [...new Set(freshQuestions.map((q: any) => q.category).filter(Boolean))] });
      const newEntry = { time: now, count: freshQuestions.length, version: newVersion };
      const updatedLog = [newEntry, ...syncLog].slice(0, 10);
      await setDoc(doc(db, "settings", "sync"), { lastSync: now, version: newVersion, totalPublished: freshQuestions.length, log: updatedLog, updatedAt: serverTimestamp() });
      setQuestions(freshQuestions); setLastSync(now); setSyncVersion(newVersion); setSyncLog(updatedLog); setSyncResult("success");
    } catch (err) { console.error("Sync error:", err); setSyncResult("error"); }
    finally { setLoading(false); }
  };

  const handleSaveTimer = async (categoryKey: string) => {
    setSavingTimer(categoryKey);
    setTimerSaved(null);
    try {
      await setDoc(doc(db, "settings", "quiz"), {
        [categoryKey]: Number(categoryTimers[categoryKey as keyof typeof categoryTimers]),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setTimerSaved(categoryKey);
      setTimeout(() => setTimerSaved(null), 3000);
    } catch (err) {
      console.error("Failed to save timer:", err);
      alert("Failed to save timer setting.");
    } finally {
      setSavingTimer(null);
    }
  };

  const categories = [...new Set(questions.map((q: any) => q.category).filter(Boolean))];

  return (
    <div className="animate-in zoom-in-95 duration-500">
      <h2 className="text-3xl font-black text-gray-800 mb-2">Content Sync</h2>
      <p className="text-gray-500 mb-10">Push updates to student devices</p>
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard icon={<FileText className="text-blue-500" />} label="Questions Ready" value={questions.length} bgColor="bg-blue-50" />
        <StatCard icon={<Layers className="text-green-500" />} label="Categories" value={categories.length} bgColor="bg-green-50" />
        <StatCard icon={<CheckCircle className="text-purple-500" />} label="Sync Version" value={syncVersion > 0 ? `v${syncVersion}` : "—"} bgColor="bg-purple-50" />
        <StatCard icon={<Activity className="text-orange-500" />} label="Status" value={loading ? "Syncing..." : syncVersion > 0 ? "Published" : "Not Synced"} bgColor="bg-orange-50" />
      </div>
      <div className="bg-white p-12 rounded-[2rem] shadow-sm border border-gray-100 text-center mb-8">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${syncResult === "success" ? "bg-green-50" : syncResult === "error" ? "bg-red-50" : "bg-gray-50"}`}>
          <RefreshCw className={`${syncResult === "success" ? "text-green-500" : syncResult === "error" ? "text-red-400" : "text-gray-400"} ${loading ? "animate-spin" : ""}`} size={48} />
        </div>
        <h3 className="text-2xl font-black text-gray-800 mb-2">{syncResult === "success" ? "Sync Complete!" : syncResult === "error" ? "Sync Failed" : syncVersion > 0 ? `Published — v${syncVersion}` : "Ready to Publish"}</h3>
        <p className="text-gray-500 mb-2 max-w-md mx-auto text-sm">{syncResult === "success" ? `${questions.length} questions published as v${syncVersion}.` : syncResult === "error" ? "Something went wrong. Try again." : "Press Sync Now to publish all questions to student devices."}</p>
        {lastSync !== "Never" && <p className="text-xs text-gray-400 font-bold mb-8">Last synced: {lastSync}</p>}
        {lastSync === "Never" && <div className="mb-8" />}
        <button onClick={handleSync} disabled={loading} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 mx-auto shadow-xl hover:bg-blue-700 active:scale-95 transition disabled:opacity-50">
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />{loading ? "Publishing..." : "Sync Now"}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-6 text-gray-800">Content Snapshot</h3>
          <div className="space-y-4 text-sm font-bold text-gray-700">
            <div className="flex justify-between border-b border-gray-50 pb-4"><span>Total Questions</span><span className="text-black">{questions.length}</span></div>
            {categories.map((cat, i) => <div key={i} className="flex justify-between border-b border-gray-50 pb-4 last:border-0 last:pb-0"><span className="text-gray-500">{cat}</span><span className="text-black">{questions.filter((q: any) => q.category === cat).length} questions</span></div>)}
            {categories.length === 0 && <p className="text-gray-400 text-xs">No questions added yet.</p>}
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-6 text-gray-800">Sync History</h3>
          {syncLog.length === 0 ? <p className="text-sm text-gray-400">No sync history yet.</p> : (
            <div className="space-y-3">
              {syncLog.map((entry, i) => (
                <div key={i} className="flex justify-between items-center text-sm border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                  <div><p className="font-black text-gray-800 text-xs">v{entry.version}</p><p className="text-[10px] text-gray-400 font-bold">{entry.time}</p></div>
                  <span className="bg-blue-50 text-blue-600 font-black text-xs px-3 py-1 rounded-full">{entry.count} questions</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Timer Settings */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 mb-8">
        <h3 className="font-bold text-lg mb-2 text-gray-800 flex items-center gap-2">
          <Activity size={20} className="text-orange-500" />
          Quiz Timer Settings
        </h3>
        <p className="text-sm text-gray-400 mb-6">
          Set how many seconds students get per question, per category.
        </p>
        <div className="space-y-6">
          {[
            { key: 'generalEd', label: 'General Education', emoji: '📚', color: 'border-blue-200 focus:border-blue-400', badge: 'bg-blue-50 text-blue-700' },
            { key: 'profEd', label: 'Professional Education', emoji: '🎓', color: 'border-purple-200 focus:border-purple-400', badge: 'bg-purple-50 text-purple-700' },
            { key: 'major', label: 'Major/Specialization', emoji: '⭐', color: 'border-orange-200 focus:border-orange-400', badge: 'bg-orange-50 text-orange-700' },
          ].map(({ key, label, emoji, color, badge }) => (
            <div key={key} className="border border-gray-100 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">{emoji}</span>
                <span className={`text-xs font-black px-3 py-1 rounded-full ${badge}`}>{label}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">Seconds per question</label>
                  <input
                    type="number"
                    min={10}
                    max={300}
                    value={categoryTimers[key as keyof typeof categoryTimers]}
                    onChange={e => setCategoryTimers(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    className={`w-full bg-gray-50 border rounded-2xl p-4 text-2xl font-black text-gray-800 focus:outline-none transition ${color}`}
                  />
                  <p className="text-xs text-gray-400 mt-2 font-medium">
                    = {Math.floor(categoryTimers[key as keyof typeof categoryTimers] / 60) > 0 ? `${Math.floor(categoryTimers[key as keyof typeof categoryTimers] / 60)}m ` : ''}{categoryTimers[key as keyof typeof categoryTimers] % 60}s per question
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2 pt-6">
                  <button
                    onClick={() => handleSaveTimer(key)}
                    disabled={savingTimer === key}
                    className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-orange-100 hover:bg-orange-600 active:scale-95 transition disabled:opacity-50 flex items-center gap-2 text-sm"
                  >
                    {savingTimer === key ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
                    ) : 'Save'}
                  </button>
                  {timerSaved === key && (
                    <span className="text-green-600 text-xs font-black flex items-center gap-1">
                      <CheckCircle size={13} /> Saved!
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-4 flex gap-2 flex-wrap">
                {[{ label: '30s', value: 30 }, { label: '45s', value: 45 }, { label: '1 min', value: 60 }, { label: '1.5 min', value: 90 }, { label: '2 min', value: 120 }].map(preset => (
                  <button
                    key={preset.value}
                    onClick={() => setCategoryTimers(prev => ({ ...prev, [key]: preset.value }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition border ${categoryTimers[key as keyof typeof categoryTimers] === preset.value ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-orange-300 hover:text-orange-500'}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-8 rounded-[2rem]">
        <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2"><Info size={18} /> How Sync Works</h4>
        <ul className="space-y-2 text-xs font-bold text-blue-800 opacity-80 list-disc pl-5">
          <li>Clicking "Sync Now" packages all questions into a published content snapshot on Firestore.</li>
          <li>Student apps check the version number on startup — if it's newer, they download the update.</li>
          <li>Downloaded content is saved locally so students can use the app fully offline.</li>
          <li>Always sync after adding new questions or editing existing ones.</li>
        </ul>
      </div>
    </div>
  );
}

// SUB-COMPONENTS
function NavItem({ icon, label, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-300 ${active ? 'bg-[#EF4444] text-white shadow-[0_10px_20px_rgba(239,68,68,0.3)]' : 'text-white hover:bg-gray-600/50 hover:text-white'}`}>
      {icon}<span className="font-bold text-sm tracking-wide">{label}</span>
    </div>
  );
}
function StatCard({ icon, label, value, bgColor }: any) {
  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm flex items-center gap-5 border border-gray-100 hover:shadow-md transition">
      <div className={`p-4 rounded-2xl ${bgColor} scale-110`}>{icon}</div>
      <div><p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{label}</p><p className="text-3xl font-black text-gray-800 leading-none">{value}</p></div>
    </div>
  );
}
function ProgressItem({ label, value, max, color, suffix = "" }: any) {
  return (
    <div>
      <div className="flex justify-between text-xs font-black mb-2 text-gray-800 uppercase tracking-tighter"><span>{label}</span><span className="text-blue-600">{value}{suffix}</span></div>
      <div className="w-full bg-gray-100 rounded-full h-3"><div className={`${color} h-3 rounded-full transition-all duration-1000`} style={{ width: `${(value / max) * 100}%` }}></div></div>
    </div>
  );
}
function AttemptItem({ label, date, score }: any) {
  return (
    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-[1.5rem] border border-gray-100">
      <div><p className="font-black text-sm text-gray-800 uppercase tracking-tight">{label}</p><p className="text-[10px] font-bold text-gray-400">{date}</p></div>
      <span className="bg-orange-100 text-orange-600 font-black text-xs px-4 py-1.5 rounded-full">{score}</span>
    </div>
  );
}
function TrendItem({ rank, label, score, date, color, badge }: any) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <div className={`${color} w-10 h-10 rounded-full flex items-center justify-center font-black text-xs`}>{rank}</div>
        <div><p className="font-bold text-gray-800 text-sm">{label}</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{date}</p></div>
      </div>
      <span className={`${badge} font-black text-xs px-4 py-1.5 rounded-full`}>{score}</span>
    </div>
  );
}
function ActionCard({ icon, title, desc, color }: any) {
  return (
    <div className={`${color} p-8 rounded-[2.5rem] text-white cursor-pointer hover:scale-[1.03] active:scale-95 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.1)] group`}>
      <div className="bg-white/20 w-fit p-3 rounded-2xl mb-6 group-hover:rotate-12 transition-transform">{icon}</div>
      <h3 className="text-2xl font-black mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-white/70 font-medium">{desc}</p>
    </div>
  );
}
function CategoryCard({ title, desc, count, color, icon }: any) {
  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-300">
      <div className={`${color} p-8 text-white relative`}>
        <span className="text-4xl absolute right-6 top-6 opacity-40 group-hover:scale-125 transition-transform">{icon}</span>
        <h3 className="text-2xl font-black mb-2 max-w-[150px] leading-tight">{title}</h3>
        <p className="text-xs text-white/70 font-medium leading-relaxed">{desc}</p>
      </div>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Questions</span><span className="text-xl font-black">{count}</span></div>
        <div className="w-full bg-gray-100 h-2 rounded-full mb-6"><div className={`${color} h-2 rounded-full`} style={{ width: `${(count / 4) * 100}%` }}></div></div>
        <button className="w-full bg-gray-50 py-3 rounded-xl text-gray-600 font-bold text-sm hover:bg-gray-100 transition">View Questions</button>
      </div>
    </div>
  );
}
function DistCard({ label, value, color }: any) {
  return (
    <div className={`${color} border p-6 rounded-[2rem] text-center`}>
      <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-70">{label}</p>
      <p className="text-4xl font-black">{value}</p>
    </div>
  );
}
function UserRow({ initials, name, email, role, color, rColor, onEdit, onDelete, deleting }: any) {
  return (
    <tr className="hover:bg-gray-50 transition border-b border-gray-50 last:border-0">
      <td className="p-5 flex items-center gap-4">
        <div className={`${color} w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm`}>{initials}</div>
        <div><p className="font-black text-gray-800 text-sm tracking-tight">{name}</p><p className="text-xs font-medium text-gray-400">{email}</p></div>
      </td>
      <td className="p-5 text-center"><span className={`${rColor} text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest`}>{role}</span></td>
      <td className="p-5 text-center"><span className="bg-green-100 text-green-600 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest italic">Active</span></td>
      <td className="p-5 text-xs font-bold text-gray-400 tracking-tight">2026-04-25</td>
      <td className="p-5">
        <div className="flex gap-4 font-black text-[10px] uppercase tracking-widest">
          <button type="button" onClick={onEdit} className="text-blue-600 hover:underline disabled:opacity-40" disabled={!!deleting}>Edit</button>
          <button type="button" onClick={onDelete} className="text-red-500 hover:underline disabled:opacity-40" disabled={deleting}>{deleting ? 'Removing...' : 'Remove'}</button>
        </div>
      </td>
    </tr>
  );
}

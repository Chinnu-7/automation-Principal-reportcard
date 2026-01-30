import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import SchoolUpload from './components/SchoolUpload';
import AdminPanel from './components/AdminPanel';

function Navigation() {
    const location = useLocation();

    return (
        <nav className="nav">
            <div className="nav-container">
                <div className="nav-brand">📊 NSF School Reports</div>
                <ul className="nav-links">
                    <li>
                        <Link
                            to="/"
                            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                        >
                            School Upload
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/admin"
                            className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
                        >
                            Admin Panel
                        </Link>
                    </li>
                </ul>
            </div>
        </nav>
    );
}

function App() {
    // Basic check to verify Supabase connection
    useEffect(() => {
        if (supabase) {
            console.log('Supabase client initialized:', supabase);
        } else {
            console.warn('Supabase client not active. Check VITE_SUPABASE_URL in .env');
        }
    }, []);

    return (
        <Router>
            <Navigation />
            <Routes>
                <Route path="/" element={<SchoolUpload />} />
                <Route path="/admin" element={<AdminPanel />} />
            </Routes>
        </Router>
    );
}

export default App;

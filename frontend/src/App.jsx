import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
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

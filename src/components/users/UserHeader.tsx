import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Book, Calendar, UserCheck, Star, BookOpen, LogOut, Library, ChevronDown, LayoutDashboard } from 'lucide-react';

interface UserHeaderProps {
    username: string;
    onLogout: () => void;
}

const UserHeader: React.FC<UserHeaderProps> = ({ username, onLogout }) => {
    const location = useLocation();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close on Escape and when route changes for cleaner UX
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsDropdownOpen(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);
    useEffect(() => {
        setIsDropdownOpen(false);
    }, [location.pathname]);

    const navigationTabs = [
        { name: 'Dashboard', path: '/user/dashboard', icon: <LayoutDashboard size={18} /> },
        { name: 'Books', path: '/user/books', icon: <Book size={18} /> },
        { name: 'Reservations', path: '/user/reservation', icon: <Calendar size={18} /> },
        { name: 'Membership', path: '/user/membership', icon: <UserCheck size={18} /> },
        { name: 'Recommendations', path: '/user/recommendations', icon: <Star size={18} /> },
        { name: 'Borrows', path: '/user/borrows', icon: <BookOpen size={18} /> }
    ];

    // Smarter active detection (matches subroutes)
    const isActive = (path: string) =>
        location.pathname === path || location.pathname.startsWith(path + '/');

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 md:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo Section */}
                    <Link to="/user/dashboard" className="flex items-center space-x-3 hover:opacity-90 transition-opacity duration-300 flex-shrink-0">
                        <div className="flex items-center justify-center w-11 h-11 bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 rounded-2xl shadow-lg shadow-blue-500/20">
                            <Library className="h-5 w-5 text-white" />
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 tracking-tight">
                                BookHive
                            </p>
                        </div>
                    </Link>

                    {/* Navigation Tabs - Premium Floating Pills Design */}
                    <nav className="hidden lg:flex items-center gap-2 bg-slate-50/60 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-200/60 shadow-sm">
                        {navigationTabs.map(tab => {
                            const active = isActive(tab.path);
                            return (
                                <Link
                                    key={tab.path}
                                    to={tab.path}
                                    className={`relative group flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-300 overflow-hidden ${
                                        active
                                            ? 'shadow-lg shadow-blue-500/30'
                                            : ''
                                    }`}
                                >
                                    {/* Active Background with Gradient */}
                                    {active && (
                                        <span className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 rounded-xl z-0" />
                                    )}
                                    
                                    {/* Shimmer Effect on Active */}
                                    {active && (
                                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-xl z-[1]" />
                                    )}
                                    
                                    {/* Hover Background for Inactive */}
                                    {!active && (
                                        <span className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl z-0" />
                                    )}

                                    <span className={`relative z-20 ${active ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'} transition-colors duration-300`}>
                                        {tab.icon}
                                    </span>
                                    <span className={`relative z-20 ${active ? 'text-white' : 'text-slate-900 group-hover:text-blue-600'} transition-colors duration-300`}>
                                        {tab.name}
                                    </span>
                                    
                                    {/* Subtle Glow on Active */}
                                    {active && (
                                        <span className="absolute -inset-1 bg-blue-500/20 blur-xl rounded-xl -z-10" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Section - Mobile Menu Toggle + User Dropdown */}
                    <div className="flex items-center space-x-4">
                        {/* Mobile Navigation Toggle */}
                        <div className="lg:hidden">
                            <button className="p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 active:scale-95">
                                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>

                        {/* Soft divider on large screens */}
                        <div className="hidden lg:block h-8 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent" />

                        {/* User Section */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                aria-haspopup="menu"
                                aria-expanded={isDropdownOpen}
                                aria-controls="user-menu"
                                className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-br from-white to-slate-50/50 hover:from-slate-50 hover:to-white border border-slate-200/70 hover:border-slate-300/70 rounded-xl transition-all duration-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 active:scale-[0.98]"
                            >
                                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30 ring-2 ring-white">
                                    <span className="text-[13px] font-black text-white">
                                        {(username || 'U').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <span className="hidden md:block text-sm font-semibold text-slate-800">
                                    {username || 'User'}
                                </span>
                                <ChevronDown
                                    size={16}
                                    className={`text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div
                                    id="user-menu"
                                    role="menu"
                                    className="absolute right-0 top-full mt-3 w-60 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5 border border-slate-200/60 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                                >
                                    <div className="px-4 py-3.5 border-b border-slate-100/80">
                                        <p className="text-sm font-bold text-slate-900">{username || 'User'}</p>
                                        <p className="text-xs text-slate-500 mt-1 font-medium">Library Member</p>
                                    </div>
                                    <div className="p-2">
                                        <button
                                            onClick={() => {
                                                onLogout();
                                                setIsDropdownOpen(false);
                                            }}
                                            className="flex items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl transition-all duration-300 w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40 active:scale-[0.98] shadow-lg shadow-red-500/20"
                                        >
                                            <LogOut size={17} />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </header>
    );
};

export default UserHeader;
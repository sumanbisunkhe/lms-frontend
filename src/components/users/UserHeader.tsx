import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Book, Calendar, UserCheck, Star, BookOpen, LogOut, Library, ChevronDown } from 'lucide-react';

interface UserHeaderProps {
    username: string;
    onLogout: () => void;
}

const UserHeader: React.FC<UserHeaderProps> = ({ username, onLogout }) => {
    const location = useLocation();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Define the navigation tabs
    const navigationTabs = [
        {
            name: 'Books',
            path: '/user/books',
            icon: <Book size={20} />
        },
        {
            name: 'Reservations',
            path: '/user/reservation',
            icon: <Calendar size={20} />
        },
        {
            name: 'Membership',
            path: '/user/membership',
            icon: <UserCheck size={20} />
        },
        {
            name: 'Ratings',
            path: '/user/ratings',
            icon: <Star size={20} />
        },
        {
            name: 'Borrows',
            path: '/user/borrows',
            icon: <BookOpen size={20} />
        }
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 shadow-sm">
            <div className="max-w-8xl mx-auto px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo Section */}
                    <Link to="/user-dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-md">
                            <Library className="h-6 w-6 text-white" />
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent">
                                BookHive
                            </p>
                        </div>
                    </Link>

                    {/* Navigation Tabs */}
                    <nav className="flex items-center space-x-1">
                        {navigationTabs.map(tab => (
                            <Link
                                key={tab.path}
                                to={tab.path}
                                className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${location.pathname === tab.path
                                    ? 'bg-white text-blue-700 shadow-md border border-blue-100'
                                    : 'text-slate-600 hover:text-blue-700 hover:bg-white/70'
                                    }`}
                            >
                                <span className={`${location.pathname === tab.path ? 'text-blue-600' : 'text-slate-500'
                                    }`}>
                                    {tab.icon}
                                </span>
                                <span className="hidden lg:block">{tab.name}</span>
                                {location.pathname === tab.path && (
                                    <div className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" />
                                )}
                            </Link>
                        ))}
                    </nav>

                    {/* User Section */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center space-x-3 px-3 py-2 
               bg-white hover:bg-gray-50 
               border border-gray-200 hover:border-gray-300 
               rounded-lg transition-all duration-200 hover:shadow-md"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                                <span className="text-xs font-semibold text-white">
                                    {(username || 'U').charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <span className="hidden md:block text-sm font-medium text-gray-700">
                                {username || 'User'}
                            </span>
                            <ChevronDown
                                size={16}
                                className={`text-gray-600 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''
                                    }`}
                            />
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 
                    bg-white rounded-lg shadow-lg 
                    border border-slate-200 py-2 z-50">
                                <div className="px-4 py-2 border-b border-slate-100">
                                    <p className="text-sm font-medium text-slate-700">{username || 'User'}</p>
                                    <p className="text-xs text-slate-500">Library Member</p>
                                </div>
                                <button
                                    onClick={() => {
                                        onLogout();
                                        setIsDropdownOpen(false);
                                    }}
                                    className="flex items-center space-x-2 px-3 py-2 mx-4 my-1 text-left 
             text-sm text-white 
             bg-red-500 hover:bg-red-600 
             rounded-md transition-colors duration-200 border-0"
                                    style={{
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        border: 'none'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#dc2626';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#ef4444';
                                    }}
                                >
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </button>

                            </div>
                        )}
                    </div>

                </div>
            </div>
        </header>
    );
};

export default UserHeader;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Book, Clock, Hash, Layers, User, Building, AlertCircle, Loader2, Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import UserHeader from '../../components/users/UserHeader';
import { showToast } from '../../utils/toast';

interface DocumentData {
    id: number;
    url: string | null;
    document: null;
    documentType: string;
    fileName: string;
    createdAt: string;
}

interface BookData {
    id: number;
    title: string;
    author: string;
    publisher: string;
    isbn: string;
    genre: string;
    totalCopies: number | null;
    availableCopies: number | null;
    isAvailable: boolean;
    documents: DocumentData[];
    createdAt: string;
    updatedAt: string;
}

interface BookResponse {
    data: BookData;
    message: string;
    status: number;
    success: boolean;
}

const BookDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const [book, setBook] = useState<BookData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [documentUrls, setDocumentUrls] = useState<Record<number, string>>({});

    // Borrow Modal State
    const [showBorrowModal, setShowBorrowModal] = useState(false);
    const [selectedReturnDate, setSelectedReturnDate] = useState<Date | null>(null);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const fetchDocumentUrl = async (documentId: number): Promise<string | null> => {
        if (documentUrls[documentId]) {
            return documentUrls[documentId];
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:8080/api/document/${documentId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.data.url) {
                setDocumentUrls(prev => ({
                    ...prev,
                    [documentId]: result.data.url
                }));
                return result.data.url;
            }
        } catch (err) {
            console.error('Failed to fetch document URL:', err);
        }

        return null;
    };

    const getCoverImageUrl = (bookData: BookData): string | null => {
        const coverDocument = bookData.documents?.find(doc =>
            doc.documentType.includes('cover') || doc.documentType === '"cover"'
        );

        if (coverDocument) {
            if (coverDocument.url) {
                return coverDocument.url;
            }

            if (documentUrls[coverDocument.id]) {
                return documentUrls[coverDocument.id];
            }
        }

        return null;
    };

    const fetchBookDetails = async () => {
        if (!id) return;

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:8080/book/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result: BookResponse = await response.json();

            if (result.success) {
                setBook(result.data);

                // Check for cover image and fetch if needed
                const coverDocument = result.data.documents?.find(doc =>
                    doc.documentType.includes('cover') || doc.documentType === '"cover"'
                );

                if (coverDocument && !coverDocument.url) {
                    fetchDocumentUrl(coverDocument.id);
                }
            } else {
                throw new Error(result.message || 'Failed to fetch book details');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch book details';
            setError(errorMessage);
            showToast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookDetails();
    }, [id]);

    const handleBorrowClick = () => {
        setSelectedReturnDate(null);
        setShowBorrowModal(true);
    };

    const handleBorrowCancel = () => {
        setShowBorrowModal(false);
        setSelectedReturnDate(null);
    };

    const handleBorrowConfirm = async () => {
        if (!book || !selectedReturnDate) {
            const errorMessage = 'Please select a return date';
            showToast.error(errorMessage);
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const borrowData = {
                returnDate: selectedReturnDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
                books: {
                    id: book.id
                },
                users: {
                    id: user?.id || parseInt(user?.userId || '0')
                }
            };

            console.log('Borrowing book with data:', borrowData);

            const response = await fetch(`http://localhost:8080/borrow/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(borrowData)
            });

            if (response.ok) {
                setShowBorrowModal(false);
                setSelectedReturnDate(null);
                showToast.success('Book borrowed successfully!');
                // Refresh book details after successful borrow
                fetchBookDetails();
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to borrow book');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to borrow book';
            showToast.error(errorMessage);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
                <UserHeader username={user?.username || 'User'} onLogout={handleLogout} />
                <div className="flex justify-center items-center min-h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                            <Loader2 className="relative h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                        </div>
                        <span className="text-gray-700 font-semibold">Loading book details...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !book) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
                <UserHeader username={user?.username || 'User'} onLogout={handleLogout} />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 flex items-center shadow-sm">
                        <AlertCircle className="h-6 w-6 text-red-500 mr-4 flex-shrink-0" />
                        <span className="text-red-700 font-medium text-lg">{error || 'Book not found'}</span>
                        <button
                            onClick={() => navigate('/user/books')}
                            className="ml-auto px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const coverUrl = getCoverImageUrl(book);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
            <UserHeader username={user?.username || 'User'} onLogout={handleLogout} />

            <main className="pt-24 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/user/books')}
                        className="group flex items-center text-gray-600 hover:text-blue-600 mb-8 transition-colors duration-200"
                    >
                        <div className="p-2 bg-white rounded-full shadow-sm border border-gray-200 group-hover:border-blue-200 group-hover:bg-blue-50 mr-3 transition-all">
                            <ArrowLeft className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-lg">Back to Books</span>
                    </button>

                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden">
                        <div className="flex flex-col lg:flex-row">
                            {/* Left Column: Image */}
                            <div className="lg:w-1/3 bg-gradient-to-br from-slate-100 to-slate-200 p-8 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>

                                <div className="relative z-10 w-full max-w-sm aspect-[2/3] shadow-2xl rounded-lg overflow-hidden transform transition-transform hover:scale-105 duration-500">
                                    {coverUrl ? (
                                        <img
                                            src={coverUrl}
                                            alt={`Cover of ${book.title}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                const parent = target.parentElement;
                                                if (parent && !parent.querySelector('.fallback-icon')) {
                                                    const iconDiv = document.createElement('div');
                                                    iconDiv.className = 'flex items-center justify-center w-full h-full bg-slate-800 fallback-icon';
                                                    iconDiv.innerHTML = '<svg class="h-24 w-24 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253z"></path></svg>';
                                                    parent.appendChild(iconDiv);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                            <Book className="h-32 w-32 text-white/50" />
                                        </div>
                                    )}

                                    {/* Availability Badge Overlay */}
                                    <div className="absolute top-4 right-4">
                                        <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-black shadow-lg backdrop-blur-md ${book.isAvailable && (book.availableCopies === null || book.availableCopies > 0)
                                            ? 'bg-green-500/90 text-white'
                                            : 'bg-red-500/90 text-white'
                                            }`}>
                                            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                                            {book.isAvailable && (book.availableCopies === null || book.availableCopies > 0) ? 'Available' : 'Unavailable'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Details */}
                            <div className="lg:w-2/3 p-8 lg:p-12">
                                <div className="mb-2">
                                    <span className="inline-block px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold tracking-wide uppercase">
                                        {book.genre}
                                    </span>
                                </div>

                                <h1 className="text-4xl font-black text-gray-900 mb-2 leading-tight">
                                    {book.title}
                                </h1>

                                <div className="flex items-center text-lg text-gray-600 mb-8 font-medium">
                                    <User className="h-5 w-5 mr-2 text-blue-500" />
                                    {book.author}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex items-center mb-2 text-gray-500 text-sm font-bold uppercase tracking-wider">
                                            <Building className="h-4 w-4 mr-2" />
                                            Publisher
                                        </div>
                                        <div className="text-gray-900 font-bold text-lg">{book.publisher}</div>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex items-center mb-2 text-gray-500 text-sm font-bold uppercase tracking-wider">
                                            <Hash className="h-4 w-4 mr-2" />
                                            ISBN
                                        </div>
                                        <div className="text-gray-900 font-mono font-bold text-lg">{book.isbn}</div>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex items-center mb-2 text-gray-500 text-sm font-bold uppercase tracking-wider">
                                            <Layers className="h-4 w-4 mr-2" />
                                            Copies
                                        </div>
                                        <div className="flex items-baseline">
                                            <span className={`text-2xl font-black mr-1 ${book.availableCopies! > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {book.availableCopies}
                                            </span>
                                            <span className="text-gray-400 font-medium">/ {book.totalCopies} available</span>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex items-center mb-2 text-gray-500 text-sm font-bold uppercase tracking-wider">
                                            <Clock className="h-4 w-4 mr-2" />
                                            Added On
                                        </div>
                                        <div className="text-gray-900 font-bold text-lg">
                                            {new Date(book.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-100">
                                    <button
                                        onClick={handleBorrowClick}
                                        disabled={!book.isAvailable || (book.availableCopies !== null && book.availableCopies === 0)}
                                        className="flex-1 py-4 px-6 rounded-xl text-lg font-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-violet-500 to-blue-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 active:scale-95"
                                    >
                                        {book.isAvailable && (book.availableCopies === null || book.availableCopies > 0) ? 'Borrow Book' : 'Not Available'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Premium Borrow Modal */}
            {showBorrowModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto border border-slate-200 relative overflow-hidden">
                        {/* Modal Header with Gradient */}
                        <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 px-8 py-6 relative">
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                                <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
                            </div>
                            <div className="relative flex items-center">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl mr-3">
                                    <Book className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-2xl font-black text-white">Borrow Book</h3>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8">
                            <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                                <p className="text-sm text-blue-800 leading-relaxed font-medium">
                                    Please select your planned return date. Remember to return on time to avoid late fees and help other members access our collection.
                                </p>
                            </div>

                            <div className="mb-6">
                                <label className="flex items-center text-sm font-black text-gray-900 mb-3">
                                    <Calendar className="h-5 w-5 mr-2 text-orange-500" />
                                    Return Date <span className="text-red-500 ml-1">*</span>
                                </label>

                                <div className="relative">
                                    <DatePicker
                                        selected={selectedReturnDate}
                                        onChange={(date: Date | null) => setSelectedReturnDate(date)}
                                        minDate={new Date()}
                                        maxDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)}
                                        dateFormat="EEEE, MMMM dd, yyyy"
                                        placeholderText="Click to select return date"
                                        className="w-full px-5 py-4 text-gray-900 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 font-bold text-center hover:border-orange-300"
                                        wrapperClassName="w-full"
                                        todayButton="Select Today"
                                        showPopperArrow={false}
                                        popperClassName="!z-[10004]"
                                        popperPlacement="bottom"
                                        fixedHeight
                                    />
                                </div>

                                <div className="mt-4 p-3 bg-amber-50 border-2 border-amber-200 rounded-xl">
                                    <p className="text-xs text-amber-800 flex items-center font-semibold">
                                        <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                                        Maximum borrowing period is 90 days from today
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-6 border-t-2 border-gray-100">
                                <button
                                    onClick={handleBorrowCancel}
                                    className="flex-1 px-6 py-3.5 text-sm font-black text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBorrowConfirm}
                                    disabled={!selectedReturnDate}
                                    className="flex-1 px-6 py-3.5 text-sm font-black text-white bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-300 shadow-xl hover:shadow-2xl disabled:shadow-none active:scale-95"
                                >
                                    Confirm Borrow
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Portal container for DatePicker */}
            <div id="date-picker-portal"></div>
        </div>
    );
};

export default BookDetailsPage;

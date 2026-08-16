import React from 'react';
import { Link } from 'react-router-dom';
import CVComponent from '../components/CVComponent';
import { useAuth } from '../contexts/AuthContext';
import { Pencil } from 'lucide-react';

const CVPage = () => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto py-8 px-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Interactive CV Builder</h1>
                    <p className="text-gray-600">Your live CV preview — download it as an image with one click</p>
                    {user && (
                        <div className="mt-4">
                            <Link
                                to="/dashboard/cv-editor"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                <Pencil size={16} /> Edit this CV in Dashboard
                            </Link>
                        </div>
                    )}
                </div>
                <CVComponent />
            </div>
        </div>
    );
};

export default CVPage;
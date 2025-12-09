import React from 'react';
import CVComponent from '../components/CVComponent';

const CVPage = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto py-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Interactive CV Builder</h1>
                    <p className="text-gray-600">Download your professional CV as an image with one click</p>
                </div>
                <CVComponent />
            </div>
        </div>
    );
};

export default CVPage;

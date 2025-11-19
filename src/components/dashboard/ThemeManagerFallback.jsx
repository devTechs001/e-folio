import React from 'react';

const ThemeManagerFallback = () => {
    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Theme Manager</h2>
            <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded">
                <p className="font-bold">Theme Manager is temporarily unavailable</p>
                <p className="text-sm mt-1">Please try refreshing the page or contact support if the issue persists.</p>
            </div>
        </div>
    );
};

export default ThemeManagerFallback;

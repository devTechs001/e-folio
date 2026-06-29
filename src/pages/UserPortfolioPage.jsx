import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const UserPortfolioPage = () => {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await fetch(`${API_URL}/public/portfolio/${username}`);
        const json = await res.json();
        if (json.success) {
          setData(json);
        } else {
          setError(json.message || 'Portfolio not found');
        }
      } catch (err) {
        setError('Failed to load portfolio');
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">{error}</h1>
          <Link to="/" className="text-cyan-400 hover:text-cyan-300">Back to Home</Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { user, portfolio } = data;
  const theme = portfolio?.theme || {};
  const sections = portfolio?.sections || [];
  const bg = theme.backgroundColor || '#0f172a';
  const tc = theme.textColor || '#f1f5f9';
  const pc = theme.primaryColor || '#2563eb';

  return (
    <div className="min-h-screen" style={{ background: bg, color: tc }}>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm opacity-60 hover:opacity-100 transition-opacity mb-8" style={{ color: tc }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-12">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br mx-auto mb-4 text-3xl font-bold text-white flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${pc}, ${theme.secondaryColor || '#7c3aed'})` }}>
              {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" /> : user.name?.charAt(0)}
            </div>
            <h1 className="text-4xl font-bold mb-2">{user.name}</h1>
            <p className="text-lg opacity-60">@{user.username}</p>
          </div>

          {sections.map((section, i) => (
            <motion.div key={section.id || i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="mb-8 p-6 rounded-xl backdrop-blur-sm border" style={{ background: `${bg}88`, borderColor: `${tc}15` }}>
              {section.content?.title && (
                <h2 className="text-2xl font-bold mb-2" style={{ color: pc }}>{section.content.title}</h2>
              )}
              {section.content?.description && (
                <p className="text-base opacity-70 mb-4">{section.content.description}</p>
              )}
              {section.content?.data && Array.isArray(section.content.data) && (
                <div className="grid gap-4">
                  {section.content.data.map((item, j) => (
                    <div key={j} className="p-4 rounded-lg" style={{ background: `${bg}44`, border: `1px solid ${tc}15` }}>
                      {item.title && <h3 className="font-semibold">{item.title}</h3>}
                      {item.description && <p className="text-sm mt-1" style={{ opacity: 0.6 }}>{item.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default UserPortfolioPage;

import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiService from '../services/api.service';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import {
  Download, FileText, ArrowLeft, Loader2, Printer, Share2, Lock, CheckCircle
} from 'lucide-react';
import CVPreview from '../components/CVPreview';
import { summarizeCv } from '../utils/cvSchema';
import '../styles/UserCVPage.css';

const UserCVPage = () => {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const cvRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const fetchCV = async () => {
      try {
        const json = await apiService.request(`/public/cv/${encodeURIComponent(username)}`);
        if (cancelled) return;
        if (json.success) setData(json);
        else setError(json.message || 'CV not found');
      } catch (err) {
        if (!cancelled) setError('Failed to load CV');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCV();
    return () => { cancelled = true; };
  }, [username]);

  const downloadAsImage = async () => {
    if (!cvRef.current) return;
    setIsGenerating(true);
    try {
      const el = cvRef.current;
      const canvas = await html2canvas(el, {
        scale: 2, useCORS: false, backgroundColor: '#ffffff',
        logging: false, width: el.scrollWidth, height: el.scrollHeight,
        windowWidth: el.scrollWidth, windowHeight: el.scrollHeight
      });
      const link = document.createElement('a');
      link.download = `${(data?.user?.name || 'cv').replace(/\s+/g, '_')}_CV.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('CV image error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAsHtml = () => {
    if (!cvRef.current) return;
    const styles = Array.from(document.querySelectorAll('style'))
      .map(node => node.textContent)
      .join('\n');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${data?.user?.name || 'CV'}</title><style>${styles}</style></head><body>${cvRef.current.outerHTML}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const link = document.createElement('a');
    link.download = `${(data?.user?.name || 'cv').replace(/\s+/g, '_')}_CV.html`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const shareCv = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${data?.user?.name || 'CV'}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // A cancelled share sheet is not an error the visitor needs to see.
    }
  };

  if (loading) {
    return (
      <div className="ucv-state">
        <Loader2 size={36} className="animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="ucv-state">
        <div className="ucv-state-card">
          <span className="ucv-state-icon"><Lock size={22} /></span>
          <h1>CV not available</h1>
          <p>This CV is private or has not been published yet.</p>
          <Link to="/" className="ucv-link">Back to the portfolio</Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const cv = data.cv || {};
  const user = data.user || {};
  const summary = summarizeCv(cv);

  return (
    <div className="ucv-page">
      <div className="ucv-shell">
        <div className="ucv-toolbar">
          <Link to="/" className="ucv-back">
            <ArrowLeft size={16} /> Back to portfolio
          </Link>
          <div className="ucv-actions">
            <button type="button" onClick={downloadAsImage} disabled={isGenerating} className="ucv-btn ucv-btn--primary">
              {isGenerating ? <><Loader2 size={16} className="animate-spin" /> Rendering…</> : <><Download size={16} /> Image</>}
            </button>
            <button type="button" onClick={downloadAsHtml} className="ucv-btn">
              <FileText size={16} /> HTML
            </button>
            <button type="button" onClick={() => window.print()} className="ucv-btn">
              <Printer size={16} /> Print / PDF
            </button>
            <button type="button" onClick={shareCv} className="ucv-btn">
              {copied ? <><CheckCircle size={16} /> Link copied</> : <><Share2 size={16} /> Share</>}
            </button>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="ucv-document" ref={cvRef}>
          <CVPreview cv={cv} />
        </motion.div>

        <div className="ucv-meta">
          <span>{user.name || 'This CV'}</span>
          {user.username && <span className="ucv-meta-dot" aria-hidden="true">•</span>}
          {user.username && <span>@{user.username}</span>}
          <span className="ucv-meta-dot" aria-hidden="true">•</span>
          <span>{summary.counts.experience} roles · {summary.counts.skills} skills · {summary.counts.projects} projects</span>
        </div>
      </div>
    </div>
  );
};

export default UserCVPage;

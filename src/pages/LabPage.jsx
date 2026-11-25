import React from 'react';
import { Link } from 'react-router-dom';
import { FlaskConical, FolderGit2 } from 'lucide-react';
import Header from './Header';
import Lab from './Lab';
import Footer from './Footer';
import '../styles/LandingPage.css';

/**
 * Phase 42 — the Lab as a standalone page.
 *
 * This is the cybersecurity operations module: engagements, builds and research
 * from the bench. It is not a view over the portfolio projects — it reads its
 * own collection through its own endpoint.
 */
const LabPage = () => (
    <div className="min-h-screen bg-bgColor">
        <Header />
        <main className="pt-20">
            <div className="max-w-5xl mx-auto px-4 pt-8">
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-cyan-400">
                    <FlaskConical size={14} />
                    Cybersecurity Operations
                </span>
                <h1 className="mt-2 text-3xl md:text-4xl font-bold text-white">
                    Security Lab
                </h1>
                <p className="mt-2 text-slate-400 max-w-2xl">
                    Engagements, builds and research from the bench — reconnaissance,
                    network and web security, cloud and wireless work. Every entry is
                    scoped to lab infrastructure and owned hardware.
                </p>
            </div>

            <Lab embedded={false} />

            <div className="max-w-5xl mx-auto px-4 pb-16">
                <Link
                    to="/projects"
                    className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition"
                >
                    <FolderGit2 size={16} />
                    Looking for software projects? They are a separate module — open Projects
                </Link>
            </div>
        </main>
        <Footer />
    </div>
);

export default LabPage;

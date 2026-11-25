import React from 'react';
import { Link } from 'react-router-dom';
import { FlaskConical } from 'lucide-react';
import Header from './Header';
import Projects from './Projects';
import Footer from './Footer';
import '../styles/LandingPage.css';

/**
 * Phase 42 — Projects as a standalone page.
 *
 * Projects and the Lab used to be two sections of the landing page, which made
 * them look like one module. They are separate modules with separate data, so
 * each now has its own route.
 */
const ProjectsPage = () => (
    <div className="min-h-screen bg-bgColor">
        <Header />
        <main className="pt-24">
            <Projects />
            <div className="max-w-5xl mx-auto px-4 pb-16">
                <Link
                    to="/lab"
                    className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition"
                >
                    <FlaskConical size={16} />
                    Looking for the security lab? It is a separate module — open the Lab
                </Link>
            </div>
        </main>
        <Footer />
    </div>
);

export default ProjectsPage;

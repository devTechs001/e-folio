import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Header from './components/Header';
import About from './components/About';
import Skills from './components/Skills';
import Education from './components/Education';
import Interests from './components/Interests';
import Projects from './components/Projects';
import Contact from './components/Contact';
import Footer from './components/Footer';
import './index.css';

const App = () => {
    useEffect(() => {
        AOS.init({
            duration: 1000,
            once: true
        });
    }, []);

    return (
        <div>
            <Header />
            <main>
                <About />
                <Skills />
                <Education />
                <Interests />
                <Projects />
                <Contact />
            </main>
            <Footer />
        </div>
    );
};

export default App;


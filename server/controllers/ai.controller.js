class AIController {
    // Generate content using AI
    async generateContent(req, res) {
        try {
            const { prompt, type, context } = req.body;

            if (!prompt) {
                return res.status(400).json({
                    success: false,
                    message: 'Prompt is required'
                });
            }

            // Mock AI response for now (replace with actual OpenAI API call)
            const mockResponses = {
                bio: `I'm a passionate ${context?.title || 'developer'} with expertise in modern web technologies. I love creating innovative solutions that make a difference. My approach combines technical excellence with creative problem-solving to deliver outstanding results.`,
                
                project_description: `This project showcases ${context?.tech || 'cutting-edge technology'} to solve real-world problems. Built with attention to detail and user experience, it demonstrates best practices in ${context?.category || 'software development'}.`,
                
                skill_description: `Expert proficiency in ${prompt}. Extensive experience building scalable applications and solving complex challenges using this technology.`,
                
                hero_tagline: `Building Tomorrow's Digital Experiences Today`,
                
                code: `// Example implementation\nfunction ${context?.functionName || 'solution'}() {\n  // Your code here\n  return result;\n}`
            };

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            const generatedContent = mockResponses[type] || mockResponses.bio;

            res.json({
                success: true,
                content: generatedContent,
                tokens: generatedContent.length,
                type
            });
        } catch (error) {
            console.error('AI generation error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate content'
            });
        }
    }

    // Improve existing content
    async improveContent(req, res) {
        try {
            const { content, instructions } = req.body;

            if (!content) {
                return res.status(400).json({
                    success: false,
                    message: 'Content is required'
                });
            }

            // Simulate improvement
            await new Promise(resolve => setTimeout(resolve, 1000));

            const improved = content
                .split('.')
                .map(s => s.trim())
                .filter(s => s.length > 0)
                .map(s => s.charAt(0).toUpperCase() + s.slice(1))
                .join('. ') + '.';

            res.json({
                success: true,
                original: content,
                improved,
                suggestions: [
                    'Consider adding more specific examples',
                    'Emphasize measurable achievements',
                    'Use active voice for impact'
                ]
            });
        } catch (error) {
            console.error('AI improve error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to improve content'
            });
        }
    }

    // Get suggestions
    async getSuggestions(req, res) {
        try {
            const { category, current } = req.body;

            const suggestions = {
                skills: [
                    { name: 'React', level: 'Expert', category: 'Frontend' },
                    { name: 'Node.js', level: 'Advanced', category: 'Backend' },
                    { name: 'TypeScript', level: 'Intermediate', category: 'Language' }
                ],
                projects: [
                    { title: 'E-commerce Platform', tech: ['React', 'Node.js', 'MongoDB'] },
                    { title: 'Real-time Chat App', tech: ['Socket.io', 'React', 'Express'] }
                ],
                bio_keywords: [
                    'innovative', 'passionate', 'experienced', 'dedicated', 
                    'results-driven', 'collaborative', 'creative', 'analytical'
                ]
            };

            res.json({
                success: true,
                suggestions: suggestions[category] || []
            });
        } catch (error) {
            console.error('AI suggestions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get suggestions'
            });
        }
    }

    // Analyze content
    async analyzeContent(req, res) {
        try {
            const { content, type } = req.body;

            if (!content) {
                return res.status(400).json({
                    success: false,
                    message: 'Content is required'
                });
            }

            // Basic analysis
            const wordCount = content.split(/\s+/).length;
            const sentenceCount = content.split(/[.!?]+/).length - 1;
            const avgWordsPerSentence = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;

            const analysis = {
                wordCount,
                sentenceCount,
                avgWordsPerSentence,
                readabilityScore: Math.min(100, Math.max(0, 100 - (avgWordsPerSentence * 2))),
                tone: wordCount > 50 ? 'professional' : 'casual',
                strengths: [
                    'Clear and concise',
                    'Good structure'
                ],
                improvements: [
                    avgWordsPerSentence > 20 ? 'Consider shorter sentences' : 'Good sentence length',
                    wordCount < 30 ? 'Could be more detailed' : 'Appropriate length'
                ]
            };

            res.json({
                success: true,
                analysis
            });
        } catch (error) {
            console.error('AI analyze error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to analyze content'
            });
        }
    }

    // Generate code snippet
    async generateCode(req, res) {
        try {
            const { description, language = 'javascript' } = req.body;

            await new Promise(resolve => setTimeout(resolve, 1200));

            const codeSnippets = {
                javascript: `// ${description}\nfunction solution() {\n  // Implementation\n  return result;\n}`,
                python: `# ${description}\ndef solution():\n    # Implementation\n    return result`,
                html: `<!-- ${description} -->\n<div class="container">\n  <!-- Your content here -->\n</div>`,
                css: `/* ${description} */\n.container {\n  display: flex;\n  justify-content: center;\n}`
            };

            res.json({
                success: true,
                code: codeSnippets[language] || codeSnippets.javascript,
                language
            });
        } catch (error) {
            console.error('AI code generation error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate code'
            });
        }
    }
}

module.exports = new AIController();

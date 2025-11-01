// services/CodeExecutionService.js
const { VM } = require('vm2');
const axios = require('axios');

class CodeExecutionService {
    constructor() {
        this.supportedLanguages = ['javascript', 'python', 'go', 'java', 'cpp'];
        this.judgeApiUrl = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
        this.judgeApiKey = process.env.JUDGE0_API_KEY;
    }

    /**
     * Execute JavaScript code in sandbox
     */
    async executeJavaScript(code, timeout = 5000) {
        try {
            const vm = new VM({
                timeout,
                sandbox: {
                    console: {
                        log: (...args) => args.join(' '),
                        error: (...args) => args.join(' ')
                    }
                }
            });

            const result = vm.run(code);
            
            return {
                success: true,
                output: String(result),
                executionTime: 0 // VM2 doesn't provide timing
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                executionTime: 0
            };
        }
    }

    /**
     * Execute code using Judge0 API
     */
    async executeCode(code, language, input = '') {
        const languageIds = {
            'javascript': 63,
            'python': 71,
            'java': 62,
            'cpp': 54,
            'c': 50,
            'go': 60,
            'rust': 73,
            'ruby': 72,
            'php': 68
        };

        const languageId = languageIds[language.toLowerCase()];
        
        if (!languageId) {
            throw new Error(`Unsupported language: ${language}`);
        }

        try {
            // Submit code
            const submitResponse = await axios.post(
                `${this.judgeApiUrl}/submissions`,
                {
                    source_code: Buffer.from(code).toString('base64'),
                    language_id: languageId,
                    stdin: Buffer.from(input).toString('base64'),
                    cpu_time_limit: 2,
                    memory_limit: 128000
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-RapidAPI-Key': this.judgeApiKey,
                        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
                    }
                }
            );

            const token = submitResponse.data.token;

            // Poll for result
            let result;
            let attempts = 0;
            const maxAttempts = 10;

            while (attempts < maxAttempts) {
                await this.sleep(1000);
                
                const resultResponse = await axios.get(
                    `${this.judgeApiUrl}/submissions/${token}`,
                    {
                        headers: {
                            'X-RapidAPI-Key': this.judgeApiKey,
                            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
                        }
                    }
                );

                result = resultResponse.data;

                if (result.status.id > 2) {
                    // Execution completed
                    break;
                }

                attempts++;
            }

            // Decode output
            const output = result.stdout 
                ? Buffer.from(result.stdout, 'base64').toString()
                : '';
            
            const error = result.stderr
                ? Buffer.from(result.stderr, 'base64').toString()
                : result.compile_output
                    ? Buffer.from(result.compile_output, 'base64').toString()
                    : '';

            return {
                success: result.status.id === 3,
                output,
                error,
                executionTime: result.time,
                memory: result.memory,
                status: result.status.description
            };
        } catch (error) {
            console.error('Code execution error:', error);
            throw error;
        }
    }

    /**
     * Validate code for security issues
     */
    validateCode(code, language) {
        const dangerousPatterns = {
            javascript: [
                /eval\s*\(/,
                /Function\s*\(/,
                /require\s*\(/,
                /process\./,
                /child_process/,
                /fs\./,
                /\.exec\(/
            ],
            python: [
                /eval\s*\(/,
                /exec\s*\(/,
                /compile\s*\(/,
                /__import__/,
                /open\s*\(/,
                /os\./,
                /subprocess/
            ]
        };

        const patterns = dangerousPatterns[language.toLowerCase()] || [];
        
        for (const pattern of patterns) {
            if (pattern.test(code)) {
                return {
                    valid: false,
                    message: 'Code contains potentially dangerous operations'
                };
            }
        }

        return { valid: true };
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new CodeExecutionService();

// src/components/Dashboard/AIAssistant/VoiceAssistant.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader } from 'lucide-react';

const VoiceAssistant = ({ onTranscript, autoSpeak = true }) => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [volume, setVolume] = useState(0);
    
    const recognitionRef = useRef(null);
    const synthRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        // Initialize Speech Recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                const current = event.resultIndex;
                const transcriptText = event.results[current][0].transcript;
                
                if (event.results[current].isFinal) {
                    setTranscript(transcriptText);
                    onTranscript(transcriptText);
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };
        }

        // Initialize Speech Synthesis
        if ('speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;
        }

        // Initialize Audio Context for visualization
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;

        return () => {
            stopListening();
            stopSpeaking();
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const startListening = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);

            recognitionRef.current?.start();
            setIsListening(true);
            visualizeVolume();
        } catch (err) {
            console.error('Microphone access denied:', err);
        }
    };

    const stopListening = () => {
        recognitionRef.current?.stop();
        setIsListening(false);
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const speak = (text, options = {}) => {
        if (!synthRef.current) return;

        stopSpeaking();
        setIsSpeaking(true);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options.rate || 1;
        utterance.pitch = options.pitch || 1;
        utterance.volume = options.volume || 1;
        
        // Get available voices
        const voices = synthRef.current.getVoices();
        const preferredVoice = voices.find(v => v.lang === 'en-US') || voices[0];
        utterance.voice = preferredVoice;

        utterance.onend = () => {
            setIsSpeaking(false);
        };

        utterance.onerror = () => {
            setIsSpeaking(false);
        };

        synthRef.current.speak(utterance);
    };

    const stopSpeaking = () => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsSpeaking(false);
        }
    };

    const visualizeVolume = () => {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        
        const updateVolume = () => {
            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setVolume(average / 255);
            
            if (isListening) {
                animationRef.current = requestAnimationFrame(updateVolume);
            }
        };
        
        updateVolume();
    };

    return (
        <div className="flex items-center gap-3">
            {/* Listening Button */}
            <button
                onClick={toggleListening}
                className={`relative p-3 rounded-xl transition-all flex items-center justify-center ${
                    isListening
                        ? 'bg-red-500 animate-pulse'
                        : 'bg-white/10 hover:bg-white/20'
                }`}
            >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                
                {/* Volume Indicator */}
                {isListening && (
                    <div
                        className="absolute -inset-1 rounded-xl border-2 border-red-500 opacity-50"
                        style={{
                            transform: `scale(${1 + volume * 0.5})`
                        }}
                    />
                )}
            </button>

            {/* Speaking Indicator */}
            {isSpeaking && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 rounded-lg">
                    <Volume2 size={16} className="text-blue-500" />
                    <span className="text-sm text-blue-500">Speaking...</span>
                    <button
                        onClick={stopSpeaking}
                        className="p-1 hover:bg-white/10 rounded transition-all"
                    >
                        <VolumeX size={14} />
                    </button>
                </div>
            )}

            {/* Transcript Display */}
            {transcript && !isSpeaking && (
                <div className="px-3 py-2 bg-white/5 rounded-lg text-sm max-w-xs truncate">
                    {transcript}
                </div>
            )}
        </div>
    );
};

export default VoiceAssistant;
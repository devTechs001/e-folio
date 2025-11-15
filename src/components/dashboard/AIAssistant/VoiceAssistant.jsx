// src/components/Dashboard/AIAssistant/VoiceAssistant.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Settings, Save, Play, Pause } from 'lucide-react';

const VoiceAssistant = ({ onTranscript, autoSpeak = true, onSaveTranscript, onPlayAudio }) => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [volume, setVolume] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedAudio, setRecordedAudio] = useState(null);
    const [voiceSettings, setVoiceSettings] = useState({
        rate: 1,
        pitch: 1,
        volume: 1,
        voice: 'default'
    });
    const [availableVoices, setAvailableVoices] = useState([]);
    
    const recognitionRef = useRef(null);
    const synthRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

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
            
            // Load available voices
            const loadVoices = () => {
                const voices = synthRef.current.getVoices();
                setAvailableVoices(voices);
            };
            
            if (synthRef.current.getVoices().length > 0) {
                loadVoices();
            } else {
                synthRef.current.onvoiceschanged = loadVoices;
            }
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

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setRecordedAudio(audioBlob);
                setIsRecording(false);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Audio recording error:', err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const playRecordedAudio = () => {
        if (recordedAudio) {
            const audioUrl = URL.createObjectURL(recordedAudio);
            const audio = new Audio(audioUrl);
            audio.play();
            onPlayAudio && onPlayAudio(audioUrl);
        }
    };

    const speak = (text, options = {}) => {
        if (!synthRef.current) return;

        stopSpeaking();
        setIsSpeaking(true);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options.rate || voiceSettings.rate;
        utterance.pitch = options.pitch || voiceSettings.pitch;
        utterance.volume = options.volume || voiceSettings.volume;
        
        // Select voice
        let selectedVoice = null;
        if (voiceSettings.voice !== 'default') {
            selectedVoice = availableVoices.find(v => v.name === voiceSettings.voice) || availableVoices[0];
        } else {
            selectedVoice = availableVoices.find(v => v.lang.includes('en-US')) || availableVoices[0];
        }
        utterance.voice = selectedVoice;

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

    const saveTranscript = () => {
        if (transcript && onSaveTranscript) {
            onSaveTranscript(transcript);
        }
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
                title={isListening ? "Stop listening" : "Start voice input"}
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

            {/* Recording Button */}
            <button
                onClick={toggleRecording}
                className={`p-3 rounded-xl transition-all flex items-center justify-center ${
                    isRecording
                        ? 'bg-orange-500 animate-pulse'
                        : 'bg-white/10 hover:bg-white/20'
                }`}
                title={isRecording ? "Stop recording" : "Record audio"}
            >
                {isRecording ? <Pause size={20} /> : <Play size={20} />}
            </button>

            {/* Speaking Indicator */}
            {isSpeaking && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 rounded-lg">
                    <Volume2 size={16} className="text-blue-500" />
                    <span className="text-sm text-blue-500">Speaking...</span>
                    <button
                        onClick={stopSpeaking}
                        className="p-1 hover:bg-white/10 rounded transition-all"
                        title="Stop speaking"
                    >
                        <VolumeX size={14} />
                    </button>
                </div>
            )}

            {/* Transcript Display */}
            {transcript && !isSpeaking && (
                <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg">
                    <div className="text-sm max-w-xs truncate">
                        {transcript}
                    </div>
                    <button
                        onClick={saveTranscript}
                        className="p-1 hover:bg-white/10 rounded transition-all"
                        title="Save transcript"
                    >
                        <Save size={14} />
                    </button>
                </div>
            )}

            {/* Play Recorded Audio */}
            {recordedAudio && (
                <button
                    onClick={playRecordedAudio}
                    className="p-3 bg-purple-500/20 hover:bg-purple-500/30 rounded-xl transition-all"
                    title="Play recorded audio"
                >
                    <Play size={20} className="text-purple-500" />
                </button>
            )}

            {/* Voice Settings */}
            <button
                onClick={() => {
                    // Open voice settings modal (would be implemented in a real app)
                    console.log('Open voice settings');
                }}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                title="Voice settings"
            >
                <Settings size={20} />
            </button>
        </div>
    );
};

export default VoiceAssistant;
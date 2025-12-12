import React, { useState } from 'react';
import { Send, Plus } from 'lucide-react';

interface InputAreaProps {
    onSend: (text: string) => void;
    disabled?: boolean;
    showSlider?: boolean; // If true, shows a slider for input
}

const InputArea: React.FC<InputAreaProps> = ({ onSend, disabled, showSlider }) => {
    const [input, setInput] = useState('');
    const [sliderValue, setSliderValue] = useState(5);
    const [isListening, setIsListening] = useState(false);

    const handleVoiceInput = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsListening(true);
            };

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput((prev) => prev + (prev ? ' ' : '') + transcript);
                setIsListening(false);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.start();
        } else {
            alert("Your browser does not support voice input.");
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (showSlider) {
            onSend(`Severity Level: ${sliderValue}/10`);
        } else {
            if (!input.trim()) return;
            onSend(input);
            setInput('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 flex flex-col gap-3">

            {showSlider && (
                <div className="w-full bg-[--color-surface] p-4 rounded-xl border border-[--color-accent-1] animate-slide-up">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-500">Severity</span>
                        <span className="text-lg font-bold text-[--color-primary]">{sliderValue}</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={sliderValue}
                        onChange={(e) => setSliderValue(Number(e.target.value))}
                        className="w-full accent-[--color-primary] h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>Mild</span>
                        <span>Severe</span>
                    </div>
                    <button
                        type="submit"
                        className="w-full mt-3 bg-[--color-primary] hover:bg-[--color-primary-hover] text-white py-2 rounded-lg font-medium transition-colors"
                    >
                        Confirm Severity: {sliderValue}
                    </button>
                </div>
            )}

            {!showSlider && (
                <div className="flex gap-2 items-center">
                    <button type="button" className="p-3 text-slate-400 hover:text-[--color-primary] transition-colors bg-slate-50 rounded-full">
                        <Plus size={20} />
                    </button>

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your response..."
                        disabled={disabled}
                        className="flex-1 bg-slate-50 border-none outline-none text-slate-700 placeholder:text-slate-400 px-4 py-3 rounded-full focus:ring-2 focus:ring-[--color-accent-1] transition-all"
                    />

                    <button
                        type="button"
                        onClick={handleVoiceInput}
                        disabled={disabled || isListening}
                        className={`p-3 rounded-full transition-colors ${
                            isListening 
                                ? 'bg-red-500 text-white animate-pulse' 
                                : 'bg-slate-50 text-slate-400 hover:text-[--color-primary]'
                        }`}
                        title="Voice Input"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="23"/><line x1="8" x2="16" y1="23" y2="23"/></svg>
                    </button>

                    <button
                        type="submit"
                        disabled={disabled || !input.trim()}
                        className="p-3 bg-black text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform shadow-lg shadow-black/20"
                    >
                        <Send size={18} />
                    </button>
                </div>
            )}
        </form>
    );
};

export default InputArea;

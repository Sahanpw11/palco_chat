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

            {/* Text Input (hidden if slider is active? Or maybe allow both explaining and slider?) 
          Let's allow text input always, but if slider is shown, the slider confirm button sends the severity. 
          Actually, let's toggle. If showSlider is true, we ONLY show the slider to force the structured input, 
          OR we just show it above the text input. 
          Let's show it above, but user can still type. 
      */}

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

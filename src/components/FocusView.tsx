import React, { useState } from 'react';
import { ArrowRight, Activity } from 'lucide-react';

interface FocusViewProps {
    messages: { text: string; sender: 'user' | 'ai'; isJsonSummary?: boolean }[];
    onSend: (text: string) => void;
    isLoading: boolean;
    showSlider: boolean;
}

const FocusView: React.FC<FocusViewProps> = ({ messages, onSend, isLoading, showSlider }) => {
    const [input, setInput] = useState('');

    // Get the latest AI message
    const lastAiMessage = [...messages].reverse().find(m => m.sender === 'ai');
    const isSummary = lastAiMessage?.isJsonSummary;
    const messageText = lastAiMessage?.text || "I'm ready to help. What symptoms are you noticing?";

    const lowerText = messageText.toLowerCase();

    // Context detection logic
    // 1. Physical: Explicitly asks for scale or slider is forced
    const isLikelyPhysical = lowerText.includes("scale") || showSlider;

    // 2. Mental (Feelings): Asks for specific feeling/word AND is NOT a duration/trigger question
    const isDurationOrTrigger = lowerText.includes("how long") || lowerText.includes("while") || lowerText.includes("when") || lowerText.includes("time") || lowerText.includes("history") || lowerText.includes("trigger") || lowerText.includes("cause");

    // Stricter check: Must ask "How ... feel" or "one word" or "describe ... feeling"
    const asksAboutFeeling = (lowerText.includes("how") && lowerText.includes("feel")) || lowerText.includes("one word") || lowerText.includes("describe");

    const isLikelyMental = !isDurationOrTrigger && !isLikelyPhysical && asksAboutFeeling;

    // Mental Health "Feeling" Options
    const feelingOptions = ["Anxious 😰", "Overwhelmed 🤯", "Sad 😢", "Tired 😴", "Angry 😠", "Confused 😕", "Okay 😐", "Hopeful 🙂"];

    // Render content
    return (
        <div className="flex-1 flex flex-col justify-center items-center p-6 max-w-2xl mx-auto w-full relative">
            <div className="absolute top-0 left-0 p-6 opacity-30">
                <Activity className="text-[--color-action]" />
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 w-full gap-8 fade-in">
                    {/* Organic Liquid Loader */}
                    <div className="relative flex items-center justify-center">
                        <div className="w-28 h-28 bg-gradient-to-br from-[--color-accent-purple] via-[--color-accent-green] to-[--color-action] animate-liquid shadow-lg opacity-80 backdrop-blur-sm flex items-center justify-center transition-all">
                            <div className="absolute inset-0 bg-white/20 animate-liquid backdrop-blur-sm mix-blend-overlay"></div>
                            <Activity className="text-white drop-shadow-md animate-pulse" size={36} />
                        </div>
                        {/* Orbiting particles */}
                        <div className="absolute w-full h-full animate-spin [animation-duration:10s]">
                            <div className="absolute top-0 left-1/2 w-3 h-3 bg-[--color-action] rounded-full blur-[1px] opacity-60"></div>
                        </div>
                        <div className="absolute w-3/4 h-3/4 animate-spin [animation-duration:7s] [animation-direction:reverse]">
                            <div className="absolute bottom-0 right-1/2 w-2 h-2 bg-[--color-accent-green] rounded-full blur-[1px] opacity-80"></div>
                        </div>
                    </div>

                    <div className="space-y-2 text-center">
                        <p className="text-[--color-text-primary] font-[family-name:var(--font-heading)] text-xl font-medium tracking-wide">
                            Thinking gently... 🌿
                        </p>
                    </div>
                </div>
            ) : isSummary ? (
                <div className="w-full bg-white/60 backdrop-blur-xl p-8 rounded-[32px] shadow-soft fade-in border border-white">
                    <MessageContent text={lastAiMessage?.text || ""} isJson={true} />
                </div>
            ) : (
                <div className="w-full flex flex-col gap-12 fade-in">
                    {/* Question */}
                    <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-heading)] text-[--color-text-primary] text-center leading-tight">
                        <MessageContent text={messageText} />
                    </h2>

                    {/* DYNAMIC INPUTS */}

                    {/* 1. Physical Severity (1-5 Emoji Grid) */}
                    {isLikelyPhysical && (
                        <div className="w-full bg-[--color-accent-green] bg-opacity-30 p-8 rounded-[32px] backdrop-blur-md fade-in">
                            <label className="block text-center text-[--color-text-secondary] font-medium mb-6 text-xl">Severity Level (1-5)</label>
                            <div className="grid grid-cols-5 gap-2 md:gap-4">
                                {[
                                    { val: 1, label: "Mild", icon: "🙂" },
                                    { val: 2, label: "Okay", icon: "😐" },
                                    { val: 3, label: "Ouch", icon: "😟" },
                                    { val: 4, label: "Hard", icon: "😣" },
                                    { val: 5, label: "Severe", icon: "😫" }
                                ].map((opt) => (
                                    <button
                                        key={opt.val}
                                        onClick={() => {
                                            onSend(`rated ${opt.val}/5 (${opt.label})`);
                                        }}
                                        className="flex flex-col items-center gap-2 group transition-transform hover:scale-110 focus:outline-none"
                                    >
                                        <div className="text-4xl md:text-5xl filter drop-shadow-md group-hover:drop-shadow-xl transition-all">
                                            {opt.icon}
                                        </div>
                                        <span className="text-xs md:text-sm font-bold uppercase tracking-wide text-[--color-text-muted] group-hover:text-[--color-action] transition-colors">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 2. Mental Health Feelings (Chips) */}
                    {isLikelyMental && !isLikelyPhysical && (
                        <div className="flex flex-wrap justify-center gap-3 fade-in">
                            {feelingOptions.map(feeling => (
                                <button
                                    key={feeling}
                                    onClick={() => onSend(feeling)}
                                    className="bg-white border border-[--color-accent-purple] px-6 py-3 rounded-full text-lg shadow-sm hover:bg-[--color-accent-purple] hover:text-[--color-action] transition-all transform hover:-translate-y-1"
                                >
                                    {feeling}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Text/Action Input (Fallback for everything except strict scale) */}
                    {!isLikelyPhysical && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (!input.trim()) return;
                                onSend(input);
                                setInput('');
                            }}
                            className="w-full relative mt-4"
                        >
                            <input
                                id="chat-input"
                                name="chat-input"
                                autoFocus
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your answer..."
                                className="w-full bg-transparent border-b-2 border-[--color-accent-purple] text-2xl py-4 px-2 focus:outline-none focus:border-[--color-action] transition-colors font-[family-name:var(--font-body)] text-[--color-text-primary] placeholder:text-[--color-text-muted]"
                            />

                            <button
                                type="submit"
                                disabled={!input.trim()}
                                className="absolute right-0 bottom-4 md:bottom-2 bg-[--color-action] text-white p-4 rounded-2xl hover:bg-[--color-action-hover] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[--color-action]/30 hover:scale-105 active:scale-95"
                            >
                                <ArrowRight size={24} />
                            </button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
};

const MessageContent = ({ text, isJson }: { text: string, isJson?: boolean }) => {
    if (isJson) {
        let data = null;
        try {
            // Attempt to clean and parse JSON
            const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
            const jsonString = jsonMatch ? jsonMatch[1] : text;
            data = JSON.parse(jsonString);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            // Fallback: Render as normal text if JSON fails
            return <div className="whitespace-pre-wrap">{text.replace(/```json/g, '').replace(/```/g, '')}</div>;
        }

        const specialist = data.recommended_specialist || {};

        return (
            <div className="space-y-8 animate-slide-up">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-[--color-accent-green] rounded-full text-[--color-text-primary]">
                        <Activity />
                    </div>
                    <div>
                        <h3 className="text-2xl font-[family-name:var(--font-heading)]">Care Plan</h3>
                        <p className="text-sm text-[--color-text-secondary]">Based on your input</p>
                    </div>
                </div>

                {/* Specialist Card */}
                {specialist.name && (
                    <div className="bg-white p-6 rounded-2xl shadow-md flex items-center gap-6 border border-[--color-accent-purple]">
                        <img
                            src={specialist.image}
                            alt={specialist.name}
                            className="w-20 h-20 rounded-full object-cover border-2 border-[--color-action]"
                        />
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-[--color-action] mb-1">Recommended Specialist</p>
                            <h4 className="text-xl font-bold text-[--color-text-primary]">{specialist.name}</h4>
                            <p className="text-[--color-text-secondary]">{specialist.role}</p>
                        </div>
                    </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-6 p-4 bg-[--color-surface] rounded-2xl">
                    <InfoBlock label="Focus Area" value={data.domain} />
                    <InfoBlock label="Key Issue" value={data.problem} />
                    {data.severity && <InfoBlock label="Severity" value={data.severity} />}
                    <InfoBlock label="Duration" value={data.duration} />
                </div>

                {/* Notes */}
                <div className="mt-6 pt-6 border-t border-[--color-accent-purple]">
                    <p className="text-lg leading-relaxed italic text-[--color-text-secondary]">"{data.notes}"</p>
                </div>
            </div>
        );
    }

    // Simple text renderer
    return <>{text}</>;
};

const InfoBlock = ({ label, value }: { label: string, value: string }) => (
    <div>
        <span className="block text-xs font-bold uppercase tracking-widest text-[--color-text-muted] mb-1">{label}</span>
        <span className="text-lg font-medium text-[--color-text-primary]">{value}</span>
    </div>
);

export default FocusView;

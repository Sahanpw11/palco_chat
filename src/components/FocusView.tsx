import React, { useState } from 'react';
import { ArrowRight, Activity, Volume2, Square } from 'lucide-react';

interface FocusViewProps {
    messages: { text: string; sender: 'user' | 'ai'; isJsonSummary?: boolean }[];
    onSend: (text: string) => void;
    isLoading: boolean;
    showSlider: boolean;
}

const FocusView: React.FC<FocusViewProps> = ({ messages, onSend, isLoading, showSlider }) => {
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);

    // Get the latest AI message
    const lastAiMessage = [...messages].reverse().find(m => m.sender === 'ai');
    const isSummary = lastAiMessage?.isJsonSummary;
    const messageText = lastAiMessage?.text || "I'm ready to help. What symptoms are you noticing?";

    const lowerText = messageText.toLowerCase();

    // Context detection logic
    // 1. Physical: Explicitly asks for scale or slider is forced
    const isLikelyPhysical = lowerText.includes("scale") || showSlider;

    // 2. Mental (Feelings): Asks for specific feeling/word AND is NOT a duration/trigger question
    const isDurationOrTrigger = lowerText.includes("how long") || lowerText.includes("while") || lowerText.includes("when") || lowerText.includes("time") || lowerText.includes("history") || lowerText.includes("trigger") || lowerText.includes("cause") || lowerText.includes("causing") || lowerText.includes("explain") || lowerText.includes("tell me");

    // Stricter check: Must ask "How ... feel" or "one word" or "describe ... feeling"
    // Also ensuring it's asking about the USER'S feelings directly, not "how x contributes to feelings"
    const asksAboutFeeling = (lowerText.includes("how") && lowerText.includes("you feel")) || lowerText.includes("one word") || lowerText.includes("describe");

    const isLikelyMental = !isDurationOrTrigger && !isLikelyPhysical && asksAboutFeeling;

    // Mental Health "Feeling" Options
    const feelingOptions = ["Anxious 😰", "Overwhelmed 🤯", "Sad 😢", "Tired 😴", "Angry 😠", "Confused 😕", "Okay 😐", "Hopeful 🙂"];

    const recognitionRef = React.useRef<any>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const speakText = (text: string) => {
        if ('speechSynthesis' in window) {
            // Cancel any current speaking
            window.speechSynthesis.cancel();

            if (isSpeaking) {
                setIsSpeaking(false);
                return;
            }

            // Sanitize text: remove markdown images, links (keep text), formatting chars, and emojis
            const cleanText = text
                .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images completely
                .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Keep link text, remove URL
                .replace(/[*_`~]/g, '') // Remove formatting characters
                .replace(/#+\s/g, '') // Remove header markers
                .replace(/[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu, '') // Remove emojis
                .trim();

            if (!cleanText) return;

            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);

            // Optional: Select a better voice if available
            // const voices = window.speechSynthesis.getVoices();
            // utterance.voice = voices.find(v => v.lang.includes('en')) || null;

            setIsSpeaking(true);
            window.speechSynthesis.speak(utterance);
        } else {
            alert("Text-to-speech is not supported in this browser.");
        }
    };

    // Auto-speak new messages (optional, enabled by default for "complete" feel)
    React.useEffect(() => {
        // Only speak if it's a new AI message and we are not already listening/speaking
        // This is a bit aggressive, maybe just a manual button is safer.
        // Let's stick to manual first as per "add a voice to the questions" (implies ability to do so).
        // Actually, "make it complete" suggests parity with input.
        // Let's rely on the button for now to avoid annoying the user with auto-play issues.

        // However, we shoudl cancel speech if the component unmounts or message changes
        return () => {
            window.speechSynthesis.cancel();
        };
    }, [messageText]);

    const toggleVoiceInput = () => {
        if (isListening) {
            if (recognitionRef.current) {
                recognitionRef.current.stop(); // stop() allows pending audio to be processed
                // Don't set null immediately, let onend handle cleanup
            }
            // setIsListening(false); // Let onend handle this to keep UI active while processing
            return;
        }

        // Stop speaking if we start listening
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsListening(true);
            };

            let finalTranscript = '';

            recognition.onresult = (event: any) => {
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                        setInput(prev => {
                            const trimmed = event.results[i][0].transcript.trim();
                            if (prev.endsWith(trimmed)) return prev;
                            return prev + (prev ? ' ' : '') + trimmed;
                        });
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
            };

            recognition.onerror = (event: any) => {
                if (event.error === 'no-speech') return;

                // If aborted, don't show error
                if (event.error === 'aborted') {
                    setIsListening(false);
                    return;
                }

                console.error('Speech recognition error', event.error);
                if (event.error === 'network') {
                    alert('Voice input failed. This often happens if:\n1. The browser blocks Google Speech services (e.g. Brave/Vivaldi).\n2. A firewall/extension is blocking the connection.\n3. The internet connection is unstable.');
                } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    alert('Microphone access blocked. Please allow microphone permissions.');
                }

                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    setIsListening(false);
                }
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
            recognition.start();
        } else {
            alert("Your browser does not support voice input.");
        }
    };

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
                    <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-heading)] text-[--color-text-primary] text-center leading-tight flex items-center justify-center gap-4">
                        <MessageContent text={messageText} />
                        <button
                            onClick={() => speakText(messageText)}
                            className="p-2 rounded-full bg-[--color-surface] text-[--color-text-secondary] hover:text-[--color-action] hover:bg-white transition-all shadow-sm"
                            title={isSpeaking ? "Stop Speaking" : "Read Aloud"}
                        >
                            {isSpeaking ? <Square size={20} className="fill-current" /> : <Volume2 size={24} />}
                        </button>
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
                                className="w-full bg-transparent border-b-2 border-[--color-accent-purple] text-2xl py-4 px-2 pr-24 focus:outline-none focus:border-[--color-action] transition-colors font-[family-name:var(--font-body)] text-[--color-text-primary] placeholder:text-[--color-text-muted]"
                            />

                            <div className="absolute right-0 bottom-4 md:bottom-2 flex gap-2">
                                <button
                                    type="button"
                                    onClick={toggleVoiceInput}
                                    disabled={isLoading}
                                    className={`p-4 rounded-2xl transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center ${isListening
                                        ? 'bg-red-500 text-white animate-pulse shadow-red-500/30'
                                        : 'bg-white text-slate-400 hover:text-[--color-primary] border border-slate-200'
                                        }`}
                                    title={isListening ? "Stop Listening" : "Start Voice Input"}
                                >
                                    {isListening ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="23" /><line x1="8" x2="16" y1="23" y2="23" /></svg>
                                    )}
                                </button>

                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="bg-[--color-action] text-white p-4 rounded-2xl hover:bg-[--color-action-hover] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[--color-action]/30 hover:scale-105 active:scale-95"
                                >
                                    <ArrowRight size={24} />
                                </button>
                            </div>
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

import React from 'react';
import { Bot, User } from 'lucide-react';

interface MessageBubbleProps {
    text: string;
    sender: 'user' | 'ai';
    isJsonSummary?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ text, sender, isJsonSummary }) => {
    const isUser = sender === 'user';

    // Parse JSON summary if needed
    let summaryData = null;
    if (isJsonSummary) {
        try {
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '');
            summaryData = JSON.parse(jsonStr);
        } catch (e) {
            console.error("Failed to parse JSON summary", e);
        }
    }

    return (
        <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'} fade-in`}>
            <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-3`}>

                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 
          ${isUser ? 'bg-gray-200 text-gray-500' : 'bg-gradient-to-tr from-[--color-accent-1] to-[--color-accent-2] text-slate-700'}`}>
                    {isUser ? <User size={16} /> : <Bot size={16} />}
                </div>

                {/* Bubble */}
                <div className={`
          p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm
          ${isUser
                        ? 'bg-[--color-text-primary] text-white rounded-br-none'
                        : 'bg-white border border-slate-100 text-[--color-text-secondary] rounded-bl-none'}
        `}>
                    {summaryData ? (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-slate-800 border-b pb-2 mb-2">Patient Summary</h3>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <span className="text-xs uppercase tracking-wider text-slate-400">Domain</span>
                                <span className="font-medium">{summaryData.domain}</span>

                                <span className="text-xs uppercase tracking-wider text-slate-400">Problem</span>
                                <span className="font-medium">{summaryData.problem || summaryData.complaint}</span>

                                <span className="text-xs uppercase tracking-wider text-slate-400">Severity</span>
                                <span className="font-medium">{summaryData.severity}</span>

                                <span className="text-xs uppercase tracking-wider text-slate-400">Duration</span>
                                <span className="font-medium">{summaryData.duration}</span>
                            </div>
                            {summaryData.impact && (
                                <div className="mt-2 text-sm bg-slate-50 p-2 rounded">
                                    <span className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Impact</span>
                                    {summaryData.impact}
                                </div>
                            )}
                        </div>
                    ) : (
                        // Basic Markdown-ish rendering (bolding)
                        text.split('\n').map((line, i) => (
                            <p key={i} className={i > 0 ? 'mt-2' : ''}>
                                {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
                                    part.startsWith('**') && part.endsWith('**')
                                        ? <strong key={j}>{part.slice(2, -2)}</strong>
                                        : part
                                )}
                            </p>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;

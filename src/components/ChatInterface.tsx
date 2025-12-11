import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import InputArea from './InputArea';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    isJsonSummary?: boolean;
}

interface ChatInterfaceProps {
    messages: Message[];
    onSend: (text: string) => void;
    isLoading: boolean;
    showSlider: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSend, isLoading, showSlider }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    return (
        <div className="flex-1 flex flex-col overflow-hidden relative">
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 pb-24 space-y-6"
            >
                {messages.map((msg) => (
                    <MessageBubble
                        key={msg.id}
                        text={msg.text}
                        sender={msg.sender}
                        isJsonSummary={msg.isJsonSummary}
                    />
                ))}
                {isLoading && (
                    <div className="flex justify-start w-full mb-6 fade-in">
                        <div className="flex items-center gap-2 bg-white/50 px-4 py-3 rounded-2xl rounded-bl-none">
                            <div className="w-2 h-2 bg-[--color-primary] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-[--color-primary] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-[--color-primary] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-10">
                <InputArea onSend={onSend} disabled={isLoading} showSlider={showSlider} />
            </div>
        </div>
    );
};

export default ChatInterface;

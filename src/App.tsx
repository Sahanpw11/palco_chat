import { useState, useEffect, useMemo, useRef } from 'react';
import FocusView from './components/FocusView';
import { createClient, sendMessage } from './services/gemini';

import OpenAI from 'openai';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  isJsonSummary?: boolean;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [client, setClient] = useState<OpenAI | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Use env var as default, fallback to empty string if not set.
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_OPENAI_API_KEY || "");
  const [showKeyInput, setShowKeyInput] = useState(false);

  const hasInitialized = useRef(false);

  // Initialize chat
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      initChat(apiKey);
    }
  }, []);

  const initChat = async (key: string) => {
    setIsLoading(true);
    setError(null);
    setShowKeyInput(false);
    try {
      const newClient = createClient(key);
      setClient(newClient);

      const response = await sendMessage(newClient, [], "Hello! I am ready to start.");
      setMessages([
        {
          id: Date.now().toString(),
          text: response,
          sender: 'ai'
        }
      ]);
    } catch (e: any) {
      console.error("Failed to start chat", e);
      setError(`Failed to connect: ${e.message}`);
      setShowKeyInput(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    initChat(apiKey);
  };

  const handleSend = async (text: string) => {
    if (!client) return;

    // Add user message
    const newMessage: Message = { id: Date.now().toString(), text, sender: 'user' };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Map internal message format to OpenAI format
      const history = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      // Send (pass valid OpenAl role strings)
      const responseText = await sendMessage(client, history, text);

      // Check if this is a summary message (contains JSON code block)
      const isJsonSummary = /```json[\s\S]*```/.test(responseText) || /```[\s\S]*```/.test(responseText) && responseText.includes("{");

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'ai',
        isJsonSummary
      };
      setMessages(prev => [
        ...prev,
        aiMessage
      ]);
    } catch (e: any) {
      console.error("Error sending message", e);
      setError(`Error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if we should show the slider
  const showSlider = useMemo(() => {
    if (messages.length === 0) return false;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender === 'user') return false;

    // Check keywords for severity request
    const lower = lastMsg.text.toLowerCase();
    return (lower.includes('scale') && (lower.includes('1') || lower.includes('10')));
  }, [messages]);

  return (
    <>


      <main className="flex-1 flex flex-col overflow-hidden relative w-full max-w-4xl mx-auto">
        {error && (
          <div className="absolute top-4 left-4 right-4 z-50 bg-red-50 p-4 rounded-xl border border-red-200 shadow-lg flex flex-col items-center gap-2 animate-in fade-in slide-in-from-top-4">
            <span className="text-red-600 text-sm font-medium text-center">{error}</span>
            {showKeyInput && (
              <form onSubmit={handleKeySubmit} className="flex gap-2 w-full max-w-sm mt-2">
                <input
                  id="api-key"
                  name="api-key"
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste OpenRouter API Key (sk-or-v1...)"
                  className="flex-1 text-sm px-3 py-1.5 border border-red-200 rounded-md focus:outline-none focus:border-red-400"
                />
                <button
                  type="submit"
                  className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-md hover:bg-red-600 transition-colors"
                >
                  Retry
                </button>
              </form>
            )}
          </div>
        )}
        <FocusView
          messages={messages}
          onSend={handleSend}
          isLoading={isLoading}
          showSlider={showSlider}
        />
      </main>
    </>
  );
}

export default App;

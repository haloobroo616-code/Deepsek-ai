import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles, ChevronDown, ChevronUp, TerminalSquare, Sun, Moon, Menu, X, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, HistoryItem } from './types';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setPrompt('');
    setIsLoading(true);

    // Compile history
    const historyPayload: HistoryItem[] = [];
    for (let i = 0; i < messages.length - 1; i++) {
        if (messages[i].role === 'user') {
            // Find next assistant message
            const assistantMsg = messages.slice(i+1).find(m => m.role === 'assistant');
            if (assistantMsg) {
                 historyPayload.push({
                     user: messages[i].content,
                     assistant: assistantMsg.content
                 });
            }
        }
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage.content,
          history: historyPayload
        })
      });

      if (!response.ok) {
         throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
         throw new Error(data.error || "Gagal mendapatkan respons dari server");
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.answer || "Tidak ada respons yang diterima.",
        reasoning: data.reasoning
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error(error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `**Error:** ${error.message || 'Terjadi kesalahan.'}`
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Adjust textarea height automatically
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [prompt]);

  return (
    <div className={`flex flex-col h-screen ${theme === 'dark' ? 'dark' : ''} bg-gray-50 dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100 font-sans transition-colors duration-300 overflow-hidden relative`}>
      <header className="flex items-center justify-between px-6 py-4 z-10 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-gray-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white">
             <Sparkles className="w-4 h-4" />
          </div>
          <h1 className="text-lg font-display font-semibold tracking-wide text-neutral-900 dark:text-neutral-100">
            DeepSeek
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-600 dark:text-neutral-400 transition-colors focus:outline-none"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-600 dark:text-neutral-400 transition-colors focus:outline-none"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-3 w-[260px] md:w-[280px] bg-white/95 dark:bg-[#111]/95 backdrop-blur-xl border border-gray-200/60 dark:border-neutral-800/60 rounded-3xl shadow-2xl overflow-hidden z-50 origin-top-right font-sans"
                >
                  <div className="p-5 flex items-center gap-4 border-b border-gray-100 dark:border-neutral-800/80">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/20">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[15px] font-bold text-gray-900 dark:text-white leading-none mb-1">Andrison</span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-widest">Developer</span>
                    </div>
                  </div>
                  
                  <div className="p-2 flex flex-col gap-1">
                    <a href="https://www.tiktok.com/@Andrimanaa_" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 mx-1 rounded-2xl hover:bg-gray-100 dark:hover:bg-neutral-800/80 transition-all duration-200 group">
                      <span className="text-[13px] font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">TikTok</span>
                      <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-200 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">@Andrimanaa_</span>
                    </a>
                    <a href="https://instagram.com/andrishiftmalam" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 mx-1 rounded-2xl hover:bg-gray-100 dark:hover:bg-neutral-800/80 transition-all duration-200 group">
                      <span className="text-[13px] font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">Instagram</span>
                      <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-200 group-hover:text-pink-500 dark:group-hover:text-pink-400 transition-colors">@andrishiftmalam</span>
                    </a>
                    <a href="https://t.me/AndriZxcll" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 mx-1 rounded-2xl hover:bg-gray-100 dark:hover:bg-neutral-800/80 transition-all duration-200 group">
                      <span className="text-[13px] font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">Telegram</span>
                      <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-200 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">@AndriZxcll</span>
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 w-full flex flex-col z-10 scroll-smooth pb-32 pt-8">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center justify-center flex-1 text-center py-20 px-4 mt-16"
            >
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 flex items-center justify-center mb-6 shadow-sm">
                <Bot className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-display font-semibold tracking-tight mb-3 text-neutral-900 dark:text-neutral-100">
                Apa yang bisa saya bantu hari ini?
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 max-w-sm text-[15px] leading-relaxed">
                Tulis pertanyaan Anda di bawah untuk memulai percakapan.
              </p>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && (
               <motion.div 
                 initial={{ opacity: 0, y: 5 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="flex items-start gap-4 flex-row w-full"
               >
                  <div className="w-8 h-8 flex items-center justify-center rounded-full shrink-0 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shadow-sm">
                     <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  </div>
                  <div className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-5 flex items-center py-2.5 rounded-2xl rounded-tl-sm border border-gray-200 dark:border-neutral-700 shadow-sm">
                     <span className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-2">Memikirkan respons<span className="animate-pulse">...</span></span>
                  </div>
               </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      <footer className="absolute bottom-0 w-full bg-gradient-to-t from-gray-50 via-gray-50/90 dark:from-[#0a0a0a] dark:via-[#0a0a0a]/90 to-transparent pt-10 pb-6 px-4 z-20 pointer-events-none">
        <div className="max-w-3xl mx-auto relative pointer-events-auto">
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-3 bg-white dark:bg-neutral-900 rounded-[28px] p-2 border border-gray-200 dark:border-neutral-700 focus-within:border-indigo-400 dark:focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-500/10 transition-all duration-300 shadow-sm"
          >
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Tanya apa saja..."
              className="w-full bg-transparent outline-none resize-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 px-4 py-3 text-[15px] leading-relaxed max-h-[200px]"
              rows={1}
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className="p-3 mb-0.5 mr-0.5 rounded-full bg-black dark:bg-white text-white dark:text-black disabled:opacity-30 transition-all duration-200 hover:bg-neutral-800 dark:hover:bg-neutral-200 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center mt-3 text-[11px] text-neutral-400 dark:text-neutral-500">
            AI dapat melakukan kesalahan. Harap periksa kembali.
          </div>
        </div>
      </footer>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const [showReasoning, setShowReasoning] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} w-full`}
    >
      <div className={`w-8 h-8 flex items-center justify-center rounded-full shrink-0 shadow-sm ${isUser ? 'bg-gray-200 dark:bg-neutral-800' : 'bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800'}`}>
        {isUser ? <User className="w-4 h-4 text-neutral-500 dark:text-neutral-400" /> : <Bot className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />}
      </div>
      
      <div className={`w-full max-w-[85%] flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
        {message.reasoning && (
           <div className="w-full rounded-[20px] border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
              <button 
                onClick={() => setShowReasoning(!showReasoning)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors duration-200 text-sm text-neutral-700 dark:text-neutral-300 font-medium cursor-pointer focus:outline-none"
              >
                 <div className="flex items-center gap-2">
                    <TerminalSquare className="w-4 h-4 text-neutral-400" />
                    <span>Proses Berpikir</span>
                 </div>
                 {showReasoning ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
              </button>
              <AnimatePresence>
                {showReasoning && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 py-4 bg-gray-50 dark:bg-[#0f0f0f] border-t border-gray-100 dark:border-neutral-800 text-[13px] text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap font-mono leading-[1.6] overflow-x-auto">
                       {message.reasoning}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        )}
        
        <div className={`px-6 py-4 min-w-[60px] max-w-full ${isUser ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-100 rounded-[20px] rounded-tr-[4px]' : 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-[20px] rounded-tl-[4px] border border-gray-200 dark:border-neutral-800 shadow-sm'} flex flex-col justify-center relative group`}>
          <div className="prose prose-sm md:prose-base dark:prose-invert prose-p:leading-relaxed prose-headings:font-display prose-headings:font-semibold prose-a:text-indigo-500 hover:prose-a:text-indigo-600 prose-pre:bg-gray-100 dark:prose-pre:bg-neutral-950 prose-pre:border border-gray-200 dark:prose-pre:border-neutral-800 prose-pre:my-3 prose-li:marker:text-indigo-400 max-w-none">
             {message.content ? (
               <ReactMarkdown>
                  {message.content}
               </ReactMarkdown>
             ) : (
               <div className="text-neutral-400 italic font-mono text-sm">Menulis respons...</div>
             )}
          </div>
          
          {!isUser && message.content && (
            <div className="flex justify-start mt-3 -mb-1">
              <button
                 onClick={handleCopy}
                 className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[12px] font-medium text-gray-500 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800/80 transition-all duration-200"
                 aria-label="Salin teks"
                 title="Salin teks"
               >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin</span>
                    </>
                  )}
               </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

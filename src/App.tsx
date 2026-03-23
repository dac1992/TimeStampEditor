/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";
import { 
  Clock, 
  Download, 
  Copy, 
  Check, 
  Settings,
  Trash2,
  Keyboard,
  Info,
  BarChart3,
  Zap,
  Calendar,
  History,
  FileText,
  Monitor,
  Layout,
  Sun,
  Moon,
  Sparkles,
  Send,
  Key,
  Loader2,
  MessageSquare
} from 'lucide-react';

// --- Types ---

type TimestampFormat = 'full' | 'time' | 'date' | 'iso';

interface Stats {
  characters: number;
  words: number;
  lines: number;
  timestamps: number;
}

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

// --- Translations ---

const translations = {
  zh: {
    settings: "设置",
    copy: "复制",
    download: "下载",
    clear: "清空",
    autoTimestamp: "自动时间戳",
    placeholderEnabled: "在这里输入内容，按回车自动插入时间戳...",
    placeholderDisabled: "自动时间戳已关闭，按回车正常换行...",
    pressEnter: "按回车记录",
    system: "系统",
    active: "运行中",
    standby: "待机",
    format: "格式",
    build: "版本",
    timestampFormat: "时间戳格式",
    fullLocale: "完整区域设置",
    timeOnly: "仅时间",
    dateOnly: "仅日期",
    iso8601: "ISO 8601",
    statistics: "统计信息",
    chars: "字符",
    words: "字数",
    lines: "行数",
    timestamps: "时间戳",
    quickTips: "小技巧",
    tip1: "自动保存到本地浏览器缓存",
    tip2: "Shift + Enter 正常换行",
    tip3: "支持导出为 .txt 文件",
    clearConfirm: "确定要清空所有内容吗？此操作不可撤销。",
    langName: "English",
    aiAssistant: "AI 助手",
    apiKeyPlaceholder: "输入您的 Gemini API Key...",
    aiSummary: "一键总结",
    aiChatPlaceholder: "输入提示词询问 AI...",
    aiLoading: "AI 正在思考...",
    aiNoKey: "请先在设置中输入 API Key",
    aiNoContent: "没有可总结的内容",
    aiSummaryPrompt: "请对以下带有时间戳的记录进行分类总结，提取关键信息并以清晰的格式呈现：",
    aiResponse: "AI 回复",
    aiTabSettings: "设置",
    aiTabChat: "对话"
  },
  en: {
    settings: "Settings",
    copy: "Copy",
    download: "Download",
    clear: "Clear",
    autoTimestamp: "Auto-Timestamp",
    placeholderEnabled: "Type here, press Enter to insert timestamp...",
    placeholderDisabled: "Auto-timestamp off, press Enter for new line...",
    pressEnter: "Press Enter to Log",
    system: "System",
    active: "Active",
    standby: "Standby",
    format: "Format",
    build: "Build",
    timestampFormat: "Timestamp Format",
    fullLocale: "Full Locale",
    timeOnly: "Time Only",
    dateOnly: "Date Only",
    iso8601: "ISO 8601",
    statistics: "Statistics",
    chars: "Chars",
    words: "Words",
    lines: "Lines",
    timestamps: "Timestamps",
    quickTips: "Quick Tips",
    tip1: "Auto-saved to local storage",
    tip2: "Shift + Enter for new line",
    tip3: "Export as .txt file",
    clearConfirm: "Are you sure you want to clear all content? This cannot be undone.",
    langName: "中文",
    aiAssistant: "AI Assistant",
    apiKeyPlaceholder: "Enter your Gemini API Key...",
    aiSummary: "One-Click Summary",
    aiChatPlaceholder: "Ask AI with custom prompt...",
    aiLoading: "AI is thinking...",
    aiNoKey: "Please enter API Key in settings first",
    aiNoContent: "No content to summarize",
    aiSummaryPrompt: "Please categorize and summarize the following timestamped logs, extract key information, and present it in a clear format:",
    aiResponse: "AI Response",
    aiTabSettings: "Settings",
    aiTabChat: "Chat"
  }
};

// --- App Component ---

export default function App() {
  // --- State ---
  const [text, setText] = useState(() => {
    const saved = localStorage.getItem('timestamp_editor_text');
    return saved || "";
  });
  const [isEnabled, setIsEnabled] = useState(() => {
    const saved = localStorage.getItem('timestamp_editor_enabled');
    return saved === null ? true : saved === 'true';
  });
  const [format, setFormat] = useState<TimestampFormat>(() => {
    const saved = localStorage.getItem('timestamp_editor_format');
    return (saved as TimestampFormat) || 'full';
  });
  const [lang, setLang] = useState<'zh' | 'en'>(() => {
    const saved = localStorage.getItem('timestamp_editor_lang');
    return (saved as 'zh' | 'en') || 'zh';
  });
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('timestamp_editor_api_key') || "";
  });
  const [aiInput, setAiInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('timestamp_editor_messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiTab, setAiTab] = useState<'settings' | 'chat'>('chat');
  const [sidebarWidth, setSidebarWidth] = useState(40); // Percentage
  const [showSettings, setShowSettings] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [stats, setStats] = useState<Stats>({ characters: 0, words: 0, lines: 0, timestamps: 0 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  // Persist state
  useEffect(() => {
    localStorage.setItem('timestamp_editor_text', text);
  }, [text]);

  useEffect(() => {
    localStorage.setItem('timestamp_editor_enabled', String(isEnabled));
  }, [isEnabled]);

  useEffect(() => {
    localStorage.setItem('timestamp_editor_format', format);
  }, [format]);

  useEffect(() => {
    localStorage.setItem('timestamp_editor_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('timestamp_editor_api_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('timestamp_editor_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAiLoading]);

  // Calculate stats
  useEffect(() => {
    const lines = text.split('\n');
    const timestamps = lines.filter(line => /^\[.*\] /.test(line)).length;
    
    setStats({
      characters: text.length,
      words: text.trim() ? text.trim().split(/\s+/).length : 0,
      lines: text === "" ? 0 : lines.length,
      timestamps
    });
  }, [text]);

  // --- Handlers ---

  const getTimestamp = () => {
    const now = new Date();
    switch (format) {
      case 'time': return `[${now.toLocaleTimeString()}] `;
      case 'date': return `[${now.toLocaleDateString()}] `;
      case 'iso': return `[${now.toISOString()}] `;
      case 'full':
      default: return `[${now.toLocaleString()}] `;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isEnabled) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const timestamp = getTimestamp();
      const { selectionStart, selectionEnd } = e.currentTarget;
      
      const newValue = 
        text.substring(0, selectionStart) + 
        "\n" + timestamp + 
        text.substring(selectionEnd);
      
      setText(newValue);

      // Set cursor position after the new timestamp
      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = selectionStart + 1 + timestamp.length;
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    setIsDownloading(true);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timestamp-log-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setIsDownloading(false), 1000);
  };

  const handleClear = () => {
    if (window.confirm(translations[lang].clearConfirm)) {
      setText("");
    }
  };

  const handleAiCall = async (prompt: string, isSummary: boolean = false) => {
    if (!apiKey) {
      alert(translations[lang].aiNoKey);
      setAiTab('settings');
      return;
    }
    
    const userMessage: ChatMessage = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);

    setIsAiLoading(true);
    setAiTab('chat');
    
    try {
      const genAI = new GoogleGenAI({ apiKey });
      
      let responseText = "";
      
      if (isSummary) {
        // Summaries are one-off
        const result = await genAI.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
        });
        responseText = result.text || "No response";
      } else {
        // Regular chat uses history
        const result = await genAI.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            ...messages.map(m => ({
              role: m.role,
              parts: [{ text: m.content }]
            })),
            { role: 'user', parts: [{ text: prompt }] }
          ]
        });
        responseText = result.text || "No response";
      }

      const modelMessage: ChatMessage = { role: 'model', content: responseText };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("AI Error:", error);
      const errorMessage: ChatMessage = { 
        role: 'model', 
        content: `Error: ${error instanceof Error ? error.message : String(error)}` 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiSummary = () => {
    if (!text.trim()) {
      alert(translations[lang].aiNoContent);
      return;
    }
    const prompt = `${translations[lang].aiSummaryPrompt}\n\n${text}`;
    handleAiCall(prompt, true);
  };

  const handleAiChat = () => {
    if (!aiInput.trim()) return;
    const input = aiInput;
    setAiInput("");
    // We include the current logs as context if it's the first message or if requested
    const context = messages.length === 0 ? `Context (My Logs):\n${text}\n\nQuestion: ${input}` : input;
    handleAiCall(context);
  };

  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem('timestamp_editor_messages');
  };

  const t = translations[lang];

  // --- UI Components ---

  return (
    <div className="flex h-screen bg-zinc-50 text-zinc-700 font-sans overflow-hidden">
      
      {/* Navigation Rail (Left Sidebar) */}
      <nav className="w-16 flex flex-col items-center py-6 border-r border-zinc-200 bg-white shadow-sm z-20">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center mb-10 shadow-lg shadow-indigo-200">
          <Clock className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 flex flex-col gap-6">
          <NavButton 
            icon={<MessageSquare className="w-5 h-5" />} 
            active={showSettings} 
            onClick={() => setShowSettings(!showSettings)} 
            label={t.aiAssistant}
          />
          <NavButton 
            icon={copied ? <Check className="w-5 h-5 text-indigo-600" /> : <Copy className="w-5 h-5" />} 
            onClick={handleCopy} 
            label={t.copy}
          />
          <NavButton 
            icon={<Download className="w-5 h-5" />} 
            onClick={handleDownload} 
            label={t.download}
          />
          <NavButton 
            icon={<Trash2 className="w-5 h-5" />} 
            onClick={handleClear} 
            label={t.clear}
          />
        </div>

        <div className="mt-auto">
          <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-400">
            v1.5
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-row relative min-w-0">
        
        {/* Editor Section (60% default) */}
        <div 
          style={{ width: showSettings ? `${100 - sidebarWidth}%` : '100%' }}
          className="flex flex-col border-r border-zinc-200 transition-all duration-300 bg-white"
        >
          {/* Header Bar */}
          <header className="h-16 flex items-center justify-between px-8 border-b border-zinc-200 bg-white/80 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 rounded-lg">
                  <Layout className="w-4 h-4 text-indigo-600" />
                </div>
                <h1 className="text-sm font-bold tracking-tight text-zinc-900">TimeStamp Editor</h1>
              </div>
              <div className="h-4 w-px bg-zinc-200" />
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
                className="px-3 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-[10px] font-bold uppercase tracking-widest text-zinc-600 transition-colors"
              >
                {t.langName}
              </button>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t.autoTimestamp}</span>
                <button 
                  onClick={() => setIsEnabled(!isEnabled)}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${isEnabled ? 'bg-indigo-600' : 'bg-zinc-200'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-5.5' : 'translate-x-1'} shadow-sm`} />
                </button>
              </div>
            </div>
          </header>

          {/* Editor Area */}
          <div className="flex-1 relative p-6 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.02),transparent_70%)] pointer-events-none" />
            
            <div className="w-full h-full bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 relative flex flex-col">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                placeholder={isEnabled ? t.placeholderEnabled : t.placeholderDisabled}
                className="w-full flex-1 bg-transparent border-none focus:ring-0 outline-none p-4 text-zinc-800 placeholder:text-zinc-300 font-mono text-base leading-relaxed resize-none selection:bg-indigo-100"
              />
              
              {/* Compact Format Selection at bottom of editor */}
              <div className="mt-4 pt-4 border-t border-zinc-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t.timestampFormat}</span>
                </div>
                <div className="flex gap-1 p-1 bg-zinc-100 rounded-lg">
                  <CompactFormatBtn active={format === 'full'} onClick={() => setFormat('full')} label={t.fullLocale} />
                  <CompactFormatBtn active={format === 'time'} onClick={() => setFormat('time')} label={t.timeOnly} />
                  <CompactFormatBtn active={format === 'date'} onClick={() => setFormat('date')} label={t.dateOnly} />
                  <CompactFormatBtn active={format === 'iso'} onClick={() => setFormat('iso')} label={t.iso8601} />
                </div>
              </div>
            </div>

            {/* Floating Indicators */}
            <div className="absolute bottom-10 right-10 flex flex-col items-end gap-3 pointer-events-none opacity-40 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 shadow-sm text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                <Keyboard className="w-3 h-3 text-indigo-500" />
                <span>{t.pressEnter}</span>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <footer className="h-10 flex items-center justify-between px-8 border-t border-zinc-200 bg-white text-[10px] font-bold uppercase tracking-widest text-zinc-400 shrink-0">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-indigo-500 animate-pulse' : 'bg-zinc-300'}`} />
                <span>{t.system}: {isEnabled ? t.active : t.standby}</span>
              </div>
              <div className="flex items-center gap-4">
                <StatItem label={t.chars} value={stats.characters} />
                <StatItem label={t.words} value={stats.words} />
                <StatItem label={t.lines} value={stats.lines} />
                <StatItem label={t.timestamps} value={stats.timestamps} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span>{t.build}: 2026.03.23</span>
              <Monitor className="w-3 h-3" />
            </div>
          </footer>
        </div>

        {/* AI & Settings Sidebar (40% default) */}
        <AnimatePresence>
          {showSettings && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: `${sidebarWidth}%`, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white overflow-hidden flex flex-col shadow-2xl z-10"
            >
              <div className="flex-1 flex flex-col min-h-0">
                
                {/* AI Assistant Header */}
                <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                  <div className="flex items-center gap-2 text-zinc-900">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <h2 className="text-sm font-bold tracking-tight">{t.aiAssistant}</h2>
                  </div>
                  <div className="flex bg-zinc-200/50 p-0.5 rounded-lg">
                    <button 
                      onClick={() => setAiTab('chat')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${aiTab === 'chat' ? 'bg-white text-indigo-600 shadow-sm' : 'text-zinc-500'}`}
                    >
                      {t.aiTabChat}
                    </button>
                    <button 
                      onClick={() => setAiTab('settings')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${aiTab === 'settings' ? 'bg-white text-indigo-600 shadow-sm' : 'text-zinc-500'}`}
                    >
                      {t.aiTabSettings}
                    </button>
                  </div>
                </div>

                {/* AI Content Area - Expanded */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  {aiTab === 'settings' ? (
                    <div className="space-y-4">
                      <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                          <Key className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Gemini API Key</span>
                        </div>
                        <input 
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder={t.apiKeyPlaceholder}
                          className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        />
                        <p className="text-[10px] text-zinc-400 leading-relaxed">
                          Your key is stored locally in your browser and never sent to our servers.
                        </p>
                      </div>

                      <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                          <Info className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{t.quickTips}</span>
                        </div>
                        <div className="space-y-3">
                          <Tip icon={<History className="w-3.5 h-3.5" />} text={t.tip1} />
                          <Tip icon={<Keyboard className="w-3.5 h-3.5" />} text={t.tip2} />
                          <Tip icon={<FileText className="w-3.5 h-3.5" />} text={t.tip3} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <button 
                        onClick={handleAiSummary}
                        disabled={isAiLoading}
                        className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-bold shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                      >
                        {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        {t.aiSummary}
                      </button>

                      <div className="space-y-4">
                        {messages.map((msg, idx) => (
                          <div 
                            key={idx} 
                            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                          >
                            <div className={`max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed ${
                              msg.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-tr-none shadow-md' 
                                : 'bg-zinc-100 text-zinc-800 rounded-tl-none border border-zinc-200'
                            }`}>
                              {msg.role === 'model' ? (
                                <div className="prose prose-sm max-w-none prose-indigo">
                                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                              ) : (
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                              )}
                            </div>
                            <span className="text-[9px] font-bold text-zinc-300 uppercase mt-1 px-1">
                              {msg.role === 'user' ? 'You' : 'AI'}
                            </span>
                          </div>
                        ))}
                        
                        {isAiLoading && (
                          <div className="flex flex-col items-start">
                            <div className="bg-zinc-100 p-4 rounded-2xl rounded-tl-none border border-zinc-200">
                              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      {messages.length > 0 && (
                        <button 
                          onClick={handleClearChat}
                          className="w-full py-2 text-[10px] font-bold text-zinc-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                        >
                          Clear Conversation
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* AI Chat Input - Fixed at bottom of sidebar */}
                {aiTab === 'chat' && (
                  <div className="p-6 border-t border-zinc-100 bg-white">
                    <div className="relative group">
                      <textarea 
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAiChat();
                          }
                        }}
                        placeholder={t.aiChatPlaceholder}
                        rows={3}
                        className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none pr-12 transition-all placeholder:text-zinc-400"
                      />
                      <button 
                        onClick={handleAiChat}
                        disabled={isAiLoading || !aiInput.trim()}
                        className="absolute right-3 bottom-3 p-2 bg-indigo-600 text-white rounded-xl disabled:bg-zinc-200 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-indigo-100"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

      </main>

    </div>
  );
}

// --- Sub-components ---

function NavButton({ icon, active, onClick, label }: { icon: React.ReactNode, active?: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`group relative p-3 rounded-xl transition-all duration-300 ${active ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900'}`}
    >
      {icon}
      <div className="absolute left-16 px-2 py-1 rounded bg-zinc-800 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
        {label}
      </div>
    </button>
  );
}

function CompactFormatBtn({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${active ? 'bg-white text-indigo-600 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
    >
      {label}
    </button>
  );
}

function StatItem({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-zinc-300">{label}:</span>
      <span className="text-zinc-500">{value.toLocaleString()}</span>
    </div>
  );
}

function Tip({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-zinc-600">
      <div className="text-indigo-600">{icon}</div>
      <span>{text}</span>
    </div>
  );
}


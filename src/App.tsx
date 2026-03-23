/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  ChevronRight,
  Monitor
} from 'lucide-react';

// --- Types ---

type TimestampFormat = 'full' | 'time' | 'date' | 'iso' | 'custom';

interface Stats {
  characters: number;
  words: number;
  lines: number;
  timestamps: number;
}

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
  const [showSettings, setShowSettings] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [stats, setStats] = useState<Stats>({ characters: 0, words: 0, lines: 0, timestamps: 0 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    if (window.confirm("确定要清空所有内容吗？此操作不可撤销。")) {
      setText("");
    }
  };

  // --- UI Components ---

  return (
    <div className="flex h-screen bg-[#050505] text-zinc-300 font-sans overflow-hidden">
      
      {/* Navigation Rail (Left Sidebar) */}
      <nav className="w-16 flex flex-col items-center py-6 border-r border-white/5 bg-black/40 backdrop-blur-xl z-20">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-10">
          <Clock className="w-5 h-5 text-emerald-400" />
        </div>

        <div className="flex-1 flex flex-col gap-6">
          <NavButton 
            icon={<Settings className="w-5 h-5" />} 
            active={showSettings} 
            onClick={() => setShowSettings(!showSettings)} 
            label="设置"
          />
          <NavButton 
            icon={copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />} 
            onClick={handleCopy} 
            label="复制"
          />
          <NavButton 
            icon={<Download className="w-5 h-5" />} 
            onClick={handleDownload} 
            label="下载"
          />
          <NavButton 
            icon={<Trash2 className="w-5 h-5" />} 
            onClick={handleClear} 
            label="清空"
          />
        </div>

        <div className="mt-auto">
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500">
            v1.2
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative min-w-0">
        
        {/* Header Bar */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-black/20">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-bold tracking-widest uppercase text-white">Timestamp Editor</h1>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Auto-Timestamp</span>
              <button 
                onClick={() => setIsEnabled(!isEnabled)}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${isEnabled ? 'bg-emerald-500' : 'bg-zinc-800'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-5.5' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </header>

        {/* Editor Area */}
        <div className="flex-1 relative p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.03),transparent_70%)] pointer-events-none" />
          
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            placeholder={isEnabled ? "在这里输入内容，按回车自动插入时间戳..." : "自动时间戳已关闭，按回车正常换行..."}
            className="w-full h-full bg-transparent border-none focus:ring-0 text-zinc-200 placeholder:text-zinc-700 font-mono text-base leading-relaxed resize-none selection:bg-emerald-500/20"
          />

          {/* Floating Indicators */}
          <div className="absolute bottom-12 right-12 flex flex-col items-end gap-3 pointer-events-none opacity-40 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              <Keyboard className="w-3 h-3" />
              <span>Press Enter to Log</span>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <footer className="h-10 flex items-center justify-between px-8 border-t border-white/5 bg-black/40 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-700'}`} />
              <span>System: {isEnabled ? 'Active' : 'Standby'}</span>
            </div>
            <span>Format: {format}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Build: 2026.03.23</span>
            <Monitor className="w-3 h-3" />
          </div>
        </footer>
      </main>

      {/* Settings Panel (Right Sidebar) */}
      <AnimatePresence>
        {showSettings && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="border-l border-white/5 bg-zinc-900/30 backdrop-blur-2xl overflow-hidden flex flex-col"
          >
            <div className="p-8 space-y-10">
              
              {/* Format Selection */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-white">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-xs font-bold uppercase tracking-widest">Timestamp Format</h2>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <FormatOption 
                    active={format === 'full'} 
                    onClick={() => setFormat('full')} 
                    label="Full Locale" 
                    desc={new Date().toLocaleString()} 
                  />
                  <FormatOption 
                    active={format === 'time'} 
                    onClick={() => setFormat('time')} 
                    label="Time Only" 
                    desc={new Date().toLocaleTimeString()} 
                  />
                  <FormatOption 
                    active={format === 'date'} 
                    onClick={() => setFormat('date')} 
                    label="Date Only" 
                    desc={new Date().toLocaleDateString()} 
                  />
                  <FormatOption 
                    active={format === 'iso'} 
                    onClick={() => setFormat('iso')} 
                    label="ISO 8601" 
                    desc={new Date().toISOString().split('.')[0] + 'Z'} 
                  />
                </div>
              </section>

              {/* Statistics */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-white">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-xs font-bold uppercase tracking-widest">Statistics</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="Chars" value={stats.characters} />
                  <StatCard label="Words" value={stats.words} />
                  <StatCard label="Lines" value={stats.lines} />
                  <StatCard label="Timestamps" value={stats.timestamps} />
                </div>
              </section>

              {/* Quick Tips */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-white">
                  <Info className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-xs font-bold uppercase tracking-widest">Quick Tips</h2>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                  <Tip icon={<History className="w-3.5 h-3.5" />} text="自动保存到本地浏览器缓存" />
                  <Tip icon={<Keyboard className="w-3.5 h-3.5" />} text="Shift + Enter 正常换行" />
                  <Tip icon={<FileText className="w-3.5 h-3.5" />} text="支持导出为 .txt 文件" />
                </div>
              </section>

            </div>
          </motion.aside>
        )}
      </AnimatePresence>

    </div>
  );
}

// --- Sub-components ---

function NavButton({ icon, active, onClick, label }: { icon: React.ReactNode, active?: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`group relative p-3 rounded-xl transition-all duration-300 ${active ? 'bg-emerald-500 text-black' : 'hover:bg-white/5 text-zinc-500 hover:text-white'}`}
    >
      {icon}
      <div className="absolute left-16 px-2 py-1 rounded bg-zinc-800 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {label}
      </div>
    </button>
  );
}

function FormatOption({ active, onClick, label, desc }: { active: boolean, onClick: () => void, label: string, desc: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full p-4 rounded-xl border text-left transition-all ${active ? 'bg-emerald-500/10 border-emerald-500/30 text-white' : 'bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10'}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
        {active && <Check className="w-3 h-3 text-emerald-400" />}
      </div>
      <div className="text-xs font-mono opacity-60 truncate">{desc}</div>
    </button>
  );
}

function StatCard({ label, value }: { label: string, value: number }) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
      <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">{label}</div>
      <div className="text-xl font-bold text-white">{value.toLocaleString()}</div>
    </div>
  );
}

function Tip({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-zinc-400">
      <div className="text-emerald-400">{icon}</div>
      <span>{text}</span>
    </div>
  );
}


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
  Monitor,
  Layout,
  Sun,
  Moon
} from 'lucide-react';

// --- Types ---

type TimestampFormat = 'full' | 'time' | 'date' | 'iso';

interface Stats {
  characters: number;
  words: number;
  lines: number;
  timestamps: number;
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
    langName: "English"
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
    langName: "中文"
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

  useEffect(() => {
    localStorage.setItem('timestamp_editor_lang', lang);
  }, [lang]);

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
            icon={<Settings className="w-5 h-5" />} 
            active={showSettings} 
            onClick={() => setShowSettings(!showSettings)} 
            label={t.settings}
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
            v1.2
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative min-w-0">
        
        {/* Header Bar */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-zinc-200 bg-white/80 backdrop-blur-md">
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

          <div className="flex items-center gap-6">
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
        <div className="flex-1 relative p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.02),transparent_70%)] pointer-events-none" />
          
          <div className="w-full h-full bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              placeholder={isEnabled ? t.placeholderEnabled : t.placeholderDisabled}
              className="w-full h-full bg-transparent border-none focus:ring-0 text-zinc-800 placeholder:text-zinc-300 font-mono text-base leading-relaxed resize-none selection:bg-indigo-100"
            />
          </div>

          {/* Floating Indicators */}
          <div className="absolute bottom-12 right-12 flex flex-col items-end gap-3 pointer-events-none opacity-60 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 shadow-sm text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              <Keyboard className="w-3 h-3 text-indigo-500" />
              <span>{t.pressEnter}</span>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <footer className="h-10 flex items-center justify-between px-8 border-t border-zinc-200 bg-white text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-indigo-500 animate-pulse' : 'bg-zinc-300'}`} />
              <span>{t.system}: {isEnabled ? t.active : t.standby}</span>
            </div>
            <span>{t.format}: {format}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>{t.build}: 2026.03.23</span>
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
            className="border-l border-zinc-200 bg-white overflow-hidden flex flex-col shadow-xl"
          >
            <div className="p-8 space-y-10">
              
              {/* Format Selection */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-zinc-900">
                  <Zap className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-xs font-bold uppercase tracking-widest">{t.timestampFormat}</h2>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <FormatOption 
                    active={format === 'full'} 
                    onClick={() => setFormat('full')} 
                    label={t.fullLocale} 
                    desc={new Date().toLocaleString()} 
                  />
                  <FormatOption 
                    active={format === 'time'} 
                    onClick={() => setFormat('time')} 
                    label={t.timeOnly} 
                    desc={new Date().toLocaleTimeString()} 
                  />
                  <FormatOption 
                    active={format === 'date'} 
                    onClick={() => setFormat('date')} 
                    label={t.dateOnly} 
                    desc={new Date().toLocaleDateString()} 
                  />
                  <FormatOption 
                    active={format === 'iso'} 
                    onClick={() => setFormat('iso')} 
                    label={t.iso8601} 
                    desc={new Date().toISOString().split('.')[0] + 'Z'} 
                  />
                </div>
              </section>

              {/* Statistics */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-zinc-900">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-xs font-bold uppercase tracking-widest">{t.statistics}</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <StatCard label={t.chars} value={stats.characters} />
                  <StatCard label={t.words} value={stats.words} />
                  <StatCard label={t.lines} value={stats.lines} />
                  <StatCard label={t.timestamps} value={stats.timestamps} />
                </div>
              </section>

              {/* Quick Tips */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-zinc-900">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-xs font-bold uppercase tracking-widest">{t.quickTips}</h2>
                </div>
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
                  <Tip icon={<History className="w-3.5 h-3.5" />} text={t.tip1} />
                  <Tip icon={<Keyboard className="w-3.5 h-3.5" />} text={t.tip2} />
                  <Tip icon={<FileText className="w-3.5 h-3.5" />} text={t.tip3} />
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
      className={`group relative p-3 rounded-xl transition-all duration-300 ${active ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900'}`}
    >
      {icon}
      <div className="absolute left-16 px-2 py-1 rounded bg-zinc-800 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
        {label}
      </div>
    </button>
  );
}

function FormatOption({ active, onClick, label, desc }: { active: boolean, onClick: () => void, label: string, desc: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full p-4 rounded-xl border text-left transition-all ${active ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50'}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
        {active && <Check className="w-3 h-3 text-indigo-600" />}
      </div>
      <div className="text-xs font-mono opacity-60 truncate">{desc}</div>
    </button>
  );
}

function StatCard({ label, value }: { label: string, value: number }) {
  return (
    <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
      <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{label}</div>
      <div className="text-xl font-bold text-zinc-900">{value.toLocaleString()}</div>
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


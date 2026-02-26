import React, { useState } from 'react';
import JSZip from 'jszip';
import { Loader2, Download, ImageIcon, Archive, AlertCircle } from 'lucide-react';

interface GenerationResult {
  id: string;
  prompt: string;
  imageUrl?: string;
  status: 'pending' | 'generating' | 'success' | 'error';
  error?: string;
}

export default function App() {
  const [promptsText, setPromptsText] = useState('');
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    const lines = promptsText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;

    setResults(lines.map((p, i) => ({ id: `${Date.now()}-${i}`, prompt: p, status: 'pending' })));
    setIsGenerating(true);

    for (let i = 0; i < lines.length; i++) {
      const prompt = lines[i];
      setResults(prev => prev.map(r => r.prompt === prompt ? { ...r, status: 'generating' } : r));

      try {
        const seed = Math.floor(Math.random() * 999999);
        // Direct image URL for maximum compatibility
        const directUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&seed=${seed}&nologo=true&model=turbo`;

        // We use the image object to pre-load and verify it exists
        const img = new Image();
        img.src = directUrl;

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error("Network restricted"));
          // Timeout after 20 seconds
          setTimeout(() => reject(new Error("Timeout")), 20000);
        });

        setResults(prev => prev.map(r => r.prompt === prompt ? { ...r, status: 'success', imageUrl: directUrl } : r));
      } catch (e) {
        setResults(prev => prev.map(r => r.prompt === prompt ? { ...r, status: 'error', error: 'Connection Restricted' } : r));
      }
    }
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-5 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent italic tracking-tighter">NANO BANANA GENERATOR</h1>
          <p className="text-slate-500 text-[10px] tracking-[0.2em] mt-2 font-mono">STABLE PRODUCTION BUILD</p>
        </header>

        <div className="bg-[#0f172a] p-8 rounded-[2rem] border border-slate-800 shadow-2xl mb-12">
          <textarea
            className="w-full h-32 bg-[#020617] rounded-2xl p-5 text-white border border-slate-800 focus:border-blue-500 outline-none"
            placeholder="Type prompts (one per line)..."
            value={promptsText}
            onChange={(e) => setPromptsText(e.target.value)}
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !promptsText.trim()}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-lg transition-all disabled:opacity-20 flex items-center justify-center shadow-lg shadow-blue-900/20"
          >
            {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <ImageIcon className="mr-2" />}
            GENERATE IMAGES
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((res) => (
            <div key={res.id} className="bg-[#0f172a] rounded-3xl border border-slate-800 overflow-hidden">
              <div className="aspect-square bg-black flex items-center justify-center">
                {res.status === 'generating' && <Loader2 className="animate-spin text-blue-500 w-10 h-10" />}
                {res.status === 'error' && <span className="text-[10px] text-red-500 font-bold uppercase">{res.error}</span>}
                {res.status === 'success' && <img src={res.imageUrl} className="w-full h-full object-cover" alt="AI Result" />}
              </div>
              <div className="p-4">
                <button
                  onClick={() => window.open(res.imageUrl, '_blank')}
                  disabled={res.status !== 'success'}
                  className="w-full bg-slate-800 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 disabled:opacity-10"
                >
                  View / Save
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

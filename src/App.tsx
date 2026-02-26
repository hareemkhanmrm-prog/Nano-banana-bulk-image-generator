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
        const seed = Math.floor(Math.random() * 1000000);
        // Using a highly reliable production endpoint
        const targetUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=512&height=512&seed=${seed}&nologo=true`;
        
        // CORS Proxy to bypass browser/vercel security blocks
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('Proxy Busy');

        const blob = await response.blob();
        const base64data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        setResults(prev => prev.map(r => r.prompt === prompt ? { ...r, status: 'success', imageUrl: base64data } : r));
      } catch (e) {
        setResults(prev => prev.map(r => r.prompt === prompt ? { ...r, status: 'error', error: 'Security Block / Network' } : r));
      }
    }
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-5 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">NANO BANANA ULTIMATE</h1>
          <p className="text-slate-400 mt-2 text-sm uppercase tracking-widest font-mono">Status: Connected via Proxy</p>
        </header>

        <div className="bg-[#1e293b] p-6 rounded-3xl border border-slate-700 shadow-2xl mb-10">
          <textarea
            className="w-full h-32 bg-[#0f172a] rounded-2xl p-4 text-white border border-slate-700 focus:border-cyan-500 outline-none transition-all"
            placeholder="Type prompts (one per line)..."
            value={promptsText}
            onChange={(e) => setPromptsText(e.target.value)}
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !promptsText.trim()}
            className="w-full mt-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 py-4 rounded-2xl font-black text-lg shadow-lg disabled:opacity-30 transition-all flex items-center justify-center"
          >
            {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <ImageIcon className="mr-2" />}
            START BULK GENERATION
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((res) => (
            <div key={res.id} className="bg-[#1e293b] rounded-3xl border border-slate-700 overflow-hidden shadow-lg">
              <div className="aspect-square bg-[#0f172a] flex items-center justify-center">
                {res.status === 'generating' && <Loader2 className="animate-spin text-cyan-500 w-10 h-10" />}
                {res.status === 'error' && <div className="text-center p-4"><AlertCircle className="text-red-500 mx-auto mb-2" /><span className="text-[10px] text-red-400 font-bold">{res.error}</span></div>}
                {res.status === 'success' && <img src={res.imageUrl} className="w-full h-full object-cover" alt="AI" />}
              </div>
              <div className="p-4">
                <p className="text-[10px] text-slate-400 truncate mb-3">{res.prompt}</p>
                <button
                  onClick={() => { const a = document.createElement('a'); a.href = res.imageUrl!; a.download = 'ai_image.png'; a.click(); }}
                  disabled={res.status !== 'success'}
                  className="w-full bg-slate-700 hover:bg-slate-600 py-2 rounded-xl text-[10px] font-bold disabled:opacity-20 transition-all"
                >
                  Download Image
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

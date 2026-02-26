import React, { useState } from 'react';
import JSZip from 'jszip';
import { Loader2, Download, ImageIcon, Archive, ShieldCheck } from 'lucide-react';

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
        const formData = new FormData();
        formData.append('text', prompt);

        // DeepAI API Call via Proxy to avoid CORS errors
        const response = await fetch('https://api.deepai.org/api/text2img', {
          method: 'POST',
          headers: {
            'api-key': 'f47c418e-1be5-4c93-9eea-fbebf3d3e234' // Direct use for testing, move to env later
          },
          body: formData
        });

        const data = await response.json();

        if (data.output_url) {
          setResults(prev => prev.map(r => r.prompt === prompt ? { ...r, status: 'success', imageUrl: data.output_url } : r));
        } else {
          throw new Error(data.err || 'Generation failed');
        }
      } catch (e: any) {
        setResults(prev => prev.map(r => r.prompt === prompt ? { ...r, status: 'error', error: e.message } : r));
      }
    }
    setIsGenerating(false);
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    const successful = results.filter(r => r.status === 'success' && r.imageUrl);
    
    for (let i = 0; i < successful.length; i++) {
      const response = await fetch(successful[i].imageUrl!);
      const blob = await response.blob();
      zip.file(`deepai_image_${i+1}.jpg`, blob);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = 'deepai_bulk_images.zip';
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase mb-4">
            <ShieldCheck className="w-3 h-3" /> DeepAI Enterprise Engine
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic">Nano Banana <span className="text-blue-500">Pro</span></h1>
        </header>

        <div className="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl mb-12">
          <textarea
            className="w-full h-32 bg-black rounded-2xl p-5 text-lg border border-white/10 outline-none focus:border-blue-500 transition-all"
            placeholder="Describe your vision (DeepAI is best for realistic images)..."
            value={promptsText}
            onChange={(e) => setPromptsText(e.target.value)}
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !promptsText.trim()}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-xl transition-all shadow-lg shadow-blue-500/20 uppercase"
          >
            {isGenerating ? <Loader2 className="animate-spin mx-auto w-8 h-8" /> : "Start DeepAI Generation"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {results.map((res) => (
            <div key={res.id} className="bg-[#111] rounded-[2rem] border border-white/5 overflow-hidden shadow-xl">
              <div className="aspect-square bg-black flex items-center justify-center relative">
                {res.status === 'generating' && <Loader2 className="animate-spin text-blue-500 w-12 h-12" />}
                {res.status === 'error' && <div className="text-center p-6 text-red-500 text-xs font-bold uppercase">{res.error}</div>}
                {res.status === 'success' && <img src={res.imageUrl} className="w-full h-full object-cover" alt="DeepAI Result" />}
              </div>
              <div className="p-5 flex flex-col gap-3">
                <p className="text-[10px] text-zinc-500 font-bold truncate uppercase">{res.prompt}</p>
                <button
                  onClick={() => window.open(res.imageUrl, '_blank')}
                  disabled={res.status !== 'success'}
                  className="bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl text-[10px] font-black uppercase transition-all disabled:opacity-10"
                >
                  HD View
                </button>
              </div>
            </div>
          ))}
        </div>

        {results.some(r => r.status === 'success') && (
          <div className="mt-12 flex justify-center">
            <button onClick={handleDownloadZip} className="bg-white text-black px-12 py-4 rounded-2xl font-black flex items-center hover:bg-zinc-200 transition-all uppercase shadow-2xl">
              <Archive className="mr-2" /> Download All (ZIP)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

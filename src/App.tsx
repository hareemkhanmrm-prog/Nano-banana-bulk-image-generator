import React, { useState } from 'react';
import JSZip from 'jszip';
import { Loader2, Download, Image as ImageIcon, Archive, AlertTriangle } from 'lucide-react';

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

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const handleGenerate = async () => {
    const lines = promptsText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;

    setResults(lines.map((p, i) => ({ id: `${Date.now()}-${i}`, prompt: p, status: 'pending' })));
    setIsGenerating(true);

    for (let i = 0; i < lines.length; i++) {
      const prompt = lines[i];
      const resultId = `${Date.now()}-${i}`;
      
      setResults(prev => prev.map(r => r.prompt === prompt ? { ...r, status: 'generating' } : r));

      try {
        // Anti-Ban Delay: Taake server block na kare (3 seconds wait)
        if (i > 0) await delay(3000);

        const seed = Math.floor(Math.random() * 1000000);
        // Using the most stable production endpoint
        const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&model=searchgpt&nologo=true`;

        // Pehle check karte hain image load ho rahi hai ya nahi
        const imgCheck = new Image();
        imgCheck.src = imageUrl;
        
        await new Promise((resolve, reject) => {
          imgCheck.onload = resolve;
          imgCheck.onerror = reject;
          // Timeout after 15 seconds
          setTimeout(() => reject(new Error("Timeout")), 15000);
        });

        setResults(prev => prev.map(r => r.prompt === prompt ? { ...r, status: 'success', imageUrl: imageUrl } : r));
      } catch (e) {
        setResults(prev => prev.map(r => r.prompt === prompt ? { ...r, status: 'error', error: 'Connection weak. Try again.' } : r));
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
      zip.file(`image_${i+1}.jpg`, blob);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = 'ai_images_bulk.zip';
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-blue-400 mb-2 underline decoration-white italic">AI BULK GENERATOR V5</h1>
          <p className="text-slate-400">Stable Professional Build</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-2xl mb-10">
          <textarea
            className="w-full h-32 bg-slate-900 rounded-2xl p-4 text-white border border-slate-700 focus:border-blue-500 outline-none"
            placeholder="One prompt per line..."
            value={promptsText}
            onChange={(e) => setPromptsText(e.target.value)}
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !promptsText.trim()}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="animate-spin mx-auto" /> : "GENERATE ALL"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((res) => (
            <div key={res.id} className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 p-2">
              <div className="aspect-square bg-slate-900 rounded-xl flex items-center justify-center relative overflow-hidden">
                {res.status === 'generating' && <Loader2 className="animate-spin text-blue-500 w-10 h-10" />}
                {res.status === 'error' && <AlertTriangle className="text-red-500 w-8 h-8" />}
                {res.status === 'success' && <img src={res.imageUrl} className="w-full h-full object-cover" alt="AI result" />}
              </div>
              <p className="text-[10px] mt-2 text-slate-400 truncate px-2">{res.prompt}</p>
            </div>
          ))}
        </div>

        {results.some(r => r.status === 'success') && (
          <div className="mt-10 flex justify-center">
            <button onClick={handleDownloadZip} className="bg-white text-black px-10 py-3 rounded-xl font-bold flex items-center hover:bg-slate-200">
              <Archive className="mr-2" /> DOWNLOAD ZIP
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

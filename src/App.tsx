import React, { useState } from 'react';
import JSZip from 'jszip';
import { Loader2, Download, ImageIcon, Archive, AlertCircle, CheckCircle } from 'lucide-react';

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

    // DeepAI Key from environment or fallback
    const apiKey = process.env.DEEPAI_API_KEY || 'f47c418e-1be5-4c93-9eea-fbebf3d3e234';

    for (let i = 0; i < lines.length; i++) {
      const prompt = lines[i];
      setResults(prev => prev.map(r => r.prompt === prompt ? { ...r, status: 'generating' } : r));

      try {
        const formData = new FormData();
        formData.append('text', prompt);

        // API Call
        const response = await fetch('https://api.deepai.org/api/text2img', {
          method: 'POST',
          headers: { 'api-key': apiKey },
          body: formData
        });

        const data = await response.json();

        if (data.output_url) {
          setResults(prev => prev.map(r => r.prompt === prompt ? { ...r, status: 'success', imageUrl: data.output_url } : r));
        } else {
          throw new Error(data.err || 'Generation failed');
        }
      } catch (e: any) {
        setResults(prev => prev.map(r => r.prompt === prompt ? { ...r, status: 'error', error: 'CORS or API Blocked' } : r));
      }
    }
    setIsGenerating(false);
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    const successful = results.filter(r => r.status === 'success' && r.imageUrl);
    
    for (let i = 0; i < successful.length; i++) {
      try {
        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(successful[i].imageUrl!)}`);
        const blob = await response.blob();
        zip.file(`deepai_${i+1}.jpg`, blob);
      } catch (e) {
        console.error("Download failed for one image");
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = 'deepai_images.zip';
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-xs font-bold flex items-center gap-2 border border-blue-200">
              <CheckCircle className="w-3 h-3" /> DEEPAI ENGINE ACTIVE
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2 uppercase italic">Nano Banana <span className="text-blue-600">Pro</span></h1>
          <p className="text-slate-500">Premium Bulk Image Generation Dashboard</p>
        </header>

        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 p-8 mb-10">
          <textarea
            rows={5}
            className="w-full rounded-2xl border-slate-200 bg-slate-50 p-5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
            placeholder="Type your prompts here (One per line)..."
            value={promptsText}
            onChange={(e) => setPromptsText(e.target.value)}
          />
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !promptsText.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-bold flex items-center shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <ImageIcon className="mr-2" />}
              Generate All
            </button>
          </div>
        </div>

        {results.length > 0 && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Generated Results</h2>
              <span className="bg-slate-200 px-4 py-1 rounded-full text-xs font-bold text-slate-600">
                {results.filter(r => r.status === 'success').length} / {results.length} Ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {results.map((res) => (
                <div key={res.id} className="bg-white rounded-[2rem] shadow-md border border-slate-100 overflow-hidden flex flex-col group hover:shadow-xl transition-all">
                  <div className="aspect-square bg-slate-100 flex items-center justify-center relative">
                    {res.status === 'generating' && <Loader2 className="animate-spin text-blue-500 w-12 h-12" />}
                    {res.status === 'error' && (
                      <div className="text-center p-6 text-red-500">
                        <AlertCircle className="mx-auto mb-2 w-8 h-8 opacity-50" />
                        <p className="text-[10px] font-bold uppercase">{res.error}</p>
                      </div>
                    )}
                    {res.status === 'success' && res.imageUrl && (
                      <img src={res.imageUrl} className="w-full h-full object-cover" alt="AI" />
                    )}
                  </div>
                  <div className="p-6">
                    <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-4 h-8">{res.prompt}</p>
                    <a 
                      href={res.imageUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${res.status === 'success' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                    >
                      <Download className="w-3 h-3" /> View / Download
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {results.some(r => r.status === 'success') && (
              <div className="flex justify-center py-10">
                <button onClick={handleDownloadZip} className="bg-blue-600 text-white px-12 py-5 rounded-[2rem] font-black flex items-center gap-3 hover:bg-blue-700 shadow-2xl transition-all uppercase tracking-tighter">
                  <Archive className="w-6 h-6" /> Download Full Zip Archive
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

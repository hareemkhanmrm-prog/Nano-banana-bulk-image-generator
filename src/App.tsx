import React, { useState } from 'react';
import JSZip from 'jszip';
import { Loader2, Download, Image as ImageIcon, Archive, AlertCircle } from 'lucide-react';

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

  const fetchImage = async (prompt: string, attempt: number = 0): Promise<string> => {
    const seed = Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(prompt);
    
    // Attempt 1: Pollinations (Flux Model)
    // Attempt 2: Pollinations (Turbo Model)
    const models = ['flux', 'turbo'];
    const currentModel = models[attempt % models.length];
    
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true&model=${currentModel}`;

    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('Busy');

    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  const handleGenerate = async () => {
    const lines = promptsText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;

    setResults(lines.map((p, i) => ({ id: `${Date.now()}-${i}`, prompt: p, status: 'pending' })));
    setIsGenerating(true);

    const currentResults = lines.map((p, i) => ({ id: `${Date.now()}-${i}`, prompt: p, status: 'pending' }));

    for (let i = 0; i < currentResults.length; i++) {
      const res = currentResults[i];
      setResults(prev => prev.map(r => r.id === res.id ? { ...r, status: 'generating' } : r));

      let success = false;
      let retries = 0;
      while (!success && retries < 3) {
        try {
          const imgData = await fetchImage(res.prompt, retries);
          setResults(prev => prev.map(r => r.id === res.id ? { ...r, status: 'success', imageUrl: imgData } : r));
          success = true;
        } catch (e) {
          retries++;
          setResults(prev => prev.map(r => r.id === res.id ? { ...r, error: `Retrying (${retries}/3)...` } : r));
          await new Promise(r => setTimeout(r, 2000));
        }
      }
      if (!success) {
        setResults(prev => prev.map(r => r.id === res.id ? { ...r, status: 'error', error: 'Server too busy. Try later.' } : r));
      }
    }
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Bulk AI Image Generator (V2)</h1>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm mb-10 border border-slate-200">
          <textarea
            className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 border border-slate-100"
            rows={5}
            placeholder="Enter prompts (one per line)..."
            value={promptsText}
            onChange={(e) => setPromptsText(e.target.value)}
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !promptsText.trim()}
            className="mt-4 w-full bg-blue-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-blue-700 transition-all flex items-center justify-center"
          >
            {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <ImageIcon className="mr-2" />}
            Generate Now
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((result) => (
            <div key={result.id} className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
              <div className="aspect-square bg-slate-100 flex items-center justify-center relative">
                {result.status === 'generating' && <Loader2 className="animate-spin text-blue-500 w-8 h-8" />}
                {result.status === 'error' && <span className="text-red-500 text-xs px-4 text-center">{result.error}</span>}
                {result.status === 'success' && <img src={result.imageUrl} className="w-full h-full object-cover" />}
                {result.error && result.status !== 'error' && <span className="absolute bottom-2 text-[10px] text-blue-600 font-bold">{result.error}</span>}
              </div>
              <div className="p-4">
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{result.prompt}</p>
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = result.imageUrl!;
                    a.download = 'image.png';
                    a.click();
                  }}
                  disabled={result.status !== 'success'}
                  className="w-full bg-slate-100 py-2 rounded-lg text-xs font-bold disabled:opacity-30"
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

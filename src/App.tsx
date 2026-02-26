import React, { useState } from 'react';
import JSZip from 'jszip';
import { Loader2, Download, Image as ImageIcon, Archive, RefreshCw } from 'lucide-react';

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

  const fetchImageWithRetry = async (prompt: string, attempt: number = 0): Promise<string> => {
    const seed = Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(prompt);
    
    // Switch models based on attempts to find an available server
    const models = ['flux', 'turbo', 'dreamshaper'];
    const model = models[attempt % models.length];
    
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true&model=${model}`;

    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      if (attempt < 2) return fetchImageWithRetry(prompt, attempt + 1);
      throw new Error('All servers busy');
    }

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

    for (let i = 0; i < lines.length; i++) {
      const prompt = lines[i];
      const id = `${Date.now()}-${i}`;
      
      setResults(prev => prev.map(r => r.prompt === prompt ? { ...r, status: 'generating' } : r));

      try {
        const imgData = await fetchImageWithRetry(prompt);
        setResults(prev => prev.map(r => r.prompt === prompt ? { ...r, status: 'success', imageUrl: imgData } : r));
      } catch (e) {
        setResults(prev => prev.map(r => r.prompt === prompt ? { ...r, status: 'error', error: 'Server Overload' } : r));
      }
    }
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-black mb-2 tracking-tighter bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent uppercase">Nano Banana Pro</h1>
          <p className="text-neutral-500 text-sm font-mono">STABLE BULK GENERATOR V4.0</p>
        </header>

        <div className="bg-[#141414] p-8 rounded-[2rem] border border-neutral-800 shadow-2xl mb-12">
          <textarea
            className="w-full bg-[#0a0a0a] rounded-2xl p-6 text-lg outline-none border border-neutral-800 focus:border-blue-500 transition-all min-h-[150px]"
            placeholder="Describe your vision (one per line)..."
            value={promptsText}
            onChange={(e) => setPromptsText(e.target.value)}
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !promptsText.trim()}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-xl flex items-center justify-center transition-all disabled:opacity-20 uppercase tracking-widest"
          >
            {isGenerating ? <Loader2 className="animate-spin mr-3 w-6 h-6" /> : <ImageIcon className="mr-3 w-6 h-6" />}
            Generate
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {results.map((res) => (
            <div key={res.id} className="bg-[#141414] rounded-[1.5rem] border border-neutral-800 overflow-hidden group">
              <div className="aspect-square bg-[#0a0a0a] flex items-center justify-center relative">
                {res.status === 'generating' && <Loader2 className="animate-spin text-blue-500 w-12 h-12" />}
                {res.status === 'error' && <div className="text-center p-4"><RefreshCw className="w-8 h-8 text-red-500 mx-auto mb-2 opacity-50" /><span className="text-[10px] font-bold text-red-500 uppercase">{res.error}</span></div>}
                {res.status === 'success' && <img src={res.imageUrl} className="w-full h-full object-cover" alt="AI result" />}
              </div>
              <div className="p-5 flex flex-col gap-4">
                <p className="text-[10px] text-neutral-500 uppercase font-bold truncate">{res.prompt}</p>
                <button
                  onClick={() => { const a = document.createElement('a'); a.href = res.imageUrl!; a.download = 'nano_banana.png'; a.click(); }}
                  disabled={res.status !== 'success'}
                  className="bg-neutral-800 hover:bg-neutral-700 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-10"
                >
                  Download PNG
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import JSZip from 'jszip';
import { Loader2, Download, Image as ImageIcon, Archive } from 'lucide-react';

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

  const fetchImage = async (prompt: string): Promise<string> => {
    const seed = Math.floor(Math.random() * 9999999);
    const encodedPrompt = encodeURIComponent(prompt);
    
    // Using a different, ultra-fast endpoint
    const url = `https://pollinations.ai/p/${encodedPrompt}?width=1024&height=1024&seed=${seed}&model=turbo`;

    const response = await fetch(url);
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

    const initialResults = lines.map((p, i) => ({ id: `${Date.now()}-${i}`, prompt: p, status: 'pending' as const }));
    setResults(initialResults);
    setIsGenerating(true);

    for (let i = 0; i < initialResults.length; i++) {
      const res = initialResults[i];
      setResults(prev => prev.map(r => r.id === res.id ? { ...r, status: 'generating' } : r));

      try {
        const imgData = await fetchImage(res.prompt);
        setResults(prev => prev.map(r => r.id === res.id ? { ...r, status: 'success', imageUrl: imgData } : r));
      } catch (e) {
        setResults(prev => prev.map(r => r.id === res.id ? { ...r, status: 'error', error: 'Server busy, retry later.' } : r));
      }
    }
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-indigo-400">Bulk AI Image Pro</h1>
        
        <div className="bg-neutral-800 p-6 rounded-3xl shadow-2xl mb-10 border border-neutral-700">
          <textarea
            className="w-full p-4 bg-neutral-900 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 border border-neutral-700 text-white"
            rows={4}
            placeholder="Enter prompts (one per line)..."
            value={promptsText}
            onChange={(e) => setPromptsText(e.target.value)}
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !promptsText.trim()}
            className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-2xl font-bold transition-all flex items-center justify-center disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <ImageIcon className="mr-2" />}
            Generate Images
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((result) => (
            <div key={result.id} className="bg-neutral-800 rounded-3xl overflow-hidden border border-neutral-700 shadow-lg">
              <div className="aspect-square bg-neutral-900 flex items-center justify-center">
                {result.status === 'generating' && <Loader2 className="animate-spin text-indigo-500 w-10 h-10" />}
                {result.status === 'error' && <span className="text-red-400 text-xs px-4 text-center">{result.error}</span>}
                {result.status === 'success' && <img src={result.imageUrl} className="w-full h-full object-cover" />}
              </div>
              <div className="p-4">
                <p className="text-[10px] text-neutral-400 truncate mb-3">{result.prompt}</p>
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = result.imageUrl!;
                    a.download = 'ai_image.png';
                    a.click();
                  }}
                  disabled={result.status !== 'success'}
                  className="w-full bg-neutral-700 py-2 rounded-xl text-xs font-bold hover:bg-neutral-600 disabled:opacity-20"
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

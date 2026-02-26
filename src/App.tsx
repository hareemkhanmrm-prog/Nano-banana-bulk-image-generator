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
    const seed = Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(prompt);
    
    // Using a more reliable, high-speed direct CDN link
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true&model=turbo`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Busy');

    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleGenerate = async () => {
    const lines = promptsText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;

    setResults(lines.map((p, i) => ({ id: `${Date.now()}-${i}`, prompt: p, status: 'pending' })));
    setIsGenerating(true);

    for (const res of lines.map((p, i) => ({ id: `${Date.now()}-${i}`, prompt: p }))) {
      setResults(prev => prev.map(r => r.prompt === res.prompt ? { ...r, status: 'generating' } : r));

      try {
        const imgData = await fetchImage(res.prompt);
        setResults(prev => prev.map(r => r.prompt === res.prompt ? { ...r, status: 'success', imageUrl: imgData } : r));
      } catch (e) {
        setResults(prev => prev.map(r => r.prompt === res.prompt ? { ...r, status: 'error', error: 'Server load high. Try one by one.' } : r));
      }
    }
    setIsGenerating(false);
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    const successful = results.filter(r => r.status === 'success' && r.imageUrl);
    successful.forEach((r, i) => {
      const data = r.imageUrl!.split(',')[1];
      zip.file(`image_${i+1}.png`, data, { base64: true });
    });
    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = 'ai_images.zip';
    a.click();
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black text-center mb-2 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent italic">BULK AI GENERATOR</h1>
        <p className="text-center text-neutral-500 mb-10 text-sm tracking-widest">STABLE ENGINE V3.0</p>
        
        <div className="bg-neutral-900 p-1 rounded-3xl mb-10 shadow-[0_0_20px_rgba(79,70,229,0.2)]">
          <textarea
            className="w-full p-6 bg-neutral-900 rounded-3xl outline-none text-lg border-none focus:ring-0"
            rows={4}
            placeholder="Describe your images..."
            value={promptsText}
            onChange={(e) => setPromptsText(e.target.value)}
          />
          <div className="p-4 flex justify-end border-t border-neutral-800">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !promptsText.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 px-10 py-3 rounded-2xl font-bold flex items-center transition-all disabled:opacity-30"
            >
              {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <ImageIcon className="mr-2" />}
              GENERATE
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((result) => (
            <div key={result.id} className="bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800 hover:border-indigo-500/50 transition-all group">
              <div className="aspect-square bg-neutral-950 flex items-center justify-center relative">
                {result.status === 'generating' && <Loader2 className="animate-spin text-indigo-500 w-10 h-10" />}
                {result.status === 'error' && <span className="text-red-500 text-[10px] font-bold text-center px-4 uppercase">{result.error}</span>}
                {result.status === 'success' && <img src={result.imageUrl} className="w-full h-full object-cover" alt="AI" />}
              </div>
              <div className="p-4">
                <button
                  onClick={() => { const a = document.createElement('a'); a.href = result.imageUrl!; a.download = 'ai.png'; a.click(); }}
                  disabled={result.status !== 'success'}
                  className="w-full bg-neutral-800 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-neutral-700 disabled:opacity-10"
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>

        {results.some(r => r.status === 'success') && (
          <div className="mt-12 flex justify-center">
            <button onClick={handleDownloadZip} className="bg-white text-black px-12 py-4 rounded-2xl font-black flex items-center hover:bg-neutral-200 transition-all uppercase tracking-tighter">
              <Archive className="mr-2" /> Download All (.ZIP)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

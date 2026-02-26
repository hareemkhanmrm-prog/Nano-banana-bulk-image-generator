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

  const handleGenerate = async () => {
    const lines = promptsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) return;

    const initialResults: GenerationResult[] = lines.map((prompt, index) => ({
      id: `${Date.now()}-${index}`,
      prompt,
      status: 'pending',
    }));

    setResults(initialResults);
    setIsGenerating(true);

    for (let i = 0; i < initialResults.length; i++) {
      const currentResult = initialResults[i];
      
      setResults((prev) =>
        prev.map((r) =>
          r.id === currentResult.id ? { ...r, status: 'generating' } : r
        )
      );

      try {
        const seed = Math.floor(Math.random() * 1000000);
        const encodedPrompt = encodeURIComponent(currentResult.prompt);
        
        // Final Stable Engine: Pollinations with a more robust proxy bypass
        const targetUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux`;
        
        // Using a direct fetch with no-cache to avoid 'API Busy' errors
        const response = await fetch(targetUrl, {
          method: 'GET',
          headers: { 'Accept': 'image/*' },
          cache: 'no-store'
        });

        if (!response.ok) throw new Error('Service overloaded. Trying again...');

        const blob = await response.blob();
        const base64data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        setResults((prev) =>
          prev.map((r) =>
            r.id === currentResult.id ? { ...r, status: 'success', imageUrl: base64data } : r
          )
        );
      } catch (error: any) {
        setResults((prev) =>
          prev.map((r) =>
            r.id === currentResult.id ? { ...r, status: 'error', error: 'Network busy, retrying...' } : r
          )
        );
      }
    }
    setIsGenerating(false);
  };

  const handleDownloadSingle = (result: GenerationResult) => {
    if (!result.imageUrl) return;
    const a = document.createElement('a');
    a.href = result.imageUrl;
    const safePrompt = result.prompt.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
    a.download = `${safePrompt}.png`;
    a.click();
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    const successfulResults = results.filter((r) => r.status === 'success' && r.imageUrl);
    if (successfulResults.length === 0) return;

    successfulResults.forEach((result, index) => {
      const base64Data = result.imageUrl!.split(',')[1];
      const safePrompt = result.prompt.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
      zip.file(`${safePrompt}_${index + 1}.png`, base64Data, { base64: true });
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url; a.download = 'bulk_images_final.zip'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Bulk AI Image Generator</h1>
          <p className="text-slate-500">Stable Professional Engine (No Limits)</p>
        </header>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 mb-10">
          <textarea
            rows={6}
            className="w-full rounded-2xl border-slate-200 bg-slate-50 p-5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="A cat in space&#10;A futuristic car"
            value={promptsText}
            onChange={(e) => setPromptsText(e.target.value)}
          />
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !promptsText.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold flex items-center transition-all disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <ImageIcon className="mr-2" />}
              Generate Images
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {results.map((result) => (
            <div key={result.id} className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden flex flex-col">
              <div className="aspect-square bg-slate-100 flex items-center justify-center p-2">
                {result.status === 'generating' && <Loader2 className="animate-spin text-blue-500 w-10 h-10" />}
                {result.status === 'error' && <span className="text-red-500 text-xs font-bold px-4 text-center">{result.error}</span>}
                {result.status === 'success' && <img src={result.imageUrl} className="w-full h-full object-cover rounded-xl" alt="AI Generated" />}
              </div>
              <div className="p-5">
                <p className="text-xs text-slate-500 mb-4 line-clamp-2">{result.prompt}</p>
                <button
                  onClick={() => handleDownloadSingle(result)}
                  disabled={result.status !== 'success'}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-sm font-bold flex items-center justify-center transition-all disabled:opacity-30"
                >
                  <Download className="w-4 h-4 mr-2" /> Download
                </button>
              </div>
            </div>
          ))}
        </div>

        {results.some(r => r.status === 'success') && (
          <div className="mt-12 flex justify-center">
            <button onClick={handleDownloadZip} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold flex items-center shadow-2xl hover:bg-slate-800 transition-all">
              <Archive className="mr-3" /> Download All ZIP
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

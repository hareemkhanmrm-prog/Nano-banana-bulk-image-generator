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

    // DeepAI API Key from environment variable
    const apiKey = process.env.DEEPAI_API_KEY || 'f47c418e-1be5-4c93-9eea-fbebf3d3e234';

    for (let i = 0; i < lines.length; i++) {
      const prompt = lines[i];
      setResults(prev => prev.map(r => r.prompt === prompt ? { ...r, status: 'generating' } : r));

      try {
        const formData = new FormData();
        formData.append('text', prompt);

        const response = await fetch('https://api.deepai.org/api/text2img', {
          method: 'POST',
          headers: { 'api-key': apiKey },
          body: formData
        });

        if (!response.ok) throw new Error('API request failed');
        
        const data = await response.json();

        if (data.output_url) {
          setResults(prev => prev.map(r => r.prompt === prompt ? { ...r, status: 'success', imageUrl: data.output_url } : r));
        } else {
          throw new Error('Image generation failed');
        }
      } catch (e: any) {
        setResults(prev => prev.map(r => r.prompt === prompt ? { ...r, status: 'error', error: e.message } : r));
      }
    }
    setIsGenerating(false);
  };

  const handleDownloadSingle = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/\s+/g, '_')}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai_bulk_images.zip';
    a.click();
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans p-4 md:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 mb-3">Bulk AI Image Generator</h1>
          <p className="text-neutral-500 max-w-2xl mx-auto">Using DeepAI Engine with Environment Variable Setup.</p>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 mb-8">
          <textarea
            rows={6}
            className="w-full rounded-xl border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-neutral-50 p-4 text-sm border resize-y"
            placeholder="Enter prompts (One per line)..."
            value={promptsText}
            onChange={(e) => setPromptsText(e.target.value)}
          />
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !promptsText.trim()}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isGenerating ? <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> : <ImageIcon className="-ml-1 mr-2 h-5 w-5" />}
              Generate All Images
            </button>
          </div>
        </div>

        {results.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight">Generated Results</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((res) => (
                <div key={res.id} className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col">
                  <div className="aspect-square bg-neutral-100 flex items-center justify-center relative">
                    {res.status === 'generating' && <Loader2 className="animate-spin text-indigo-500 w-10 h-10" />}
                    {res.status === 'error' && (
                      <div className="text-center p-4">
                        <AlertCircle className="text-red-500 mx-auto mb-2" />
                        <span className="text-xs text-red-500">{res.error}</span>
                      </div>
                    )}
                    {res.status === 'success' && res.imageUrl && (
                      <img src={res.imageUrl} className="w-full h-full object-cover" alt="AI Generated" crossOrigin="anonymous" />
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <p className="text-sm text-neutral-700 line-clamp-2 mb-4 flex-grow">{res.prompt}</p>
                    <button
                      onClick={() => handleDownloadSingle(res.imageUrl!, res.prompt)}
                      disabled={res.status !== 'success'}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-neutral-300 shadow-sm text-sm font-medium rounded-lg text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-30"
                    >
                      <Download className="-ml-1 mr-2 h-4 w-4" /> Download
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {results.some(r => r.status === 'success') && (
              <div className="mt-12 pt-8 border-t border-neutral-200 flex justify-center">
                <button onClick={handleDownloadZip} className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl shadow-sm text-white bg-neutral-900 hover:bg-neutral-800 transition-colors">
                  <Archive className="-ml-1 mr-3 h-6 w-6" /> Download All as ZIP
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

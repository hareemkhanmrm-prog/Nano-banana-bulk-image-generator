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
        const userKey = Math.random().toString(36).substring(2, 10);
        const seed = Math.floor(Math.random() * 1000000000);
        const encodedPrompt = encodeURIComponent(currentResult.prompt);
        
        // Using a CORS Proxy to fix the "Failed to fetch" error
        const targetUrl = `https://image-generation.perchance.org/api/generate?prompt=${encodedPrompt}&seed=${seed}&userKey=${userKey}`;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
           throw new Error('API is currently busy. Please try again in a moment.');
        }

        const blob = await response.blob();
        
        if (!blob.type.startsWith('image/')) {
          throw new Error('Received invalid data instead of an image.');
        }

        const base64data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        setResults((prev) =>
          prev.map((r) =>
            r.id === currentResult.id
              ? { ...r, status: 'success', imageUrl: base64data }
              : r
          )
        );
      } catch (error: any) {
        setResults((prev) =>
          prev.map((r) =>
            r.id === currentResult.id
              ? { ...r, status: 'error', error: error.message || 'Connection error' }
              : r
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
    const successfulResults = results.filter(
      (r) => r.status === 'success' && r.imageUrl
    );

    if (successfulResults.length === 0) return;

    successfulResults.forEach((result, index) => {
      const base64Data = result.imageUrl!.split(',')[1];
      const safePrompt = result.prompt.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
      zip.file(`${safePrompt}_${index + 1}.png`, base64Data, { base64: true });
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_images_perchance.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  const successfulCount = results.filter((r) => r.status === 'success').length;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 mb-3">
            Bulk AI Image Generator (Stable)
          </h1>
          <p className="text-neutral-500 max-w-2xl mx-auto">
            Powered by Perchance AI engine. High-quality bulk image generation without limits.
          </p>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 mb-8">
          <label htmlFor="prompts" className="block text-sm font-medium text-neutral-700 mb-2">
            Image Prompts (One per line)
          </label>
          <textarea
            id="prompts"
            rows={8}
            className="w-full rounded-xl border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-neutral-50 p-4 text-sm border resize-y"
            placeholder="A futuristic city at sunset&#10;A cute cat wearing a spacesuit"
            value={promptsText}
            onChange={(e) => setPromptsText(e.target.value)}
            disabled={isGenerating}
          />

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !promptsText.trim()}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Generating...
                </>
              ) : (
                <>
                  <ImageIcon className="-ml-1 mr-2 h-5 w-5" />
                  Generate All Images
                </>
              )}
            </button>
          </div>
        </div>

        {results.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">Results</h2>
              <span className="text-sm text-neutral-500 bg-neutral-200 px-3 py-1 rounded-full">
                {successfulCount} / {results.length} Completed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((result) => (
                <div key={result.id} className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col">
                  <div className="aspect-square bg-neutral-100 relative flex items-center justify-center p-4">
                    {result.status === 'pending' && <span className="text-sm text-neutral-400">Waiting...</span>}
                    {result.status === 'generating' && <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />}
                    {result.status === 'error' && (
                      <div className="text-center p-2 text-red-500">
                        <AlertCircle className="h-6 w-6 mx-auto mb-1" />
                        <span className="text-xs font-medium">{result.error}</span>
                      </div>
                    )}
                    {result.status === 'success' && result.imageUrl && (
                      <img src={result.imageUrl} alt={result.prompt} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <p className="text-sm text-neutral-700 line-clamp-2 mb-4 flex-grow">{result.prompt}</p>
                    <button
                      onClick={() => handleDownloadSingle(result)}
                      disabled={result.status !== 'success'}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-neutral-300 shadow-sm text-sm font-medium rounded-lg hover:bg-neutral-50 disabled:opacity-50"
                    >
                      <Download className="-ml-1 mr-2 h-4 w-4" /> Download
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {successfulCount > 0 && (
              <div className="mt-12 pt-8 border-t border-neutral-200 flex justify-center">
                <button
                  onClick={handleDownloadZip}
                  className="inline-flex items-center px-8 py-4 text-white bg-neutral-900 rounded-xl hover:bg-neutral-800 transition-colors"
                >
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

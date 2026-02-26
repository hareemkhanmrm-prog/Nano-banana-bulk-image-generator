import React, { useState } from 'react';

export default function App() {
  const [promptsText, setPromptsText] = useState('');
  const [images, setImages] = useState<{prompt: string, url: string}[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    const lines = promptsText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;

    setIsGenerating(true);
    const newImages = lines.map(prompt => {
      const seed = Math.floor(Math.random() * 1000000);
      return {
        prompt,
        url: `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=512&height=512&seed=${seed}&nologo=true`
      };
    });

    setImages(newImages);
    // Humne delay rakha hai taake loading animation dikhayi de
    setTimeout(() => setIsGenerating(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-center mb-8 text-blue-500 uppercase">Nano Banana: Direct Render</h1>
        
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 mb-10">
          <textarea
            className="w-full h-32 bg-slate-950 rounded-2xl p-4 border border-slate-800 outline-none focus:border-blue-500"
            placeholder="Enter prompts..."
            value={promptsText}
            onChange={(e) => setPromptsText(e.target.value)}
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full mt-4 bg-blue-600 py-3 rounded-xl font-bold hover:bg-blue-500 disabled:opacity-30"
          >
            {isGenerating ? "Connecting to Engine..." : "GENERATE IMAGES"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {images.map((img, i) => (
            <div key={i} className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800">
              <div className="aspect-square bg-black flex items-center justify-center">
                <img 
                  src={img.url} 
                  alt={img.prompt}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/512?text=Network+Error+Check+VPN";
                  }}
                />
              </div>
              <div className="p-4 flex justify-between items-center">
                <p className="text-[10px] text-slate-500 truncate w-2/3">{img.prompt}</p>
                <a href={img.url} target="_blank" className="text-[10px] bg-slate-800 px-3 py-1 rounded-lg">Open Link</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

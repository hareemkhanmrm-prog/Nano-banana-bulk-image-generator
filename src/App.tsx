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
      // Fixed URL Structure: No extra params that might break the request
      return {
        prompt,
        url: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${seed}&model=flux`
      };
    });

    setImages(newImages);
    setTimeout(() => setIsGenerating(false), 1000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black text-center mb-10 text-indigo-500 uppercase tracking-tighter italic">Nano Banana: Stable Build</h1>
        
        <div className="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 mb-12 shadow-2xl">
          <textarea
            className="w-full h-32 bg-black rounded-2xl p-5 text-white border border-white/10 outline-none focus:border-indigo-500 transition-all"
            placeholder="Enter prompts (one per line)..."
            value={promptsText}
            onChange={(e) => setPromptsText(e.target.value)}
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-black text-lg shadow-lg shadow-indigo-500/20 transition-all uppercase"
          >
            {isGenerating ? "Syncing..." : "Generate Images"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {images.map((img, i) => (
            <div key={i} className="bg-[#111] rounded-[2rem] overflow-hidden border border-white/5 group hover:border-indigo-500/50 transition-all">
              <div className="aspect-square bg-black flex items-center justify-center p-2">
                <img 
                  src={img.url} 
                  alt={img.prompt}
                  className="w-full h-full object-cover rounded-2xl"
                  onLoad={() => console.log("Loaded: " + img.prompt)}
                  onError={(e) => {
                    const parent = e.currentTarget.parentElement;
                    if (parent) parent.innerHTML = "<div class='text-[10px] text-red-500 font-bold'>Server Rejected Request<br/>Try different prompt</div>";
                  }}
                />
              </div>
              <div className="p-5 flex justify-between items-center bg-black/20">
                <p className="text-[10px] text-white/40 uppercase font-bold truncate w-2/3">{img.prompt}</p>
                <a 
                  href={img.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[9px] bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-full font-black uppercase hover:bg-indigo-600 hover:text-white transition-all"
                >
                  View
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

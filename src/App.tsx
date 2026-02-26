import React, { useState } from 'react';

export default function App() {
  const [apiKey, setApiKey] = useState('f47c418e-1be5-4c93-9eea-fbebf3d3e234');
  const [promptsText, setPromptsText] = useState('');
  const [images, setImages] = useState<{prompt: string, url: string, status: string}[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    const lines = promptsText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;

    setLoading(true);
    const newResults = lines.map(p => ({ prompt: p, url: '', status: 'Generating...' }));
    setImages(newResults);

    for (let i = 0; i < lines.length; i++) {
      try {
        const formData = new FormData();
        formData.append('text', lines[i]);

        const response = await fetch('https://api.deepai.org/api/text2img', {
          method: 'POST',
          headers: { 'api-key': apiKey },
          body: formData
        });

        const data = await response.json();
        
        setImages(prev => prev.map((img, index) => 
          index === i ? { ...img, url: data.output_url, status: 'Success' } : img
        ));
      } catch (error) {
        setImages(prev => prev.map((img, index) => 
          index === i ? { ...img, status: 'Failed' } : img
        ));
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f4f4f4', minHeight: '100-screen' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#fff', padding: '20px', borderRadius: '10px' }}>
        <h2>DeepAI Bulk Generator (Sada Build)</h2>
        
        <label>API Key:</label>
        <input 
          type="text" 
          value={apiKey} 
          onChange={(e) => setApiKey(e.target.value)} 
          style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />

        <label>Prompts (Har line mein ek):</label>
        <textarea 
          rows={5} 
          value={promptsText} 
          onChange={(e) => setPromptsText(e.target.value)} 
          style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />

        <button 
          onClick={handleGenerate} 
          disabled={loading}
          style={{ width: '100%', padding: '15px', marginTop: '10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          {loading ? 'Processing...' : 'Start Generating'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {images.map((img, i) => (
          <div key={i} style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
            {img.url ? (
              <img src={img.url} alt="AI" style={{ width: '100%', borderRadius: '5px' }} />
            ) : (
              <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee' }}>
                {img.status}
              </div>
            )}
            <p style={{ fontSize: '12px', color: '#666' }}>{img.prompt}</p>
            {img.url && <a href={img.url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'blue' }}>Download</a>}
          </div>
        ))}
      </div>
    </div>
  );
}

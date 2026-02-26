// ... imports same (React, useState, JSZip, lucide icons)

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
      const response = await fetch('https://backend.craiyon.com/v3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: currentResult.prompt,
          version: 'c6y2m3p4z3t8',  // latest version as of 2026, agar change ho to inspect network tab on craiyon.com
          negative_prompt: '',     // optional
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      // Craiyon returns array of base64 images usually in data.images
      let imageUrl = '';
      if (data.images && data.images.length > 0) {
        // First image (you can loop for more if want)
        imageUrl = `data:image/png;base64,${data.images[0]}`;
      }

      if (imageUrl) {
        setResults((prev) =>
          prev.map((r) =>
            r.id === currentResult.id
              ? { ...r, status: 'success', imageUrl }
              : r
          )
        );
      } else {
        throw new Error('No image data in response');
      }
    } catch (error: any) {
      setResults((prev) =>
        prev.map((r) =>
          r.id === currentResult.id
            ? { ...r, status: 'error', error: error.message || 'Craiyon failed - try later or check prompt' }
            : r
        )
      );
    }
  }

  setIsGenerating(false);
};

// Baaki code (download single, zip, UI) bilkul same rahega — sirf yeh handleGenerate replace kar dena

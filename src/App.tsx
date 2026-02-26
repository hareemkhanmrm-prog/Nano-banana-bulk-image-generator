const handleGenerate = async () => {
  // ... same prompt splitting and loop setup

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer YOUR_CLOUDFLARE_API_TOKEN',  // Vercel env mein daal dena: process.env.CF_API_TOKEN
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: currentResult.prompt,
          // optional: width: 1024, height: 1024, num_steps: 20, guidance: 7.5
        }),
      }
    );

    if (!response.ok) throw new Error(`Cloudflare error: ${response.status}`);

    const data = await response.json();
    // Response: { result: { images: [ { base64: "..." } ] } } usually array of base64
    let imageUrl = '';
    if (data.result?.images?.[0]?.base64) {
      imageUrl = `data:image/png;base64,${data.result.images[0].base64}`;
    }

    if (imageUrl) {
      // set success
    } else {
      throw new Error('No image in response');
    }
  } catch (error: any) {
    // error handling
  }
};

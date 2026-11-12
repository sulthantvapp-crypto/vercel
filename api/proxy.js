export default async function handler(req, res) {
  // CORS ഹെഡറുകൾ സെറ്റ് ചെയ്യുന്നു
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // URL പരാമീറ്റർ എടുക്കുന്നു
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: "Missing 'url' parameter" });
  }

  try {
    // Einthusan സെർവറിന് വിദേശത്ത് നിന്ന് റിക്വസ്റ്റ് വരുന്നതായി ഫീൽ ചെയ്യിക്കാനുള്ള ഹെഡറുകൾ
    const modifiedHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://einthusan.tv/",
      "Origin": "https://einthusan.tv",
      "X-Forwarded-For": "24.144.82.172", // യുണൈറ്റഡ് സ്റ്റേറ്റ്സ് ഐപി (Geo-spoofing)
      "Cookie": "_gorilla_csrf=MTc5NDQwNjQzNHxJbWN3ZWtaVlZVeGhkakZhUWpKVVIxQlZSSFJ2YWxKTWFpdFlNRk5IV0RoRVYySXdaRzh4Y1ZSd01YYzlJZ289fCcWsdMVkHynj1FEhgkjoWamx5mDCh9zT2hm5e00SlDh; sid=MTc5NDQwNjQzNHxoSy14X0NJQ19Xa1RBZUNLcXY4azdwSUlyblB6Nzc1TDl4NzkzMTVSOVQ3QVJWTjJUYWtNZ1Y4OW13al8zRk5BMWNJMmFDUnpXMzg9fPkZ2e7_dkBVoldWba-sQqi-sBfyl6zVGDUHe-acN3zG"
    };

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: modifiedHeaders,
      redirect: "follow"
    });

    const responseBody = await response.text();

    // സിനിമ വാച്ച് പേജ് ആണെങ്കിൽ MP4 ലിങ്ക് എക്സ്ട്രാക്റ്റ് ചെയ്ത് ഡയറക്ട് റീഡയറക്ട് ചെയ്യാം
    if (targetUrl.includes("einthusan.tv/movie/watch/")) {
      const match = responseBody.match(/data-mp4-link=["']([^"']+)["']/);
      if (match && match[1]) {
        let rawLink = match[1].replace(/&amp;/g, '&');
        let parts = rawLink.split('etv');
        if (parts.length > 1) {
          let streamUrl = "https://cdn1.einthusan.io/etv" + parts[1];
          return res.redirect(302, streamUrl);
        }
      }
    }

    // സാധാരണ പേജ് ആണെങ്കിൽ റെസ്പോൺസ് പാസ് ചെയ്യുക
    res.setHeader('Content-Type', response.headers.get('content-type') || 'text/html');
    return res.status(response.status).send(responseBody);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

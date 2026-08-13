export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.searchParams.get("url");

    if (!target) {
      return json({ error: "Missing ?url=" }, 400);
    }

    try {
      const res = await fetch(target, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; SitemapExtractor/2.1)",
          "Accept-Encoding": "gzip"
        }
      });

      if (!res.ok) {
        return json({ error: `Fetch failed: ${res.status}` }, 502);
      }

      let text;
      const contentEncoding = res.headers.get("content-encoding") || "";
      const isGzip = target.endsWith(".gz") || contentEncoding.includes("gzip");

      if (isGzip) {
        const buffer = await res.arrayBuffer();
        const ds = new DecompressionStream("gzip");
        const stream = new Response(buffer).body.pipeThrough(ds);
        text = await new Response(stream).text();
      } else {
        text = await res.text();
      }

      // Prevent Worker from timing out on extremely large files
      if (text.length > 6_000_000) {
        text = text.substring(0, 6_000_000);
      }

      return new Response(text, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=300"
        }
      });
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
        }
        

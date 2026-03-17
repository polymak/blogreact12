const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Content-Type": "application/json"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS
  });
}

export default {
  async fetch(request, env) {

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    /* ================= UPLOAD IMAGE ================= */

    if (url.pathname === "/api/upload" && request.method === "POST") {

      const formData = await request.formData();
      const file = formData.get("image");

      if (!file) return json({ error: "No file" }, 400);

      const fileName = Date.now() + "-" + file.name;

      await env.IMAGES.put(fileName, file.stream(), {
        httpMetadata: { contentType: file.type }
      });

      const imageUrl = `https://pub-YOUR-ID.r2.dev/${fileName}`;

      return json({ success: true, url: imageUrl });
    }

    /* ================= GET ARTICLES ================= */

    if (url.pathname === "/api/articles" && request.method === "GET") {

      const { results } = await env.DB.prepare(`
        SELECT * FROM articles
        ORDER BY date DESC
      `).all();

      return json({ success: true, data: results });
    }

    /* ================= GET ARTICLE ================= */

    if (url.pathname.match(/^\/api\/articles\/\d+$/)) {

      const id = url.pathname.split("/").pop();

      const { results } = await env.DB.prepare(
        "SELECT * FROM articles WHERE id=?"
      ).bind(id).all();

      if (!results.length) {
        return json({ error: "Not found" }, 404);
      }

      return json({ success: true, data: results[0] });
    }

    /* ================= CREATE ARTICLE ================= */

    if (url.pathname === "/api/articles" && request.method === "POST") {

      const body = await request.json();

      const result = await env.DB.prepare(`
        INSERT INTO articles (titre, contenu, image, auteur, categorie, status)
        VALUES (?, ?, ?, ?, ?, 'published')
      `)
      .bind(
        body.titre,
        body.contenu,
        body.image,
        body.auteur || "Admin",
        body.categorie || "General"
      )
      .run();

      return json({
        success: true,
        id: result.meta.last_row_id
      });
    }

    return json({ error: "Route not found" }, 404);
  }
};
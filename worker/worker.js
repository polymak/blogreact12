/**
 * BlogReact12 Worker API (FIXED VERSION)
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};

function handleCORS(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  return null;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS
  });
}

function authenticateToken(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return false;

  const token = authHeader.split(" ")[1];
  return token === "demo-token";
}

/* ---------------- SAFE JSON PARSER ---------------- */

async function getJSON(request) {
  try {
    const text = await request.text();
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/* ---------------- WORKER ---------------- */

export default {
  async fetch(request, env) {

    const cors = handleCORS(request);
    if (cors) return cors;

    const url = new URL(request.url);

    /* ================= API ================= */

    if (url.pathname === "/api/upload" && request.method === "POST") {

      if (!authenticateToken(request)) {
        return json({ error: "Unauthorized" }, 401);
      }

      const formData = await request.formData();
      const file = formData.get("file");

      if (!file) {
        return json({ success: false, error: "No file" }, 400);
      }

      const fileName = `${Date.now()}-${file.name}`;

      await env.IMAGES.put(fileName, file.stream(), {
        httpMetadata: { contentType: file.type }
      });

      return json({
        success: true,
        url: `https://pub-be96ecf581d24e5f981ad2a9ca70fe6e.r2.dev/${fileName}`
      });
    }

    /* ================= GET ALL ================= */

    if (url.pathname === "/api/articles" && request.method === "GET") {

      const { results } = await env.DB.prepare(
        "SELECT * FROM articles ORDER BY date DESC"
      ).all();

      return json({ success: true, data: results });
    }

    /* ================= CREATE ================= */

    if (url.pathname === "/api/articles" && request.method === "POST") {

      if (!authenticateToken(request)) {
        return json({ error: "Unauthorized" }, 401);
      }

      const body = await getJSON(request);

      if (!body || !body.title || !body.content) {
        return json({ error: "Invalid data" }, 400);
      }

      const result = await env.DB.prepare(
        `INSERT INTO articles 
        (titre, contenu, image, auteur, categorie, status)
        VALUES (?, ?, ?, ?, ?, 'published')`
      )
      .bind(
        body.title,
        body.content,
        body.image || "",
        "Admin",
        "General"
      )
      .run();

      return json({ success: true, id: result.meta.last_row_id });
    }

    /* ================= UPDATE ================= */

    if (url.pathname.match(/^\/api\/articles\/\d+$/) && request.method === "PUT") {

      if (!authenticateToken(request)) {
        return json({ error: "Unauthorized" }, 401);
      }

      const id = url.pathname.split("/").pop();
      const body = await getJSON(request);

      await env.DB.prepare(
        `UPDATE articles
        SET titre=?, contenu=?, image=?, updated_at=CURRENT_TIMESTAMP
        WHERE id=?`
      )
      .bind(
        body.title,
        body.content,
        body.image,
        id
      )
      .run();

      return json({ success: true });
    }

    /* ================= DELETE ================= */

    if (url.pathname.match(/^\/api\/articles\/\d+$/) && request.method === "DELETE") {

      if (!authenticateToken(request)) {
        return json({ error: "Unauthorized" }, 401);
      }

      const id = url.pathname.split("/").pop();

      await env.DB.prepare("DELETE FROM articles WHERE id=?")
        .bind(id)
        .run();

      return json({ success: true });
    }

    /* ================= LOGIN ================= */

    if (url.pathname === "/api/login" && request.method === "POST") {

      const body = await getJSON(request);

      const { results } = await env.DB.prepare(
        "SELECT * FROM users WHERE username=? AND password=?"
      )
      .bind(body.username, body.password)
      .all();

      if (!results.length) {
        return json({ success: false }, 401);
      }

      return json({
        success: true,
        token: "demo-token"
      });
    }

    return new Response("Not Found", { status: 404 });
  }
};
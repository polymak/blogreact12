/**
 * BlogReact12 Worker API
 * Cloudflare Workers + D1
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};

/* ---------------- CORS ---------------- */

function handleCORS(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  return null;
}

/* ---------------- JSON RESPONSE ---------------- */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS
  });
}

/* ---------------- AUTH ---------------- */

function authenticateToken(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return false;

  const token = authHeader.split(" ")[1];
  if (token !== "demo-token") return false;

  return true;
}

/* ---------------- ROUTE MATCHER ---------------- */

function matchRoute(request, routes) {

  const url = new URL(request.url);
  const path = url.pathname;

  for (const [pattern, handler] of Object.entries(routes)) {

    const [method, routePattern] = pattern.split(" ");

    if (method !== request.method) continue;

    const regex = new RegExp("^" + routePattern.replace(/:[^/]+/g, "([^/]+)") + "$");

    const match = path.match(regex);

    if (match) {

      const params = {};
      const names = routePattern.match(/:([^/]+)/g);

      if (names) {
        names.forEach((p, i) => {
          params[p.substring(1)] = match[i + 1];
        });
      }

      return { handler, params };
    }
  }

  return null;
}

/* ---------------- WORKER ---------------- */

export default {

  async fetch(request, env) {

    const cors = handleCORS(request);
    if (cors) return cors;

    const url = new URL(request.url);

    /* ---------------- API ROUTES ---------------- */

    const routes = {

      /* GET ARTICLES */

      "GET /api/articles": async () => {

        try {

          const page = Number(url.searchParams.get("page") || 1);
          const limit = 10;
          const offset = (page - 1) * limit;

          const { results } = await env.DB.prepare(
            `SELECT * FROM articles
             WHERE status='published'
             ORDER BY date DESC
             LIMIT ? OFFSET ?`
          )
          .bind(limit, offset)
          .all();

          return json({
            success: true,
            page,
            data: results
          });

        } catch (e) {

          return json({
            success: false,
            error: e.message
          }, 500);

        }

      },

      /* GET ARTICLE BY ID */

      "GET /api/articles/:id": async (req, params) => {

        try {

          const { results } = await env.DB.prepare(
            "SELECT * FROM articles WHERE id=?"
          )
          .bind(params.id)
          .all();

          if (!results.length) {
            return json({
              success: false,
              error: "Article non trouvé"
            }, 404);
          }

          return json({
            success: true,
            data: results[0]
          });

        } catch (e) {

          return json({
            success: false,
            error: e.message
          }, 500);

        }

      },

      /* CREATE ARTICLE */

      "POST /api/articles": async request => {

        if (!authenticateToken(request)) {
          return json({ error: "Unauthorized" }, 401);
        }

        try {

          const body = await request.json();

          const result = await env.DB.prepare(
            `INSERT INTO articles
            (titre, contenu, image, auteur, categorie, status)
            VALUES (?, ?, ?, ?, ?, 'published')`
          )
          .bind(
            body.titre,
            body.contenu,
            body.image || "",
            body.auteur || "Admin",
            body.categorie || "General"
          )
          .run();

          return json({
            success: true,
            id: result.meta.last_row_id
          });

        } catch (e) {

          return json({
            success: false,
            error: e.message
          }, 500);

        }

      },

      /* UPDATE ARTICLE */

      "PUT /api/articles/:id": async (req, params) => {

        if (!authenticateToken(req)) {
          return json({ error: "Unauthorized" }, 401);
        }

        try {

          const body = await req.json();

          await env.DB.prepare(
            `UPDATE articles
            SET titre=?, contenu=?, image=?, categorie=?, updated_at=CURRENT_TIMESTAMP
            WHERE id=?`
          )
          .bind(
            body.titre,
            body.contenu,
            body.image,
            body.categorie,
            params.id
          )
          .run();

          return json({
            success: true,
            message: "Article mis à jour"
          });

        } catch (e) {

          return json({
            success: false,
            error: e.message
          }, 500);

        }

      },

      /* DELETE ARTICLE */

      "DELETE /api/articles/:id": async (req, params) => {

        if (!authenticateToken(req)) {
          return json({ error: "Unauthorized" }, 401);
        }

        try {

          await env.DB.prepare(
            "DELETE FROM articles WHERE id=?"
          )
          .bind(params.id)
          .run();

          return json({
            success: true,
            message: "Article supprimé"
          });

        } catch (e) {

          return json({
            success: false,
            error: e.message
          }, 500);

        }

      },

      /* LOGIN */

      "POST /api/login": async request => {

        try {

          const body = await request.json();

          const { results } = await env.DB.prepare(
            "SELECT * FROM users WHERE username=? AND password=?"
          )
          .bind(body.username, body.password)
          .all();

          if (!results.length) {

            return json({
              success: false,
              message: "Identifiants incorrects"
            }, 401);

          }

          return json({
            success: true,
            token: "demo-token",
            user: results[0]
          });

        } catch (e) {

          return json({
            success: false,
            error: e.message
          }, 500);

        }

      }

    };

    if (url.pathname.startsWith("/api")) {

      const match = matchRoute(request, routes);

      if (match) {
        return await match.handler(request, match.params);
      }

      return json({
        success: false,
        error: "Route API inconnue"
      }, 404);

    }

    /* ---------------- FRONTEND ROUTER ---------------- */

    const pages = {
      "/": "index.html",
      "/index.html": "index.html",
      "/login.html": "login.html",
      "/dashboard.html": "dashboard.html",
      "/article.html": "article.html"
    };

    if (pages[url.pathname]) {
      return fetch(`https://blogreact12.pages.dev/${pages[url.pathname]}`);
    }

    return new Response("Page Not Found", { status: 404 });

  }

};
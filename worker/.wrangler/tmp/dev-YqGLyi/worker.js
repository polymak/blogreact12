var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-gcqhYg/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// db.js
var db_default = {
  // Mock execute function - replace with actual database connection
  async execute(query, params = []) {
    console.log("Database query:", query, "params:", params);
    if (query.includes("SELECT * FROM articles")) {
      return [
        {
          id: 1,
          titre: "Article de test",
          contenu: "Contenu de test pour Cloudflare Workers",
          auteur: "Admin",
          categorie: "Test",
          date: (/* @__PURE__ */ new Date()).toISOString(),
          status: "published",
          views: 0,
          likes: 0
        }
      ];
    }
    return [];
  }
};

// worker.js
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};
function authenticateToken(request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return false;
  }
  return true;
}
__name(authenticateToken, "authenticateToken");
function handleCORS(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: CORS_HEADERS
    });
  }
  return null;
}
__name(handleCORS, "handleCORS");
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json"
    }
  });
}
__name(jsonResponse, "jsonResponse");
var routes = {
  // GET /api/articles - Get all articles (public)
  "GET /api/articles": /* @__PURE__ */ __name(async (request) => {
    try {
      const [rows] = await db_default.execute(
        "SELECT * FROM articles WHERE status='published' ORDER BY date DESC"
      );
      return jsonResponse({
        success: true,
        data: rows,
        count: rows.length
      });
    } catch (error) {
      console.error("Get articles error:", error);
      return jsonResponse({
        success: false,
        error: "Erreur lors de la r\xE9cup\xE9ration des articles"
      }, 500);
    }
  }, "GET /api/articles"),
  // GET /api/articles/:id - Get single article (public)
  "GET /api/articles/:id": /* @__PURE__ */ __name(async (request, params) => {
    try {
      const id = params.id;
      const [rows] = await db_default.execute(
        "SELECT * FROM articles WHERE id=? AND status='published'",
        [id]
      );
      if (rows.length > 0) {
        return jsonResponse({
          success: true,
          data: rows[0]
        });
      } else {
        return jsonResponse({
          success: false,
          error: "Article non trouv\xE9 ou non publi\xE9"
        }, 404);
      }
    } catch (error) {
      console.error("Get article error:", error);
      return jsonResponse({
        success: false,
        error: "Erreur lors de la r\xE9cup\xE9ration de l'article"
      }, 500);
    }
  }, "GET /api/articles/:id"),
  // GET /api/articles/category/:category - Get articles by category (public)
  "GET /api/articles/category/:category": /* @__PURE__ */ __name(async (request, params) => {
    try {
      const category = params.category;
      const [rows] = await db_default.execute(
        "SELECT * FROM articles WHERE categorie=? AND status='published' ORDER BY date DESC",
        [category]
      );
      return jsonResponse({
        success: true,
        data: rows,
        count: rows.length
      });
    } catch (error) {
      console.error("Get articles by category error:", error);
      return jsonResponse({
        success: false,
        error: "Erreur lors de la r\xE9cup\xE9ration des articles"
      }, 500);
    }
  }, "GET /api/articles/category/:category"),
  // GET /api/articles/author/:author - Get articles by author (public)
  "GET /api/articles/author/:author": /* @__PURE__ */ __name(async (request, params) => {
    try {
      const author = params.author;
      const [rows] = await db_default.execute(
        "SELECT * FROM articles WHERE auteur=? AND status='published' ORDER BY date DESC",
        [author]
      );
      return jsonResponse({
        success: true,
        data: rows,
        count: rows.length
      });
    } catch (error) {
      console.error("Get articles by author error:", error);
      return jsonResponse({
        success: false,
        error: "Erreur lors de la r\xE9cup\xE9ration des articles"
      }, 500);
    }
  }, "GET /api/articles/author/:author"),
  // GET /api/articles/recent/:limit - Get recent articles (public)
  "GET /api/articles/recent/:limit": /* @__PURE__ */ __name(async (request, params) => {
    try {
      const limit = parseInt(params.limit) || 10;
      const [rows] = await db_default.execute(
        "SELECT * FROM articles WHERE status='published' ORDER BY date DESC LIMIT ?",
        [limit]
      );
      return jsonResponse({
        success: true,
        data: rows,
        count: rows.length
      });
    } catch (error) {
      console.error("Get recent articles error:", error);
      return jsonResponse({
        success: false,
        error: "Erreur lors de la r\xE9cup\xE9ration des articles r\xE9cents"
      }, 500);
    }
  }, "GET /api/articles/recent/:limit"),
  // GET /api/categories - Get categories (public)
  "GET /api/categories": /* @__PURE__ */ __name(async (request) => {
    try {
      const [rows] = await db_default.execute(
        "SELECT DISTINCT categorie, COUNT(*) as article_count FROM articles WHERE status='published' GROUP BY categorie ORDER BY article_count DESC"
      );
      return jsonResponse({
        success: true,
        data: rows
      });
    } catch (error) {
      console.error("Get categories error:", error);
      return jsonResponse({
        success: false,
        error: "Erreur lors de la r\xE9cup\xE9ration des cat\xE9gories"
      }, 500);
    }
  }, "GET /api/categories"),
  // GET /api/articles/search - Search articles (public)
  "GET /api/articles/search": /* @__PURE__ */ __name(async (request) => {
    try {
      const url = new URL(request.url);
      const q = url.searchParams.get("q");
      const category = url.searchParams.get("category");
      const author = url.searchParams.get("author");
      let query = "SELECT * FROM articles WHERE status='published'";
      let params = [];
      if (q) {
        query += " AND (titre LIKE ? OR contenu LIKE ?)";
        const searchPattern = `%${q}%`;
        params.push(searchPattern, searchPattern);
      }
      if (category) {
        query += " AND categorie = ?";
        params.push(category);
      }
      if (author) {
        query += " AND auteur = ?";
        params.push(author);
      }
      query += " ORDER BY date DESC";
      const [rows] = await db_default.execute(query, params);
      return jsonResponse({
        success: true,
        data: rows,
        count: rows.length,
        query: { q, category, author }
      });
    } catch (error) {
      console.error("Search articles error:", error);
      return jsonResponse({
        success: false,
        error: "Erreur lors de la recherche d'articles"
      }, 500);
    }
  }, "GET /api/articles/search"),
  // GET /api/stats - Get article statistics (public)
  "GET /api/stats": /* @__PURE__ */ __name(async (request) => {
    try {
      const [totalArticles] = await db_default.execute(
        "SELECT COUNT(*) as total FROM articles WHERE status='published'"
      );
      const [categories] = await db_default.execute(
        "SELECT COUNT(DISTINCT categorie) as total FROM articles WHERE status='published'"
      );
      const [authors] = await db_default.execute(
        "SELECT COUNT(DISTINCT auteur) as total FROM articles WHERE status='published'"
      );
      const [recentArticles] = await db_default.execute(
        "SELECT COUNT(*) as total FROM articles WHERE status='published' AND date >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
      );
      return jsonResponse({
        success: true,
        data: {
          total_articles: totalArticles[0].total,
          total_categories: categories[0].total,
          total_authors: authors[0].total,
          recent_articles_30_days: recentArticles[0].total
        }
      });
    } catch (error) {
      console.error("Get stats error:", error);
      return jsonResponse({
        success: false,
        error: "Erreur lors de la r\xE9cup\xE9ration des statistiques"
      }, 500);
    }
  }, "GET /api/stats"),
  // POST /api/articles/:id/views - Increment article views (public)
  "POST /api/articles/:id/views": /* @__PURE__ */ __name(async (request, params) => {
    try {
      const id = params.id;
      const [result] = await db_default.execute(
        "UPDATE articles SET views = views + 1 WHERE id = ? AND status='published'",
        [id]
      );
      if (result.affectedRows > 0) {
        return jsonResponse({
          success: true,
          message: "Compteur de vues mis \xE0 jour"
        });
      } else {
        return jsonResponse({
          success: false,
          error: "Article non trouv\xE9 ou non publi\xE9"
        }, 404);
      }
    } catch (error) {
      console.error("Increment views error:", error);
      return jsonResponse({
        success: false,
        error: "Erreur lors de la mise \xE0 jour des vues"
      }, 500);
    }
  }, "POST /api/articles/:id/views"),
  // POST /api/articles/:id/likes - Increment article likes (public)
  "POST /api/articles/:id/likes": /* @__PURE__ */ __name(async (request, params) => {
    try {
      const id = params.id;
      const [result] = await db_default.execute(
        "UPDATE articles SET likes = likes + 1 WHERE id = ? AND status='published'",
        [id]
      );
      if (result.affectedRows > 0) {
        return jsonResponse({
          success: true,
          message: "Compteur de likes mis \xE0 jour"
        });
      } else {
        return jsonResponse({
          success: false,
          error: "Article non trouv\xE9 ou non publi\xE9"
        }, 404);
      }
    } catch (error) {
      console.error("Increment likes error:", error);
      return jsonResponse({
        success: false,
        error: "Erreur lors de la mise \xE0 jour des likes"
      }, 500);
    }
  }, "POST /api/articles/:id/likes"),
  // POST /api/login - User authentication
  "POST /api/login": /* @__PURE__ */ __name(async (request) => {
    try {
      const body = await request.json();
      const { username, password } = body;
      const [rows] = await db_default.execute(
        "SELECT * FROM users WHERE username=? AND password=?",
        [username, password]
      );
      if (rows.length > 0) {
        return jsonResponse({
          success: true,
          message: "Connexion r\xE9ussie",
          token: "dummy-token-for-now"
          // In real app, generate JWT
        });
      } else {
        return jsonResponse({
          success: false,
          message: "Identifiants incorrects"
        }, 401);
      }
    } catch (error) {
      console.error("Login error:", error);
      return jsonResponse({
        success: false,
        message: "Erreur serveur"
      }, 500);
    }
  }, "POST /api/login"),
  // POST /api/articles - Add new article (authenticated)
  "POST /api/articles": /* @__PURE__ */ __name(async (request) => {
    if (!authenticateToken(request)) {
      return jsonResponse({
        success: false,
        error: "Acc\xE8s non autoris\xE9 - Token manquant"
      }, 401);
    }
    try {
      const body = await request.json();
      const { titre, contenu, auteur, categorie } = body;
      if (!titre || titre.trim() === "") {
        return jsonResponse({
          error: "Le titre est requis"
        }, 400);
      }
      if (!contenu || contenu.trim() === "") {
        return jsonResponse({
          error: "Le contenu est requis"
        }, 400);
      }
      const [result] = await db_default.execute(
        "INSERT INTO articles (titre, contenu, auteur, categorie, date) VALUES (?, ?, ?, ?, NOW())",
        [titre.trim(), contenu.trim(), auteur || "Admin", categorie || "G\xE9n\xE9ral"]
      );
      const [newArticle] = await db_default.execute(
        "SELECT * FROM articles WHERE id=?",
        [result.insertId]
      );
      return jsonResponse({
        success: true,
        message: "Article ajout\xE9 avec succ\xE8s",
        article: newArticle[0]
      });
    } catch (error) {
      console.error("Add article error:", error);
      if (error.code === "ER_DUP_ENTRY") {
        return jsonResponse({
          success: false,
          error: "Un article avec ce titre existe d\xE9j\xE0"
        }, 400);
      } else {
        return jsonResponse({
          success: false,
          error: "Erreur lors de l'ajout de l'article: " + error.message
        }, 500);
      }
    }
  }, "POST /api/articles"),
  // PUT /api/articles/:id - Update article (authenticated)
  "PUT /api/articles/:id": /* @__PURE__ */ __name(async (request, params) => {
    if (!authenticateToken(request)) {
      return jsonResponse({
        success: false,
        error: "Acc\xE8s non autoris\xE9 - Token manquant"
      }, 401);
    }
    try {
      const id = params.id;
      const body = await request.json();
      const { titre, contenu, auteur, categorie } = body;
      const [existing] = await db_default.execute(
        "SELECT * FROM articles WHERE id=?",
        [id]
      );
      if (existing.length === 0) {
        return jsonResponse({
          error: "Article non trouv\xE9"
        }, 404);
      }
      let query = "UPDATE articles SET ";
      let values = [];
      let fields = [];
      if (titre) {
        fields.push("titre=?");
        values.push(titre);
      }
      if (contenu) {
        fields.push("contenu=?");
        values.push(contenu);
      }
      if (auteur) {
        fields.push("auteur=?");
        values.push(auteur);
      }
      if (categorie) {
        fields.push("categorie=?");
        values.push(categorie);
      }
      fields.push("date=NOW()");
      query += fields.join(", ") + " WHERE id=?";
      values.push(id);
      await db_default.execute(query, values);
      const [updatedArticle] = await db_default.execute(
        "SELECT * FROM articles WHERE id=?",
        [id]
      );
      return jsonResponse({
        message: "Article mis \xE0 jour avec succ\xE8s",
        article: updatedArticle[0]
      });
    } catch (error) {
      console.error("Update article error:", error);
      return jsonResponse({
        error: "Erreur lors de la mise \xE0 jour de l'article"
      }, 500);
    }
  }, "PUT /api/articles/:id"),
  // DELETE /api/articles/:id - Delete article (authenticated)
  "DELETE /api/articles/:id": /* @__PURE__ */ __name(async (request, params) => {
    if (!authenticateToken(request)) {
      return jsonResponse({
        success: false,
        error: "Acc\xE8s non autoris\xE9 - Token manquant"
      }, 401);
    }
    try {
      const id = params.id;
      const [existing] = await db_default.execute(
        "SELECT * FROM articles WHERE id=?",
        [id]
      );
      if (existing.length === 0) {
        return jsonResponse({
          error: "Article non trouv\xE9"
        }, 404);
      }
      await db_default.execute(
        "DELETE FROM articles WHERE id=?",
        [id]
      );
      return jsonResponse({
        message: "Article supprim\xE9 avec succ\xE8s"
      });
    } catch (error) {
      console.error("Delete article error:", error);
      return jsonResponse({
        error: "Erreur lors de la suppression de l'article"
      }, 500);
    }
  }, "DELETE /api/articles/:id")
};
function matchRoute(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (routes[path]) {
    return { route: routes[path], params: {} };
  }
  for (const [pattern, handler] of Object.entries(routes)) {
    const [method, routePattern] = pattern.split(" ");
    if (request.method !== method) continue;
    const regex = new RegExp("^" + routePattern.replace(/:[^\s/]+/g, "([^/]+)") + "$");
    const match = path.match(regex);
    if (match) {
      const params = {};
      const paramNames = routePattern.match(/:([^\s/]+)/g);
      if (paramNames) {
        paramNames.forEach((param, index) => {
          params[param.substring(1)] = match[index + 1];
        });
      }
      return { route: handler, params };
    }
  }
  return null;
}
__name(matchRoute, "matchRoute");
var worker_default = {
  async fetch(request) {
    const corsResponse = handleCORS(request);
    if (corsResponse) {
      return corsResponse;
    }
    const match = matchRoute(request);
    if (match) {
      try {
        return await match.route(request, match.params);
      } catch (error) {
        console.error("Route error:", error);
        return jsonResponse({
          success: false,
          error: "Erreur serveur interne"
        }, 500);
      }
    }
    return jsonResponse({
      success: false,
      error: "Route non trouv\xE9e"
    }, 404);
  }
};

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-gcqhYg/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-gcqhYg/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map

/**
 * Cloudflare Worker API for BlogReact12
 * Replaces the Express server with serverless functions
 */

// Import database connection
import db from './db.js'

// CORS headers for all responses
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
};

// Authentication middleware
function authenticateToken(request) {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return false;
    }
    
    // For now, we'll just check if token exists (simple authentication)
    // In a real app, you would verify the JWT token here
    return true;
}

// Helper function to handle CORS preflight requests
function handleCORS(request) {
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: CORS_HEADERS
        });
    }
    return null;
}

// Helper function to send JSON response
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status: status,
        headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json'
        }
    });
}

// API Routes
const routes = {
    // GET /api/articles - Get all articles (public)
    'GET /api/articles': async (request) => {
        try {
            const [rows] = await db.execute(
                "SELECT * FROM articles WHERE status='published' ORDER BY date DESC"
            );
            return jsonResponse({
                success: true,
                data: rows,
                count: rows.length
            });
        } catch (error) {
            console.error('Get articles error:', error);
            return jsonResponse({
                success: false,
                error: "Erreur lors de la récupération des articles"
            }, 500);
        }
    },

    // GET /api/articles/:id - Get single article (public)
    'GET /api/articles/:id': async (request, params) => {
        try {
            const id = params.id;
            const [rows] = await db.execute(
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
                    error: "Article non trouvé ou non publié"
                }, 404);
            }
        } catch (error) {
            console.error('Get article error:', error);
            return jsonResponse({
                success: false,
                error: "Erreur lors de la récupération de l'article"
            }, 500);
        }
    },

    // GET /api/articles/category/:category - Get articles by category (public)
    'GET /api/articles/category/:category': async (request, params) => {
        try {
            const category = params.category;
            const [rows] = await db.execute(
                "SELECT * FROM articles WHERE categorie=? AND status='published' ORDER BY date DESC",
                [category]
            );
            return jsonResponse({
                success: true,
                data: rows,
                count: rows.length
            });
        } catch (error) {
            console.error('Get articles by category error:', error);
            return jsonResponse({
                success: false,
                error: "Erreur lors de la récupération des articles"
            }, 500);
        }
    },

    // GET /api/articles/author/:author - Get articles by author (public)
    'GET /api/articles/author/:author': async (request, params) => {
        try {
            const author = params.author;
            const [rows] = await db.execute(
                "SELECT * FROM articles WHERE auteur=? AND status='published' ORDER BY date DESC",
                [author]
            );
            return jsonResponse({
                success: true,
                data: rows,
                count: rows.length
            });
        } catch (error) {
            console.error('Get articles by author error:', error);
            return jsonResponse({
                success: false,
                error: "Erreur lors de la récupération des articles"
            }, 500);
        }
    },

    // GET /api/articles/recent/:limit - Get recent articles (public)
    'GET /api/articles/recent/:limit': async (request, params) => {
        try {
            const limit = parseInt(params.limit) || 10;
            const [rows] = await db.execute(
                "SELECT * FROM articles WHERE status='published' ORDER BY date DESC LIMIT ?",
                [limit]
            );
            return jsonResponse({
                success: true,
                data: rows,
                count: rows.length
            });
        } catch (error) {
            console.error('Get recent articles error:', error);
            return jsonResponse({
                success: false,
                error: "Erreur lors de la récupération des articles récents"
            }, 500);
        }
    },

    // GET /api/categories - Get categories (public)
    'GET /api/categories': async (request) => {
        try {
            const [rows] = await db.execute(
                "SELECT DISTINCT categorie, COUNT(*) as article_count FROM articles WHERE status='published' GROUP BY categorie ORDER BY article_count DESC"
            );
            return jsonResponse({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Get categories error:', error);
            return jsonResponse({
                success: false,
                error: "Erreur lors de la récupération des catégories"
            }, 500);
        }
    },

    // GET /api/articles/search - Search articles (public)
    'GET /api/articles/search': async (request) => {
        try {
            const url = new URL(request.url);
            const q = url.searchParams.get('q');
            const category = url.searchParams.get('category');
            const author = url.searchParams.get('author');
            
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
            
            const [rows] = await db.execute(query, params);
            return jsonResponse({
                success: true,
                data: rows,
                count: rows.length,
                query: { q, category, author }
            });
        } catch (error) {
            console.error('Search articles error:', error);
            return jsonResponse({
                success: false,
                error: "Erreur lors de la recherche d'articles"
            }, 500);
        }
    },

    // GET /api/stats - Get article statistics (public)
    'GET /api/stats': async (request) => {
        try {
            const [totalArticles] = await db.execute(
                "SELECT COUNT(*) as total FROM articles WHERE status='published'"
            );
            
            const [categories] = await db.execute(
                "SELECT COUNT(DISTINCT categorie) as total FROM articles WHERE status='published'"
            );
            
            const [authors] = await db.execute(
                "SELECT COUNT(DISTINCT auteur) as total FROM articles WHERE status='published'"
            );
            
            const [recentArticles] = await db.execute(
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
            console.error('Get stats error:', error);
            return jsonResponse({
                success: false,
                error: "Erreur lors de la récupération des statistiques"
            }, 500);
        }
    },

    // POST /api/articles/:id/views - Increment article views (public)
    'POST /api/articles/:id/views': async (request, params) => {
        try {
            const id = params.id;
            
            const [result] = await db.execute(
                "UPDATE articles SET views = views + 1 WHERE id = ? AND status='published'",
                [id]
            );
            
            if (result.affectedRows > 0) {
                return jsonResponse({
                    success: true,
                    message: "Compteur de vues mis à jour"
                });
            } else {
                return jsonResponse({
                    success: false,
                    error: "Article non trouvé ou non publié"
                }, 404);
            }
        } catch (error) {
            console.error('Increment views error:', error);
            return jsonResponse({
                success: false,
                error: "Erreur lors de la mise à jour des vues"
            }, 500);
        }
    },

    // POST /api/articles/:id/likes - Increment article likes (public)
    'POST /api/articles/:id/likes': async (request, params) => {
        try {
            const id = params.id;
            
            const [result] = await db.execute(
                "UPDATE articles SET likes = likes + 1 WHERE id = ? AND status='published'",
                [id]
            );
            
            if (result.affectedRows > 0) {
                return jsonResponse({
                    success: true,
                    message: "Compteur de likes mis à jour"
                });
            } else {
                return jsonResponse({
                    success: false,
                    error: "Article non trouvé ou non publié"
                }, 404);
            }
        } catch (error) {
            console.error('Increment likes error:', error);
            return jsonResponse({
                success: false,
                error: "Erreur lors de la mise à jour des likes"
            }, 500);
        }
    },

    // POST /api/login - User authentication
    'POST /api/login': async (request) => {
        try {
            const body = await request.json();
            const { username, password } = body;

            const [rows] = await db.execute(
                "SELECT * FROM users WHERE username=? AND password=?",
                [username, password]
            );

            if (rows.length > 0) {
                return jsonResponse({
                    success: true,
                    message: "Connexion réussie",
                    token: "dummy-token-for-now" // In real app, generate JWT
                });
            } else {
                return jsonResponse({
                    success: false,
                    message: "Identifiants incorrects"
                }, 401);
            }
        } catch (error) {
            console.error('Login error:', error);
            return jsonResponse({
                success: false,
                message: "Erreur serveur"
            }, 500);
        }
    },

    // POST /api/articles - Add new article (authenticated)
    'POST /api/articles': async (request) => {
        if (!authenticateToken(request)) {
            return jsonResponse({
                success: false,
                error: "Accès non autorisé - Token manquant"
            }, 401);
        }

        try {
            const body = await request.json();
            const { titre, contenu, auteur, categorie } = body;

            // Validation
            if (!titre || titre.trim() === '') {
                return jsonResponse({
                    error: "Le titre est requis"
                }, 400);
            }
            
            if (!contenu || contenu.trim() === '') {
                return jsonResponse({
                    error: "Le contenu est requis"
                }, 400);
            }

            const [result] = await db.execute(
                "INSERT INTO articles (titre, contenu, auteur, categorie, date) VALUES (?, ?, ?, ?, NOW())",
                [titre.trim(), contenu.trim(), auteur || 'Admin', categorie || 'Général']
            );

            const [newArticle] = await db.execute(
                "SELECT * FROM articles WHERE id=?",
                [result.insertId]
            );

            return jsonResponse({
                success: true,
                message: "Article ajouté avec succès",
                article: newArticle[0]
            });
        } catch (error) {
            console.error('Add article error:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return jsonResponse({
                    success: false,
                    error: "Un article avec ce titre existe déjà"
                }, 400);
            } else {
                return jsonResponse({
                    success: false,
                    error: "Erreur lors de l'ajout de l'article: " + error.message
                }, 500);
            }
        }
    },

    // PUT /api/articles/:id - Update article (authenticated)
    'PUT /api/articles/:id': async (request, params) => {
        if (!authenticateToken(request)) {
            return jsonResponse({
                success: false,
                error: "Accès non autorisé - Token manquant"
            }, 401);
        }

        try {
            const id = params.id;
            const body = await request.json();
            const { titre, contenu, auteur, categorie } = body;

            // Check if article exists
            const [existing] = await db.execute(
                "SELECT * FROM articles WHERE id=?",
                [id]
            );

            if (existing.length === 0) {
                return jsonResponse({
                    error: "Article non trouvé"
                }, 404);
            }

            // Build update query
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

            // Always update the date
            fields.push("date=NOW()");
            
            query += fields.join(", ") + " WHERE id=?";
            values.push(id);

            await db.execute(query, values);

            const [updatedArticle] = await db.execute(
                "SELECT * FROM articles WHERE id=?",
                [id]
            );

            return jsonResponse({
                message: "Article mis à jour avec succès",
                article: updatedArticle[0]
            });
        } catch (error) {
            console.error('Update article error:', error);
            return jsonResponse({
                error: "Erreur lors de la mise à jour de l'article"
            }, 500);
        }
    },

    // DELETE /api/articles/:id - Delete article (authenticated)
    'DELETE /api/articles/:id': async (request, params) => {
        if (!authenticateToken(request)) {
            return jsonResponse({
                success: false,
                error: "Accès non autorisé - Token manquant"
            }, 401);
        }

        try {
            const id = params.id;

            // Check if article exists
            const [existing] = await db.execute(
                "SELECT * FROM articles WHERE id=?",
                [id]
            );

            if (existing.length === 0) {
                return jsonResponse({
                    error: "Article non trouvé"
                }, 404);
            }

            await db.execute(
                "DELETE FROM articles WHERE id=?",
                [id]
            );

            return jsonResponse({
                message: "Article supprimé avec succès"
            });
        } catch (error) {
            console.error('Delete article error:', error);
            return jsonResponse({
                error: "Erreur lors de la suppression de l'article"
            }, 500);
        }
    }
};

// Route matching function
function matchRoute(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Try exact match first
    if (routes[path]) {
        return { route: routes[path], params: {} };
    }
    
    // Try pattern matching
    for (const [pattern, handler] of Object.entries(routes)) {
        const [method, routePattern] = pattern.split(' ');
        if (request.method !== method) continue;
        
        const regex = new RegExp('^' + routePattern.replace(/:[^\s/]+/g, '([^/]+)') + '$');
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

// Main fetch handler
export default {
    async fetch(request) {
        // Handle CORS preflight
        const corsResponse = handleCORS(request);
        if (corsResponse) {
            return corsResponse;
        }

        // Match route
        const match = matchRoute(request);
        
        if (match) {
            try {
                return await match.route(request, match.params);
            } catch (error) {
                console.error('Route error:', error);
                return jsonResponse({
                    success: false,
                    error: "Erreur serveur interne"
                }, 500);
            }
        }

        // 404 Not Found
        return jsonResponse({
            success: false,
            error: "Route non trouvée"
        }, 404);
    }
};
const http = require("http");
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pool = require("./db");

const app = express();

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Use absolute path to ensure correct upload directory
        // __dirname points to 'backend/', so we need the upload folder in the same directory
        const uploadPath = path.join(__dirname, 'upload');
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Seuls les fichiers images sont autorisés'), false);
        }
    }
});

// Middleware
app.use(express.json());
app.use(express.static('frontend'));
app.use('/upload', express.static(path.join(__dirname, 'upload')));

// CORS headers
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            error: "Accès non autorisé - Token manquant"
        });
    }
    
    // For now, we'll just check if token exists (simple authentication)
    // In a real app, you would verify the JWT token here
    next();
}

// LOGIN
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const [rows] = await pool.query(
            "SELECT * FROM users WHERE username=? AND password=?",
            [username, password]
        );

        if (rows.length > 0) {
            res.json({
                success: true,
                message: "Connexion réussie"
            });
        } else {
            res.status(401).json({
                success: false,
                message: "Identifiants incorrects"
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: "Erreur serveur"
        });
    }
});

// PUBLIC ENDPOINTS (No authentication required) - For Flutter App
// GET ALL ARTICLES (Public)
app.get("/api/articles", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM articles WHERE status='published' ORDER BY date DESC"
        );
        res.json({
            success: true,
            data: rows,
            count: rows.length
        });
    } catch (error) {
        console.error('Get articles error:', error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de la récupération des articles"
        });
    }
});

// GET SINGLE ARTICLE (Public)
app.get("/api/articles/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            "SELECT * FROM articles WHERE id=? AND status='published'",
            [id]
        );
        
        if (rows.length > 0) {
            res.json({
                success: true,
                data: rows[0]
            });
        } else {
            res.status(404).json({
                success: false,
                error: "Article non trouvé ou non publié"
            });
        }
    } catch (error) {
        console.error('Get article error:', error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de la récupération de l'article"
        });
    }
});

// GET ARTICLES BY CATEGORY (Public)
app.get("/api/articles/category/:category", async (req, res) => {
    try {
        const { category } = req.params;
        const [rows] = await pool.query(
            "SELECT * FROM articles WHERE categorie=? AND status='published' ORDER BY date DESC",
            [category]
        );
        res.json({
            success: true,
            data: rows,
            count: rows.length
        });
    } catch (error) {
        console.error('Get articles by category error:', error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de la récupération des articles"
        });
    }
});

// GET ARTICLES BY AUTHOR (Public)
app.get("/api/articles/author/:author", async (req, res) => {
    try {
        const { author } = req.params;
        const [rows] = await pool.query(
            "SELECT * FROM articles WHERE auteur=? AND status='published' ORDER BY date DESC",
            [author]
        );
        res.json({
            success: true,
            data: rows,
            count: rows.length
        });
    } catch (error) {
        console.error('Get articles by author error:', error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de la récupération des articles"
        });
    }
});

// GET RECENT ARTICLES (Public)
app.get("/api/articles/recent/:limit", async (req, res) => {
    try {
        const { limit } = req.params;
        const limitNum = parseInt(limit) || 10;
        
        const [rows] = await pool.query(
            "SELECT * FROM articles WHERE status='published' ORDER BY date DESC LIMIT ?",
            [limitNum]
        );
        res.json({
            success: true,
            data: rows,
            count: rows.length
        });
    } catch (error) {
        console.error('Get recent articles error:', error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de la récupération des articles récents"
        });
    }
});

// GET CATEGORIES (Public)
app.get("/api/categories", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT DISTINCT categorie, COUNT(*) as article_count FROM articles WHERE status='published' GROUP BY categorie ORDER BY article_count DESC"
        );
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de la récupération des catégories"
        });
    }
});

// SEARCH ARTICLES (Public)
app.get("/api/articles/search", async (req, res) => {
    try {
        const { q, category, author } = req.query;
        
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
        
        const [rows] = await pool.query(query, params);
        res.json({
            success: true,
            data: rows,
            count: rows.length,
            query: { q, category, author }
        });
    } catch (error) {
        console.error('Search articles error:', error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de la recherche d'articles"
        });
    }
});

// GET ARTICLE STATISTICS (Public)
app.get("/api/stats", async (req, res) => {
    try {
        const [totalArticles] = await pool.query(
            "SELECT COUNT(*) as total FROM articles WHERE status='published'"
        );
        
        const [categories] = await pool.query(
            "SELECT COUNT(DISTINCT categorie) as total FROM articles WHERE status='published'"
        );
        
        const [authors] = await pool.query(
            "SELECT COUNT(DISTINCT auteur) as total FROM articles WHERE status='published'"
        );
        
        const [recentArticles] = await pool.query(
            "SELECT COUNT(*) as total FROM articles WHERE status='published' AND date >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
        );

        res.json({
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
        res.status(500).json({
            success: false,
            error: "Erreur lors de la récupération des statistiques"
        });
    }
});

// INCREMENT ARTICLE VIEWS (Public)
app.post("/api/articles/:id/views", async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await pool.query(
            "UPDATE articles SET views = views + 1 WHERE id = ? AND status='published'",
            [id]
        );
        
        if (result.affectedRows > 0) {
            res.json({
                success: true,
                message: "Compteur de vues mis à jour"
            });
        } else {
            res.status(404).json({
                success: false,
                error: "Article non trouvé ou non publié"
            });
        }
    } catch (error) {
        console.error('Increment views error:', error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de la mise à jour des vues"
        });
    }
});

// INCREMENT ARTICLE LIKES (Public)
app.post("/api/articles/:id/likes", async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await pool.query(
            "UPDATE articles SET likes = likes + 1 WHERE id = ? AND status='published'",
            [id]
        );
        
        if (result.affectedRows > 0) {
            res.json({
                success: true,
                message: "Compteur de likes mis à jour"
            });
        } else {
            res.status(404).json({
                success: false,
                error: "Article non trouvé ou non publié"
            });
        }
    } catch (error) {
        console.error('Increment likes error:', error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de la mise à jour des likes"
        });
    }
});

// GET ARTICLES
app.get("/articles", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM articles ORDER BY date DESC"
        );
        res.json(rows);
    } catch (error) {
        console.error('Get articles error:', error);
        res.status(500).json({
            error: "Erreur lors de la récupération des articles"
        });
    }
});

// GET SINGLE ARTICLE
app.get("/articles/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            "SELECT * FROM articles WHERE id=?",
            [id]
        );
        
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({
                error: "Article non trouvé"
            });
        }
    } catch (error) {
        console.error('Get article error:', error);
        res.status(500).json({
            error: "Erreur lors de la récupération de l'article"
        });
    }
});

// ADD ARTICLE
app.post("/articles", authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { titre, contenu, auteur, categorie } = req.body;
        const image = req.file ? `/upload/${req.file.filename}` : null;

        // Validation plus souple
        if (!titre || titre.trim() === '') {
            return res.status(400).json({
                error: "Le titre est requis"
            });
        }
        
        if (!contenu || contenu.trim() === '') {
            return res.status(400).json({
                error: "Le contenu est requis"
            });
        }

        const [result] = await pool.query(
            "INSERT INTO articles (titre, contenu, image, auteur, categorie) VALUES (?, ?, ?, ?, ?)",
            [titre.trim(), contenu.trim(), image, auteur || 'Admin', categorie || 'Général']
        );

        const [newArticle] = await pool.query(
            "SELECT * FROM articles WHERE id=?",
            [result.insertId]
        );

        res.json({
            success: true,
            message: "Article ajouté avec succès",
            article: newArticle[0]
        });
    } catch (error) {
        console.error('Add article error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({
                success: false,
                error: "Un article avec ce titre existe déjà"
            });
        } else {
            res.status(500).json({
                success: false,
                error: "Erreur lors de l'ajout de l'article: " + error.message
            });
        }
    }
});

// UPDATE ARTICLE
app.put("/articles/:id", authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { titre, contenu, auteur, categorie } = req.body;
        const image = req.file ? `/upload/${req.file.filename}` : null;

        // Check if article exists
        const [existing] = await pool.query(
            "SELECT * FROM articles WHERE id=?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                error: "Article non trouvé"
            });
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
        if (image) {
            fields.push("image=?");
            values.push(image);
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

        await pool.query(query, values);

        const [updatedArticle] = await pool.query(
            "SELECT * FROM articles WHERE id=?",
            [id]
        );

        res.json({
            message: "Article mis à jour avec succès",
            article: updatedArticle[0]
        });
    } catch (error) {
        console.error('Update article error:', error);
        res.status(500).json({
            error: "Erreur lors de la mise à jour de l'article"
        });
    }
});

// DELETE ARTICLE
app.delete("/articles/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if article exists and get image path
        const [existing] = await pool.query(
            "SELECT image FROM articles WHERE id=?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                error: "Article non trouvé"
            });
        }

        // Delete image file if exists
        if (existing[0].image) {
            const imagePath = path.join(__dirname, existing[0].image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await pool.query(
            "DELETE FROM articles WHERE id=?",
            [id]
        );

        res.json({
            message: "Article supprimé avec succès"
        });
    } catch (error) {
        console.error('Delete article error:', error);
        res.status(500).json({
            error: "Erreur lors de la suppression de l'article"
        });
    }
});

// GET ARTICLES BY CATEGORY
app.get("/articles/category/:category", authenticateToken, async (req, res) => {
    try {
        const { category } = req.params;
        const [rows] = await pool.query(
            "SELECT * FROM articles WHERE categorie=? ORDER BY date DESC",
            [category]
        );
        res.json(rows);
    } catch (error) {
        console.error('Get articles by category error:', error);
        res.status(500).json({
            error: "Erreur lors de la récupération des articles"
        });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
    console.log(`Upload directory: ${path.join(__dirname, 'upload')}`);
});
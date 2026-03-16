# BlogReact12 - Cloudflare Pages & Workers

This project has been refactored from a traditional Node.js/Express application to a modern serverless architecture using Cloudflare Pages and Cloudflare Workers.

## Architecture Overview

```
BlogReact12/
├── frontend/                 # Cloudflare Pages (Static Frontend)
│   ├── index.html
│   ├── login.html
│   ├── dashboard.html
│   ├── article.html
│   ├── script.js
│   ├── style.css
│   └── _redirects
├── worker/                   # Cloudflare Worker API
│   ├── worker.js
│   ├── wrangler.toml
│   └── package.json
├── database/
│   └── db.js
└── uploads/                  # Future Cloudflare R2 storage
```

## Key Changes

### Removed
- **Express Server** (`server.js`) - No longer needed with Cloudflare Workers
- **Express Dependencies** - Replaced with Cloudflare Workers runtime

### Added
- **Cloudflare Worker** (`worker/worker.js`) - Serverless API backend
- **Cloudflare Pages Config** (`frontend/_redirects`) - Clean URL routing
- **Wrangler Config** (`worker/wrangler.toml`) - Worker deployment configuration
- **Package.json** (`worker/package.json`) - Worker dependencies and scripts

## API Routes

The Cloudflare Worker provides the following API endpoints:

### Public Routes (No Authentication Required)
- `GET /api/articles` - Get all published articles
- `GET /api/articles/:id` - Get single article by ID
- `GET /api/articles/category/:category` - Get articles by category
- `GET /api/articles/author/:author` - Get articles by author
- `GET /api/articles/recent/:limit` - Get recent articles
- `GET /api/categories` - Get all categories
- `GET /api/articles/search` - Search articles
- `GET /api/stats` - Get article statistics
- `POST /api/articles/:id/views` - Increment article views
- `POST /api/articles/:id/likes` - Increment article likes

### Authenticated Routes
- `POST /api/login` - User authentication
- `POST /api/articles` - Add new article
- `PUT /api/articles/:id` - Update article
- `DELETE /api/articles/:id` - Delete article

## Frontend Changes

### Updated Fetch Requests
All frontend JavaScript now calls the Worker API instead of localhost:

```javascript
// Before (localhost)
fetch('http://localhost:3000/api/articles')

// After (Worker API)
fetch('/api/articles')
```

### Dynamic Article Loading
Articles are now loaded dynamically using query parameters:
- URL: `/article/14`
- Loads: `article.html?id=14`

### Clean URLs
The `_redirects` file enables clean URLs:
- `/accueil` → `index.html`
- `/login` → `login.html`
- `/dashboard` → `dashboard.html`
- `/article/*` → `article.html`

## Database Configuration

### Current State
The database connection is currently a mock for testing purposes. In production, you should configure one of these options:

### Option 1: Cloudflare D1 (Recommended)
```toml
[[d1_databases]]
binding = "DB"
database_name = "blogreact12-d1"
database_id = "your-d1-database-id"
```

### Option 2: External MySQL
```toml
[[vars]]
DB_HOST = "your-mysql-host"
DB_USER = "your-username"
DB_PASSWORD = "your-password"
DB_NAME = "blogreact12"
```

## Deployment

### 1. Install Dependencies
```bash
cd worker
npm install
```

### 2. Configure Environment
Set up your database connection in `wrangler.toml` or use environment variables:

```bash
# For external MySQL
wrangler secret put DB_HOST
wrangler secret put DB_USER
wrangler secret put DB_PASSWORD
wrangler secret put DB_NAME
```

### 3. Deploy Worker to Cloudflare
```bash
# Navigate to worker directory
cd BlogReact12\worker

# Deploy Worker (development)
wrangler deploy

# Deploy to production environment
wrangler deploy --env=production

# Preview locally
wrangler dev

# Deploy specific environment
wrangler deploy --env=staging
```

**Détails d'utilisation de `wrangler deploy` :**
- `wrangler deploy` : Déploie le Worker dans l'environnement par défaut
- `wrangler deploy --env=production` : Déploie dans l'environnement de production
- `wrangler deploy --env=staging` : Déploie dans l'environnement de staging
- `wrangler dev` : Lance un serveur de développement local pour tester le Worker

### 4. Deploy Frontend to Cloudflare Pages
```bash
# Navigate to frontend directory
cd BlogReact12\frontend

# Deploy to Cloudflare Pages
wrangler pages deploy .
```

**Détails d'utilisation de `wrangler pages deploy .` :**
- `wrangler pages deploy .` : Déploie tous les fichiers du répertoire courant vers Cloudflare Pages
- Le `.` indique le répertoire courant (frontend/)
- Cette commande upload les fichiers statiques (HTML, CSS, JS, images)
- Crée automatiquement une preview URL pour chaque déploiement
- Met à jour le site en production après validation

### 5. Alternative: GitHub Integration
1. Connect your GitHub repository to Cloudflare Pages
2. Set build settings:
   - Build command: `echo "No build needed"`
   - Build directory: `frontend`
3. Deploy

**Avantages de chaque méthode :**
- **wrangler pages deploy .** : Déploiement direct, idéal pour les tests et déploiements rapides
- **GitHub Integration** : Déploiement automatique sur chaque push, idéal pour la production

## Image Storage Migration

### Current State
Images are stored in `backend/upload/` directory.

### Future: Cloudflare R2
To migrate to R2 storage:

1. Configure R2 bucket in `wrangler.toml`:
```toml
[[r2_buckets]]
binding = "IMAGES"
bucket_name = "blogreact12-images"
```

2. Update image upload logic in Worker
3. Update frontend to use R2 URLs

## Development

### Local Development
```bash
# Start Worker locally
cd worker
wrangler dev

# Frontend can be served from any static file server
# or directly opened in browser (for testing)
```

### Testing API
```bash
# Test public endpoints
curl https://your-worker.workers.dev/api/articles

# Test authenticated endpoints
curl -H "Authorization: Bearer your-token" \
     https://your-worker.workers.dev/api/articles
```

## Benefits of Cloudflare Architecture

1. **Zero Server Management** - No need to manage servers or containers
2. **Global Performance** - Edge network provides fast response times worldwide
3. **Cost Effective** - Pay only for what you use, generous free tier
4. **Scalability** - Automatic scaling without configuration
5. **Security** - Built-in DDoS protection and security features
6. **Simplified Deployment** - One-click deployments with GitHub integration

## Migration Notes

### From Express to Cloudflare Workers
- Removed Express.js dependencies
- Converted middleware to Worker handlers
- Updated database connection patterns
- Simplified CORS handling
- Removed file upload handling (for R2 migration)

### Frontend Compatibility
- All frontend files remain static
- Only fetch URLs were updated
- No changes to HTML/CSS structure
- Maintains all existing functionality

## Next Steps

1. **Database Setup**: Configure D1 or external MySQL
2. **R2 Migration**: Set up image storage in Cloudflare R2
3. **Authentication**: Implement proper JWT token handling
4. **Environment Variables**: Set up production secrets
5. **Monitoring**: Add logging and monitoring
6. **Testing**: Add comprehensive tests for Worker functions

## Support

For issues related to:
- Cloudflare Workers: Check [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- Cloudflare Pages: Check [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- Database Issues: Check [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
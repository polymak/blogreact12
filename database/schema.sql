-- Database: blogreact
-- Creation date: 2026-03-15
-- Description: Complete database schema for BlogReact application

-- Drop existing tables if they exist
DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    role ENUM('admin', 'editor', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
);

-- Create articles table
CREATE TABLE articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    contenu TEXT NOT NULL,
    image VARCHAR(255),
    auteur VARCHAR(100) DEFAULT 'Admin',
    categorie VARCHAR(50) DEFAULT 'Général',
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('draft', 'published', 'archived') DEFAULT 'published',
    views INT DEFAULT 0,
    likes INT DEFAULT 0,
    INDEX idx_titre (titre),
    INDEX idx_auteur (auteur),
    INDEX idx_categorie (categorie),
    INDEX idx_date (date),
    INDEX idx_status (status)
);

-- Insert default admin user
INSERT INTO users (username, password, email, role) VALUES 
('Admin', '$2b$10$example.hash.here.admin', 'admin@blogreact.com', 'admin'),
('editor', '$2b$10$example.hash.here.editor', 'editor@blogreact.com', 'editor');

-- Insert sample articles
INSERT INTO articles (titre, contenu, image, auteur, categorie) VALUES 
('Bienvenue sur BlogReact', 'Ceci est votre premier article. BlogReact est une plateforme moderne de blogging avec un design inspiré de x.com. Profitez d\'une interface intuitive et performante pour partager vos idées avec le monde.', 'https://picsum.photos/seed/welcome/800/400', 'Admin', 'Annonces'),
('Guide d\'utilisation', 'Découvrez comment utiliser efficacement BlogReact. Ajoutez des articles, gérez votre contenu et personnalisez votre expérience de blogging. Notre interface simple et puissante vous permet de vous concentrer sur l\'essentiel : votre contenu.', 'https://picsum.photos/seed/guide/800/400', 'Admin', 'Tutoriel'),
('Nouveautés de la version 1.0', 'Nous sommes heureux de vous présenter la version 1.0 de BlogReact ! De nombreuses améliorations ont été apportées : performances optimisées, design responsive, animations fluides et bien plus encore. Restez à l\'écoute pour les prochaines mises à jour !', 'https://picsum.photos/seed/news/800/400', 'Admin', 'Annonces'),
('Conseils pour un bon blogging', 'Pour réussir dans le blogging, voici quelques conseils essentiels : soyez authentique, créez du contenu de qualité, interagissez avec votre audience et soyez constant. Avec BlogReact, vous avez tous les outils nécessaires pour exceller dans l\'art du blogging.', 'https://picsum.photos/seed/tips/800/400', 'Editor', 'Conseils'),
('SEO et référencement', 'Le référencement naturel est crucial pour attirer du trafic vers votre blog. Utilisez des mots-clés pertinents, créez des titres accrocheurs, optimisez vos images et partagez votre contenu sur les réseaux sociaux. BlogReact vous aide à optimiser votre référencement.', 'https://picsum.photos/seed/seo/800/400', 'Editor', 'Marketing'),
('Design et ergonomie', 'Un bon design améliore considérablement l\'expérience utilisateur. Chez BlogReact, nous mettons l\'accent sur la simplicité, la clarté et la performance. Notre design inspiré de x.com offre une expérience moderne et intuitive à vos lecteurs.', 'https://picsum.photos/seed/design/800/400', 'Admin', 'Design'),
('Les tendances du blogging 2026', 'Le blogging continue d\'évoluer rapidement. Cette année, on observe une montée en puissance des formats courts, des visuels immersifs et de l\'interaction en temps réel. Restez à la pointe de l\'innovation avec BlogReact.', 'https://picsum.photos/seed/trends/800/400', 'Editor', 'Tendances'),
('Monétisation du contenu', 'Vous souhaitez monétiser votre blog ? Plusieurs options s\'offrent à vous : publicité, parrainage, contenu premium, formations en ligne. BlogReact vous accompagne dans votre parcours de monétisation avec des outils adaptés.', 'https://picsum.photos/seed/monetization/800/400', 'Admin', 'Business'),
('Communauté et engagement', 'Une communauté active est la clé du succès d\'un blog. Encouragez les commentaires, répondez à votre audience et créez un espace d\'échange enrichissant. BlogReact facilite l\'interaction avec vos lecteurs.', 'https://picsum.photos/seed/community/800/400', 'Editor', 'Communauté'),
('Performance et optimisation', 'Un blog rapide est un blog qui convertit. Optimisez vos images, utilisez un bon hébergement et surveillez vos performances. BlogReact est conçu pour offrir une expérience rapide et fluide à vos visiteurs.', 'https://picsum.photos/seed/performance/800/400', 'Admin', 'Technique');

-- Create indexes for better performance
CREATE INDEX idx_articles_status_date ON articles(status, date);
CREATE INDEX idx_articles_auteur_status ON articles(auteur, status);
CREATE INDEX idx_articles_categorie_date ON articles(categorie, date);

-- Add foreign key constraint (if we had a more complex relationship)
-- ALTER TABLE articles ADD CONSTRAINT fk_auteur FOREIGN KEY (auteur) REFERENCES users(username);

-- View for dashboard statistics
CREATE VIEW article_stats AS
SELECT 
    COUNT(*) as total_articles,
    COUNT(CASE WHEN status = 'published' THEN 1 END) as published_articles,
    COUNT(CASE WHEN DATE(date) = CURDATE() THEN 1 END) as today_articles,
    COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_articles,
    SUM(views) as total_views,
    SUM(likes) as total_likes
FROM articles;

-- View for recent articles
CREATE VIEW recent_articles AS
SELECT 
    id,
    titre,
    SUBSTRING(contenu, 1, 200) as excerpt,
    image,
    auteur,
    categorie,
    date,
    views,
    likes
FROM articles 
WHERE status = 'published'
ORDER BY date DESC
LIMIT 10;

-- View for user articles
CREATE VIEW user_articles AS
SELECT 
    a.id,
    a.titre,
    a.contenu,
    a.image,
    a.auteur,
    a.categorie,
    a.date,
    a.status,
    a.views,
    a.likes,
    u.email as author_email
FROM articles a
LEFT JOIN users u ON a.auteur = u.username
ORDER BY a.date DESC;

-- Procedure to get articles by category
DELIMITER //
CREATE PROCEDURE GetArticlesByCategory(IN cat VARCHAR(50))
BEGIN
    SELECT * FROM articles 
    WHERE categorie = cat AND status = 'published'
    ORDER BY date DESC;
END //
DELIMITER ;

-- Procedure to get articles by author
DELIMITER //
CREATE PROCEDURE GetArticlesByAuthor(IN author_name VARCHAR(100))
BEGIN
    SELECT * FROM articles 
    WHERE auteur = author_name AND status = 'published'
    ORDER BY date DESC;
END //
DELIMITER ;

-- Function to get article count by status
DELIMITER //
CREATE FUNCTION GetArticleCountByStatus(status_val VARCHAR(20)) 
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE count_val INT;
    SELECT COUNT(*) INTO count_val FROM articles WHERE status = status_val;
    RETURN count_val;
END //
DELIMITER ;

-- Trigger to update article timestamp
DELIMITER //
CREATE TRIGGER update_article_timestamp 
BEFORE UPDATE ON articles
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- Trigger to validate article data
DELIMITER //
CREATE TRIGGER validate_article_insert 
BEFORE INSERT ON articles
FOR EACH ROW
BEGIN
    IF LENGTH(NEW.titre) < 5 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Le titre doit contenir au moins 5 caractères';
    END IF;
    IF LENGTH(NEW.contenu) < 20 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Le contenu doit contenir au moins 20 caractères';
    END IF;
    IF NEW.auteur IS NULL OR NEW.auteur = '' THEN
        SET NEW.auteur = 'Admin';
    END IF;
END //
DELIMITER ;

-- Grant permissions (adjust as needed for your environment)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON blogreact.* TO 'blogreact_user'@'localhost';
-- FLUSH PRIVILEGES;

-- Display table information
SELECT 'Database schema created successfully' as status;
SELECT 'Tables created: users, articles' as tables;
SELECT 'Views created: article_stats, recent_articles, user_articles' as views;
SELECT 'Procedures created: GetArticlesByCategory, GetArticlesByAuthor' as procedures;
SELECT 'Functions created: GetArticleCountByStatus' as functions;
SELECT 'Triggers created: update_article_timestamp, validate_article_insert' as triggers;
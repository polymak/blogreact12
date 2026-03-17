import 'package:flutter/material.dart';
import 'package:flutter_app/models/article.dart';
import 'package:flutter_app/services/api_service.dart';
import 'package:flutter_app/widgets/article_card.dart';
import 'package:url_launcher/url_launcher.dart';

class ArticleDetailScreen extends StatefulWidget {
  final Article article;

  const ArticleDetailScreen({super.key, required this.article});

  @override
  State<ArticleDetailScreen> createState() => _ArticleDetailScreenState();
}

class _ArticleDetailScreenState extends State<ArticleDetailScreen> {
  late Article _article;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _article = widget.article;
    _incrementViews();
  }

  Future<void> _incrementViews() async {
    try {
      await ApiService.incrementViews(_article.id);
      // Update local copy
      setState(() {
        _article = Article(
          id: _article.id,
          titre: _article.titre,
          contenu: _article.contenu,
          auteur: _article.auteur,
          categorie: _article.categorie,
          image: _article.image,
          statut: _article.statut,
          dateCreation: _article.dateCreation,
          vues: _article.vues + 1,
          likes: _article.likes,
        );
      });
    } catch (e) {
      // Silently ignore view increment errors
    }
  }

  Future<void> _incrementLikes() async {
    try {
      await ApiService.incrementLikes(_article.id);
      // Update local copy
      setState(() {
        _article = Article(
          id: _article.id,
          titre: _article.titre,
          contenu: _article.contenu,
          auteur: _article.auteur,
          categorie: _article.categorie,
          image: _article.image,
          statut: _article.statut,
          dateCreation: _article.dateCreation,
          vues: _article.vues,
          likes: _article.likes + 1,
        );
      });
    } catch (e) {
      // Silently ignore like increment errors
    }
  }

  Future<void> _shareArticle() async {
    final url =
        'https://blogreact12-api.reatest.workers.dev/article/${_article.id}';
    if (await canLaunchUrl(Uri.parse(url))) {
      await launchUrl(Uri.parse(url));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Article'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        actions: [
          IconButton(icon: const Icon(Icons.share), onPressed: _shareArticle),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Article Image
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(
                _article.image,
                width: double.infinity,
                height: 250,
                fit: BoxFit.cover,
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) return child;
                  return Center(
                    child: CircularProgressIndicator(
                      value: loadingProgress.expectedTotalBytes != null
                          ? loadingProgress.cumulativeBytesLoaded /
                                loadingProgress.expectedTotalBytes!
                          : null,
                    ),
                  );
                },
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    height: 250,
                    color: Colors.grey[300],
                    child: const Center(
                      child: Icon(Icons.image_not_supported, size: 40),
                    ),
                  );
                },
              ),
            ),

            const SizedBox(height: 16),

            // Category Badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                _article.categorie,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Title
            Text(
              _article.titre,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),

            const SizedBox(height: 12),

            // Author and Date
            Row(
              children: [
                const Icon(Icons.person, size: 16, color: Colors.grey),
                const SizedBox(width: 4),
                Text(
                  _article.auteur,
                  style: const TextStyle(fontSize: 14, color: Colors.grey),
                ),
                const Spacer(),
                const Icon(Icons.calendar_today, size: 16, color: Colors.grey),
                const SizedBox(width: 4),
                Text(
                  _formatDate(_article.dateCreation),
                  style: const TextStyle(fontSize: 14, color: Colors.grey),
                ),
              ],
            ),

            const SizedBox(height: 20),

            // Content
            Text(
              _article.contenu,
              style: const TextStyle(fontSize: 16, height: 1.6),
              textAlign: TextAlign.justify,
            ),

            const SizedBox(height: 20),

            // Stats and Actions
            Row(
              children: [
                // Views
                Row(
                  children: [
                    const Icon(Icons.visibility, size: 18, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(
                      '${_article.vues}',
                      style: const TextStyle(fontSize: 14, color: Colors.grey),
                    ),
                  ],
                ),

                const SizedBox(width: 20),

                // Likes
                Row(
                  children: [
                    const Icon(Icons.favorite, size: 18, color: Colors.red),
                    const SizedBox(width: 4),
                    Text(
                      '${_article.likes}',
                      style: const TextStyle(fontSize: 14, color: Colors.grey),
                    ),
                  ],
                ),

                const Spacer(),

                // Like Button
                IconButton(
                  icon: const Icon(Icons.favorite_border),
                  onPressed: _incrementLikes,
                  color: Colors.red,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays == 0) {
      return 'Aujourd\'hui';
    } else if (difference.inDays == 1) {
      return 'Hier';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} jours';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}

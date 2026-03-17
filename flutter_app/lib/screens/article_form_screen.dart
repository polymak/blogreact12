import 'package:flutter/material.dart';
import 'package:flutter_app/models/article.dart';
import 'package:flutter_app/services/api_service.dart';

class ArticleFormScreen extends StatefulWidget {
  final Article? article;

  const ArticleFormScreen({super.key, this.article});

  @override
  State<ArticleFormScreen> createState() => _ArticleFormScreenState();
}

class _ArticleFormScreenState extends State<ArticleFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  final _imageController = TextEditingController();
  final _categoryController = TextEditingController();

  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    // Pre-fill form if editing
    if (widget.article != null) {
      _titleController.text = widget.article!.titre ?? '';
      _contentController.text = widget.article!.contenu ?? '';
      _imageController.text = widget.article!.image ?? '';
      _categoryController.text = widget.article!.categorie ?? '';
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    _imageController.dispose();
    _categoryController.dispose();
    super.dispose();
  }

  Future<void> _saveArticle() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final articleData = {
        'titre': _titleController.text.trim(),
        'contenu': _contentController.text.trim(),
        'image': _imageController.text.trim(),
        'categorie': _categoryController.text.trim(),
        'auteur': 'Admin', // Could be dynamic based on logged user
        'statut': 'published',
      };

      if (widget.article != null) {
        // Update existing article
        await ApiService.updateArticle(widget.article!.id, articleData);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Article mis à jour avec succès')),
        );
      } else {
        // Create new article
        await ApiService.createArticle(articleData);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Article créé avec succès')),
        );
      }

      // Navigate back to articles list
      Navigator.pushNamed(context, '/articles');
    } catch (e) {
      setState(() {
        _error = 'Erreur lors de l\'enregistrement: $e';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.article != null ? 'Modifier Article' : 'Ajouter Article',
        ),
        backgroundColor: Theme.of(context).colorScheme.primary,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              // Title Field
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Titre',
                  prefixIcon: Icon(Icons.title),
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez entrer un titre';
                  }
                  if (value.length < 3) {
                    return 'Le titre doit contenir au moins 3 caractères';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Category Field
              TextFormField(
                controller: _categoryController,
                decoration: const InputDecoration(
                  labelText: 'Catégorie',
                  prefixIcon: Icon(Icons.category),
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez entrer une catégorie';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Image URL Field
              TextFormField(
                controller: _imageController,
                decoration: const InputDecoration(
                  labelText: 'URL de l\'image',
                  prefixIcon: Icon(Icons.image),
                  border: OutlineInputBorder(),
                  hintText: 'https://example.com/image.jpg',
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez entrer une URL d\'image';
                  }
                  if (!value.startsWith('http')) {
                    return 'Veuillez entrer une URL valide';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Content Field
              TextFormField(
                controller: _contentController,
                decoration: const InputDecoration(
                  labelText: 'Contenu',
                  prefixIcon: Icon(Icons.description),
                  border: OutlineInputBorder(),
                  hintText: 'Contenu de l\'article...',
                ),
                maxLines: 8,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez entrer le contenu de l\'article';
                  }
                  if (value.length < 10) {
                    return 'Le contenu doit contenir au moins 10 caractères';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 20),

              // Error Message
              if (_error != null)
                Text(
                  _error!,
                  style: const TextStyle(color: Colors.red, fontSize: 14),
                ),
              const SizedBox(height: 20),

              // Save Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _saveArticle,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: Theme.of(context).colorScheme.primary,
                  ),
                  child: _isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : Text(
                          widget.article != null
                              ? 'Mettre à jour'
                              : 'Enregistrer',
                        ),
                ),
              ),

              const SizedBox(height: 16),

              // Cancel Button
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () {
                    Navigator.pop(context);
                  },
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text('Annuler'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_app/models/article.dart';
import 'package:flutter_app/services/api_service.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

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

  XFile? _selectedImage;
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    // Pre-fill form if editing
    if (widget.article != null) {
      _titleController.text = widget.article!.titre ?? '';
      _contentController.text = widget.article!.contenu ?? '';
      // Note: Image handling for existing articles would need API support
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final imagePicker = ImagePicker();
    final pickedFile = await imagePicker.pickImage(source: ImageSource.gallery);

    if (pickedFile != null) {
      setState(() {
        _selectedImage = pickedFile;
      });
    }
  }

  Future<void> _saveArticle() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Build request data with default values
      final title = _titleController.text.trim().isEmpty
          ? "Untitled"
          : _titleController.text.trim();
      final content = _contentController.text.trim();

      if (widget.article != null) {
        // Update existing article
        final articleData = {
          'titre': title,
          'contenu': content,
          'auteur': 'Admin',
          'statut': 'published',
        };

        await ApiService.updateArticle(widget.article!.id, articleData);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Article mis à jour avec succès')),
        );
      } else {
        // Create new article
        if (_selectedImage != null) {
          // Use MultipartRequest for image upload
          await ApiService.createArticleWithImage(
            title: title,
            content: content,
            imageFile: File(_selectedImage!.path),
          );
        } else {
          // Normal POST request without image
          final articleData = {
            'titre': title,
            'contenu': content,
            'auteur': 'Admin',
            'statut': 'published',
          };
          await ApiService.createArticle(articleData);
        }
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
                  hintText: 'Titre de l\'article (optionnel)',
                ),
                // No validation - field is optional
              ),
              const SizedBox(height: 16),

              // Image Upload
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Image', style: Theme.of(context).textTheme.labelLarge),
                  const SizedBox(height: 8),
                  ElevatedButton.icon(
                    onPressed: _pickImage,
                    icon: const Icon(Icons.image),
                    label: const Text('Choisir une image'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 12,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Image Preview
                  if (_selectedImage != null)
                    Container(
                      height: 200,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.file(
                          File(_selectedImage!.path),
                          fit: BoxFit.cover,
                        ),
                      ),
                    )
                  else if (widget.article?.image != null &&
                      widget.article?.image!.isNotEmpty == true)
                    Container(
                      height: 200,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          widget.article!.image!,
                          fit: BoxFit.cover,
                          loadingBuilder: (context, child, loadingProgress) {
                            if (loadingProgress == null) return child;
                            return Center(
                              child: CircularProgressIndicator(
                                value:
                                    loadingProgress.expectedTotalBytes != null
                                    ? loadingProgress.cumulativeBytesLoaded /
                                          loadingProgress.expectedTotalBytes!
                                    : null,
                              ),
                            );
                          },
                          errorBuilder: (context, error, stackTrace) {
                            return Container(
                              color: Colors.grey[300],
                              child: const Center(
                                child: Icon(
                                  Icons.image_not_supported,
                                  size: 40,
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    )
                  else
                    Container(
                      height: 200,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Colors.grey[200],
                        border: Border.all(color: Colors.grey),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Center(
                        child: Text(
                          'Aucune image sélectionnée',
                          style: TextStyle(color: Colors.grey),
                        ),
                      ),
                    ),
                ],
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
                // No validation - field is optional
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

import 'package:flutter/material.dart';
import 'package:flutter_app/models/article.dart';
import 'package:flutter_app/services/api_service.dart';
import 'package:flutter_app/widgets/article_card.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _searchController = TextEditingController();
  List<Article> _articles = [];
  List<String> _categories = [];
  List<String> _authors = [];
  Set<String> _selectedCategories = {};
  Set<String> _selectedAuthors = {};
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadCategoriesAndAuthors();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadCategoriesAndAuthors() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // For now, we'll simulate categories and authors
      // In a real app, you would fetch these from the API
      _categories = ['Technologie', 'Science', 'Art', 'Sport', 'Politique'];
      _authors = ['Admin', 'Editor', 'Auteur 1', 'Auteur 2'];
      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = 'Erreur lors du chargement des filtres';
      });
    }
  }

  Future<void> _performSearch() async {
    if (_searchController.text.isEmpty &&
        _selectedCategories.isEmpty &&
        _selectedAuthors.isEmpty) {
      setState(() {
        _articles = [];
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final articles = await ApiService.searchArticles(
        query: _searchController.text.isNotEmpty
            ? _searchController.text
            : null,
        category: _selectedCategories.isNotEmpty
            ? _selectedCategories.first
            : null,
        author: _selectedAuthors.isNotEmpty ? _selectedAuthors.first : null,
      );

      setState(() {
        _articles = articles;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = 'Erreur lors de la recherche';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Recherche'),
        backgroundColor: Theme.of(context).colorScheme.primary,
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: const InputDecoration(
                labelText: 'Rechercher par mot-clé',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
              onSubmitted: (_) => _performSearch(),
            ),
          ),

          // Filters
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _buildFiltersAndResults(),
          ),
        ],
      ),
    );
  }

  Widget _buildFiltersAndResults() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Categories
          if (_categories.isNotEmpty) ...[
            const Text(
              'Catégories',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _categories.map((category) {
                return FilterChip(
                  label: Text(category),
                  selected: _selectedCategories.contains(category),
                  onSelected: (selected) {
                    setState(() {
                      if (selected) {
                        _selectedCategories.add(category);
                      } else {
                        _selectedCategories.remove(category);
                      }
                    });
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 20),
          ],

          // Authors
          if (_authors.isNotEmpty) ...[
            const Text(
              'Auteurs',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _authors.map((author) {
                return FilterChip(
                  label: Text(author),
                  selected: _selectedAuthors.contains(author),
                  onSelected: (selected) {
                    setState(() {
                      if (selected) {
                        _selectedAuthors.add(author);
                      } else {
                        _selectedAuthors.remove(author);
                      }
                    });
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 20),
          ],

          // Search Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _performSearch,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: Theme.of(context).colorScheme.primary,
              ),
              child: const Text('Rechercher'),
            ),
          ),

          const SizedBox(height: 20),

          // Results
          if (_error != null)
            Text(_error!, style: const TextStyle(color: Colors.red))
          else if (_articles.isEmpty && _searchController.text.isNotEmpty)
            const Text('Aucun résultat trouvé')
          else if (_articles.isNotEmpty)
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 1,
                childAspectRatio: 0.8,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
              ),
              itemCount: _articles.length,
              itemBuilder: (context, index) {
                return ArticleCard(
                  article: _articles[index],
                  onTap: () {
                    Navigator.pushNamed(
                      context,
                      '/article',
                      arguments: _articles[index],
                    );
                  },
                );
              },
            ),
        ],
      ),
    );
  }
}

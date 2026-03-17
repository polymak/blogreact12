import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_app/models/article.dart';

class ApiService {
  static const String baseUrl =
      'https://blogreact12-api.reatest.workers.dev/api';

  static Future<List<Article>> getArticles() async {
    final response = await http.get(Uri.parse('$baseUrl/articles'));

    if (response.statusCode == 200) {
      final dynamic data = jsonDecode(response.body);

      // Handle both list and map responses
      if (data is List) {
        return data.map((item) => Article.fromJson(item)).toList();
      } else if (data is Map<String, dynamic>) {
        // If API returns a map, try to extract articles from it
        if (data.containsKey('articles') && data['articles'] is List) {
          return (data['articles'] as List)
              .map((item) => Article.fromJson(item))
              .toList();
        } else if (data.containsKey('data') && data['data'] is List) {
          return (data['data'] as List)
              .map((item) => Article.fromJson(item))
              .toList();
        } else {
          // Try to convert the map values to articles
          return data.values.map((item) => Article.fromJson(item)).toList();
        }
      } else {
        throw Exception('Invalid response format from API');
      }
    } else {
      throw Exception('Failed to load articles: ${response.statusCode}');
    }
  }

  static Future<List<Article>> searchArticles({
    String? query,
    String? category,
    String? author,
  }) async {
    String url = '$baseUrl/articles/search';
    final params = <String, String>{};

    if (query != null && query.isNotEmpty) {
      params['q'] = query;
    }
    if (category != null && category.isNotEmpty) {
      params['category'] = category;
    }
    if (author != null && author.isNotEmpty) {
      params['author'] = author;
    }

    if (params.isNotEmpty) {
      url += '?${Uri(queryParameters: params).query}';
    }

    final response = await http.get(Uri.parse(url));

    if (response.statusCode == 200) {
      final dynamic data = jsonDecode(response.body);

      // Handle both list and map responses
      if (data is List) {
        return data.map((item) => Article.fromJson(item)).toList();
      } else if (data is Map<String, dynamic>) {
        // If API returns a map, try to extract articles from it
        if (data.containsKey('articles') && data['articles'] is List) {
          return (data['articles'] as List)
              .map((item) => Article.fromJson(item))
              .toList();
        } else if (data.containsKey('data') && data['data'] is List) {
          return (data['data'] as List)
              .map((item) => Article.fromJson(item))
              .toList();
        } else {
          // Try to convert the map values to articles
          return data.values.map((item) => Article.fromJson(item)).toList();
        }
      } else {
        throw Exception('Invalid response format from API');
      }
    } else {
      throw Exception('Failed to search articles: ${response.statusCode}');
    }
  }

  static Future<void> incrementViews(int articleId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/articles/$articleId/views'),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to increment views');
    }
  }

  static Future<void> incrementLikes(int articleId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/articles/$articleId/likes'),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to increment likes');
    }
  }

  static Future<Article> createArticle(Map<String, dynamic> articleData) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/articles'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(articleData),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return Article.fromJson(data);
      } else {
        throw Exception('Failed to create article: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error creating article: $e');
    }
  }

  static Future<Article> updateArticle(
    int articleId,
    Map<String, dynamic> articleData,
  ) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/articles/$articleId'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(articleData),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return Article.fromJson(data);
      } else {
        throw Exception('Failed to update article: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error updating article: $e');
    }
  }

  static Future<void> deleteArticle(int articleId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/articles/$articleId'),
      );

      if (response.statusCode != 200 && response.statusCode != 204) {
        throw Exception('Failed to delete article: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error deleting article: $e');
    }
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_app/screens/home_screen.dart';
import 'package:flutter_app/screens/login_screen.dart';
import 'package:flutter_app/screens/dashboard_screen.dart';
import 'package:flutter_app/screens/article_detail_screen.dart';
import 'package:flutter_app/screens/search_screen.dart';
import 'package:flutter_app/models/article.dart';

void main() {
  runApp(const BlogReactApp());
}

class BlogReactApp extends StatelessWidget {
  const BlogReactApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BlogReact',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1A91DA)),
        useMaterial3: true,
        fontFamily: 'Inter',
      ),
      initialRoute: '/',
      routes: {
        '/': (context) => const HomeScreen(),
        '/login': (context) => const LoginScreen(),
        '/dashboard': (context) => DashboardScreen(
          username:
              ModalRoute.of(context)?.settings.arguments as String? ?? 'Admin',
        ),
        '/article': (context) => ArticleDetailScreen(
          article:
              ModalRoute.of(context)?.settings.arguments as Article? ??
              Article(
                id: 0,
                titre: 'Article non trouvé',
                contenu: 'Le contenu de cet article n\'est pas disponible.',
                auteur: 'Admin',
                categorie: 'Non classé',
                image:
                    'https://via.placeholder.com/400x250?text=Article+Not+Found',
                statut: 'draft',
                dateCreation: DateTime.now(),
                vues: 0,
                likes: 0,
              ),
        ),
        '/search': (context) => const SearchScreen(),
      },
      debugShowCheckedModeBanner: false,
    );
  }
}

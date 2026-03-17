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
          username: ModalRoute.of(context)?.settings.arguments as String,
        ),
        '/article': (context) => ArticleDetailScreen(
          article: ModalRoute.of(context)?.settings.arguments as Article,
        ),
        '/search': (context) => const SearchScreen(),
      },
      debugShowCheckedModeBanner: false,
    );
  }
}

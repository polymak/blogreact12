import 'dart:convert';

class Article {
  final int id;
  final String titre;
  final String contenu;
  final String auteur;
  final String categorie;
  final String image;
  final String statut;
  final DateTime dateCreation;
  final int vues;
  final int likes;

  Article({
    required this.id,
    required this.titre,
    required this.contenu,
    required this.auteur,
    required this.categorie,
    required this.image,
    required this.statut,
    required this.dateCreation,
    required this.vues,
    required this.likes,
  });

  factory Article.fromJson(Map<String, dynamic> json) {
    return Article(
      id: json['id'],
      titre: json['titre'],
      contenu: json['contenu'],
      auteur: json['auteur'],
      categorie: json['categorie'],
      image: json['image'],
      statut: json['statut'],
      dateCreation: DateTime.parse(json['date_creation']),
      vues: json['vues'],
      likes: json['likes'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'titre': titre,
      'contenu': contenu,
      'auteur': auteur,
      'categorie': categorie,
      'image': image,
      'statut': statut,
      'date_creation': dateCreation.toIso8601String(),
      'vues': vues,
      'likes': likes,
    };
  }
}

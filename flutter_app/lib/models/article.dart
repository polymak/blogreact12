class Article {
  final int id;
  final String? titre;
  final String? contenu;
  final String? auteur;
  final String? categorie;
  final String? image;
  final String? statut;
  final DateTime? dateCreation;
  final int vues;
  final int likes;

  Article({
    required this.id,
    this.titre,
    this.contenu,
    this.auteur,
    this.categorie,
    this.image,
    this.statut,
    this.dateCreation,
    required this.vues,
    required this.likes,
  });

  factory Article.fromJson(Map<String, dynamic> json) {
    return Article(
      id: json['id'] ?? 0,
      titre: json['titre'] ?? '',
      contenu: json['contenu'] ?? '',
      auteur: json['auteur'] ?? 'Admin',
      categorie: json['categorie'] ?? 'Non classé',
      image:
          json['image'] ?? 'https://via.placeholder.com/400x250?text=No+Image',
      statut: json['statut'] ?? 'draft',
      dateCreation: _parseDateTime(json['date_creation']),
      vues: json['vues'] ?? 0,
      likes: json['likes'] ?? 0,
    );
  }

  static DateTime? _parseDateTime(dynamic dateValue) {
    if (dateValue == null) return null;
    if (dateValue is String) {
      try {
        return DateTime.parse(dateValue);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'titre': titre ?? '',
      'contenu': contenu ?? '',
      'auteur': auteur ?? 'Admin',
      'categorie': categorie ?? 'Non classé',
      'image': image ?? 'https://via.placeholder.com/400x250?text=No+Image',
      'statut': statut ?? 'draft',
      'date_creation': dateCreation?.toIso8601String() ?? '',
      'vues': vues,
      'likes': likes,
    };
  }
}

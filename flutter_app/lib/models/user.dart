class User {
  final String? username;
  final String? role;

  User({this.username, this.role});

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      username: json['username'] ?? 'Unknown',
      role: json['role'] ?? 'user',
    );
  }

  Map<String, dynamic> toJson() {
    return {'username': username ?? 'Unknown', 'role': role ?? 'user'};
  }
}

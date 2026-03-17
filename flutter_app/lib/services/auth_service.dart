import 'dart:convert';
import 'package:http/http.dart' as http;

class AuthService {
  static const String baseUrl =
      'https://blogreact12-api.reatest.workers.dev/api';
  static const String tokenKey = 'user_token';

  static Future<bool> login(String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'username': username, 'password': password}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          // Store token
          // Note: In a real app, you would use secure storage
          // For now, we'll just return success
          return true;
        }
      }
      return false;
    } catch (e) {
      print('Login error: $e');
      return false;
    }
  }

  static Future<bool> logout() async {
    // Clear stored token
    // In a real app, you would clear from secure storage
    return true;
  }
}

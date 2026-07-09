import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'config/app_animations.dart';
import 'config/app_theme.dart';
import 'config/smooth_scroll.dart';
import 'config/supabase_config.dart';
import 'pages/splash_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: SupabaseConfig.url,
    anonKey: SupabaseConfig.anonKey,
  );

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  runApp(const RtOsApp());
}

class RtOsApp extends StatelessWidget {
  const RtOsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'RT OS Indonesia',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.theme.copyWith(
        pageTransitionsTheme: PageTransitionsTheme(
          builders: {
            TargetPlatform.android: AppPageTransitions(),
            TargetPlatform.iOS: AppPageTransitions(),
            TargetPlatform.windows: AppPageTransitions(),
          },
        ),
      ),
      scrollBehavior: const AppScrollBehavior(),
      home: const SplashPage(),
    );
  }
}

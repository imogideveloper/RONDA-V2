import 'package:flutter_test/flutter_test.dart';
import 'package:ronda_app/main.dart';

void main() {
  testWidgets('RT OS launches splash screen', (WidgetTester tester) async {
    await tester.pumpWidget(const RtOsApp());
    expect(find.text('RT OS'), findsOneWidget);
    expect(find.text('Indonesia'), findsOneWidget);
  });
}

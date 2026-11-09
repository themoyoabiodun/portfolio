import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:rank_bills/main.dart';

void main() {
  testWidgets('Bill & Payment screen renders its sections', (tester) async {
    await tester.pumpWidget(const RankBillsApp());
    await tester.pumpAndSettle();

    expect(find.text('Bill & Payment'), findsOneWidget);
    expect(find.text('Saved Bills'), findsOneWidget);
    expect(find.text('Services'), findsOneWidget);
    expect(find.text('Electricity'), findsOneWidget);
    expect(find.text('Buy Again'), findsOneWidget);

    await tester.scrollUntilVisible(
      find.text('GOtv Max'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('Recent payments'), findsOneWidget);
    expect(find.text('₦8,500'), findsOneWidget);
  });
}

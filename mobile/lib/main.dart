import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'screens/bills_payment_screen.dart';
import 'theme/tokens.dart';

void main() {
  runApp(const RankBillsApp());
}

class RankBillsApp extends StatelessWidget {
  const RankBillsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark.copyWith(statusBarColor: Colors.transparent),
      child: MaterialApp(
        title: 'Bill & Payment',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          fontFamily: 'Dazzed',
          scaffoldBackgroundColor: RankColors.bgDefault,
          colorScheme: ColorScheme.fromSeed(
            seedColor: RankColors.textPrimary,
            primary: RankColors.textPrimary,
            surface: RankColors.bgDefault,
          ),
        ),
        home: const BillsPaymentScreen(),
      ),
    );
  }
}

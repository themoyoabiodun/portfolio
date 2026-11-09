import 'package:flutter/material.dart';

import '../theme/tokens.dart';
import '../widgets/brand_logo.dart';
import '../widgets/components.dart';
import '../widgets/service_icon.dart';

class _SavedBill {
  const _SavedBill(this.biller, this.number, this.provider, {this.badge});
  final Biller biller;
  final String number;
  final String provider;
  final String? badge;
}

class _Payment {
  const _Payment(this.biller, this.title, this.subtitle, this.amount, this.status);
  final Biller biller;
  final String title;
  final String subtitle;
  final String amount;
  final String status;
}

const _savedBills = [
  _SavedBill(Biller.mtn, '0803 456 7788', 'MTN'),
  _SavedBill(Biller.ikedc, '0451 2290 331', 'IKEDC Prepaid'),
  _SavedBill(Biller.dstv, '7023 4411 09', 'DStv', badge: 'Due 3d'),
];

/// (service, label, column width from the design)
const _serviceRows = [
  [
    (Service.airtime, 'Airtime', 64.0),
    (Service.data, 'Data', 64.0),
    (Service.electricity, 'Electricity', 69.0),
    (Service.cableTv, 'Cable TV', 64.0),
  ],
  [
    (Service.internet, 'Internet', 64.0),
    (Service.transport, 'Transport', 67.0),
    (Service.education, 'Education', 69.0),
    (Service.betting, 'Betting', 64.0),
  ],
];

const _recentPayments = [
  _Payment(Biller.mtn, 'MTN Airtime', '0803 456 7788 · Today, 9:14 AM', '₦2,000', 'Successful'),
  _Payment(Biller.ikedc, 'IKEDC Prepaid', 'Home · Mon, 6:02 PM', '₦15,000', 'Token ready'),
  _Payment(Biller.gotv, 'GOtv Max', 'Mum’s TV · 2 Nov', '₦8,500', 'Pending'),
];

/// Bill & Payment — Figma node 10613:51748 (Rank Standard Staging).
class BillsPaymentScreen extends StatefulWidget {
  const BillsPaymentScreen({super.key});

  @override
  State<BillsPaymentScreen> createState() => _BillsPaymentScreenState();
}

class _BillsPaymentScreenState extends State<BillsPaymentScreen> {
  final _scroll = ScrollController();
  bool _scrolledUnder = false;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(() {
      final under = _scroll.offset > 0;
      if (under != _scrolledUnder) setState(() => _scrolledUnder = under);
    });
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  void _todo(String what) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(what), duration: const Duration(seconds: 1)));
  }

  @override
  Widget build(BuildContext context) {
    final padding = MediaQuery.paddingOf(context);
    final topBarHeight = padding.top + RankTopBar.rowHeight;

    return Scaffold(
      backgroundColor: RankColors.bgDefault,
      body: Stack(
        children: [
          ListView(
            controller: _scroll,
            padding: EdgeInsets.only(top: topBarHeight, bottom: padding.bottom + 16),
            children: [
              _savedBillsSection(),
              const SizedBox(height: 8),
              _servicesSection(),
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.all(16),
                child: BuyAgainCard(
                  title: '₦2,000 MTN Airtime',
                  number: '080987654321',
                  onBuyAgain: () => _todo('Buy ₦2,000 MTN Airtime again'),
                ),
              ),
              const SizedBox(height: 8),
              _recentPaymentsSection(),
            ],
          ),
          Positioned(
            left: 0,
            right: 0,
            top: 0,
            height: topBarHeight,
            child: RankTopBar(
              title: 'Bill & Payment',
              scrolledUnder: _scrolledUnder,
              onBack: () => Navigator.maybePop(context),
              trailing: GlassIconButton(
                icon: 'assets/icons/magnifying_glass.svg',
                semanticLabel: 'Search',
                onPressed: () => _todo('Search'),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _savedBillsSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: SectionHeader(title: 'Saved Bills', onSeeAll: () => _todo('All saved bills')),
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (final (i, bill) in _savedBills.indexed) ...[
                  if (i > 0) const SizedBox(width: 10),
                  BillCard(
                    biller: bill.biller,
                    number: bill.number,
                    provider: bill.provider,
                    badge: bill.badge,
                    onTap: () => _todo('${bill.provider} · ${bill.number}'),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _servicesSection() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Services', style: RankText.section),
          const SizedBox(height: 12),
          for (final (i, row) in _serviceRows.indexed) ...[
            if (i > 0) const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                for (final (service, label, width) in row)
                  ServiceTile(
                    service: service,
                    label: label,
                    width: width,
                    onTap: () => _todo(label),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _recentPaymentsSection() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SectionHeader(title: 'Recent payments', onSeeAll: () => _todo('All payments')),
          const SizedBox(height: 16),
          for (final p in _recentPayments)
            PaymentRow(
              biller: p.biller,
              title: p.title,
              subtitle: p.subtitle,
              amount: p.amount,
              status: p.status,
              onTap: () => _todo('${p.title} · ${p.amount}'),
            ),
        ],
      ),
    );
  }
}

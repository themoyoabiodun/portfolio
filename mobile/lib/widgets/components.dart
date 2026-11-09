import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../theme/tokens.dart';
import 'brand_logo.dart';
import 'service_icon.dart';

/// Icon Button, Size=Medium (42), Style=Glass.
class GlassIconButton extends StatelessWidget {
  const GlassIconButton({
    super.key,
    required this.icon,
    required this.semanticLabel,
    required this.onPressed,
  });

  final String icon;
  final String semanticLabel;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: semanticLabel,
      child: DecoratedBox(
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(color: Color(0xFFD0D0D0), offset: Offset(1.25, 0), spreadRadius: -0.75),
            BoxShadow(color: Color(0xFFD0D0D0), offset: Offset(-1.25, 0), spreadRadius: -0.75),
            BoxShadow(color: Color(0xFFE8E8E8), spreadRadius: 0.5),
            BoxShadow(color: Color(0x05000000), offset: Offset(0, 8), blurRadius: 15),
          ],
        ),
        child: ClipOval(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
            child: Material(
              color: const Color(0xEEFCFCFC),
              child: InkWell(
                onTap: onPressed,
                child: SizedBox.square(
                  dimension: 42,
                  child: Center(child: SvgPicture.asset(icon, width: 20, height: 20)),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Top bar, Type=Page, Platform=iOS: centred title between a glass back
/// button and a 42pt trailing slot. The fade (Scrim) appears once content
/// scrolls under the bar.
class RankTopBar extends StatelessWidget {
  const RankTopBar({
    super.key,
    required this.title,
    required this.scrolledUnder,
    required this.onBack,
    this.trailing,
  });

  final String title;
  final bool scrolledUnder;
  final VoidCallback onBack;
  final Widget? trailing;

  /// Header row height: 8 + 42 + 8.
  static const double rowHeight = 58;

  @override
  Widget build(BuildContext context) {
    final statusBar = MediaQuery.paddingOf(context).top;
    return Stack(
      children: [
        Positioned.fill(
          child: IgnorePointer(
            child: AnimatedOpacity(
              opacity: scrolledUnder ? 1 : 0,
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeOut,
              child: ShaderMask(
                shaderCallback: (rect) => const LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.white, Colors.white, Colors.transparent],
                  stops: [0, 0.55, 1],
                ).createShader(rect),
                blendMode: BlendMode.dstIn,
                child: ClipRect(
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                    child: Container(color: RankColors.bgDefault.withValues(alpha: 0.85)),
                  ),
                ),
              ),
            ),
          ),
        ),
        Padding(
          padding: EdgeInsets.only(top: statusBar),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                GlassIconButton(
                  icon: 'assets/icons/arrow_left.svg',
                  semanticLabel: 'Back',
                  onPressed: onBack,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    title,
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: RankText.bodyLargeBold,
                  ),
                ),
                const SizedBox(width: 12),
                // Keep the slot even when empty so the title stays centred.
                SizedBox.square(dimension: 42, child: trailing),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

/// button-cta, Type=Primary Ghost, Size=Small: text-only orange label.
class GhostButton extends StatelessWidget {
  const GhostButton({super.key, required this.label, required this.onPressed});

  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(30),
      child: Text(
        label,
        style: RankText.bodySmallSemiBold.copyWith(color: RankColors.textPrimary),
      ),
    );
  }
}

class SectionHeader extends StatelessWidget {
  const SectionHeader({super.key, required this.title, this.onSeeAll});

  final String title;
  final VoidCallback? onSeeAll;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: RankText.section),
        if (onSeeAll != null) GhostButton(label: 'See all', onPressed: onSeeAll!),
      ],
    );
  }
}

/// Bill card — a saved bill in the Saved Bills rail.
class BillCard extends StatelessWidget {
  const BillCard({
    super.key,
    required this.biller,
    required this.number,
    required this.provider,
    this.badge,
    required this.onTap,
  });

  final Biller biller;
  final String number;
  final String provider;
  final String? badge;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: RankColors.bgSurface,
      borderRadius: BorderRadius.circular(20),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: SizedBox(
          width: 164,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    BrandLogo(biller),
                    if (badge != null) _Badge(badge!),
                  ],
                ),
                const SizedBox(height: 24),
                Text(number, style: RankText.bodySmallSemiBold, maxLines: 1),
                const SizedBox(height: 4),
                Text(provider, style: RankText.bodySmallMedium, maxLines: 1),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: RankColors.badgeWarningBg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(label, style: RankText.badge),
    );
  }
}

/// A service shortcut: 64pt surface tile with its illustration and a label.
class ServiceTile extends StatelessWidget {
  const ServiceTile({
    super.key,
    required this.service,
    required this.label,
    required this.width,
    required this.onTap,
  });

  final Service service;
  final String label;
  final double width;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      excludeSemantics: true,
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: SizedBox(
          width: width,
          child: Column(
            children: [
              Container(
                height: 64,
                decoration: BoxDecoration(
                  color: RankColors.bgSurface,
                  borderRadius: BorderRadius.circular(20),
                ),
                alignment: Alignment.center,
                child: ServiceIcon(service),
              ),
              const SizedBox(height: 8),
              Text(
                label,
                textAlign: TextAlign.center,
                maxLines: 1,
                softWrap: false,
                overflow: TextOverflow.visible,
                style: RankText.bodySmallSemiBold,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// "Buy again" card for the last airtime purchase.
class BuyAgainCard extends StatelessWidget {
  const BuyAgainCard({
    super.key,
    required this.title,
    required this.number,
    required this.onBuyAgain,
  });

  final String title;
  final String number;
  final VoidCallback onBuyAgain;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 149,
      padding: const EdgeInsets.fromLTRB(12, 8, 8, 8),
      decoration: BoxDecoration(
        color: RankColors.bgDefault,
        border: Border.all(color: RankColors.borderDefault),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Padding(
                  padding: const EdgeInsets.all(4),
                  child: Text.rich(
                    TextSpan(
                      children: [
                        TextSpan(text: '$title '),
                        TextSpan(
                          text: number,
                          style: const TextStyle(color: RankColors.textDefault),
                        ),
                      ],
                    ),
                    style: RankText.bodyLargeSemiBold,
                  ),
                ),
                InkWell(
                  onTap: onBuyAgain,
                  borderRadius: BorderRadius.circular(30),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('Buy Again', style: RankText.captionSemiBold),
                      const SizedBox(width: 4),
                      SvgPicture.asset('assets/icons/arrow_right.svg', width: 16, height: 16),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 32),
          Container(
            width: 133,
            decoration: BoxDecoration(
              color: RankColors.mtnYellow,
              borderRadius: BorderRadius.circular(14),
            ),
            clipBehavior: Clip.antiAlias,
            child: Stack(
              children: [
                Positioned(
                  left: 15,
                  top: 15,
                  child: SvgPicture.asset('assets/logos/mtn_promo.svg', width: 101, height: 101),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// ListRow for a recent payment.
class PaymentRow extends StatelessWidget {
  const PaymentRow({
    super.key,
    required this.biller,
    required this.title,
    required this.subtitle,
    required this.amount,
    required this.status,
    required this.onTap,
  });

  final Biller biller;
  final String title;
  final String subtitle;
  final String amount;
  final String status;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(
          children: [
            BrandLogo(biller),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: RankText.bodyLargeSemiBold, maxLines: 1),
                  const SizedBox(height: 2),
                  Text(subtitle, style: RankText.bodySmallMedium),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(amount, style: RankText.bodyLargeSemiBold),
                const SizedBox(height: 2),
                Text(status, style: RankText.bodySmallMedium),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

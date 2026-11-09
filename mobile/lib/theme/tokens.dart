import 'package:flutter/material.dart';

/// Rank design tokens used by the Bill & Payment screen (Light mode).
abstract final class RankColors {
  static const bgDefault = Color(0xFFFFFFFF);
  static const bgSurface = Color(0xFFF8F7F7);
  static const bgActive = Color(0xFFAAA4A2);
  static const borderDefault = Color(0xFFEBEBEB);
  static const textLead = Color(0xFF220900);
  static const textDefault = Color(0xFF78706D);
  static const textPrimary = Color(0xFFFF7500);
  static const badgeWarningBg = Color(0xFFFFF1E3);
  static const badgeWarningText = Color(0xFFF77500);
  static const mtnYellow = Color(0xFFFFC325);
}

/// Rank type styles. Dazzed is the brand face; it falls back to the platform
/// font until the Dazzed files are added to `pubspec.yaml` (see README).
abstract final class RankText {
  static const _family = 'Dazzed';

  static TextStyle _style(double size, double height, FontWeight weight) =>
      TextStyle(
        fontFamily: _family,
        fontSize: size,
        height: height / size,
        fontWeight: weight,
        // Figma: letter spacing -1%.
        letterSpacing: -size * 0.01,
        color: RankColors.textLead,
      );

  /// Section/Bold — 18 / 26.
  static final section = _style(18, 26, FontWeight.w700);

  /// Body Large/Bold — 16 / 26.
  static final bodyLargeBold = _style(16, 26, FontWeight.w700);

  /// Body Large/SemiBold — 16 / 26.
  static final bodyLargeSemiBold = _style(16, 26, FontWeight.w600);

  /// Body Small/SemiBold — 14 / 22.
  static final bodySmallSemiBold = _style(14, 22, FontWeight.w600);

  /// Body Small/Medium — 14 / 22.
  static final bodySmallMedium =
      _style(14, 22, FontWeight.w500).copyWith(color: RankColors.textDefault);

  /// Caption/SemiBold — 12 / 18.
  static final captionSemiBold = _style(12, 18, FontWeight.w600);

  /// Badge label — Inter SemiBold 11.
  static const badge = TextStyle(
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: FontWeight.w600,
    color: RankColors.badgeWarningText,
  );
}

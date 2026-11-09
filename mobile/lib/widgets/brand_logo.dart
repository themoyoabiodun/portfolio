import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// Biller logos (40 × 40 circles), built from the Figma `logo/*` components.
enum Biller { mtn, ikedc, dstv, gotv }

class BrandLogo extends StatelessWidget {
  const BrandLogo(this.biller, {super.key});

  final Biller biller;

  static const double size = 40;

  @override
  Widget build(BuildContext context) {
    if (biller == Biller.mtn) {
      return SvgPicture.asset('assets/logos/mtn.svg', width: size, height: size);
    }

    // The other logos are a bordered white disc with the brand image placed
    // inside it, all clipped to the 40pt circle.
    final Widget mark = switch (biller) {
      Biller.ikedc => Positioned(
          left: 5,
          top: 3.33,
          width: 31.19,
          height: 31.39,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(1000),
            child: Image.asset('assets/logos/ikedc.jpg', fit: BoxFit.cover),
          ),
        ),
      Biller.dstv => Positioned(
          left: 5,
          top: 11.67,
          width: 31.333,
          height: 17.407,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(1000),
            child: Image.asset('assets/logos/dstv.png', fit: BoxFit.cover),
          ),
        ),
      Biller.gotv => Positioned(
          left: 5.46,
          top: 11.66,
          width: 27.87,
          height: 15.48,
          child: DecoratedBox(
            position: DecorationPosition.foreground,
            decoration: BoxDecoration(
              border: Border.all(color: const Color(0xFFF2F2F2), width: 0.417),
            ),
            child: Image.asset('assets/logos/gotv.png', fit: BoxFit.cover),
          ),
        ),
      Biller.mtn => const SizedBox.shrink(),
    };

    return SizedBox.square(
      dimension: size,
      child: ClipOval(
        child: Stack(
          children: [
            SvgPicture.asset(
              'assets/logos/circle_bordered.svg',
              width: size,
              height: size,
            ),
            mark,
          ],
        ),
      ),
    );
  }
}

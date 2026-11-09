import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

enum Service { airtime, data, electricity, cableTv, internet, transport, education, betting }

/// The 40 × 40 illustration for each service tile, placed exactly as the
/// Figma `asset` frames lay out their images.
class ServiceIcon extends StatelessWidget {
  const ServiceIcon(this.service, {super.key});

  final Service service;

  @override
  Widget build(BuildContext context) {
    return SizedBox.square(
      dimension: 40,
      child: ClipRect(
        child: Stack(clipBehavior: Clip.none, children: _layers()),
      ),
    );
  }

  List<Widget> _layers() {
    switch (service) {
      case Service.airtime:
        return [
          Positioned(
            left: 5.34,
            top: 7.51,
            child: SvgPicture.asset(
              'assets/services/airtime_shadow.svg',
              width: 32.0703,
              height: 27.8945,
            ),
          ),
          _image('assets/services/airtime.png', left: 5.01, top: 7.01, width: 32.738, height: 29.064),
        ];
      case Service.data:
        return [
          _rotated('assets/services/data_note.png',
              left: 0.83, top: 3.33, boxW: 39.853, boxH: 32.949,
              w: 22.789, h: 34.183, degrees: -109.63),
          _rotated('assets/services/data_note.png',
              left: 2.86, top: 7.16, boxW: 35.797, boxH: 25.29,
              w: 22.789, h: 34.183, degrees: -94.3),
        ];
      case Service.electricity:
        // The price tag is a crop of a larger sheet.
        return [
          _rotatedChild(
            left: 0.83, top: 5, boxW: 36.505, boxH: 30.521, degrees: -81.45,
            child: SizedBox(
              width: 25.898,
              height: 33.02,
              child: ClipRect(
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Positioned(
                      left: -64.42,
                      top: -133.05,
                      width: 103.58,
                      height: 210.10,
                      child: Image.asset('assets/services/electricity_tag.png', fit: BoxFit.fill),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ];
      case Service.cableTv:
        return [_image('assets/services/cable_tv.png', left: 0, top: 0, width: 40, height: 40)];
      case Service.internet:
        return [_image('assets/services/internet.png', left: 4.16, top: 5, width: 31.991, height: 30)];
      case Service.transport:
        return [
          Positioned(
            left: 5.83,
            top: 7.5,
            child: SvgPicture.asset(
              'assets/services/transport.svg',
              width: 27.9554,
              height: 24.7207,
            ),
          ),
        ];
      case Service.education:
        return [_image('assets/services/education.png', left: 4.16, top: 4.17, width: 32.135, height: 32.5, alignment: Alignment.bottomCenter)];
      case Service.betting:
        return [
          _rotated('assets/services/betting.png',
              left: -3.33, top: -1.67, boxW: 47.558, boxH: 43.733,
              w: 40.268, h: 35, degrees: 14.06),
        ];
    }
  }

  static Widget _image(
    String asset, {
    required double left,
    required double top,
    required double width,
    required double height,
    Alignment alignment = Alignment.center,
  }) {
    return Positioned(
      left: left,
      top: top,
      width: width,
      height: height,
      child: Image.asset(asset, fit: BoxFit.cover, alignment: alignment),
    );
  }

  static Widget _rotated(
    String asset, {
    required double left,
    required double top,
    required double boxW,
    required double boxH,
    required double w,
    required double h,
    required double degrees,
  }) {
    return _rotatedChild(
      left: left,
      top: top,
      boxW: boxW,
      boxH: boxH,
      degrees: degrees,
      child: SizedBox(width: w, height: h, child: Image.asset(asset, fit: BoxFit.cover)),
    );
  }

  /// Centres [child] in a [boxW] × [boxH] box and rotates it about its centre,
  /// like Figma's rotated-layer bounding boxes.
  static Widget _rotatedChild({
    required double left,
    required double top,
    required double boxW,
    required double boxH,
    required double degrees,
    required Widget child,
  }) {
    return Positioned(
      left: left,
      top: top,
      width: boxW,
      height: boxH,
      child: OverflowBox(
        maxWidth: double.infinity,
        maxHeight: double.infinity,
        child: Transform.rotate(angle: degrees * 3.141592653589793 / 180, child: child),
      ),
    );
  }
}

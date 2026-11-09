# Rank — Bill & Payment (Flutter)

The **Bill & Payment** screen from the Rank Standard Staging Figma file
(node `10613:51748`), built in Flutter for iOS, Android and web.

## Run it

```bash
cd mobile
flutter pub get
flutter run            # pick a simulator / device, or `-d chrome`
```

Checks:

```bash
flutter analyze
flutter test
```

## Layout

- `lib/theme/tokens.dart`: colour and type tokens (BG/Surface, Text/Lead, Section/Bold and the rest)
- `lib/widgets/components.dart`: Top bar, glass Icon Button, ghost button-cta, Bill card, Service tile, Buy-again card, payment ListRow
- `lib/widgets/brand_logo.dart`: biller logos (MTN, IKEDC, DStv, GOtv)
- `lib/widgets/service_icon.dart`: service illustrations, placed as in Figma
- `lib/screens/bills_payment_screen.dart`: the screen and its sample data
- `assets/`: icons, logos and illustrations exported from Figma (large PNGs downscaled)

## Notes

- **Font:** the design uses *Dazzed*, which is licensed and not included. Until it's added, the app falls back to the platform font. To add it, put the `.otf`/`.ttf` files in `assets/fonts/` and declare them under `flutter: fonts:` in `pubspec.yaml` with family `Dazzed` and weights 500, 600 and 700.
- The iOS status bar and home indicator come from the OS. The top bar reserves the system inset instead of drawing them.
- The top bar is clear at rest, as in the design. It fades in a white blur once content scrolls under it.
- Taps currently show a placeholder snackbar; there are no flows behind them yet.

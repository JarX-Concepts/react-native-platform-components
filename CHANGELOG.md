# Changelog

# [1.7.0](https://github.com/JarX-Concepts/react-native-platform-components/compare/v1.6.0...v1.7.0) (2026-10-17)

### Bug Fixes

* **android:** report the ContextMenu long press to React Native only under a React root ([e80e5db](https://github.com/JarX-Concepts/react-native-platform-components/commit/e80e5db9f84b5f3ee2fc6c9601067a05d820a24b))
* **context-menu:** let the wrapped content keep its own taps ([c171864](https://github.com/JarX-Concepts/react-native-platform-components/commit/c171864efb55ad1e6fcf2d1872b42eb37904189a)), closes [#111](https://github.com/JarX-Concepts/react-native-platform-components/issues/111)
* **ios:** anchor the ActionSheet to its children, not its frame ([845786d](https://github.com/JarX-Concepts/react-native-platform-components/commit/845786d8e9d35ff851ceeb4f481350f4d7f75538))

### Features

* add ActionSheet component ([63cd3a4](https://github.com/JarX-Concepts/react-native-platform-components/commit/63cd3a4575f57b33641e4e21fc23b54893da1ebe)), closes [#107](https://github.com/JarX-Concepts/react-native-platform-components/issues/107)
* **context-menu:** open the menu from JS on both platforms ([367c7b5](https://github.com/JarX-Concepts/react-native-platform-components/commit/367c7b52584e99f56d8dcf9cc1ce0cb083cc626a)), closes [#106](https://github.com/JarX-Concepts/react-native-platform-components/issues/106)
* **context-menu:** testID on ContextMenu and Button menu actions ([ed7f046](https://github.com/JarX-Concepts/react-native-platform-components/commit/ed7f046526721a7210a8c91c9297fd6f177c8ac8)), closes [#105](https://github.com/JarX-Concepts/react-native-platform-components/issues/105)

# [1.6.0](https://github.com/JarX-Concepts/react-native-platform-components/compare/v1.5.0...v1.6.0) (2026-10-13)

### Bug Fixes

* install expo-system-ui in example-expo ([d40dd11](https://github.com/JarX-Concepts/react-native-platform-components/commit/d40dd11582f1adbe5eac66e150d9eb4a2c3f5586))
* make the Expo example's FAB icon visible, and document icons in Expo ([df357bc](https://github.com/JarX-Concepts/react-native-platform-components/commit/df357bc2634f1f06d4fb1c58d2a91b55656e1142))

### Features

* **plugin:** copy vector drawables into Expo projects at prebuild ([f57ed99](https://github.com/JarX-Concepts/react-native-platform-components/commit/f57ed995bdffe927984dbe34b98b140e15734b46))

# [1.5.0](https://github.com/JarX-Concepts/react-native-platform-components/compare/v1.4.0...v1.5.0) (2026-09-27)

### Bug Fixes

* **button:** add the Android button before swapping in the loading spinner ([e4f17fa](https://github.com/JarX-Concepts/react-native-platform-components/commit/e4f17fa5009a46fabac6e6d7635ae98b1521e59a))
* **context-menu:** native anchor, destructive color, icons and iOS 16 previews ([dcde756](https://github.com/JarX-Concepts/react-native-platform-components/commit/dcde756010f84280341c1c426971fb4be631b080))
* **date-picker:** apply firstDayOfWeek, min/max days and locale on Android ([e44769a](https://github.com/JarX-Concepts/react-native-platform-components/commit/e44769a1de24ed6523d0a38020ad273444d9c136))
* **date-picker:** report the countdown duration as durationSeconds on iOS ([0e02104](https://github.com/JarX-Concepts/react-native-platform-components/commit/0e02104b4ffa815b0e6682fc24b3a3092d09ca10))
* **date-picker:** use wheels for the iOS countdown timer instead of crashing ([c938a05](https://github.com/JarX-Concepts/react-native-platform-components/commit/c938a0582f3fcfb2d648cd5304824e0d22bccd3f))
* **example:** drop the app-wide exposed-dropdown textInputStyle ([3d544cd](https://github.com/JarX-Concepts/react-native-platform-components/commit/3d544cd5fc2372fa375ec16fd4994ff40af09809))
* **example:** move the haptics pickers off the e2e flows' paths ([956f473](https://github.com/JarX-Concepts/react-native-platform-components/commit/956f47387babb3afe279be12a8316c361d488cc7))
* harden platform controls and validation ([163df5a](https://github.com/JarX-Concepts/react-native-platform-components/commit/163df5aee3779a710f642db16865d6bbe5d7d517))
* **ios:** seed each Fabric view's default props ([aed0a08](https://github.com/JarX-Concepts/react-native-platform-components/commit/aed0a088ccf63383b34d406eb91d14649755b0de))
* **menus:** leave closing and unpresented menus alone ([1acaa94](https://github.com/JarX-Concepts/react-native-platform-components/commit/1acaa9478d0ec2d865f82dc3076062811affcb2d))
* **segmented-control:** find the iOS 26 segment views for testIDs and badges ([ee1722c](https://github.com/JarX-Concepts/react-native-platform-components/commit/ee1722c76ceaeaf9dd241565d4997fb8a83ee64a))
* **segmented-control:** find the iOS 26 segment views for testIDs and badges ([deb41a0](https://github.com/JarX-Concepts/react-native-platform-components/commit/deb41a0039d5a8dc3add977c9ad35894fe465a6d))
* **selection-menu:** mark the selected option natively ([832c793](https://github.com/JarX-Concepts/react-native-platform-components/commit/832c7936b0d6a81d8551efc7d8bde6fa8e766942))

### Features

* add FloatingActionButton, the Material FAB ([e8959b6](https://github.com/JarX-Concepts/react-native-platform-components/commit/e8959b6b739ae3e0bddefe2c5c748c93f6f591de))
* add NavigationRail, the Material navigation rail ([ce0a963](https://github.com/JarX-Concepts/react-native-platform-components/commit/ce0a963348f6c7e4ab6dc3e52361f839a1d5f6b4))
* add TabBar, the native tab bar ([473acdc](https://github.com/JarX-Concepts/react-native-platform-components/commit/473acdcd740044f674e0fa2a653839d5bf5f847c)), closes [#53](https://github.com/JarX-Concepts/react-native-platform-components/issues/53)
* add web adapters and native control options ([181130e](https://github.com/JarX-Concepts/react-native-platform-components/commit/181130e1ac5ba8fc881df7ce8b028c9b2abcd435))
* **button-group:** add a split button, and an overflow menu on iOS behind a cross-platform prop ([e00db9b](https://github.com/JarX-Concepts/react-native-platform-components/commit/e00db9b9718c92372c90a604d48621b866a4c9d8))
* **button:** add a loading state ([#50](https://github.com/JarX-Concepts/react-native-platform-components/issues/50)) ([53e0d05](https://github.com/JarX-Concepts/react-native-platform-components/commit/53e0d05c9a6fff6e6af41759e1eefe2473d0b48a))
* **button:** add disabledColor and disabledTintColor ([#51](https://github.com/JarX-Concepts/react-native-platform-components/issues/51)) ([121b142](https://github.com/JarX-Concepts/react-native-platform-components/commit/121b14292a70393af71da0528edd031a163c3c52))
* **button:** add iconPosition and numeric cornerRadius ([#52](https://github.com/JarX-Concepts/react-native-platform-components/issues/52)) ([2549cab](https://github.com/JarX-Concepts/react-native-platform-components/commit/2549cab3d24d00484ca21abe70513c88b828b1bb))
* **button:** add Liquid Glass variants glass and prominentGlass ([#58](https://github.com/JarX-Concepts/react-native-platform-components/issues/58)) ([11aed29](https://github.com/JarX-Concepts/react-native-platform-components/commit/11aed2926c2d8d309d0941851652abe7468a0d92))
* **button:** add maxFontSizeMultiplier ([#43](https://github.com/JarX-Concepts/react-native-platform-components/issues/43)) ([d072a98](https://github.com/JarX-Concepts/react-native-platform-components/commit/d072a988826499c654bf6f675172516e766f3e2b))
* **button:** toggle, menu, clear glass, symbol effects and top / bottom icons ([672ea40](https://github.com/JarX-Concepts/react-native-platform-components/commit/672ea4059cb6dbc9f03ad78972097e8567ebd726))
* **context-menu:** play the Android long-press haptic when the menu opens ([020f09c](https://github.com/JarX-Concepts/react-native-platform-components/commit/020f09c62e6864400f50a97c9f951aba1d9f3c1e))
* **context-menu:** sections, image icons, keepsMenuPresented and preview press ([c8d7edf](https://github.com/JarX-Concepts/react-native-platform-components/commit/c8d7edfa5639ec4a0ed40397ae22c283896b0ce9))
* cover the new TextField, Button and SegmentedControl props in the jest mock ([6012b2f](https://github.com/JarX-Concepts/react-native-platform-components/commit/6012b2f685c12ad7cd2579322cb23cb9359b61b6))
* **date-picker:** a range picker, Android text input, is24Hour and iOS yearAndMonth ([458541f](https://github.com/JarX-Concepts/react-native-platform-components/commit/458541f339befa6f8ad7ab9b3af82e52b3a14360))
* **example:** haptics in the Button, ContextMenu, SegmentedControl, TabBar and SelectionMenu demos ([e28f4b8](https://github.com/JarX-Concepts/react-native-platform-components/commit/e28f4b88761e1009cf286edef9a9c74af61249a1))
* **example:** haptics on the FAB, NavigationRail and SplitButton demos, per-action warnings ([1fca465](https://github.com/JarX-Concepts/react-native-platform-components/commit/1fca4651d6bb10d47321814784c586214ab8af3a))
* **floating-toolbar:** link a ScrollView for edge effect and hide on scroll ([d2bcaef](https://github.com/JarX-Concepts/react-native-platform-components/commit/d2bcaef33fd8531dd1354f14681bfff2bdd3f9db))
* **haptics:** add a shared haptics prop to the interactive components ([672997a](https://github.com/JarX-Concepts/react-native-platform-components/commit/672997a7f057496ff3390b43f9d494c77141b77c))
* **haptics:** add the prop to FloatingActionButton, NavigationRail and SplitButton ([8ced35e](https://github.com/JarX-Concepts/react-native-platform-components/commit/8ced35ed51779c2aa6c0849221b1e4982e34f493))
* **haptics:** play on menu picks, with a per-action override ([3fb4133](https://github.com/JarX-Concepts/react-native-platform-components/commit/3fb41339459afd4fe723907493f2d420e0304657))
* **ios:** resolve icon names from the asset catalog after SF Symbols ([425db0d](https://github.com/JarX-Concepts/react-native-platform-components/commit/425db0d3ec345f3dfd7853b1a701fd6df63c7e64)), closes [#54](https://github.com/JarX-Concepts/react-native-platform-components/issues/54)
* **liquid-glass:** add LiquidGlassContainer and cornerStyle ([a40be0e](https://github.com/JarX-Concepts/react-native-platform-components/commit/a40be0ee4fdd8ce680a97843b055d3a37364019f))
* mock TabBar in the jest mock ([8dfe152](https://github.com/JarX-Concepts/react-native-platform-components/commit/8dfe152092dc2b073be5c6c5c99a4282b37cb9bc))
* **segmented-control:** per-segment testID and maxFontSizeMultiplier ([e19f910](https://github.com/JarX-Concepts/react-native-platform-components/commit/e19f9107335b1712472fd759ba6389a5fe2b2468)), closes [#40](https://github.com/JarX-Concepts/react-native-platform-components/issues/40) [#43](https://github.com/JarX-Concepts/react-native-platform-components/issues/43) [#53](https://github.com/JarX-Concepts/react-native-platform-components/issues/53) [#40](https://github.com/JarX-Concepts/react-native-platform-components/issues/40)
* **selection-menu:** system menu in modal mode, rich options and searchable dropdown ([70a7904](https://github.com/JarX-Concepts/react-native-platform-components/commit/70a79049192890f45561e732b066f851b35865c6))
* ship an official jest mock ([76d13ff](https://github.com/JarX-Concepts/react-native-platform-components/commit/76d13ff96d941f9c7af6bd8598d3873eb2bd1265)), closes [#56](https://github.com/JarX-Concepts/react-native-platform-components/issues/56)
* **tab-bar:** active indicator options and horizontal tabs on Android ([bc822e2](https://github.com/JarX-Concepts/react-native-platform-components/commit/bc822e253b1d7616f2aedf96a9a1d2a6a5e907e2))
* **tab-bar:** bottom accessory ([42f2ac4](https://github.com/JarX-Concepts/react-native-platform-components/commit/42f2ac4a4fb2e31164b1d8be706084fc8f277a02))
* **tab-bar:** minimize on scroll, and keep the bar's height when stretched ([06af2d0](https://github.com/JarX-Concepts/react-native-platform-components/commit/06af2d0ad975492a99d319b94deb4380f7597514))
* **tab-bar:** search tab and system items ([7ac4e38](https://github.com/JarX-Concepts/react-native-platform-components/commit/7ac4e380ac5783f4e4d0b417531eb4496c76d924))
* **text-field:** submitBehavior, selection, iOS keyboard toolbar and password rules ([9ff1ab5](https://github.com/JarX-Concepts/react-native-platform-components/commit/9ff1ab58490722e33bb4cef3cae72c3fcd9f2637))
* **text-field:** test ids, colors, read-only press, alignment, line bounds ([073070b](https://github.com/JarX-Concepts/react-native-platform-components/commit/073070befda663b1eb3b42127a4dab525922b0a3)), closes [#39](https://github.com/JarX-Concepts/react-native-platform-components/issues/39) [#41](https://github.com/JarX-Concepts/react-native-platform-components/issues/41) [#42](https://github.com/JarX-Concepts/react-native-platform-components/issues/42) [#43](https://github.com/JarX-Concepts/react-native-platform-components/issues/43) [#44](https://github.com/JarX-Concepts/react-native-platform-components/issues/44) [#45](https://github.com/JarX-Concepts/react-native-platform-components/issues/45) [#46](https://github.com/JarX-Concepts/react-native-platform-components/issues/46) [#47](https://github.com/JarX-Concepts/react-native-platform-components/issues/47) [#48](https://github.com/JarX-Concepts/react-native-platform-components/issues/48) [#49](https://github.com/JarX-Concepts/react-native-platform-components/issues/49) [#39](https://github.com/JarX-Concepts/react-native-platform-components/issues/39) [#41](https://github.com/JarX-Concepts/react-native-platform-components/issues/41) [#42](https://github.com/JarX-Concepts/react-native-platform-components/issues/42) [#44](https://github.com/JarX-Concepts/react-native-platform-components/issues/44) [#45](https://github.com/JarX-Concepts/react-native-platform-components/issues/45) [#46](https://github.com/JarX-Concepts/react-native-platform-components/issues/46) [#47](https://github.com/JarX-Concepts/react-native-platform-components/issues/47) [#48](https://github.com/JarX-Concepts/react-native-platform-components/issues/48) [#49](https://github.com/JarX-Concepts/react-native-platform-components/issues/49)
* **web:** render the browser's own controls on react-native-web ([a12c8ca](https://github.com/JarX-Concepts/react-native-platform-components/commit/a12c8ca91cb5c42203b1d4caa818d067e8b5c445))

# [1.4.0](https://github.com/JarX-Concepts/react-native-platform-components/compare/v1.3.0...v1.4.0) (2026-09-23)

### Features

* add Material 3 Expressive Button, ButtonGroup and FloatingToolbar ([8df86cd](https://github.com/JarX-Concepts/react-native-platform-components/commit/8df86cd38434ca5661988e986013544334e1ce10))
* add README GIFs and Detox flows for Button and FloatingToolbar ([44a1bfd](https://github.com/JarX-Concepts/react-native-platform-components/commit/44a1bfde4c96630cb05811c20e648b296ca5bda4))
* add TextField, a native text field on both platforms ([f2ccb1b](https://github.com/JarX-Concepts/react-native-platform-components/commit/f2ccb1b503837a19ddaa5411bf935cf6edea0fa5))
* **android:** material style for SegmentedControl, Button and ButtonGroup, and a README showreel ([d176ebb](https://github.com/JarX-Concepts/react-native-platform-components/commit/d176ebbdea3a15d21bc3ad3d6045107fa0c9b005))
* **example:** a view switcher in the FloatingToolbar demo, docs and GIFs ([b2b29c1](https://github.com/JarX-Concepts/react-native-platform-components/commit/b2b29c12e80a444a7daad3f11655a1b140f04d94))
* put TextField first, sharper GIFs, codegen floor fix ([5e1f48f](https://github.com/JarX-Concepts/react-native-platform-components/commit/5e1f48f3e0ac7913291760d43c51da0580e149e5))

# [1.3.0](https://github.com/JarX-Concepts/react-native-platform-components/compare/v1.2.0...v1.3.0) (2026-09-22)

### Bug Fixes

* **expo:** resolve the config plugin by bare package name ([c1c51fc](https://github.com/JarX-Concepts/react-native-platform-components/commit/c1c51fcf2300511983a5ed8623b1672fe2eb8442))
* verify the supported floor in CI, and make the native code portable to 0.76 ([1504f05](https://github.com/JarX-Concepts/react-native-platform-components/commit/1504f0539e2297a9860804f0b4f699a6d75eb4e8))

### Features

* **ios:** build without Xcode 26, falling back for Liquid Glass ([2d41c2d](https://github.com/JarX-Concepts/react-native-platform-components/commit/2d41c2d16dba8d49c4d47e13025daa1caf7a58da)), closes [#if](https://github.com/JarX-Concepts/react-native-platform-components/issues/if) [#31](https://github.com/JarX-Concepts/react-native-platform-components/issues/31)

# [1.2.0](https://github.com/JarX-Concepts/react-native-platform-components/compare/v1.1.0...v1.2.0) (2026-09-16)

### Bug Fixes

* **android:** keep SegmentedControl taps from reaching unrelated React views ([ead70c7](https://github.com/JarX-Concepts/react-native-platform-components/commit/ead70c7f4bfd91c0bdf2739304c30f63881e0184))

### Features

* sync the brand color and light/dark mode to native components from JS ([529915d](https://github.com/JarX-Concepts/react-native-platform-components/commit/529915d3d89fb9aa41e5c6076ba9571ef35a6fb8))

# [1.1.0](https://github.com/JarX-Concepts/react-native-platform-components/compare/v1.0.0...v1.1.0) (2026-09-16)

# [1.0.0](https://github.com/JarX-Concepts/react-native-platform-components/compare/v0.9.0...v1.0.0) (2026-09-16)

### Bug Fixes

* **android:** fall back to Material 3 defaults instead of crashing without a Material theme ([990ec6a](https://github.com/JarX-Concepts/react-native-platform-components/commit/990ec6ab1f9ee21fedce096ab8d40df8c816ad96))
* **expo:** implement the android.theme config plugin option ([5801c0a](https://github.com/JarX-Concepts/react-native-platform-components/commit/5801c0a9288a0406f50a508e7bf4e393c181fc63))

Entries are generated from conventional commits by release-it on each release. Releases before this file existed are documented on the [GitHub releases page](https://github.com/JarX-Concepts/react-native-platform-components/releases).

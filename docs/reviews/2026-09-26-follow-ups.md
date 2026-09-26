# Review follow-ups — 26 September 2026

Follow-up work to [the package review](./2026-09-25.md), starting from main
`7c5a7bf`, on `feat/review-follow-ups`.

## Agreed scope

The implementation work covers native improvements and an optional, typed web
adapter provider. Consumers can connect their own web implementations while
keeping this package's component imports and props. A brief README section links
to the full setup guide. Changes to built-in web controls, web menus, web icons
and broad browser test infrastructure are deferred. Existing web fallbacks remain in place;
SelectionMenu only forwards the new shared `disabled` option to its existing HTML
controls so those fallbacks do not allow an unavailable choice.

## Work and validation

- [x] Refresh compatible development dependencies and record remaining advisory paths.
- [x] Support disabled SelectionMenu options on iOS and Android.
- [x] Add native image request options.
- [x] Warn in development about empty or duplicate selection identifiers.
- [x] Add the web adapter provider with ref, nesting, SSR and browser checks.
- [x] Update component, contributor and limitation documentation.
- [x] Validate affected behavior, package/build tools and native platforms locally.
- [ ] Review, commit, push and merge only after full CI succeeds; verify main afterward.

No npm release is part of this work. Delivery remains conditional on the PR's
full CI, followed by the resulting main commit and documentation deployment.

### Validation receipts

- Jest: 344 tests across 25 suites, including provider nesting, replacement,
  callbacks, field refs, native passthrough and separate server renders.
- Library, bare example and Expo example types; repository lint; package/plugin
  and documentation builds; packed provider exports all pass locally.
- Published web declarations pass positive and negative consumer checks under
  bundler and NodeNext resolution. CI now runs that check after package build.
  Restoring the faulty declarations in a temporary copy makes NodeNext fail.
- A real browser exercised registrations, nested overrides, existing fallbacks,
  controlled inputs, imperative focus/selection, and keyboard activation. Actual
  hydration and a broad browser compatibility matrix remain outside this change.
- iOS regression flows passed across the full run and focused reruns. Image
  assertions inspect rendered pixels, including cached/remounted account icons;
  menu tests verify reload/no-store images, stable request counts and a delayed
  old account response. Native Release builds pass on both platforms.
- Android native coverage adds disabled embedded, filtered and modal selections,
  runtime re-enabling, repeated controlled rejections and HTTP image/cache checks.
  The prior 18-case suite and the four affected cases after final changes passed;
  the complete CI suite now contains 19 cases.
- Android Detox's corrected disabled-option and image-pixel checks both pass;
  the unchanged regression flows passed in the preceding full run. The final
  focused run recovered from a graphics-path watchdog stall, so it establishes
  behavior rather than providing clean performance evidence.

Independent review caught and corrected inferred web declarations that lost prop
checking under NodeNext, and an iOS menu rebuild loop for reload/no-store images.
The latter now retains only each menu owner's current images and ignores stale
completions. Disabled-option UI tests inspect the actual platform row or
accessibility trait, not a child label whose enabled flag has different semantics.

## Web integration

Keep iOS and Android as the core scope. The optional, typed web adapter provider
lets applications supply components while retaining this package's imports and
public props. A consumer can adapt its existing web design system without
branching every screen by platform. Registrations retain field refs and have
explicit compound-component, fallback and server-rendering behavior.

If built-in web controls are expanded later, start with native browser text, date
and selection controls. Leave custom menus, navigation and platform effects to
consumer adapters, and document unsupported props explicitly.

The registration API (see the [full setup guide](../docs/guides/web.md)):

```tsx
// Register once in the application's web entry point.
<PlatformComponentsProvider
  web={{
    TextField: AppWebTextField,
    SelectionMenu: AppWebSelect,
    ContextMenu: AppWebContextMenu,
  }}
>
  <App />
</PlatformComponentsProvider>
```

Screens would continue importing the same components with the same props.
Adapters translate to the consumer's web library, preserve callbacks and field
ref methods, and document any unsupported platform-specific behavior. Unregistered
components retain the existing fallbacks. Registration belongs in a web entry
point so consumer DOM dependencies do not enter native bundles. Use React context
for tree-scoped registrations rather than a mutable global registry, including
tests for separate roots and server rendering. See the
[React context reference](https://react.dev/reference/react/createContext).

## Development dependency triage

Compatible re-resolution reduced the initial 116 audit entries to nine. A scoped
workspace resolution to `serialize-javascript@^7.1.2` fixes the remaining high
serialization advisory in the documentation build tools (`copy-webpack-plugin`
and `css-minimizer-webpack-plugin`). This keeps their CommonJS serialization API;
Node 20 or newer is already required by these workspaces. The resolution is only
for this repository's toolchain and is not a consumer runtime dependency.

The subsequent workspace audit reports seven moderate entries, no high or
critical entries. Five are deprecation/support notices: ESLint 9, glob 10,
inflight, rimraf 2 and whatwg-encoding. Upgrade their owning tools when compatible
upstream versions are available rather than forcing incompatible transitive APIs.

The other two advisory paths were inspected in installed sources:

- `detox@20.51.4 → stream-json@1.9.1`: Detox imports `jsonl/Parser` for its own
  local log stream. It does not import the pick/ignore/filter/replace modules
  described by [GHSA-528h-pc64-c93x](https://github.com/advisories/GHSA-528h-pc64-c93x).
- `xcode@3.0.1 → uuid@7.0.3` and `sockjs@0.3.24 → uuid@8.3.2`: both callers use
  `v4()` with no caller-provided buffer. The reported bounds issue affects
  v3/v5/v6 buffer writes in
  [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq).

No affected calls were found on those inspected paths. This is a reachability
assessment, not a claim that the older dependencies are fully maintained or
free of other issues. Keep the upstream replacements on the release checklist.

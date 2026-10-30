# Dependency audit

Checked on **2026-10-30** with Node **24.21.0** and npm **11.19.0**. The backend was installed with
`npm ci` from the inspected QS patch lock; the frontend retains its unchanged lock and installed baseline.

| Installed audit | Production (`--omit=dev`) | Full development graph |
| --- | --- | --- |
| Backend | 0 findings, exit 0 | 2 Moderate, exit 1 |
| Frontend | 5 High package entries (Vue I18n family), exit 1 | 6 High + 5 Moderate, exit 1 |

The backend production audit is clear, but the **frontend production High gate fails** on newly indexed Vue I18n
advisories. The dated development exceptions below, including **Happy DOM host-code execution** and a newly indexed
SSRF advisory, remain open. **Overall security/launch readiness is on hold.** Package-entry counts from
`npm audit` differ from GitHub alert counts and include affected parents such as `vitest`.

## JWT migration (4B.1)

The backend now uses exact **jose 6.2.12** (published 2026-09-05T09:17:12.608Z) and **ms 2.1.3**
(2020-12-08T13:54:35.223Z). Both have no own dependencies. Exact-version global advisory queries on 2026-10-27
returned no applicable advisories. The newer jose 6.2.13 is excluded by the age policy until 2026-11-03T06:21:48.616Z.
The direct ms dependency preserves the existing expiration language; see [decision 0007](decisions/0007-jose-session-tokens.md).

The three new resolved paths are jose 6.2.12, root ms 2.1.3 and debug's relocated ms 2.0.0 (published 2017-05-16T12:26:06.610Z).
Each passed the 336-hour age and registry integrity/tarball checks before installation. Redundant nested ms 2.1.3
copies were deduplicated. Removing jsonwebtoken/jws removes twelve package nodes in total; semver 7.8.5
keeps its bytes/version and becomes development-only after its last runtime consumer is removed. Native/optional
packages and the frontend graph remain unchanged. No Node 26 support is claimed.

## Check and update policy

```bash
# Run separately in backend/ and frontend/ with Node 24.21.0.
npm ci
npm ls --all
npm audit --omit=dev --json
npm audit --omit=dev --audit-level=high
npm audit --json
```

- Fix within the existing major and parent range. An existing direct range gets a corrected lower bound; a new
  direct dependency must use an exact version. Do not use `npm audit fix --force` or add a transitive override.
- Every newly resolved direct **and transitive** package must be at least **336 hours** old before installation,
  following [decision 0004](decisions/0004-dependency-and-ci-policy.md). Use a precise `--before=<UTC cutoff>` when
  resolving a targeted update, inspect every changed lock node against registry publication time and integrity,
  then install the resulting exact locks with `npm ci`.
- Review remaining findings on the dates below. Limited reachability is a static assessment, not proof that a
  vulnerable package is safe. No test, build, CI, retry, worker or performance-budget setting changes in 4A.

## Mature patches in 4A

| Package and path | Before → selected | npm publication (UTC) |
| --- | --- | --- |
| Backend runtime: `express-rate-limit` → `ip-address` | 10.7.3 → **10.7.4** | 2026-10-11 19:34:42.622 |
| Backend development: `mongodb-memory-server-core` → `follow-redirects` | 1.16.0 → **1.16.1** | 2026-10-01 13:52:31.780 |
| Backend development: `vitest` → `vite` | 8.3.1 → **8.3.3** | 2026-10-06 04:10:19.326 |
| Frontend development: direct `vite`, also used by Vitest | 6.4.3 → **6.4.4**, floor `^6.4.4` | 2026-10-06 05:49:07.089 |
| Frontend development: exact `happy-dom` | 20.14.5 → **20.14.6** | 2026-10-08 23:18:02.688 |

Publication evidence comes from each package's `https://registry.npmjs.org/<package>` metadata, `time[version]`.
All five changed nodes passed the age/integrity checks; no additional package nodes changed. The native/optional
subtrees and the complete Vitest **4.1.11** family remain unchanged. Backend Vite's `rolldown ~1.2.11` is satisfied
by the already locked 1.2.11; the two package roots retain their separate toolchains.

The exact `ip-address` gate was **2026-10-25T19:34:42.622Z**. The resolver ran only after a recorded guard at
**2026-10-26T19:15:15.427Z**, when 10.7.4 was **359.6758 hours** old. This fixes
[GHSA-rxp7-6hxx-x8q5](https://github.com/advisories/GHSA-rxp7-6hxx-x8q5). The parent stays at `express-rate-limit`
8.7.0. A new isolated, trusted-loopback proxy harness exercises the real limiter and parser: IPv6 addresses
within one `/56` share the failure limit, the adjacent `/56` stays independent, and blocking returns 429 with
consistent `Retry-After`. Existing full-API integration checks still cover failed-login limits and logout.
Production proxy settings are unchanged. The process-local `MemoryStore` still forgets counts on restart and
does not coordinate multiple API processes.

`follow-redirects` 1.16.1 addresses
[custom sensitive headers](https://github.com/advisories/GHSA-8r9p-f939-6h3c) and
[array-form header stripping](https://github.com/advisories/GHSA-q3jh-wrc6-jgq8) in the development MongoDB downloader.
The [Vite 8.3.3](https://github.com/vitejs/vite/blob/v8.3.3/packages/vite/CHANGELOG.md) and
[Vite 6.4.4](https://github.com/vitejs/vite/blob/v6.4.4/packages/vite/CHANGELOG.md) patches include editor-launching
and file-serving fixes. A standalone `launch-editor` override would not replace Vite's bundled implementation.

[Happy DOM 20.14.6](https://github.com/capricorn86/happy-dom/releases/tag/v20.14.6) repairs cookie-scope validation.
It **does not fix** the RCE exception below, and that High remains in the full frontend audit.

## Runtime qs patch (QS-155)

The local backend lock now resolves **qs 6.16.1**, fixing Moderate
[GHSA-6pq8-jhm2-2vcw](https://github.com/advisories/GHSA-6pq8-jhm2-2vcw).
Only `version`, `resolved` and `integrity` of the single `node_modules/qs` lock node changed. Express/body-parser
and Superagent's existing ranges accept the patch; every other package node, both manifests and the frontend
lock retain their bytes/structure. No direct dependency or override was added.

The npm publication was **2026-10-14T22:06:17.002Z**, making the minimum resolver/install time
**2026-10-28T22:06:17.002Z**. The execution guard ran at **2026-10-30T12:16:03.528Z** (374.1629 hours old);
the selective resolver used cutoff **2026-10-16T12:16:03.528Z**. Registry tarball/integrity and the one changed
resolved tuple passed inspection before `npm ci`. The exact-version global advisory query was empty.

Five real-library coercion regressions failed with TypeError on 6.16.0 and pass on 6.16.1; six controls retain
ordinary/callable-hook behavior and custom exception identity. Raw nested query/form rejection and valid form
login characterization remain green. The combined targeted suite passed **128/128**. This does not establish
an exploitable HTTP stringify sink: the application graph uses parse, while the regression targets the library
operation directly. Alert **#155 is still open on remote main** before publication and is not suppressed.

## Newly indexed findings and release hold (2026-10-30)

Vue I18n **11.4.12** is in the affected range of High
[srcdoc sanitization bypass](https://github.com/advisories/GHSA-83rm-6c8r-g728) and Low
[mixed list/named escaping](https://github.com/advisories/GHSA-8rc2-428q-7ww3). npm propagates the High across five
production package entries; these are not five independent High advisories. The affected code is unchanged by QS.
The maintainer advisories describe HTML translation rendering with `escapeParameter`. The current application
does not enable that option or use `v-html`, and loads checked-in CS/EN messages. This is limited static
reachability evidence, not proof of safety or an accepted exception. **Production High remains a release blocker.**

The same-major fix **11.4.14** was published **2026-10-10T11:11:08.057Z** (eligible
**2026-10-24T11:11:08.057Z**). A separate Vue I18n family patch must inspect every changed transitive tuple,
integrity, applicable advisory and locale/rendering regression before installation. Newer 11.4.15/11.4.16 are
not automatically eligible. No frontend dependency has been changed in QS-155.

New Happy DOM [SSRF through iframe/stylesheet loading](https://github.com/advisories/GHSA-c8p4-j97h-3vg8), High,
affects **20.14.6** even when JavaScript evaluation is disabled. It requires parsing attacker-controlled HTML;
the current tests use local fixtures, but that is not a sandbox guarantee. Its first fixed major **21.0.0**
does not address the separate host-code execution finding; retain the planned **21.0.4** major review and its
**2026-11-03T18:05:53.295Z** age gate rather than installing an incomplete fix.

The frontend full audit also newly reports Moderate [Vite fs.deny query bypass](https://github.com/advisories/GHSA-8g5g-mxqh-grgj)
for **6.4.4**. Record this separately for a reviewed, age-gated tooling patch; do not fold it into the backend qs change.

## Development exceptions and dated follow-ups

| Finding / GitHub alert IDs | Installed path and assessment | Fixed version, eligibility and review |
| --- | --- | --- |
| `@vitest/mocker`: [redirect traversal](https://github.com/advisories/GHSA-xp26-3454-mjgp), [module injection](https://github.com/advisories/GHSA-qxg6-89mg-rqv8); backend #139/#140, frontend #147/#148 | Both roots use `vitest 4.1.11 → @vitest/mocker 4.1.11`. Tests use Node/happy-dom; browser mode and direct mocker/interceptor plugins are not configured. This reduces current reachability, not the package flaw. | Update the entire **4.1.12** family in follow-up **4A.1**. Latest family publication: 2026-10-15T14:51:24.991Z; eligible **2026-10-29T14:51:24.991Z**. Review **2026-10-30**. |
| `fast-uri`: [URI interpretation](https://github.com/advisories/GHSA-wjr9-j795-jxcr), [equivalence](https://github.com/advisories/GHSA-w74x-v6f9-j3xg), [related parsing](https://github.com/advisories/GHSA-333x-w4r6-6crp), [normalization](https://github.com/advisories/GHSA-xhq7-xmqj-769h); frontend #149–#152 | `eslint 7 → table 6.9.0 → Ajv 8.20.0 → fast-uri 3.1.8`. Used by lint tooling; no application request path using this URI parser was found. | Same-major **3.1.9**, follow-up **4A.1**. Published 2026-10-19T23:05:26.357Z; eligible **2026-11-02T23:05:26.357Z**. Review **2026-11-03**. |
| `postcss-selector-parser`: [quadratic flat-selector parsing](https://github.com/postcss/postcss-selector-parser/security/advisories/GHSA-rj75-hqrm-r3gf); former frontend #128 | `eslint-plugin-vue 8.7.1 → 6.1.4`. The consumer rule reads selectors from lint options; `component-tags-order` is not enabled by the project's `vue3-essential` configuration. The installed package remains affected and is still reported by npm. | An official in-major backport **6.1.5 exists**. Published 2026-10-19T15:02:08.894Z; eligible **2026-11-02T15:02:08.894Z**. Review **2026-11-03**, follow-up **4A.1**. No major migration or downgrade is required. |
| Happy DOM [host-code execution](https://github.com/advisories/GHSA-834v-8h66-3h79), High; frontend #153 | `happy-dom 20.14.6` is the Vitest DOM environment. Its installed default `enableJavaScriptEvaluation` is false; Vitest changes error capture, not that setting. Exploitation requires JavaScript evaluation plus attacker-controlled HTML/module input. This is limited static reachability, not a sandbox guarantee. | **21.0.4** requires a separately planned major change, **4A.2**. Published 2026-10-20T18:05:53.295Z; eligible **2026-11-03T18:05:53.295Z**. Review **2026-11-04**. High remains explicitly accepted for this maintenance scope until that review. |

## Remote alerts and historical provenance

The **2026-10-30** remote snapshot still has **11 open alerts: 1 High / 8 Medium / 2 Low**, ten development and runtime qs #155.
The new npm findings above have not appeared in this remote snapshot; scanner lag does not clear them.
4A is merged; its fourteen fixed alert instances are historical results, not fixes from this JWT migration.
Selector-parser's current alert is #154; former #128 remains withdrawn without a package fix.

The earlier snapshot on **2026-10-26** contained **23 open alerts: 5 High / 14 Medium / 4 Low**, with
22 development and one runtime alert. At that time remote still described pre-4A `main`; local lock/audit results did not
close remote alerts before push/merge. Fourteen of those open alert instances matched the locally patched Vite,
downloader and IP-parser nodes. Nine of its open instances matched the remaining mocker/fast-uri/Happy DOM
exceptions in that historical snapshot; this was a local range assessment before release.

The 2026-10-25 planning snapshot had 24 alerts. On 2026-10-26, fetching #128 returns HTTP 410, "Alert number 128
has been withdrawn". The global advisory itself has `withdrawn_at: null`; its update at
2026-10-26T14:07:57Z now correctly lists both `<6.1.5` and `>=7.0.0 <7.1.6`, matching the maintainer's backport.
The installed 6.1.4 did not change. Keep the selector-parser exception and review date even though that old remote
alert is no longer open. Its disappearance is **not a 4A code fix**.

Two older exceptions no longer appear in current audits because their advisories were withdrawn:

- `braces` **3.0.3**, backend `nodemon → chokidar 3 → braces`:
  [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), withdrawn
  **2026-10-23T12:53:02Z**.
- `sprintf-js` **1.0.3**, frontend `eslint → @eslint/eslintrc → js-yaml 3 → argparse 1 → sprintf-js`:
  [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c), withdrawn
  **2026-10-22T19:21:04Z**.

Both package versions are unchanged in 4A. Withdrawal is advisory history, not an upgrade or a newly proven
absence of all possible defects. The former 2027-01-15 blanket review date is superseded by the specific dates
above for active exceptions.

Earlier work already replaced bcrypt 5.1.1 with **6.0.0**, removing the `node-pre-gyp → tar 6` download chain and
using packaged native binaries on supported platforms. The password API/hash format and the legacy bcrypt-5-hash
sign-in regression remain; 4A does not repeat that major migration. Likewise, `express-rate-limit 8.7.0` was added
on 2026-10-18 when 8.7.1 was too young; its compatible transitive IP-parser patch is the runtime change here.

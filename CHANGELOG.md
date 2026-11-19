# [2.0.0](https://github.com/akadenia/AkadeniaAPI/compare/1.6.5...2.0.0) (2026-11-19)


### Features

* **api:** drop axios and AxiosApiClient ([#110](https://github.com/akadenia/AkadeniaAPI/issues/110)) ([fc8aa6b](https://github.com/akadenia/AkadeniaAPI/commit/fc8aa6bec60acbbc50d6ff1b5de27cb7d810287b))


### BREAKING CHANGES

* **api:** AxiosApiClient and the AxiosError type export are removed.
Use UndiciApiClient instead; see "Migrating from AxiosApiClient" in the
README for the differences.

* fix(api): tighten UndiciApiClient retries, timeouts and query handling

- Only retry 429/5xx responses for idempotent methods, so POST and PATCH
  aren't repeated after the server may have acted on them
- Apply the per-request timeout to undici's headers and body timeouts, so
  it can be longer than the client timeout
- Append the query option to paths that already have a query string
  instead of failing
- Report aborts with a custom reason as network errors
- Parse +json content types such as application/problem+json
- Remove the unused config and request fields from the success response type
- Remove the duplicate License section from the README

* fix(api): return an error response when the query or body can't be serialized

Serialization ran before the try, so a lone surrogate in the query (or a
BigInt or circular body) rejected the promise and left the timeout and
the abort listener on the caller's signal behind.

* fix(api): merge query ahead of a fragment, stop retrying timeouts, tighten JSON detection

- Merge the query option into paths that contain a fragment, inserting it before the #.
- Classify query and body serialization failures before the abort state, so an
  already-aborted signal no longer reports them as network errors.
- Drop UND_ERR_HEADERS_TIMEOUT and UND_ERR_BODY_TIMEOUT from the retryable codes;
  the abort timer is what fires, and timeouts are not retried.
- Only parse application/json and +json types, not application/json-seq.
- Cover connection-error retries for POST and PATCH, and no retries on timeout.

* docs(readme): correct retry, redirect and query encoding notes in the 2.0 migration guide

## [1.6.5](https://github.com/akadenia/AkadeniaAPI/compare/1.6.4...1.6.5) (2026-07-21)


### Bug Fixes

* resolve JS-YAML DoS vulnerability in AkadeniaAPI ([#95](https://github.com/akadenia/AkadeniaAPI/issues/95)) ([e08cfe0](https://github.com/akadenia/AkadeniaAPI/commit/e08cfe0b904e97cfa5eec93a2316f0465a2ad485)), closes [#86](https://github.com/akadenia/AkadeniaAPI/issues/86)

## [1.6.4](https://github.com/akadenia/AkadeniaAPI/compare/1.6.3...1.6.4) (2026-07-21)


### Bug Fixes

* **ci:** consolidate release PR creation into commit-release-assets.sh ([#100](https://github.com/akadenia/AkadeniaAPI/issues/100)) ([b0becb8](https://github.com/akadenia/AkadeniaAPI/commit/b0becb84f9215f5dbd3af8e0fe4332f041ccda17))

## [1.6.3](https://github.com/akadenia/AkadeniaAPI/compare/1.6.2...1.6.3) (2026-07-20)


### Bug Fixes

* **deps:** resolve js-yaml security vulnerability via pnpm override ([#97](https://github.com/akadenia/AkadeniaAPI/issues/97)) ([89d555f](https://github.com/akadenia/AkadeniaAPI/commit/89d555f3521552f56b2fb6226c699e8b6a20b96e))

## [1.6.2](https://github.com/akadenia/AkadeniaAPI/compare/1.6.1...1.6.2) (2026-06-26)


### Bug Fixes

* switch to pnpm, keep node 22, add node 26 to ci matrix ([#93](https://github.com/akadenia/AkadeniaAPI/issues/93)) ([167a038](https://github.com/akadenia/AkadeniaAPI/commit/167a0382600a8cd984403b49dc265a721aeb337e))

## [1.6.1](https://github.com/akadenia/AkadeniaAPI/compare/1.6.0...1.6.1) (2026-06-25)


### Bug Fixes

* **ci:** use GH_TOKEN for release asset push in commit-release-assets.sh ([#91](https://github.com/akadenia/AkadeniaAPI/issues/91)) ([b89b5d9](https://github.com/akadenia/AkadeniaAPI/commit/b89b5d96d8e003adebbf438d74241a4d4aefaab2))

# [1.1.0](https://github.com/akadenia/AkadeniaApi/compare/v1.0.1...1.1.0) (2024-08-19)


### Features

* **axios-client:** update axios api client class constructor to accept options object ([#18](https://github.com/akadenia/AkadeniaApi/issues/18)) ([93c3246](https://github.com/akadenia/AkadeniaApi/commit/93c3246fd678e439267db2acaeb61ec06d89d7b0))

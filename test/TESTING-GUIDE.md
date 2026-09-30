# Developer testing guide

## 1. Install dependencies

Use Node.js 22 or later. Run all commands below from the repository root:

```bash
npm ci --prefix package
```

The suite runs the actual CLI against Vansah. Uploads and single-result tests create real test runs. Results remain in Vansah after testing.

## 2. Fill out `.env`

Create or update `.env` in the repository root, alongside `test/` and `package/`. Keep your existing `VANSAH_TOKEN` entry; its value is deliberately omitted here. Keep `.env` out of Git.

For a new checkout, copy [`.env.example`](../.env.example) to `.env`, then fill in your credentials and check the workspace settings. If `.env` already exists, merge any missing settings instead of overwriting it.

```bash
cp -n .env.example .env
```

The current test workspace uses these settings:

```dotenv
VANSAH_URL=https://prodsgp.vansah.com
VANSAH_PROJECT_KEY=NEW2
VANSAH_MODE=stp

VANSAH_TEST_CASE_KEY=NEW2-C2
VANSAH_JIRA_ISSUE_KEY=NEW2-1
VANSAH_FOLDER_PATH="cucumber import testing/"
VANSAH_STP_KEY=NEW2-P3
VANSAH_ATP_KEY=NEW2-P4
VANSAH_ITERATION=3

VANSAH_ENVIRONMENT_NAME=SYS
VANSAH_SPRINT_NAME="NEW2 Sprint 1"
VANSAH_RELEASE_NAME=cucumber-itr

VANSAH_CUCUMBER_REPORT=./test/fixtures/cucumber.json
VANSAH_TESTNG_REPORT=./test/fixtures/testng-report.xml
```

- `NEW2` is the project/space used for these tests. Use the API URL belonging to your workspace.
- Confirm the case, issue, folder, and both plans exist and are accessible in that project.
- Confirm iteration `3` exists in **both** plans. Both Cucumber and single-result plan tests use this value; they do not create iterations. Single-result tests also check the default iteration 1, which must exist in both plans.
- Confirm the report's cases are available in the selected plans and the issue/folder context supports those cases. ATP uploads use `NEW2-1` as context.
- Confirm the environment, sprint, and release names match your workspace.
- Report paths can be absolute or relative to the repository root. The files must already exist.
- Shell/CI variables override `.env` in the test harness. Remove stale exported values when switching projects.
- To use a different environment file, set `VANSAH_TEST_ENV_FILE`; relative paths resolve from the repository root.

## 3. Prepare the Cucumber report

Use [fixtures/cucumber.json](fixtures/cucumber.json), or point `VANSAH_CUCUMBER_REPORT` to your own Cucumber JSON report. The harness uploads the file unchanged; it does not generate a replacement.

The current report contains:

| Case tag | Recorded scenario result |
| --- | --- |
| `@NEW2-C2` | Passed |
| `@NEW2-C3` | Failed; a later step is skipped |
| `@NEW2-C4` | Passed |

When moving to another project:

1. Replace the scenario case tags with existing case keys from that project.
2. Check any other workspace-specific references in the report, including version tags and linked data.
3. Set the destination issue, folder, and plan keys in `.env`.
4. Preserve step results, errors, and attachments unless intentionally changing the test dataset.

For this dataset, a successful import must return **Imported 3, Failed 0, Skipped 0**. These are import counts: the failed scenario is still a successfully imported result. The harness derives the expected count from scenario elements in the file and excludes backgrounds.

## 4. Prepare the TestNG XML report

Use [fixtures/testng-report.xml](fixtures/testng-report.xml), or set `VANSAH_TESTNG_REPORT` to your existing report.

The current XML contains two results:

| Test method | Case | Issue | Result |
| --- | --- | --- | --- |
| `Addition_Test` | `NEW2-C2` | `NEW2-1` | `PASS` |
| `Subtraction_Test` | `NEW2-C3` | `NEW2-1` | `PASS` |

Both entries use sprint `NEW2 Sprint 1` and environment `SYS`. There is no C4 entry in this XML. Report totals remain `total="2"`, `passed="2"`, `failed="0"`, and `skipped="0"`.

When moving to another project:

1. Update `Case Key`, `Tested Issue`, `Tested Sprint`, and `Tested Environment` in each method's custom attributes.
2. Update the matching references in each method's `signature` attribute as well.
3. Preserve CDATA formatting, for example `<![CDATA[[NEW2-C2]]]>`.
4. Preserve the existing results and totals when only changing workspace references.
5. Update `VANSAH_PROJECT_KEY` in `.env`. The CLI sends it as the TestNG upload's `projectKey` multipart field.

Changing `.env` does not rewrite the XML's embedded case keys, issue, sprint, or environment. Update both places when changing the dataset.

## 5. Run the tests

Run both test files:

```bash
npm test --prefix package
```

Run one suite:

```bash
npm run test:functional --prefix package
npm run test:regression --prefix package
```

`npm run test:integration --prefix package` is an alias for the full suite.

| File | Coverage |
| --- | --- |
| [new-functionality.test.mjs](new-functionality.test.mjs) | Invalid iterations and result syntax, missing report files, configuration storage, new result statuses, Cucumber plan uploads, and single STP/ATP results with configured, inline, and default iterations; ATP issue/folder context and missing-context errors |
| [regression.test.mjs](regression.test.mjs) | Help/version, missing arguments and settings, original result statuses, issue/folder/STP single results, Cucumber and TestNG imports, plan selection, and malformed-report rejection |
| [support/harness.mjs](support/harness.mjs) | Loads `.env`, starts the actual CLI, and captures real HTTP responses for assertions; isolates configuration writes in a temporary home directory |

Run a specific flow:

```bash
# Cucumber report uploads to STP and ATP
node --test --test-name-pattern='Live Cucumber plan iterations' test/new-functionality.test.mjs

# Single STP/ATP results: iteration precedence and issue/folder context
node --test --test-name-pattern='Single-result plan validation|Live single-result STP' test/new-functionality.test.mjs

# Normal single results, including passed/failed, folder targets, and an STP result
node --test --test-name-pattern='Live single-result regression' test/regression.test.mjs

# The pass alias and in-progress statuses
node --test --test-name-pattern='Live platform acceptance' test/new-functionality.test.mjs

# TestNG report upload only
node --test --test-name-pattern='imports the explicitly configured TestNG report' test/regression.test.mjs
```

## 6. Check the results

- For a complete run, expect no failures and no skips. `SKIP` means a required setting is missing; that flow was not verified.
- Local invalid-input tests expect a nonzero CLI exit and an appropriate error before a request reaches the platform.
- Live success tests check the CLI exit code, actual HTTP response, and platform success indication. Cucumber tests also check all import counts.
- The checked-in `malformed.json` and `malformed.xml` files are intentionally invalid. Leave them unchanged; their tests expect a report-validation error, not an authentication error.
- Open the destination issue, folder, or plan in Vansah to inspect the recorded runs. The suite checks upload responses but does not perform a separate API read-back of stored results.
- Single-result tests submit several statuses for the same configured case. Do not expect its final visible status to match the Cucumber report after running the entire suite.

## 7. Resolve common failures

| Failure | What to check |
| --- | --- |
| `Iteration ... not found` | The configured iteration exists in the specific STP or ATP being tested. |
| `Please provide space information` | `VANSAH_PROJECT_KEY` is populated and you are running the current CLI code, which sends it for both report formats. |
| Missing report file | The configured path resolves from the repository root, not from `package/`. |
| Cucumber import count mismatch | All scenario tags refer to valid cases available in the selected target; inspect the platform's returned errors. |
| Authentication rejected | Workspace API URL and current authorization are correct. If Atlassian authorization changed, reconnect Vansah and retry. |
| CLI succeeds but the wrong destination was used | Check the explicit target flags and saved mode. An explicit `-a` overrides a saved plan mode; an explicit plan flag selects that plan. |

The harness uses `.env` plus shell overrides and isolates saved user settings. If reproducing a failure manually outside the harness, remember that the CLI also reads `~/.vansah-connect/.env`, which takes precedence over the project-local `.env`.

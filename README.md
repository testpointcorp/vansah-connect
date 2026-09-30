<div align="center">
  <a href="https://vansah.com"><img src="https://vansah.com/app/logo/vansahjira-logo.svg" alt="Vansah Test Management for Jira" /></a><br>
</div>

<p align="center">Vansah Connect brings automated test results into Vansah Test Management for Jira. Upload TestNG XML or Cucumber JSON reports, or log a single test-case result, from your terminal or CI/CD pipeline.</p>

<p align="center">
  <a href="https://vansah.com/"><b>Website</b></a> •
  <a href="https://vansah.com/connect-integrations/"><b>More Connect Integrations</b></a>
</p>

# Vansah Connect

`@vansah/vansah-connect` is a command-line tool that connects your test automation to Vansah. Run your tests with your existing framework, then use this CLI to upload the results and record test runs in Jira. The CLI does not execute your test suite.

Use it to:

- Upload TestNG XML and Cucumber JSON reports after automated tests finish.
- Log a result for an individual Vansah test case.
- Record results against Jira issues, test folders, or supported test plans.
- Select a test-plan iteration for Cucumber or single results and associate supported run properties.
- Automate reporting from GitHub Actions, Jenkins, GitLab CI, or another pipeline.

## Contents

- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Configuration](#configuration)
- [Usage](#usage)
- [CI/CD](#cicd)
- [Local development](#local-development)
- [Local testing](#local-testing)
- [Packaging and publishing](#packaging-and-publishing)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18 or newer and npm. Use Node.js 22 or newer for local development and repository tests.
- Vansah installed in your Jira workspace.
- A Vansah Connect token and your workspace's API Connect URL.
- Your Jira project/space key.
- Existing test cases and the issue, folder, or test plan where results will be recorded.
- For test-plan uploads, the selected iteration must already exist in the plan.

## Setup

Install the published CLI:

```bash
npm install --global @vansah/vansah-connect
vansah-connect --help
```

Configure your token, API URL, and Jira project key. Replace the example values with your own. If your token is already supplied through the `VANSAH_TOKEN` environment variable, saving it is optional.

```bash
vansah-connect -c "$VANSAH_TOKEN"
vansah-connect -v "https://prod.vansah.com"
vansah-connect -p DEMO
```

Use the API URL assigned to your Vansah workspace; the default is `https://prod.vansah.com`. Keep tokens out of version control. Examples below use placeholder keys such as `DEMO-C1` and `DEMO-9` that must exist in your project.

This README describes the code in this checkout. If a flag is unavailable in your installed release, follow [local development](#local-development) to run this version.

## Configuration

Settings load in this order, highest priority first:

1. Shell or CI environment variables.
2. Saved user settings in `~/.vansah-connect/.env`.
3. A `.env` file in the directory where you run the command.
4. Built-in defaults.

Standalone configuration commands write to the saved user file. Saved values override project `.env` values, including empty saved values. Settings are shared across projects for the same user. To remove a saved setting, delete its entry from that file.

```bash
vansah-connect --environment UAT
vansah-connect --sprint "Sprint 1"
vansah-connect --release "v1.2"
vansah-connect --mode stp --stp DEMO-P2
vansah-connect --itr 1
```

Run these save commands separately from uploads. Inline `--mode`, `--stp`, `--atp`, and `--itr` select a target for that invocation without saving it. Other configuration flags, such as `--environment`, do not override an upload inline; save them first or supply environment variables.

| Environment variable | Purpose |
| --- | --- |
| `VANSAH_TOKEN` | Vansah Connect token; required for API requests |
| `VANSAH_URL` | API base URL; defaults to `https://prod.vansah.com` |
| `VANSAH_PROJECT_KEY` | Jira project/space key; required when sending results |
| `VANSAH_ENVIRONMENT_NAME` | Environment for Cucumber and single-result requests |
| `VANSAH_SPRINT_NAME` | Sprint for Cucumber uploads |
| `VANSAH_RELEASE_NAME` | Release for Cucumber uploads |
| `VANSAH_MODE` | `normal`, `stp`, or `atp`; defaults to `normal` |
| `VANSAH_STP_KEY` | Saved Standard Test Plan key |
| `VANSAH_ATP_KEY` | Saved Advanced Test Plan key |
| `VANSAH_ITERATION` | STP/ATP iteration for Cucumber and single results; defaults to `1` |

Legacy `TOKEN` and `PROD_URL` variables are fallback names when `VANSAH_TOKEN` and `VANSAH_URL` respectively have no nonempty value. Prefer the `VANSAH_` names. TestNG targeting and properties come from the XML report.

## Usage

### Upload Cucumber results to an issue or folder

You can export tagged feature files from Vansah using [Cucumber Feature Export](https://help.vansah.com/en/articles/13337729-cucumber-feature-export), or tag your existing scenarios manually.

Tag each scenario with its Vansah test-case key and produce a Cucumber JSON report:

```gherkin
Feature: Login

  @DEMO-C1
  Scenario: Successful login
    Given a registered user
    When the user signs in with valid credentials
    Then the dashboard is displayed
```

For a project using Cucumber.js, generate the report with:

```bash
npx cucumber-js --format json:cucumber.json
```

Upload it to a Jira issue or test folder:

```bash
vansah-connect -f ./cucumber.json --format cucumber -a DEMO-9
vansah-connect -f ./cucumber.json --format cucumber -a "regression/login/"
```

`-a` is interpreted as a folder path if it contains `/`; otherwise it is a Jira issue key. A plan key such as `DEMO-P2` must use `--stp` or `--atp`, not `-a`.

For report setup and examples for other test runners, see [Vansah Cucumber Integration](https://help.vansah.com/en/articles/13228016-vansah-cucumber-integration). That guide also covers separate shell and PowerShell import scripts; use the commands and `VANSAH_` settings in this README for this CLI.

### Upload Cucumber results to a test plan

| Target | Required options | Supported input |
| --- | --- | --- |
| Jira issue or folder | `-a <issue-or-folder>` | Cucumber, single result |
| Standard Test Plan (STP) | `--stp <plan-key>` | Cucumber, single result |
| Advanced Test Plan (ATP) | `--atp <plan-key>` and `-a <issue-or-folder>` context | Cucumber, single result |

```bash
# Standard Test Plan, iteration 2
vansah-connect -f ./cucumber.json --format cucumber --stp DEMO-P2 --itr 2

# Advanced Test Plan, with issue context
vansah-connect -f ./cucumber.json --format cucumber --atp DEMO-P1 -a DEMO-9 --itr 2

# Advanced Test Plan, with folder context
vansah-connect -f ./cucumber.json --format cucumber --atp DEMO-P1 -a "regression/login/" --itr 2
```

Iteration must be a positive whole number. Text, fractions, zero, negatives, missing values, and repeated `--itr` flags are rejected. Resolution is inline `--itr`, then configured `VANSAH_ITERATION`, then `1`. The Cucumber API receives the multipart field `iterationNumber`. Single-result STP and ATP requests use the same iteration precedence. Custom iteration is not supported for normal issue/folder results or TestNG uploads.

Create the iteration in the target Vansah Test Plan before uploading. The CLI does not create iterations: `--itr 2` sends results to iteration 2 that already exists in the selected plan. This also applies when the iteration comes from `VANSAH_ITERATION` or defaults to 1.

Save a target for repeated use:

```bash
vansah-connect --mode stp --stp DEMO-P2
vansah-connect --itr 2
vansah-connect -f ./cucumber.json --format cucumber

# Return to normal issue/folder targeting
vansah-connect --mode normal
```

An explicit `-a` overrides a saved plan mode unless you also select a plan inline using `--mode`, `--stp`, or `--atp`. For example, use `--mode atp -a DEMO-9` to use the saved ATP key with issue context.

### Upload a TestNG report

```bash
vansah-connect -f ./testng-results.xml --format testng
```

`--format` is required for every `-f` upload. TestNG destinations are specified in the report's custom attributes; CLI plan targeting does not apply.

Include the exact, case-sensitive attribute names in your TestNG tests:

```java
@Test(attributes = {
    @CustomAttribute(name = "Case Key", values = "DEMO-C1"),
    @CustomAttribute(name = "Tested Issue", values = "DEMO-9"),
    @CustomAttribute(name = "Tested Sprint", values = "Sprint 1"),
    @CustomAttribute(name = "Tested Environment", values = "UAT")
})
public void additionTest() {
    Assert.assertEquals(3 + 2, 5);
}
```

`Case Key` and `Tested Issue` identify the test and target. Sprint and environment are optional. Generate the XML report with your test runner before uploading it. See the [TestNG XML import guide](https://help.vansah.com/en/articles/9824969-testng-testcase-import-xml) for the report format and a sample XML file.

### Log a single test-case result

```bash
vansah-connect -t DEMO-C1 -s passed -a DEMO-9
vansah-connect -t DEMO-C1 -s failed -a "regression/login/"
vansah-connect -t DEMO-C1 -s passed --stp DEMO-P2 --itr 2
vansah-connect -t DEMO-C1 -s passed --atp DEMO-P1 -a DEMO-9 --itr 2
vansah-connect -t DEMO-C1 -s passed --atp DEMO-P1 -a "regression/login/" --itr 2
```

For plan results, `--itr` overrides `VANSAH_ITERATION`; when neither is set, iteration 1 is used. The iteration must already exist. ATP requires `-a` with the issue or folder containing the case. Use `vansah-connect help` or `--help` for examples.

Supported statuses are case-insensitive:

| Status | API result ID |
| --- | --- |
| `n/a` (alias `na`) | 0 |
| `failed` | 1 |
| `passed` (alias `pass`) | 2 |
| `untested` | 3 |
| `n/a-in-progress` | 4 |
| `failed-in-progress` | 5 |
| `passed-in-progress` | 6 |

The in-progress variants follow [Vansah's result-status reference](https://help.vansah.com/en/articles/9822260-understanding-a-test-result-status/).

## CI/CD

Run your test framework first, then upload the generated report. Provide credentials through your pipeline's secret store. For GitHub Actions, add a step after your existing test step:

```yaml
- name: Upload Cucumber results to Vansah
  if: ${{ !cancelled() }}
  env:
    VANSAH_TOKEN: ${{ secrets.VANSAH_TOKEN }}
    VANSAH_URL: ${{ vars.VANSAH_URL }}
    VANSAH_PROJECT_KEY: DEMO
    VANSAH_ENVIRONMENT_NAME: CI
  run: |
    npm install --global @vansah/vansah-connect
    vansah-connect -f ./cucumber.json --format cucumber -a DEMO-9
```

Configure `VANSAH_URL` for your workspace and ensure the report is generated even when tests fail. The upload step runs after a failed test step unless the job was cancelled. Cucumber import counts describe importing results, not how many scenarios passed or failed. The summary shows counts only, for example `Imported 3, Failed 0, Skipped 0`; individual case keys are omitted.

For a broader walkthrough, see [How to send test results to Vansah from your CI/CD pipeline](https://help.vansah.com/en/articles/16230699-how-to-send-test-results-to-vansah-from-your-ci-cd-pipeline).

## Local development

Clone the source and install dependencies from the package directory:

```bash
git clone https://github.com/testpointcorp/vansah-connect.git
cd vansah-connect
npm ci --prefix package
node package/bin/index.js --help
```

The repository separates published code from development files:

```text
vansah-connect/
├── README.md
├── .env.example             # template for local test settings
├── package/
│   ├── package.json          # npm metadata, dependencies, and file allowlist
│   ├── package-lock.json
│   ├── README.md             # README included on npm
│   ├── bin/index.js          # CLI options and routing
│   ├── api/sendresults.js    # Vansah API requests
│   ├── const.js
│   └── utility/              # configuration, validation, and output
└── test/
    ├── TESTING-GUIDE.md      # dataset, workspace setup, and test instructions
    ├── new-functionality.test.mjs
    ├── regression.test.mjs
    ├── support/
    │   └── harness.mjs       # loads settings and runs the CLI against Vansah
    └── fixtures/            # existing Cucumber/TestNG reports and invalid samples
```

There is no build step: the CLI uses JavaScript ES modules directly. Run the checkout with `node package/bin/index.js` from the repository root to avoid invoking an older global installation.

For an optional global development link:

```bash
cd package
npm link
cd ..
vansah-connect --help
```

To remove that link later, run `npm uninstall --global @vansah/vansah-connect`. Reinstall the published package if needed.

## Local testing

Use Node.js 22 or later and run commands from the repository root. These tests run the actual CLI and send real requests to Vansah. Uploaded results remain in your workspace.

1. Install dependencies with `npm ci --prefix package`.
2. Copy [`.env.example`](.env.example) to `.env`. If `.env` already exists, add missing settings without overwriting your values.
3. Fill in your workspace URL, credentials, project, case, issue/folder, plan keys, and report paths. The example uses the current NEW2 test dataset; change it for your workspace.
4. Review [test/TESTING-GUIDE.md](test/TESTING-GUIDE.md) before running tests. It explains the current dataset, how to update both report files, and which cases and iterations must exist first.
5. Run the full suite or one test file:

```bash
npm test --prefix package                 # both files, sequentially
npm run test:integration --prefix package # alias for both files
npm run test:functional --prefix package  # new functionality
npm run test:regression --prefix package  # existing behavior
```

The test files are:

- `test/new-functionality.test.mjs`: iteration validation, result statuses, file checks, configuration permissions, and Cucumber and single-result uploads to STP/ATP.
- `test/regression.test.mjs`: CLI syntax, original result statuses, issue/folder/STP results, Cucumber and TestNG imports, and malformed-report rejection.
- `test/support/harness.mjs`: reads the repository-root `.env`, runs the CLI, and captures real platform responses. Shell/CI variables override the file. Saved user settings are isolated from these tests.

Set `VANSAH_TEST_ENV_FILE` to use a different environment file. Relative environment-file and report paths resolve from the repository root. The harness uploads your existing reports unchanged; it does not generate them. Configuration-saving tests use a temporary directory and leave your saved CLI settings unchanged.

A complete run should have no failures or skips. `SKIP` means a required test setting is missing and that flow was not checked. Cucumber tests compare the import count with the report's scenario count and require zero failed or skipped imports. A failed scenario can still be imported successfully.

The suite checks platform responses but does not read back stored runs through a separate API call. Inspect the resulting runs in Vansah when checking the final recorded data. Tests, fixtures, and the testing guide are in the source checkout, not the installed npm package.

## Packaging and publishing

The npm package root is `package/`. Preview exactly what will ship:

```bash
cd package
npm pack --dry-run
npm pack
```

`npm pack` creates `vansah-vansah-connect-<version>.tgz` locally. To smoke-test that artifact, install it on a test machine:

```bash
npm install --global ./vansah-vansah-connect-<version>.tgz
vansah-connect --help
```

Replace `<version>` with the version in `package/package.json`. Global installation replaces any global package/link with the same name.

The `files` allowlist includes the six runtime JavaScript files. npm also includes `package.json` and the package README: eight files total. Tests, fixtures, `.env` files, workflows, `node_modules`, and the development lockfile are excluded. Add new runtime modules to the allowlist when needed. npm installs runtime dependencies separately.

Keep the repository and package READMEs consistent. Update the package version and lockfile together before a release, run the relevant tests, and inspect the pack output. When ready to publish with an npm account authorized for the `@vansah` scope, run from `package/`:

```bash
npm publish --access public
```

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Missing token | Set `VANSAH_TOKEN` or save a token with `-c`. |
| Authentication rejected even though the token has not expired | Check that `VANSAH_URL` matches your workspace and that the configured token is correct. If your Atlassian connection needs authorization again, reconnect Vansah and retry. The error alone does not prove the token has expired. |
| `Project key is missing` or `Please provide space information` | Set `VANSAH_PROJECT_KEY` or run `vansah-connect -p <PROJECT_KEY>`. If it is already set, check which settings are taking precedence and that you are running the current CLI. |
| Unexpected configuration | Check shell variables, then `~/.vansah-connect/.env`, then the current directory's `.env`. |
| `--format is required` | Add `--format cucumber` or `--format testng`. |
| `jiraIssueKey must be in format 'PROJECT-123'` | Use an issue key with `-a`; select plan keys using `--stp` or `--atp`. |
| ATP requires context | Add `-a <issue-key-or-folder-path>` alongside the ATP selector. |
| Invalid iteration | Supply one positive whole number, for example `--itr 2`. |
| `Iteration ... not found` | Create that iteration in the selected Vansah Test Plan first, or choose an existing one. Uploading results does not create it. |
| Missing `.env` when running tests | Copy `.env.example` to `.env` in the repository root and fill in the settings. Follow `test/TESTING-GUIDE.md`. |
| Report file not found | Check the path and make sure your test runner has produced the report. For repository tests, relative report paths start at the repository root. |
| `Imported 0, Failed 3` | The imports failed; this does not mean three scenarios failed. Inspect the API response or backend logs. |
| Missing expected flags | Check `vansah-connect --version` and whether you are running the checkout or a published release. |

The current Cucumber CLI can print a success checkmark and exit `0` when the API returns HTTP `200` with `success: true`, even if its import failure count is nonzero. It also omits warnings from that success response. Do not use that exit code alone as proof that every test result was imported.

## Support

Report package issues at [GitHub Issues](https://github.com/testpointcorp/vansah-connect/issues). Include the command, package version, report format, and sanitized response; omit tokens and sensitive report contents.

Developed by [Vansah](https://vansah.com/).

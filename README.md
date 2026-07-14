<div align="center">
   <a href="https://vansah.com"><img src="https://vansah.com/wp-content/uploads/2021/07/256x256-3.png" /></a><br>
</div>

<p align="center">A single command-line tool for your CI/CD pipelines to send automated test results to Vansah Test Management for Jira</p>

<p align="center">
    <a href="https://vansah.com/"><b>Website</b></a> •
    <a href="https://vansah.com/connect-integrations/"><b>More Connect Integrations</b></a>
</p>

## Table of Contents

  - [Features](#features)
  - [Prerequisites](#prerequisites)
  - [Installing](#installing)
  - [Configuration](#configuration)
  - [Uploading a TestNG report](#uploading-a-testng-report)
  - [Uploading a Cucumber report](#uploading-a-cucumber-report)
  - [Logging a single Test Case result](#logging-a-single-test-case-result)
  - [Command reference](#command-reference)
  - [Using in CI/CD](#using-in-cicd)

## Features

- Upload **TestNG** XML and **Cucumber** JSON reports to [`Vansah Test Management for Jira`](https://marketplace.atlassian.com/apps/1224250/vansah-test-management-for-jira?tab=overview&hosting=cloud) with a single command.
- Log a single Test Case result directly, without a report file.
- Command-line friendly — easy to drop into GitHub Actions, Jenkins, GitLab CI, and other pipelines.
- Reads configuration from environment variables, a project `.env`, or a saved user config — so pipeline secrets stay out of your repo.

## Prerequisites

- [`Vansah`](https://marketplace.atlassian.com/apps/1224250/vansah-test-management-for-jira?tab=overview&hosting=cloud) is installed in your Jira workspace.
- A Vansah [`Connect token`](https://help.vansah.com/en/articles/14003255-create-vansah-api-token) to authenticate with the Vansah API.
- Your Vansah [`API Connect URL`](https://help.vansah.com/en/articles/10407923-vansah-api-connect-url) (e.g. `https://prod.vansah.com`).
- Your **Space Key** (your Jira project key, e.g. `DEMO`) — required by the Vansah API v2.
- [Node.js](https://nodejs.org/en/download) version 18 or newer.

## Installing

`vansah-connect` is a command-line tool, so install it globally with npm:

```bash
npm i -g @vansah/vansah-connect
```

Verify the install:

```bash
vansah-connect --help
```

## Configuration

`vansah-connect` reads its settings from three sources, in this order of priority:

1. **Environment variables** (best for CI — inject secrets as masked variables)
2. **A `.env` file** in the directory you run the command from (your project root)
3. **The saved user config** at `~/.vansah-connect/.env`

Save your settings once with the commands below. They are written to `~/.vansah-connect/.env` and reused across every project.

```bash
# Your Vansah Connect token
vansah-connect -c "YOUR_CONNECT_TOKEN"

# Your Vansah API URL (optional — defaults to https://prod.vansah.com)
vansah-connect -v "https://prod<YourRegionCode>.vansah.com"

# Your Space Key (Jira project key) — required for API v2
vansah-connect -p "DEMO"
```

> **Note:** If your Jira instance is pinned to a specific data-residency region, your API URL will differ. Copy it from **Apps → Vansah → Settings → Vansah API Tokens**.

### Environment variables

Every setting can also be supplied as an environment variable (ideal for pipelines):

| Variable | Required | Description |
|----------|----------|-------------|
| `VANSAH_TOKEN` | Yes | Your Vansah Connect token |
| `VANSAH_PROJECT_KEY` | Yes* | Your Space Key / Jira project key (e.g. `DEMO`) |
| `VANSAH_URL` | No | Vansah API URL (default `https://prod.vansah.com`) |
| `VANSAH_ENVIRONMENT_NAME` | No | Tested environment (e.g. `SYS`, `UAT`) |
| `VANSAH_SPRINT_NAME` | No | Sprint name to associate with the run |
| `VANSAH_RELEASE_NAME` | No | Release name to associate with the run |

\* `VANSAH_PROJECT_KEY` is required for Cucumber uploads and single-result logging. TestNG uploads derive the project from the Case Key prefix.

## Uploading a TestNG report

After your suite runs, upload the generated TestNG XML with a single command:

```bash
vansah-connect -f ./target/testng-results.xml
```

For each test method, Vansah reads **custom attributes** from the report to know which Test Case, Jira issue, sprint, and environment the result belongs to. Set these in your TestNG methods:

```java
/**
 * Custom Attributes:
 * - Case Key (Mandatory):        "DEMO-C1"
 * - Tested Issue (Mandatory):    "DEMO-1"
 * - Tested Sprint (Optional):    "DEMO Sprint 1"
 * - Tested Environment (Optional): "SYS"
 */
@Test(attributes = {
        @CustomAttribute(name = "Case Key", values = "DEMO-C1"),
        @CustomAttribute(name = "Tested Issue", values = "DEMO-1"),
        @CustomAttribute(name = "Tested Sprint", values = "DEMO Sprint 1"),
        @CustomAttribute(name = "Tested Environment", values = "SYS")})
public void Addition_Test() {
    int a = 3, b = 2;
    Assert.assertEquals(a + b, 5);
}
```

> **Note:** The attribute names (`Case Key`, `Tested Issue`, `Tested Sprint`, `Tested Environment`) are constant and case-sensitive.

## Uploading a Cucumber report

`vansah-connect` can upload a `cucumber.json` report produced by any Cucumber-based framework (JavaScript, Java, Python `behave`, Ruby, SpecFlow, and more).

**1. Tag each scenario** with its Vansah Test Case key in the form `@{PROJECT}-C{NUMBER}`:

```gherkin
Feature: User Authentication

  @DEMO-C54
  Scenario: Valid login with correct credentials
    Given I am on the login page
    When I enter valid credentials
    Then I should see the dashboard
```

> **Tip:** You can export ready-tagged `.feature` files straight from Vansah — **Export → Test Cases and Test Script → Cucumber (.feature)**. Scenarios without a Vansah tag are skipped during import.

**2. Generate the JSON report** from your Cucumber run, for example:

```bash
npx cucumber-js --format json:cucumber.json
```

**3. Upload the report**, choosing where the runs should be recorded with `-a`:

```bash
# Against a Jira issue
vansah-connect -f ./cucumber.json --format cucumber -a DEMO-9

# Against a Test Folder (any value containing "/")
vansah-connect -f ./cucumber.json --format cucumber -a "regression/login/"
```

Vansah parses the report, maps each tagged scenario to its Test Case, records the Gherkin steps and their pass/fail results, and attaches the runs to the issue or folder you provided. `VANSAH_PROJECT_KEY` must be set. Optional `VANSAH_SPRINT_NAME`, `VANSAH_RELEASE_NAME`, and `VANSAH_ENVIRONMENT_NAME` are applied if present.

A successful upload prints a summary:

```bash
✔ Imported 1, Failed 0, Skipped 0 (DEMO-C54=PASSED)
```

## Logging a single Test Case result

To record one Test Case result without a report file:

```bash
# -t <TestCaseKey>  -s <result>  -a <IssueKey or Test Folder path>
vansah-connect -t "DEMO-C50" -s "passed" -a "DEMO-9"
```

- `-s` accepts `passed`, `failed`, `n/a`, or `untested` (case-insensitive).
- `-a` is treated as a **Test Folder path** if it contains `/`, otherwise as a **Jira issue key**.
- `VANSAH_PROJECT_KEY` must be set.

On success:

```bash
✔ Executed Test Case DEMO-C50 against DEMO-9 with Result = passed
```

## Command reference

| Command | Description |
|---------|-------------|
| `vansah-connect -c <token>` | Save your Vansah Connect token |
| `vansah-connect -v <url>` | Save your Vansah API URL |
| `vansah-connect -p <projectKey>` | Save your Space Key (Jira project key) |
| `vansah-connect -f <file>` | Upload a TestNG report (default format) |
| `vansah-connect -f <file> --format cucumber -a <asset>` | Upload a Cucumber report |
| `vansah-connect -t <caseKey> -s <result> -a <asset>` | Log a single Test Case result |
| `vansah-connect --help` | Show all commands and examples |

## Using in CI/CD

In a pipeline, provide the configuration as environment variables (masked secrets) and call the tool after your tests run. Example GitHub Actions step:

```yaml
- name: Upload results to Vansah
  env:
    VANSAH_TOKEN: ${{ secrets.VANSAH_TOKEN }}
    VANSAH_URL: https://prod.vansah.com
    VANSAH_PROJECT_KEY: DEMO
  run: |
    npm i -g @vansah/vansah-connect
    vansah-connect -f ./cucumber.json --format cucumber -a DEMO-9
```

## Developed By

[Vansah](https://vansah.com/)

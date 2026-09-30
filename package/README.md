<div align="center">
  <a href="https://vansah.com"><img src="https://vansah.com/app/logo/vansahjira-logo.svg" alt="Vansah Test Management for Jira" /></a><br>
</div>

<p align="center">Send automated test results from your CI/CD pipeline to Vansah Test Management for Jira.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@vansah/vansah-connect"><img src="https://img.shields.io/badge/npm-vansah--connect-CB3837?logo=npm&logoColor=white" alt="Install Vansah Connect from npm" /></a>
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white" alt="Node.js 18 or newer" />
  <img src="https://img.shields.io/badge/reports-TestNG%20%7C%20Cucumber-6554C0" alt="TestNG and Cucumber reports" />
</p>

<p align="center">
  <a href="https://vansah.com/"><b>Website</b></a> •
  <a href="https://vansah.com/connect-integrations/"><b>More Connect Integrations</b></a>
</p>

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installing](#installing)
- [Configuration](#configuration)
- [Uploading Your Results](#uploading-your-results)
- [Use of Custom Attributes](#use-of-custom-attributes)
- [Uploading to a Test Plan](#uploading-to-a-test-plan)
- [Adding Results to a Specific Test Case](#adding-results-to-a-specific-test-case)
- [Using Vansah Connect in CI/CD](#using-vansah-connect-in-cicd)

## Features

- 📄 Upload **TestNG XML** and **Cucumber JSON** reports to Vansah.
- 🎯 Send individual test-case results to **Jira issues**, **test folders**, **Standard Test Plans (STP)**, or **Advanced Test Plans (ATP)**.
- 🗂️ Upload Cucumber reports to **Jira issues**, **test folders**, **STP**, or **ATP**.
- ✅ Record an individual test-case result with one command.
- 🚀 Add result uploads to **GitHub Actions, Jenkins, GitLab CI**, or another pipeline.

## Prerequisites

- [Vansah Test Management for Jira](https://marketplace.atlassian.com/apps/1224250/vansah-test-management-for-jira?tab=overview&hosting=cloud) installed in your Jira workspace.
- A [Vansah Connect token](https://help.vansah.com/en/articles/9824979-generate-a-vansah-api-token-from-jira).
- Your workspace's [API Connect URL](https://help.vansah.com/en/articles/10407923-vansah-api-connect-url) and Jira project/space key.
- [Node.js](https://nodejs.org/en/download) 18 or newer and npm.
- Existing test cases and the issue, folder, or test plan where results will be recorded.
- For test-plan uploads, the selected iteration must already exist in Vansah.

## Installing

Install globally with npm:

```bash
npm install -g @vansah/vansah-connect
```

View the available commands:

```bash
vansah-connect --help
```

## Configuration

1. Save your Vansah Connect token:

   ```bash
   vansah-connect -c "Your Vansah Connect Token"
   ```

2. Set the API Connect URL shown in your Vansah settings. Replace the example with your workspace's URL:

   ```bash
   vansah-connect -v "https://prod.vansah.com"
   ```

3. Set your Jira project/space key:

   ```bash
   vansah-connect -p DEMO
   ```

> **Note:** Your workspace's API URL may differ by region. Use the URL shown in Vansah's API Tokens settings. The default is `https://prod.vansah.com`.

Optionally, save run properties:

```bash
vansah-connect --environment SYS
vansah-connect --sprint "Sprint 1"
vansah-connect --release "v1.2"
```

Environment applies to Cucumber uploads and single results. Sprint and release apply to Cucumber uploads. TestNG reads its run properties from the XML's custom attributes.

Settings are saved in `~/.vansah-connect/.env` and reused across projects. You can also provide them through environment variables or a `.env` file in the directory where you run the command:

| Variable | Purpose |
| --- | --- |
| `VANSAH_TOKEN` | Vansah Connect token |
| `VANSAH_URL` | Your workspace's API Connect URL |
| `VANSAH_PROJECT_KEY` | Required Jira project/space key |
| `VANSAH_ENVIRONMENT_NAME` | Tested environment |
| `VANSAH_SPRINT_NAME` | Sprint name |
| `VANSAH_RELEASE_NAME` | Release name |
| `VANSAH_MODE` | `normal`, `stp`, or `atp`; defaults to `normal` |
| `VANSAH_STP_KEY` | Standard Test Plan key |
| `VANSAH_ATP_KEY` | Advanced Test Plan key |
| `VANSAH_ITERATION` | STP/ATP iteration for Cucumber and single results; defaults to `1` |

Settings are read in this order: **shell/CI variables → saved user settings → local `.env` → defaults**. Keep credentials out of version control.

Run configuration commands separately from uploads. Inline `--mode`, `--stp`, `--atp`, and `--itr` apply to the current upload without changing saved settings. For environment, sprint, and release, save the values first or supply environment variables.

## Uploading Your Results

Run your automation suite first, then upload its report.

### TestNG XML

```bash
vansah-connect -f ./target/testng-results.xml --format testng
```

Include the [custom attributes](#use-of-custom-attributes) in your TestNG tests so Vansah can identify each case and its target issue.

### Cucumber JSON

Tag your scenarios with their Vansah test-case keys:

```gherkin
Feature: Login

  @DEMO-C1
  Scenario: Successful login
    Given a registered user
    When the user signs in with valid credentials
    Then the dashboard is displayed
```

You can also export tagged feature files from Vansah. See [Cucumber Feature Export](https://help.vansah.com/en/articles/13337729-cucumber-feature-export).

For Cucumber.js, generate the JSON report with:

```bash
npx cucumber-js --format json:cucumber.json
```

Upload the report against an issue or folder:

```bash
# Jira issue
vansah-connect -f ./cucumber.json --format cucumber -a DEMO-9

# Test folder
vansah-connect -f ./cucumber.json --format cucumber -a "regression/login/"
```

A value containing `/` is treated as a folder path; otherwise `-a` is treated as a Jira issue key. Use `--stp` or `--atp` for plan keys.

> **Note:** Every report upload requires `--format testng` or `--format cucumber`.

For report setup with other Cucumber runners, see [Vansah Cucumber Integration](https://help.vansah.com/en/articles/13228016-vansah-cucumber-integration).

## Use of Custom Attributes

Add these attributes to each TestNG test method:

```java
@Test(attributes = {
    @CustomAttribute(name = "Case Key", values = "DEMO-C1"),
    @CustomAttribute(name = "Tested Issue", values = "DEMO-9"),
    @CustomAttribute(name = "Tested Sprint", values = "Sprint 1"),
    @CustomAttribute(name = "Tested Environment", values = "SYS")
})
public void Addition_Test() {
    int sum = 3 + 2;
    Assert.assertEquals(sum, 5);
}
```

| Attribute | Required | Purpose |
| --- | --- | --- |
| `Case Key` | Yes | Existing Vansah test case |
| `Tested Issue` | Yes | Jira issue receiving the result |
| `Tested Sprint` | No | Sprint associated with the result |
| `Tested Environment` | No | Environment where the test ran |

> **Note:** Attribute names are case-sensitive. Keep the names exactly as shown and replace the values with your workspace's data.

TestNG uses the destinations in the XML; CLI plan flags do not change them. See the [TestNG XML import guide](https://help.vansah.com/en/articles/9824969-testng-testcase-import-xml) for a sample report.

## Uploading to a Test Plan

Choose a plan when uploading a Cucumber report:

| Target | Options |
| --- | --- |
| Standard Test Plan | `--stp <plan-key>` |
| Advanced Test Plan | `--atp <plan-key>` plus `-a <issue-or-folder>` |

```bash
# Standard Test Plan, iteration 2
vansah-connect -f ./cucumber.json --format cucumber --stp DEMO-P2 --itr 2

# Advanced Test Plan with issue context
vansah-connect -f ./cucumber.json --format cucumber --atp DEMO-P1 -a DEMO-9 --itr 2

# Advanced Test Plan with folder context
vansah-connect -f ./cucumber.json --format cucumber --atp DEMO-P1 -a "regression/login/" --itr 2
```

> **Important:** Create the iteration in the selected Vansah Test Plan first. The CLI does not create iterations. It sends results to the existing iteration you specify.

`--itr` accepts a positive whole number. The CLI uses the inline value first, then `VANSAH_ITERATION`, then `1`. An inline value leaves the saved iteration unchanged. Custom iteration selection applies to Cucumber uploads and single results targeting STP or ATP.

Save a plan and iteration for repeated uploads:

```bash
vansah-connect --mode stp --stp DEMO-P2
vansah-connect --itr 2
vansah-connect -f ./cucumber.json --format cucumber
```

To save and reuse an ATP target:

```bash
vansah-connect --mode atp --atp DEMO-P1
vansah-connect -f ./cucumber.json --format cucumber --mode atp -a DEMO-9 --itr 2
```

Passing `-a` overrides a saved plan mode unless you also select the plan inline. To return to normal issue/folder targeting by default:

```bash
vansah-connect --mode normal
```

## Adding Results to a Specific Test Case

Send a result without uploading a report:

```bash
# Against a Jira issue
vansah-connect -t DEMO-C1 -s passed -a DEMO-9

# Against a test folder
vansah-connect -t DEMO-C1 -s failed -a "regression/login/"

# Against a Standard Test Plan
vansah-connect -t DEMO-C1 -s passed --stp DEMO-P2 --itr 2

# Against an Advanced Test Plan with issue context
vansah-connect -t DEMO-C1 -s passed --atp DEMO-P1 -a DEMO-9 --itr 2

# Against an Advanced Test Plan with folder context
vansah-connect -t DEMO-C1 -s passed --atp DEMO-P1 -a "regression/login/" --itr 2
```

| Option | Value |
| --- | --- |
| `-t` | Test-case key |
| `-s` | Result status |
| `-a` | Jira issue key or test-folder path |
| `--stp` | Standard Test Plan key, as an alternative target |
| `--atp` | Advanced Test Plan key; also requires `-a` for issue/folder context |
| `--itr` | Existing plan iteration; overrides the configured value for this command |

Single-result STP and ATP requests use `--itr` when supplied, otherwise `VANSAH_ITERATION` from your settings, otherwise `1`. The iteration must already exist in the selected plan. For example, with `VANSAH_ITERATION=3` in your `.env`:

```bash
vansah-connect -t DEMO-C1 -s passed --stp DEMO-P2
vansah-connect -t DEMO-C1 -s passed --atp DEMO-P1 -a DEMO-9
```

Both commands send the result to iteration 3. ATP requires the issue or folder that contains the case within the plan. Use `--mode atp -a DEMO-9` to select a saved ATP key; `-a` alone selects a normal issue/folder run. Normal issue/folder results and TestNG uploads do not accept `--itr`.

Use `vansah-connect help` or `vansah-connect --help` to see the plan options and examples.

Supported statuses are case-insensitive:

| Result | API result ID |
| --- | --- |
| `n/a` or `na` | 0 |
| `failed` | 1 |
| `passed` or `pass` | 2 |
| `untested` | 3 |
| `n/a-in-progress` | 4 |
| `failed-in-progress` | 5 |
| `passed-in-progress` | 6 |

```bash
vansah-connect -t DEMO-C1 -s pass -a DEMO-9
vansah-connect -t DEMO-C1 -s failed-in-progress -a DEMO-9
vansah-connect -t DEMO-C1 -s passed-in-progress --stp DEMO-P2
```

See [Vansah's result-status reference](https://help.vansah.com/en/articles/9822260-understanding-a-test-result-status/) for status definitions.

## Using Vansah Connect in CI/CD

Run your tests, keep the generated report, and add an upload step. Supply credentials through your pipeline's secret store.

Example for GitHub Actions:

```yaml
- name: Upload Cucumber results to Vansah
  if: ${{ !cancelled() }}
  env:
    VANSAH_TOKEN: ${{ secrets.VANSAH_TOKEN }}
    VANSAH_URL: ${{ vars.VANSAH_URL }}
    VANSAH_PROJECT_KEY: DEMO
    VANSAH_ENVIRONMENT_NAME: CI
  run: |
    npm install -g @vansah/vansah-connect
    vansah-connect -f ./cucumber.json --format cucumber -a DEMO-9
```

Ensure the report is generated even when tests fail. This upload step runs unless the workflow is cancelled.

After an upload, open the destination issue, folder, or plan in Vansah and check the recorded results.

For the full walkthrough, see [How to send test results to Vansah from your CI/CD pipeline](https://help.vansah.com/en/articles/16230699-how-to-send-test-results-to-vansah-from-your-ci-cd-pipeline).

## Developed By

[Vansah](https://vansah.com/)

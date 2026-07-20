<div align="center">
   <a href="https://vansah.com"><img src="https://vansah.com/app/logo/vansahjira-logo.svg" /></a><br>
</div>

<p align="center">A Single Solution for all your CI/CD tools to send automated Test results to Vansah Test Management for Jira</p>

<p align="center">
    <a href="https://vansah.com/"><b>Website</b></a> •
    <a href="https://vansah.com/connect-integrations/"><b>More Connect Integrations</b></a>
</p>

## Table of Contents

  - [Features](#Features)
  - [Prerequisite](#Prerequisite)
  - [Installing](#Installing)
  - [Configuration](#Configuration)
  - [Uploading a TestNG Report](#Uploading-a-TestNG-Report)
  - [Use of Custom Attributes](#Use-of-Custom-Attributes)
  - [Uploading a Cucumber Report](#Uploading-a-Cucumber-Report)
  - [Adding results to a specific Test Case](#Adding-results-to-a-specific-Test-Case)
  - [Targeting a Test Plan (STP / ATP)](#Targeting-a-Test-Plan-STP--ATP)
  - [Command Reference](#Command-Reference)
  - [Using in CI/CD](#Using-in-CICD)

## Features

- Upload your **TestNG** 🎉 XML and **Cucumber** 🥒 JSON reports to [`Vansah Test Management for Jira`](https://marketplace.atlassian.com/apps/1224250/vansah-test-management-for-jira?tab=overview&hosting=cloud) with a single command.
- Execute your Vansah Test Case in just [`one command`](#Adding-results-to-a-specific-Test-Case).
- Easy to use as it is command line friendly.
- Easy to integrate with CI/CD tools such as Github Actions, Jenkins, Gitlab and so on.
- Reads configuration from environment variables, a project `.env`, or a saved user config - so pipeline secrets stay out of your repo.

## Prerequisite

- Make sure that [`Vansah`](https://marketplace.atlassian.com/apps/1224250/vansah-test-management-for-jira?tab=overview&hosting=cloud) is installed in your Jira workspace.
- You need to generate a Vansah [`Connect token`](https://help.vansah.com/en/articles/14003255-create-vansah-api-token) to authenticate with the Vansah APIs.
- Your Vansah [`API Connect URL`](https://help.vansah.com/en/articles/10407923-vansah-api-connect-url) (e.g. `https://prod.vansah.com`).
- Your **Space Key** (your Jira project key, e.g. `DEMO`) - required by the Vansah API v2.
- [Node.js](https://nodejs.org/en/download) version 18 or newer should be installed on your machine.

## Installing

Using npm (install globally) as this is a `command line` tool:

```bash
$ npm i -g @vansah/vansah-connect
```

Verify the install:

```bash
$ vansah-connect --help
```

## Configuration

`vansah-connect` reads its settings from three sources, in this order of priority:

1. **Environment variables** (best for CI - inject secrets as masked variables)
2. **A `.env` file** in the directory you run the command from (your project root)
3. **The saved user config** at `~/.vansah-connect/.env`

Save your settings once with the commands below. They are written to `~/.vansah-connect/.env` and reused across every project.

- Configure your Vansah `Connect` token. Use either of the following commands:
    - Option 1: Replace "Your Vansah `Connect` Token" with your actual token.

        ```bash
        $ vansah-connect -c "Your Vansah Connect Token"
        ```
    - Option 2: If you have the token stored as a pipeline variable, you can use:

        ```bash
        $ vansah-connect -c %YOUR-PIPELINE-VARIABLE%
        ```

- Configure your Vansah Jira pinned location URL (leave it blank to use the default URL: `https://prod.vansah.com`).

    > **Note:** If your Jira instance is set to a specific location, the URL will be different. Update the URL by verifying it in the **Apps → Vansah → Settings → Vansah API Tokens** section.

    ```bash
    $ vansah-connect -v "https://prod<Your Region code>.vansah.com"
    ```

- Configure your **Space Key** (Jira project key) - required for API v2.

    ```bash
    $ vansah-connect -p "DEMO"
    ```

- Optionally, save the **run properties** so they apply to every run:

    ```bash
    $ vansah-connect --environment "UAT"      # tested environment (e.g. SYS, UAT)
    $ vansah-connect --sprint "Sprint 1"      # sprint to associate with the run
    $ vansah-connect --release "v1.2"         # release to associate with the run
    ```

> **Tip:** Run `vansah-connect --show-config` at any time to print the effective configuration (the Connect token is masked).

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
| `VANSAH_MODE` | No | Result target: `normal` (issue/folder, default), `stp` or `atp` - see [Targeting a Test Plan](#Targeting-a-Test-Plan-STP--ATP) |
| `VANSAH_STP_KEY` | No | Standard Test Plan key (e.g. `DEMO-P2`) used when mode is `stp` |
| `VANSAH_ATP_KEY` | No | Advanced Test Plan key (e.g. `DEMO-P1`) used when mode is `atp` |

\* `VANSAH_PROJECT_KEY` is required for Cucumber uploads and single-result logging. TestNG uploads derive the project from the Case Key prefix.

## Uploading a TestNG Report

Now, it's time to effortlessly upload your test results to `Vansah Test Management for Jira` with a single command.

Replace `./YOUR-TESTNG_FILEPATH.xml` with the actual file path to your TestNG file. The `--format` flag is **required** with `-f`:

```bash
$ vansah-connect -f ./YOUR-TESTNG_FILEPATH.xml --format testng
```

> **Note:** Set up your `TestNG` file to include [`custom attributes`](#Use-of-Custom-Attributes) for each of your test functions. This way, after running the automation suite, all test methods will have sufficient information to log the results into `Vansah Test Management for Jira`.

## Use of Custom Attributes

In Vansah, the determination of whether a test should pass or fail relies on the utilization of custom attribute annotations.

```java
/**
 * Example
 * This is a test method for performing an addition operation.
 *
 * Custom Attributes:
 * - Case Key (Mandatory):          "DEMO-C1"
 * - Tested Issue (Mandatory):      "DEMO-1"
 * - Tested Sprint (Optional):      "DEMO Sprint 1"
 * - Tested Environment (Optional): "SYS"
 */
@Test(attributes = {
        @CustomAttribute(name = "Case Key", values = "DEMO-C1"),
        @CustomAttribute(name = "Tested Issue", values = "DEMO-1"),
        @CustomAttribute(name = "Tested Sprint", values = "DEMO Sprint 1"),
        @CustomAttribute(name = "Tested Environment", values = "SYS")})
public void Addition_Test() {

    int a = 3, b = 2;
    int sum = a + b;
    System.out.println("Addition of Two numbers are : " + sum);

    Assert.assertEquals(sum, 5);

}
```

> **Note:** Modifying the name values is not possible as they are constant and case-sensitive.

## Uploading a Cucumber Report

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

> **Tip:** You can export ready-tagged `.feature` files straight from Vansah - **Export → Test Cases and Test Script → Cucumber (.feature)**. Scenarios without a Vansah tag are skipped during import.

**2. Generate the JSON report** from your Cucumber run, for example:

```bash
$ npx cucumber-js --format json:cucumber.json
```

**3. Upload the report**, choosing where the runs should be recorded with `-a`:

```bash
# Against a Jira issue
$ vansah-connect -f ./cucumber.json --format cucumber -a DEMO-9

# Against a Test Folder (any value containing "/")
$ vansah-connect -f ./cucumber.json --format cucumber -a "regression/login/"
```

Vansah parses the report, maps each tagged scenario to its Test Case, records the Gherkin steps and their pass/fail results, and attaches the runs to the issue or folder you provided. `VANSAH_PROJECT_KEY` must be set. Optional `VANSAH_SPRINT_NAME`, `VANSAH_RELEASE_NAME`, and `VANSAH_ENVIRONMENT_NAME` are applied if present.

> To record the runs against a **Standard** or **Advanced Test Plan** instead of an issue/folder, see [Targeting a Test Plan (STP / ATP)](#Targeting-a-Test-Plan-STP--ATP).

A successful upload prints a summary:

```bash
✔ Imported 1, Failed 0, Skipped 0 (DEMO-C54=PASSED)
```

## Adding results to a specific Test Case

If you want to upload a result directly to a particular Test Case, follow the command below.

```bash
/**
 * -t <TestCaseKey>
 * -s <passed | failed | n/a | untested>
 * -a <IssueKey or Test Folder path>
 **/
$ vansah-connect -t "DEMO-C50" -s "passed" -a "DEMO-9"
```

- `-s` accepts `passed`, `failed`, `n/a`, or `untested` (case-insensitive).
- `-a` is treated as a **Test Folder path** if it contains `/`, otherwise as a **Jira issue key**.
- `VANSAH_PROJECT_KEY` must be set.

Upon successful execution, you'll receive a reassuring message:

```bash
✔ Executed Test Case DEMO-C50 against DEMO-9 with Result = passed
```

## Targeting a Test Plan (STP / ATP)

By default, results are recorded against a **Jira issue** or **Test Folder** (the `-a` asset). To record them against a Test Plan instead, switch the **mode**:

| Mode | Target | Needs | Works with |
|------|--------|-------|------------|
| `normal` *(default)* | Jira issue or Test Folder | `-a` | Cucumber, single result |
| `stp` | **Standard Test Plan** | plan key (`--stp`) | Cucumber, single result |
| `atp` | **Advanced Test Plan** | plan key (`--atp`) + `-a` context | **Cucumber only** |

> **Note:** Test Plan targeting applies to **Cucumber uploads** and **single-result logging** (`normal`/`stp` only - ATP is Cucumber-only). **TestNG is not supported** - TestNG reports target their destination through the `Case Key` / `Tested Issue` custom attributes in the XML, not through a mode.

> **Iteration:** Test Plan runs currently land in the plan's **default iteration (1)**. Support for selecting a custom iteration is on the roadmap - the team will add it in an upcoming release.

### Save your plan settings once

The plan key and mode can be saved to `~/.vansah-connect/.env` like any other setting, then reused across runs:

```bash
# Standard Test Plan
$ vansah-connect --mode stp --stp DEMO-P2

# Advanced Test Plan
$ vansah-connect --mode atp --atp DEMO-P1

# Back to normal issue/folder targeting
$ vansah-connect --mode normal
```

Check what is configured at any time:

```bash
$ vansah-connect --show-config
```

> **Heads-up:** A saved `mode` only applies to plan runs. Passing `-a` on a command is always treated as a **normal quick run** against that issue/folder - the saved `stp`/`atp` mode is ignored for that run, so it never hijacks a quick run. The saved mode only kicks in when you **don't** pass `-a` (or when you select a plan inline with `--mode` / `--stp` / `--atp`).

### Standard Test Plan (STP)

```bash
# Cucumber report against a Standard Test Plan
$ vansah-connect -f ./cucumber.json --format cucumber --mode stp --stp DEMO-P2

# Single result against a Standard Test Plan
$ vansah-connect -t DEMO-C50 -s passed --mode stp --stp DEMO-P2
```

### Advanced Test Plan (ATP)

> **Cucumber uploads only.** Advanced Test Plans are **not supported for single results** (`-t`) - use a Cucumber report for ATP, or log single results against an issue/folder or a Standard Test Plan.

An Advanced Test Plan additionally needs the **context** it is scoped to - supply the issue/folder with `-a`:

```bash
# Cucumber report against an Advanced Test Plan (issue as context)
$ vansah-connect -f ./cucumber.json --format cucumber --mode atp --atp DEMO-P1 -a DEMO-9

# ...or a Test Folder as context
$ vansah-connect -f ./cucumber.json --format cucumber --mode atp --atp DEMO-P1 -a "regression/login/"
```

> Flags override saved config for a single run, so you can also keep the key in config and just pass `--mode stp` / `--mode atp` on the command.

## Command Reference

| Command | Description |
|---------|-------------|
| `vansah-connect -c <token>` | Save your Vansah Connect token |
| `vansah-connect -v <url>` | Save your Vansah API URL |
| `vansah-connect -p <projectKey>` | Save your Space Key (Jira project key) |
| `vansah-connect --environment <name>` | Save the tested environment (run property) |
| `vansah-connect --sprint <name>` | Save the sprint name (run property) |
| `vansah-connect --release <name>` | Save the release name (run property) |
| `vansah-connect --mode <normal\|stp\|atp>` | Save the result-target mode |
| `vansah-connect --stp <planKey>` | Save your Standard Test Plan key |
| `vansah-connect --atp <planKey>` | Save your Advanced Test Plan key |
| `vansah-connect --show-config` | Show the saved / effective configuration (token masked) |
| `vansah-connect -f <file> --format testng` | Upload a TestNG report |
| `vansah-connect -f <file> --format cucumber -a <asset>` | Upload a Cucumber report against an issue / folder |
| `vansah-connect -f <file> --format cucumber --mode stp --stp <planKey>` | Upload a Cucumber report against a Standard Test Plan |
| `vansah-connect -f <file> --format cucumber --mode atp --atp <planKey> -a <asset>` | Upload a Cucumber report against an Advanced Test Plan |
| `vansah-connect -t <caseKey> -s <result> -a <asset>` | Log a single Test Case result |
| `vansah-connect -t <caseKey> -s <result> --mode stp --stp <planKey>` | Log a single result against a Standard Test Plan |
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

And that's it! With `vansah-connect`, you've streamlined the integration of your automation test results into Vansah, making your testing and test management process even more efficient and seamless.

## Developed By

[Vansah](https://vansah.com/)
</content>
</invoke>

<div align="center">
   <a href="https://vansah.com"><img src="https://vansah.com/wp-content/uploads/2021/07/256x256-3.png" /></a><br>
</div>

<p align="center">A Single Solution for all the CI/CD tools to send Test results to Vansah Test Management for Jira</p>

<p align="center">
    <a href="https://vansah.com/"><b>Website</b></a> •
    <a href="https://vansah.com/connect-integrations/"><b>More Connect Integrations</b></a>
</p>

## Table of Contents

  - [Features](#features)
  - [Prerequisite](#Prerequisite)
  - [Installing](#installing)
  - [Configuration](#Configuration)
  - [Uploading Your Results](#Uploading-Your-Results)
  - [Use of Custom Attributes](#Use-of-Custom-Attributes)
  - [Adding results to a specific Test Case](#Adding-results-to-a-specific-Test-Case)

## Features

- Upload your TestNG🎉, 🔜 Junit, xunit🔜 and jtl/xml/csv🔜 to [`Vansah Test Management for Jira`](https://marketplace.atlassian.com/apps/1224250/vansah-test-management-for-jira?tab=overview&hosting=cloud) 
- Easy to use as it is command line friendly.
- Easy to Integrate with CI/CD tools such as Github Actions, Jenkins, Gitlab and so on.
- Execute your Vansah Test Case in just [`one command`](#Adding-results-to-a-specific-Test-Case).


## Prerequisite

- Make sure that [`Vansah`](https://marketplace.atlassian.com/apps/1224250/vansah-test-management-for-jira?tab=overview&hosting=cloud) is installed in your Jira workspace
- You need to Generate Vansah [`connect`](https://help.vansah.com/en/articles/9824979-generate-a-vansah-api-token-from-jira) token to authenticate with Vansah APIs.
- [Node.js](https://nodejs.org/en/download) version 18 should be installed in your machine.

## Installing

Using npm (Install globally) as this is `command line` tool:

```bash
$ npm i -g @vansah/vansah-connect
```

## Configuration

- Configure your Vansah `connect` Token. Use either of the following commands:
    - Option 1: Replace "Your Vansah `connect` Token" with your actual token.
    
        ```bash
            $ vansah-connect -c "Your Vansah Connect Token"
        ```
    - Option 2: If you have the token stored as a pipeline variable, you can use:
            
        ```bash
            $ vansah-connect -c %YOUR-PIPELINE-VARIABLE%
        ```
- Configure your Vansah Jira Pinned location URL.( leave it blank to use default URL : `https://prod.vansah.com`)

    > Note : If your Jira instance is set to a specific location, the URL will be different. Update the URL by verifying it in the Vansah API Tokens section.

    ```bash
         $ vansah-connect -v "https://prod<Your Region code>.vansah.com"
    ```

## Uploading Your Results

Now, it's time to effortlessly upload your test results to `Vansah Test Management for Jira` with a single command.

Replace `./YOUR-TESTNG_FILEPATH.xml` with the actual file path to your TestNg file

```bash
$ vansah-connect -f ./YOUR-TESTNG_FILEPATH.xml
```


> **Note** : Set up your `TestNG` file to include [`custom attributes`](#Use-of-Custom-Attributes) for each of your test functions. This way, after running the automation suite, all test methods will have sufficient information to log the results into `Vansah Test Management for Jira`.

## Use of Custom Attributes

In Vansah, the determination of whether a test should pass or fail relies on the utilization of custom attribute annotations

```java
/**
 * Example
 * This is a test method for performing an addition operation.
 *
 * Custom Attributes:
 * - Case Key (Mandatory): "DOT-C1"
 * - Tested Issue (Mandatory): "DOT-1"
 * - Tested Sprint: "DOT Sprint 1"
 * - Tested Environment: "SYS"
 */
@Test(attributes = {
		      @CustomAttribute(name = "Case Key", values = "DOT-C1"),
		      @CustomAttribute(name = "Tested Issue", values = "DOT-1"),
		      @CustomAttribute(name = "Tested Sprint", values = "DOT Sprint 1"),
		      @CustomAttribute(name = "Tested Environment", values = "SYS")})
	public void Addition_Test() {
		
		int a = 3 , b = 2;
		int sum = a + b ;
		System.out.println("Addition of Two numbers are : " + sum);
	
		Assert.assertEquals(sum, 5);
		
	}
	
```
> **Note** : Modifying the name values is not possible as they are constant and case-sensitive
   
   
   
## Adding results to a specific Test Case

If you want to upload results directly to a particular test case follow below command

```bash
/**
* -t <TestCaseKey> 
* -s <passedOrFailed>
* -a <IssueKeyorTestFolderID>
**/
$ vansah-connect -t "PVT-C500" -s "passed" -a "PVT-4"
```

Upon successful execution, you'll receive a reassuring message

```bash
A new Test Run created.
```
And that's it! With vansah-connect, you've streamlined the integration of your automation test results into Vansah, making your testing and test management process even more efficient and seamless.

## Developed By

[Vansah](https://vansah.com/)

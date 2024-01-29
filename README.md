# vansah-connect
<p>A Single Solution for all the CI/CD tools to send Test results to Vansah Test Management for Jira</p>

# Steps to Install
```
npm install -g vansah-connect
```
# Use
<p>It is necessary to add Your Connect Token to use Vansah - TM For Jira</p>

```
vansah-connect -c <Your Connect Token>
```

<p>Currently Vansah only supports TestNg results *.xml based files</p>

```
vansah-connect -f <FilePath> 

```

<p>Send Test Case Results Directly to Vansah Test Management for Jira</p>

```
vansah-connect -t <testCaseKey> -s <testCaseResultName> -a <assetKey/testFolderIdentifier>

```

## Developed By

* Testpoint (https://testpoint.com.au/)

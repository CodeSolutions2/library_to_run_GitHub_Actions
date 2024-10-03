# library_to_run_GitHub_Actions

The purpose of this JavaScript library is to launch Backend processes on GitHub Actions, for Frontend web applications on GitHub Pages. It contains functions that are useful to create web applications using GitHub Pages (a Frontend web application). When calling a model or a database to process a user's input request, the developer must submit the user's data to the model or database using the web application/company keys/tokens on behalf of the user; keys/tokens can either be used from GitHub Secrets on the Backend or they can be encrypted and stored in a file in the repository (ie: Frontend). 

## Specific library function
The library creates a file, in a folder, containing data from the Frontend web application (RepoA), in any repository (RepoB) using RepoB's repository file content key.  The library is called from RepoA on GitHub Pages, it decrypts the repository file content key of RepoB, creates a file with the the user input in RepoB, and can then re-encrypt the key for RepoB. 

This library was inspired by the GitHub workflow called [workflow dispatch event](https://docs.github.com/en/rest/actions/workflows?apiVersion=2022-11-28#create-a-workflow-dispatch-event) that uses the same organizational idea and sends information from RepoA to RepoB.

![alt_text](RepoA_RepoB.png)

The intention of the library is to use it with GitHub Actions. When the library creates the file in RepoB (destination repository), a GitHub Actions script will automatically trigger to either run a process on the user's input or trigger another repository's (ie: RepoA (sending repository)) GitHub Actions script to run. 

The purpose of using an intermediate repository, RepoB, is to allow for security to RepoA. RepoB acts as a central repository with non-critical information inside of it; an encrypted file content key which can be recreated, temporary user input messages from Frontend applications, and the .yaml files for triggering processes to run. If an intrusion occured, RepoB would be vunerable to loosing non-critical information, and RepoA would just loose functional communication without loss of critical data.

## Example of library usage

[Current working version] https://codesolutions2.github.io/library_to_run_GitHub_Actions/index.html 

Inside index.html the following function is called, also different ways in which to import the library are given. Define names of the following variables: Github owner, RepoA, RepoB, the folder to put the created file inside of RepoB, the file to create in RepoB, the text to put inside the created file. This file will be in RepoA.

RepoB should have the following file structure:
- .github
  - .env (encrypted key of repository(RepoA/RepoB) inside)
  - workflows
    - reset_key_automatically.yaml - The workflow uses a github token (with repository file contents read and write permission) from GitHub Secrets; it encrypts the token using base64 encoding, salting (additional strings added), and scrambling.  The encrypted token is saved in the .github/.env file automatically. 
- README.md (optional)

## In progress
- Use a standard method for GitHub encryption instead of salt/scramble: Github recommends using [libsodium-wrappers](https://docs.github.com/en/rest/guides/encrypting-secrets-for-the-rest-api?apiVersion=2022-11-28) to salt and encrypt keys. 

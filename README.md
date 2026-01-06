# library_to_run_GitHub_Actions

The purpose of this JavaScript library is to launch Backend processes on GitHub Actions, for Frontend web applications on GitHub Pages. It contains functions that are useful to create web applications using GitHub Pages (a Frontend web application). When calling a model or a database to process a user's input request, the developer must submit the user's data to the model or database using the web application/company keys/tokens on behalf of the user; keys/tokens can either be used from GitHub Secrets on the Backend or they can be encrypted and stored in a file in the repository (ie: Frontend). 

## Specific library function
The library creates a file, in a folder, containing data from the Frontend web application (RepoA), in any repository (RepoB) using RepoB's repository file content key.  The library is called from RepoA on GitHub Pages, it decrypts the repository file content key of RepoB, creates a file with the the user input in RepoB, and can then re-encrypt the key for RepoB. 

This library was inspired by the GitHub workflow called [workflow dispatch event](https://docs.github.com/en/rest/actions/workflows?apiVersion=2022-11-28#create-a-workflow-dispatch-event) that uses the same organizational idea and sends information from RepoA to RepoB.

![alt_text](RepoA_RepoB.png)

The intention of the library is to use it to trigger a GitHub Actions workflow (.yaml). When the library creates the file in RepoB (destination repository), a GitHub Actions script (.yaml) will automatically trigger in RepoB (destination repository). The .yaml script can then process user input on the Backend using any programming language (Python, bash, etc), and then save the results to a file in RepoA or RepoB. The webapp frontend can then read the results back to the user.

The purpose of using an intermediate repository, RepoB, is to allow for security to RepoA. RepoB acts as a central repository with non-critical information inside of it; an encrypted file content key which can be recreated, temporary user input messages from Frontend applications, and the .yaml files for triggering processes to run. If an intrusion occured, RepoB would be vunerable to loosing non-critical information, and RepoA would just loose functional communication without loss of critical data. However, despite the benefits of security, sending information from one repository to a different repository via REST API does takes more time, thus resulting in less quick user responses.

## Example of library usage

The library is available at:
- npm: https://www.npmjs.com/package/library_to_run_github_actions
- jsdelivr: https://www.jsdelivr.com/package/npm/library_to_run_github_actions

[Example script for using the library with or without jsdelivr CDN] https://codesolutions2.github.io/library_to_run_GitHub_Actions/index.html 

Inside index.html the following function is called, also different ways in which to import the library are given. Define names of the following variables: Github owner, RepoA, RepoB, the folder to put the created file inside of RepoB, the file to create in RepoB, the text to put inside the created file. This file will be in RepoA.

RepoB should have the following file structure:
- .github
  - .env (encrypted key of repository(RepoA/RepoB) inside)
  - workflows
    - reset_key_automatically.yaml - The workflow uses a github token (with repository file contents read and write permission) from GitHub Secrets; it encrypts the token using base64 encoding, salting (additional strings added), and scrambling.  The encrypted token is saved in the .github/.env file automatically. 
- README.md (optional)

## Library versions
The available functions that can be exported.

### Version 0 (current version)
- export async function run_backend_process(RepoAobj)
- export async function initialize_github(RepoAobj)
- export async function run_env_decode_desalt(RepoAobj)
- export async function encrypt_text_salt_scramble(obj)
- export async function decode_desalt(obj, x_i)
- export async function isbase64(text)
- export async function PUT_create_a_file_RESTAPI(auth, message, content, desired_path, repoName, repoOwner)
- export async function PUT_add_to_a_file_RESTAPI(auth, message, content, desired_path, sha, repoName, repoOwner)
- export async function DELETE_a_file_RESTAPI(auth, message, desired_path, sha, repoName, repoOwner) 
- export async function GET_text_from_file_wo_auth_GitHub_RESTAPI(desired_filename, desired_foldername, repoB_name, repoOwner)
- export async function GET_fileDownloadUrl_and_sha(desired_filename, desired_foldername, repoB_name, repoOwner)
- export async function rand_perm(x)


### reset_key_automatically.yaml 
name: automatically reset (salt, encrypt) repository key for Frontend file

on:
  schedule:
    - cron: '1 0,3,6,7,11,12,15,19,18,23 * * *'
      
jobs:
  reset_key:
    runs-on: ubuntu-latest

    permissions:
      contents: write

    steps:
      - name: Get repository files (equivalent to git pull)
        uses: actions/checkout@v2
        
      - name: Reset the key automatically
        uses: actions/github-script@v6
        env:
          LIBRARY_TO_RUN_GITHUB_ACTIONS_TOKEN0: "${{ secrets.LIBRARY_TO_RUN_GITHUB_ACTIONS_TOKEN0 }}"
        with:
          result-encoding: string
          script: |
            var n = 1;

            // Resalt and save the key in .env, for the next time
            const alpha = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'; 
            const num = '0123456789'; 
            var alpha_arr = alpha.split(''); 
            var num_arr = num.split('');

            // --------------------------------
            
            // Determine the salt length - it can be up to length n
            // Configuration 0: [1 to n]
            // first part is [0 to n-1], we do not want 0 so shift it by one [1 to n]
            // var new_salt_length = Math.round(Math.random())*(n-1) + 1;
            // OR
            // Configuration 1: [no_salt to n]
            var new_salt_length = Math.round(Math.random())*n;
            console.log('new_salt_length: ', new_salt_length);
            
            // --------------------------------
            
            if (new_salt_length > 0) {
              // Fill a vector new_salt_length long with 0 or 1; 0=salt a letter, 1=salt a number
              var letnum_selection = [];
              for (let i=0; i<new_salt_length; i++) {
                letnum_selection.push(Math.round(Math.random())); 
              }
              // console.log('letnum_selection: ', letnum_selection);
              
              // --------------------------------

              // Create salt (extra strings randomly)
              var salt = letnum_selection.map((row) => { 
                if (row == 0) { 
                  var val = Math.round(Math.random()*alpha_arr.length);
                  // console.log('val: ', val);
                  return alpha_arr[val]; 
                } else { 
                  var val = Math.round(Math.random()*num_arr.length);
                  // console.log('val: ', val);
                  return num_arr[val]; 
                } 
              });
              // console.log('salt: ', salt);
              salt = salt.join('');
            } else {
              salt = "";
            }
            console.log('salt: ', salt);

            // --------------------------------

            var new_auth = process.env.LIBRARY_TO_RUN_GITHUB_ACTIONS_TOKEN0;
            // console.log('new_auth: ', new_auth);

            // --------------------------------
            
            // Add salt to auth_new
            if (Math.round(Math.random()) == 0) {
              // salt front
              new_auth = salt+new_auth;
            } else {
              // salt back
              new_auth = new_auth+salt;
            }

            // --------------------------------

            // Scramble key : Github automatically base64 decodes and searches the strings and can find the key, causing GitHub to disactivate the key automatically for security
            
            // obtain even values of string
            var new_auth_arr = new_auth.split('');
            // console.log('new_auth_arr: ', new_auth_arr);

            var ep = [];
            var ap = [];
            for (let i=0; i<new_auth_arr.length; i++) {
              if (i % 2 == 0) { 
                ep.push(new_auth_arr[i]);
              } else {
                ap.push(new_auth_arr[i]);
              }
            }
            // console.log('ep: ', ep);
            // console.log('ap: ', ap);

            var new_auth1 = ep.join('') + "|" + ap.join('');
            // console.log('new_auth1: ', new_auth1);
            
            new_auth = btoa(new_auth1); // This will be displayed in the file

            // --------------------------------
            
            const fs = require('fs');
            fs.writeFileSync('.github/.env', new_auth);


      - name: Commit and push changes
        run: |
          repoOwner=$(echo "${{ github.repository }}" | cut -d '/' -f 1);
          repoOwnerEmail="XXXX@gmail.com";
          
          git config --global user.email ${repoOwnerEmail};
          git config --global user.name ${repoOwner};
          git pull origin main;
          git checkout main;
          git branch --set-upstream-to origin/main;
          git merge main --ff-only;
          git add -A; 
          git diff-index --quiet HEAD || git commit -m "add files" --allow-empty;
          git push

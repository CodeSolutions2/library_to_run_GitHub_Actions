# library_to_run_GitHub_Actions

The purpose of this JavaScript library is to launch Backend processes on GitHub Actions, for Frontend web applications on GitHub Pages. It contains functions that are useful to create web applications using GitHub Pages (a Frontend web application). When calling a model or a database to process a user's input request, the developer must submit the user's data to the model or database using the web application/company keys/tokens on behalf of the user; keys/tokens can either be used from GitHub Secrets on the Backend or they can be encrypted and stored in a file in the repository (ie: Frontend). 

## Specific library function
The library creates a file, in a folder, containing data from the Frontend web application (RepoA), in any repository (RepoB) using RepoB's repository file content key.  The library is called from RepoA on GitHub Pages, it decrypts the repository file content key of RepoB, creates a file with the the user input in RepoB, and can then re-encrypt the key for RepoB. 

![alt_text](RepoA_RepoB.png)

The intention of the library is to use it with GitHub Actions. When the library creates the file in RepoB, a GitHub Actions script will automatically trigger to either run a process on the user's input or trigger another repository's (ie: RepoA) GitHub Actions script to run. 

The purpose of using an intermediate repository, RepoB, is to allow for security to RepoA. RepoB acts as a central repository with non-critical information inside of it; an encrypted file content key which can be recreated, temporary user input messages from Frontend applications, and the .yaml files for triggering processes to run. If an intrusion occured, RepoB would be vunerable to loosing non-critical information, and RepoA would just loose functional communication without loss of critical data.


## Example of library usage

Inside index.html the following function is called, also different ways in which to import the library are given. Define names of the following variables: Github owner, RepoA, RepoB, the folder to put the created file inside of RepoB, the file to create in RepoB, the text to put inside the created file. This file will be in RepoA.

async function run_selection() {

	// This function creates a file called cb.txt in a folder named webapp in a repository named RepoB. The file cb.txt contains the string assigned to RepoAobj.input_text.
	var RepoAobj = {};
	RepoAobj.repoOwner = 'CodeSolutions2';
	RepoAobj.repoA_name = 'library_to_run_GitHub_Actions';
	RepoAobj.foldername = 'webapp'; // foldername in RepoB	
	RepoAobj.filename = 'cb.txt'; // filename to create in RepoB, in foldername
	RepoAobj.input_text = document.getElementById("input_text").value+"|"+RepoAobj.repoA_name;
	RepoAobj.repoB_name = 'frontend_backend_message_passing_central_repository_v1';

	// await module.run_backend_process(RepoAobj); // Way 1
	await run_backend_process(RepoAobj);

}

RepoB should have the following file structure:
- .github
  - .env (encrypted key of RepoB inside)
- README.md (optional)

Inside of .env put a github token (with repository file content read and write permission) that is base64 encoded, salted (additional strings added), and scrambled (see additional functions create_salt and resalt_auth that should be REMOVED AND PUT ON THE BACKEND SERVER-SIDE). Feel free to add a more secure protocol for token encrypton and modify the decode_desalt function, this library framework uses a basic example of making a token non-visible. 

GitHub recommends using [libsodium-wrappers](https://docs.github.com/en/rest/guides/encrypting-secrets-for-the-rest-api?apiVersion=2022-11-28) to salt and encrypt keys. 

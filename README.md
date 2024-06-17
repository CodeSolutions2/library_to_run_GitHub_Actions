# library_to_run_GitHub_Actions

The purpose of this JavaScript library is to launch Backend processes on GitHub Actions, for Frontend web applications on GitHub Pages.

The library creates a file in a folder containing data from the Frontend web application (RepoA), in any repository (RepoB) using it's repository file content key.  The library is called from RepoA on GitHub Pages, it decrypts the repository file content key of RepoB, creates a file with the the user input in RepoB, and can then re-encrypt the key for RepoB. 

The intention of the library is to use it with GitHub Actions. When the library creates the file in RepoB, a GitHub Actions script will automatically trigger to either run a process on the user's input or trigger another repository's (ie: RepoA) GitHub Actions script to run. 

The purpose of using an intermediate repository, RepoB, is to allow for security to RepoA. RepoB acts as a central repository with non-critical information inside of it; an encrypted file content key which can be recreated, temporary user input messages from Frontend applications, and the .yaml files for triggering processes to run. If an intrusion occured, RepoB would be vunerable to loosing non-critical information, and RepoA would just loose functional communication without loss of critical data.

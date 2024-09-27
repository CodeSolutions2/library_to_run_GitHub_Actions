export async function save_text_input_in_repository_file_process(RepoAobj) {
	
	// This function was previously called run_backend_process(obj), it was changed to save_text_input_in_repository_file_process(obj) for better clarity.
	var obj = await initialize_github(RepoAobj);
	await save_text_input_in_repository_file(obj);
}

// ------------------------------------------------
// HIGHER-LEVEL PROCESS FUNCTIONS
// ------------------------------------------------
export async function initialize_github(RepoAobj) {

	var obj_env = await GET_text_from_file_wo_auth_GitHub_RESTAPI(".env", ".github", RepoAobj.repoB_name, RepoAobj.repoOwner);

	// n is the maximum salt length used
	var obj = {env_text: obj_env.text.replace(/[\n\s]/g, ""), 
		   env_file_download_url: obj_env.file_download_url, 
		   env_sha: obj_env.sha, 
		   n: RepoAobj.n,
		   repoOwner: RepoAobj.repoOwner,
		   filename: RepoAobj.filename, 
		   foldername: RepoAobj.foldername, 
		   input_text: RepoAobj.input_text, 
		   repoB_name: RepoAobj.repoB_name};

	Object.freeze(obj.env_text); // make the original value non-changeable

	return obj;
}

// -----------------------------------------------

export async function decrypt_GitHub_key_from_repository_file(RepoAobj) {

	// Purpose: Decrypt an encrypted GitHub key (obj.auth) in a repository file.
	
	var obj = await initialize_github(RepoAobj);
	
	obj = await decrypt_GitHub_key(obj);

	// obj.auth is the decrypted GitHub key
	return obj;
}

// ----------------------------------------------------

export async function encrypt_GitHub_key_and_save_to_repository_file(obj) {

	// Purpose: Resave the decrypted key (obj.auth) in a repository file.
	// This is equivalent to encrypt_text_with_salt, 

	// [0] If you desire to re-encrypt an existing GitHub key that is encrypted in a file in the repository. 
	// Obtain an existing decrypted GitHub key in a repository file. 
	// var obj = await decrypt_GitHub_key_from_repository_file(RepoAobj);
	// Then call this function.
	// await encrypt_GitHub_key_and_save_to_repository_file(obj);
	
	// OR
	
	// [1] If you desire to encrypt a new GitHub key.
	// Initialize obj.
	// var obj = await initialize_github(RepoAobj);
	// Input the key in an input field.
	// obj.auth = document.getElementById("text_input_id").value;
	// Then call this function.
	// await encrypt_GitHub_key_and_save_to_repository_file(obj);

	// OR 

	// [2] If you desire to encrypt a new GitHub key.
	// Put the key in GitHub Secrets.
	// Use a .yaml workflow (reset_key_automatically.yaml) to encrypt the GitHub key in a repository file
	// --------------------------------
	
	obj.decrypted_file_contents = obj.auth;
	
	obj = await add_salt_to_text(obj);
	obj = await encrypt_text_without_salt(obj);

	// newauth is obj.encrypted_file_contents

	// --------------------------------

	// The key is base64_decoded so that the key is hidden in the file
	await PUT_add_to_a_file_RESTAPI(obj.auth, 'resave the new value', btoa(obj.encrypted_file_contents), obj.env_desired_path, obj.env_sha);
	
}

// ----------------------------------------------------

async function add_salt_to_text(obj) {
	
	obj = await create_salt(obj);
	
	// Add salt
	if (Math.round(Math.random()) == 0) {
		// salt front
		obj.decrypted_file_contents = obj.salt+obj.decrypted_file_contents;
	} else {
		// salt back
		obj.decrypted_file_contents = obj.decrypted_file_contents+obj.salt;
	}
	delete obj.salt;
	
	return obj;
}

// ----------------------------------------------------

export async function encrypt_text(obj) {
	
	// Scramble 
	obj.encrypted_file_contents = obj.decrypted_file_contents.split('').map((val, index) => { if (index % 2 == 0) { return val; } }).join('') + "|" + obj.decrypted_file_contents.split('').map((val, index) => { if (index % 2 != 0) { return val; } }).join('');
	// console.log('obj.encrypted_file_contents:', obj.encrypted_file_contents);
	
	return obj;
}

// ----------------------------------------------------

async function encrypt_text_without_salt(obj) {

	obj.decrypted_file_contents = obj.input_text;

	obj = await encrypt_text(obj);
	// encrypted text is in obj.encrypted_file_contents

	return obj;
}

// ----------------------------------------------------

async function decrypt_text_without_salt(obj) {

	var obj_file = await GET_text_from_file_wo_auth_GitHub_RESTAPI(RepoAobj.filename, RepoAobj.foldername, RepoAobj.repoB_name, RepoAobj.repoOwner);

	obj.encrypted_file_contents = obj_file.text; 
	obj.file_file_download_url = obj_file.file_download_url;
	obj.file_sha = obj_file.sha;

	obj = await decode_desalt(obj, 0);

	return obj.decrypted_file_contents;
}

// ----------------------------------------------------





// ----------------------------------------------------
// EXPORTED SUBFUNCTIONS
// ----------------------------------------------------
export async function isbase64(text) {

	// Purpose: Test if a text string is in base64 format.
	
	try {
		return btoa(atob(text)) === text;
	} catch (error) {
		return false;
	}
}

// ----------------------------------------------------

export async function GET_repository_content(auth, desired_path, repoName, repoOwner) {
	
	// GET repository content: a call that can test the repository key without changing anything in the repository
	// https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28
	var url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${desired_path}`;
	var headers = {"Accept": "application/vnd.github+json", "Authorization": `Bearer ${auth}`, "X-GitHub-Api-Version": "2022-11-28"};
	var options = {method : 'GET', headers: headers};
	
	return await fetch(url, options)
		.catch(error => { console.log("error: ", error); });
}

// ----------------------------------------------------

export async function PUT_create_a_file_RESTAPI(auth, message, content, desired_path, repoName, repoOwner) {
	
	// PUT content into a new file: https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28
	var url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${desired_path}`;
	var data = {"message": message, "committer":{"name":"App name","email":"App email"}, "content": btoa(content)};
	var headers = {"Accept": "application/vnd.github+json", "Authorization": `Bearer ${auth}`, "X-GitHub-Api-Version": "2022-11-28"};
	var options = {method : 'PUT', headers: headers, body : JSON.stringify(data)};
	
	return await fetch(url, options)
		.catch(error => { console.log("error: ", error); });
}

// ----------------------------------------------------

export async function PUT_add_to_a_file_RESTAPI(auth, message, content, desired_path, sha, repoName, repoOwner) {
	
	// PUT content into an existing file: https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28
	let url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${desired_path}`;
	var data = {"message": message, "committer":{"name":"App name","email":"App email"}, "content": btoa(content), "sha": sha};
	var headers = {"Accept": "application/vnd.github+json", "Authorization": `Bearer ${auth}`, "X-GitHub-Api-Version": "2022-11-28"};
	var options = {method : 'PUT', headers: headers, body : JSON.stringify(data)};
	
	return await fetch(url, options)
		.catch(error => { console.log("error: ", error); });
}

// ----------------------------------------------------

export async function DELETE_a_file_RESTAPI(auth, message, desired_path, sha, repoName, repoOwner) {
	
	// DELETE an existing file: https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28
	let url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${desired_path}`;
	var data = {"message": message, "committer":{"name":"App name","email":"App email"}, "sha": sha};
	var headers = {"Accept": "application/vnd.github+json", "Authorization": `Bearer ${auth}`, "X-GitHub-Api-Version": "2022-11-28"};
	var options = {method : 'DELETE', headers: headers, body : JSON.stringify(data)};
	
	return await fetch(url, options)
		.catch(error => { console.log("error: ", error); });
}

// ----------------------------------------------------

export async function GET_text_from_file_wo_auth_GitHub_RESTAPI(desired_filename, desired_foldername, repoB_name, repoOwner) {

	return await GET_fileDownloadUrl_and_sha(desired_filename, desired_foldername, repoB_name, repoOwner)
		.then(async function (obj) {
			var text = "";
			if (obj.file_download_url != ["No_file_found"]) {
				// fetch on first file
				text = await fetch(obj.file_download_url[0])
					.then(response => response.text())
					.then(async function(text) { return text; });
			}
			return {text: text, file_download_url: obj.file_download_url[0], sha: obj.sha_arr[0]};
		})
		.catch(error => { console.log("error: ", error); });
}

// ----------------------------------------------------

export async function GET_fileDownloadUrl_and_sha(desired_filename, desired_foldername, repoB_name, repoOwner) {

	// Returns an object of values that are an array
	var url = `https://api.github.com/repos/${repoOwner}/${repoB_name}/contents`;
	// console.log('url: ', url);

	var data = await fetch(url).then(res => res.json());
	// console.log('data: ', data);

	var flag = "run";
	var max_loop_limit = 0;
	var file_download_url = [];
	var folders = [];
	var sha_arr = [];
	
	while (flag == "run" && max_loop_limit < 5) {
		
		// console.log('flag: ', flag);
		// console.log('max_loop_limit: ', max_loop_limit);

		// search over data to find the desired_filename
		var obj = await loop_over_files_and_folders(data, desired_filename, desired_foldername, file_download_url, folders, sha_arr);
		// console.log('obj: ', obj);
		
		folders = folders.concat(obj.folders);
		folders = [... new Set(folders)];
		// console.log('folders: ', folders);
		
		file_download_url = file_download_url.concat(obj.file_download_url);
		file_download_url = [... new Set(file_download_url)];
		// console.log('file_download_url: ', file_download_url);
		
		sha_arr = sha_arr.concat(obj.sha_arr);
		sha_arr = [... new Set(sha_arr)];
		// console.log('sha_arr: ', sha_arr);
		
		// get list of folders from the main directory
		if (folders.length == 0) {
			if (file_download_url.length == 0) { file_download_url = ["No_file_found"]; }
			if (sha_arr.length == 0) { sha_arr = ["No_file_found"]; }
			flag = "stop";
		} else {
			// There are directories in the main file
			data = await fetch(folders.shift())
				.then(res => res.json())
				.then(async function(data) { return data; });
		}
		max_loop_limit += 1;
	}
	
	return {file_download_url: file_download_url, sha_arr: sha_arr};
}

// ----------------------------------------------------

export async function rand_perm(x) {

	var out = [];
	while (out.length != x.length) {
		out = await get_number(x).then(async function(x_of_y) {
			if (out.includes(x_of_y) == false && typeof x_of_y != "undefined") { 
				out.push(x_of_y);
			}
			return [... new Set(out)]; // ensure that only unique values are stored in out
		});
	}
	
	return out;
	
}  // end of rand_perm

// ----------------------------------------------------







// ----------------------------------------------------
// NON-EXPORTED SUBFUNCTIONS
// ----------------------------------------------------
async function decrypt_GitHub_key(obj) {

	// Decrypt a salted and scrambled GitHub token.  The salt parameter obj.n can range from 0 to n.
	
	// [1] Initialize values
	obj.auth = obj.env_text;
	obj.status = 404;
	
	// [2] Loop over the number of possible values
	let i = 0;
	var x = Array.from({ length: (obj.n*2)+1 }, (_, ind) => ind);
	var x_rand = await rand_perm(x);
	
	// console.log('x: ', x);
	// console.log('x_rand: ', x_rand);

	try {
		while ((/^20/g).test(obj.status) == false && obj.auth != null && i < (obj.n*2)+1) {
			
			obj.encrypted_file_contents = obj.auth;
			
			obj = await decode_desalt(obj,  x_rand[i])
				.then(async function(obj) {
					
					obj.auth = obj.decrypted_file_contents;
					
					// Test getting repository content
					obj.status = await GET_repository_content(obj.auth, obj.foldername+"/"+obj.filename, obj.repoB_name, obj.repoOwner)
						.then(async function(out) { return out.status; })
						.catch(error => { console.log("error: ", error); });
			 		
					return obj;
				})
				.then(async function(obj) {
					// console.log("obj.status:", obj.status);
					
					if ((/^20/g).test(obj.status) == true) {
						// console.log("Match found");
						obj.auth_temp = obj.auth;
						delete obj.auth; // the variable is deleted to force it to stop the loop as quickly as possible, it will then throw an error for the while loop thus the while loop is called in a try catch to prevent errors.
					} else {
						obj.auth = obj.env_text; // reinitialize value to keep the value obj.auth non-visible
					}
					return obj;
				})
				.then(async function(obj) { await new Promise(r => setTimeout(r, 2000)); return obj; })
			
			// Advance while loop
			// console.log("loop i: ", i);
			// console.log("x_rand[i]: ", x_rand[i]);
			i += 1;	
		}
		
	} catch (error) {
		console.log("error: ", error);
		console.log("loop finished!");
	}

	// Reassign obj.auth
	obj.auth = obj.auth_temp; // obj.auth should be undefined if an error occurs
	delete obj.auth_temp;
	
	return obj;
}

// ----------------------------------------------------

// This function was previously called run_backend(obj), it was changed to save_text_input_in_repository_file(obj) for better clarity.
async function save_text_input_in_repository_file(obj) {
	
	// Try each of the 'de-salted' authorization keys to identify the correct key: loop over a REST API request and identify which key succeeds. The salt parameter obj.n can range from 0 to n.
	// console.log('obj.repoB_name: ', obj.repoB_name);
	
	// [0] Determine if filename exists
	var obj_temp = await GET_fileDownloadUrl_and_sha(obj.filename, obj.foldername, obj.repoB_name, obj.repoOwner)

	// [1] Add obj_env and obj_temp to the general object (obj)
	// obj.env_text
	// obj.env_text = "MGV0dHN8dHMgZXQ=";  // for testing
	
	// obj.env_file_download_url
	// obj.env_sha
	obj.env_desired_path = obj.env_file_download_url.split('main/').pop();
	// console.log('obj.env_desired_path: ', obj.env_desired_path);
	
	obj.temp_file_download_url = obj_temp.file_download_url[0]; // this is a string
	obj.temp_desired_path = obj.temp_file_download_url.split('main/').pop();
	obj.temp_sha = obj_temp.sha_arr[0]; // this is a string
	obj.auth = obj.env_text; // Initialize value
	obj.status = 404; // Initialize value
		
	// [2] Loop over the number of possible values
	let i = 0;
	var x = Array.from({ length: (obj.n*2)+1 }, (_, ind) => ind);
	var x_rand = await rand_perm(x);
	
	// console.log('x: ', x);
	// console.log('x_rand: ', x_rand);

	try {
		while ((/^20/g).test(obj.status) == false && obj.auth != null && i < (obj.n*2)+1) {

			obj.encrypted_file_contents = obj.auth;
			
			obj = await decode_desalt(obj,  x_rand[i])
				.then(async function(obj) {

					obj.auth = obj.decrypted_file_contents;
					
					if (obj.temp_file_download_url == "No_file_found") {
						// Option 0: create a new file
					  	obj.status = await PUT_create_a_file_RESTAPI(obj.auth, 'create a new file', obj.input_text, obj.foldername+"/"+obj.filename, obj.repoB_name, obj.repoOwner)
					 		.then(async function(out) { obj.auth = ""; return out.status; })
		 			 		.catch(error => { console.log("error: ", error); });
			 		} else {
						// Option 1: modify an existing file
				 	 	obj.status = await PUT_add_to_a_file_RESTAPI(obj.auth, 'modify an existing file', obj.input_text, obj.temp_desired_path, obj.temp_sha, obj.repoB_name, obj.repoOwner)
					 		.then(async function(out) { obj.auth = ""; return out.status; })
		 			 		.catch(error => { console.log("error: ", error); });
			 		}
					return obj;
				})
				.then(async function(obj) {
					// console.log("obj.status:", obj.status);
					
					if ((/^20/g).test(obj.status) == true) {
						// console.log("Match found");
						delete obj.auth; // the variable is deleted to force it to stop the loop as quickly as possible, it will then throw an error for the while loop thus the while loop is called in a try catch to prevent errors.
					} else {
						obj.auth = obj.env_text; // reinitialize value to keep the value obj.auth non-visible
					}
					
					return obj;
				})
				.then(async function(obj) { await new Promise(r => setTimeout(r, 2000)); return obj; })
			
			// Advance while loop
			// console.log("loop i: ", i);
			// console.log("x_rand[i]: ", x_rand[i]);
			i += 1;	
		}
		
	} catch (error) {
		console.log("error: ", error);
		console.log("loop finished!");
	}
		
}

// ----------------------------------------------------

async function decode_desalt(obj, x_i) {
	
	// 0. Decode the Base64-encoded string --> obtain the salted data in binary string format
	const bool = await isbase64(obj.encrypted_file_contents);
	var var0_str;
	if (bool == true) {
		var0_str = atob(obj.encrypted_file_contents);
	} else {
		var0_str = obj.encrypted_file_contents;
	}
	
	// 1. 'de-salt' the authorization key read from the file
	if (x_i == 0) {
		// console.log('Remove nothing:');
		obj.decrypted_file_contents = await descramble_ver0(var0_str);
	} else if (x_i <= obj.n) {
		// console.log('Remove end:');
		obj.encrypted_file_contents = var0_str.slice(0, var0_str.length - x_i);
		obj.decrypted_file_contents = await descramble_ver0(obj.encrypted_file_contents);
	} else {
		// console.log('Remove beginning:');
		obj.encrypted_file_contents = var0_str.slice(x_i - obj.n, var0_str.length);
		obj.decrypted_file_contents = await descramble_ver1(obj.encrypted_file_contents);
	}
	// console.log('result: ', obj.decrypted_file_contents.slice(0,5));
  return obj;
}

// ----------------------------------------------------

async function descramble_ver0(var3_str) {
	let arr = var3_str.split('').map((val, ind) => {
		if (ind % 2 == 0){
			return var3_str.split('').at(Math.floor(ind/2));
		} else {
			return var3_str.split('').at(Math.floor(ind/2) + 1  + var3_str.split('').indexOf('|'));
		}
	});
	const vals_to_Keep = (x) => x != '|';
	return arr.filter(vals_to_Keep).join('');
}
	
// ----------------------------------------------------

async function descramble_ver1(var3_str) {
	let arr = var3_str.split('').map((val, ind) => {
		if (ind % 2 == 0){
			return var3_str.split('').at(Math.floor(ind/2) + 1  + var3_str.split('').indexOf('|'));
		} else {
			return var3_str.split('').at(Math.floor(ind/2));
		}
	});
	const vals_to_Keep = (x) => x != '|';
	return arr.filter(vals_to_Keep).join('');
}

// ----------------------------------------------------
	
async function loop_over_files_and_folders(data, desired_filename, desired_foldername, file_download_url, folders, sha_arr) {
	
	var regexp = new RegExp(`${desired_filename}`, 'g');
	var regexp_foldername = new RegExp(`${desired_foldername}`, 'g');
	
	// run through files per url directory
	let i = 0;
	while (i < data.length && i < 10) {
		
		if (data[i].type === 'file' && data[i].name.match(regexp) && regexp_foldername.test(data[i].download_url) == true) { 
			file_download_url = data[i].download_url;
			sha_arr = data[i].sha;
			// console.log('file_download_url: ', file_download_url);
			// console.log('Desired file found: ', data[i].url);
		} else if (data[i].type === 'dir') {
			// Store url of directories found
			folders.push(data[i].url);
			// console.log('A directory was found: ', data[i].url);
		// } else {
			// console.log('Desired file not found: ', data[i].url);
		}
		i += 1;
		// console.log('i: ', i);
	}
	
	return {file_download_url: file_download_url, folders: folders, sha_arr: sha_arr}; 
}

// ----------------------------------------------------

async function get_number(x) {
	return x[Math.round(x.length*Math.random())-1];
}

// ----------------------------------------------------

async function create_salt(obj) {
	
	// Resalt and save the key in .env, for the next time
	var alpha = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var num = '0123456789';
	let alpha_arr = alpha.split('');
	let num_arr = num.split('');

	// --------------------------------
	
	// Determine the salt length - it can be up to length n
	// Configuration 0: [1 to n]
	// first part is [0 to n-1], we do not want 0 so shift it by one [1 to n]
	// var new_salt_length = Math.round(Math.random())*(n-1) + 1;
	// OR
	// Configuration 1: [no_salt to n]
	var new_salt_length = Math.round(Math.random())*obj.n;
	// console.log('new_salt_length: ', new_salt_length);

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
		obj.salt = letnum_selection.map((row) => { 
		      if (row == 0) { 
			let val = Math.round(Math.random()*alpha_arr.length);
			// console.log('val: ', val);
			return alpha_arr[val]; 
		      } else { 
			let val = Math.round(Math.random()*num_arr.length);
			// console.log('val: ', val);
			return num_arr[val]; 
		      } 
		});
	
		obj.salt = obj.salt.join('');
	} else {
		obj.salt = "";
	}

	return obj;
}

// ----------------------------------------------------

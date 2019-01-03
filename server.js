const http = require("http"); // need to http
const fs = require("fs"); // need to read static files
const url = require("url"); // to parse url strings

const ROOT_DIR = "html"; // dir to serve static files from

const MIME_TYPES = {
	css : "text/css",
	gif : "image/gif",
	htm : "text/html",
	html : "text/html",
	ico : "image/x-icon",
	jpeg : "image/jpeg",
	jpg : "image/jpeg",
	js : "application/javascript",
	json : "application/json",
	png : "image/png",
	svg : "image/svg+xml",
	txt : "text/plain"
}

const get_mime = function(filename) {
	// Use file extension to determine the correct response MIME type
	for (let ext in MIME_TYPES) {
		if (filename.indexOf(ext, filename.length - ext.length) !== -1) {
			return MIME_TYPES[ext]
		}
	}
	return MIME_TYPES["txt"]
}

http.createServer(
		function(request, response) {

			var urlObj = url.parse(request.url, true, false)
			var receivedData = "";

			// Event handler to collect the message data
			request.on("data", function(chunk) {
				receivedData += chunk;
			});

			// Event handler for the end of the message
			request.on("end", function() {
				// console.log("received data: ", receivedData)
				// console.log("type: ", typeof receivedData)

				// if it is a POST request then echo back the data.
				if (request.method == "POST") {
					// Handle POST requests

					var dataObj = JSON.parse(receivedData)
					// console.log("received data object: ", dataObj)
					// console.log("type: ", typeof dataObj)
					// console.log("USER REQUEST: " + dataObj.text)
					// console.log("request.url: " + request.url)

					// remove extra whitespace
					var songName = dataObj.text.trim()
					// if user saves a song
					if (request.url === '/saveSong') {
						var lines = "";
						// go through the words on the canvas and add them to
						// the file
						for (let i = 0; i < dataObj.lineArray.length; i++) {
							lines = lines + dataObj.lineArray[i].trim();
							if (i < dataObj.lineArray.length - 1)
								lines = lines + '\n';
						}
						// save the file as the filename, which is the text
						// the user entered in the text field
						var filename = 'songs/' + songName + '.txt';
						// asynchronous file writing
						fs.writeFile(filename, lines, function(err, data) {
							if (err) {
								var returnObj = {};
								returnObj.code = 1; // 1 means there's an error
								returnObj.text = "SAVE ERROR: " + songName
								console.log(returnObj.text);
								response.writeHead(200, {
									"Content-Type" : MIME_TYPES["json"]
								})
								response.end(JSON.stringify(returnObj))
								return;
							}
							/*
							 * Regular Expressions were used here. /\[/g means
							 * every "[" in the string. Add spaces before the
							 * "["s -> " [". /\]/g means every "]" in the
							 * string. Add spaces after the "]"s -> "] ". /\r/g
							 * means every carriage return (they're used in text
							 * files).
							 */
							lines = lines.replace(/\[/g, " [").replace(/\]/g,
									"] ").replace(/\r/g, "").split("\n");
							// intialize return object
							var returnObj = {
								code : 0, // 0 means no errors
								text : songName,
								lineArray : lines
							};
							// object to return to client
							response.writeHead(200, {
								"Content-Type" : MIME_TYPES["json"]
							});
							// send back the JSON object
							response.end(JSON.stringify(returnObj));
							return;
						});
					}

					// if user loads an existing song
					if (request.url === '/loadSong') {
						// remove extra whitespace
						var lines = {};
						var filename = 'songs/' + songName + '.txt';
						// asynchronous file reading
						fs.readFile(filename, function(err, data) {
							if (err) {
								var returnObj = {};
								returnObj.code = 1;	// 1 means there's an error
								returnObj.text = "NOT FOUND: " + songName
								console.log(returnObj.text);
								response.writeHead(200, {
									"Content-Type" : MIME_TYPES["json"]
								})
								response.end(JSON.stringify(returnObj))
								return;
							}
							lines = data.toString().replace(/\[/g, " [")
									.replace(/\]/g, "] ").replace(/\r/g, "")
									.split("\n");
							// intialize return object
							var returnObj = {
								code : 0, // 0 means no errors
								text : songName,
								lineArray : lines
							};
							// object to return to client
							response.writeHead(200, {
								"Content-Type" : MIME_TYPES["json"]
							});
							// send back the JSON object as plain text
							response.end(JSON.stringify(returnObj));
							return;
						});
					}
				}

				if (request.method == "GET") {
					// Handle GET requests
					var filePath = ROOT_DIR + urlObj.pathname;
					// set file path to load page
					if (urlObj.pathname === "/")
						filePath = ROOT_DIR + "/index.html";

					fs.readFile(filePath, function(err, data) {
						if (err) {
							// report error to console
							console.log("ERROR: " + JSON.stringify(err));
							// respond with not found 404 to client
							response.writeHead(404);
							response.end(JSON.stringify(err));
							return;
						}
						response.writeHead(200, {
							"Content-Type" : get_mime(filePath)
						});
						// close data stream
						response.end(data);
					});
				}
			})
		}).listen(3000)

console.log("Server Running at PORT 3000  CTRL-C to quit")
console.log("To Test:")
console.log("http://localhost:3000/chord-pro-web-app.html")

// Use javascript array of objects to represent words and their locations
let words = []

let wordBeingMoved

let deltaX, deltaY // location where mouse is pressed
const canvas = document.getElementById('canvas1'); // our drawing canvas

function getWordAtLocation(aCanvasX, aCanvasY) {
	// get the canvas position and size
	let rect = canvas.getBoundingClientRect();
	// horizontal offset: rect.left - canvas.offsetLeft
	// vertical offset: rect.top - canvas.offsetTop
	let x = aCanvasX + rect.left - canvas.offsetLeft;
	let y = aCanvasY + rect.top - canvas.offsetTop;

	let context = canvas.getContext('2d')

	for (let i = 0; i < words.length; i++) {
		let strWidth = context.measureText(words[i].word).width;
		if ((x >= words[i].x) && Math.abs(words[i].x - x) < strWidth
				&& Math.abs(words[i].y - y) < 20) {
			console.log("word i'm clicking on: %s", JSON.stringify(words[i]));
			return words[i]
		}
	}

	return null
}

function drawCanvas() {

	let context = canvas.getContext('2d')

	context.fillStyle = 'white'
	context.fillRect(0, 0, canvas.width, canvas.height) // erase canvas

	context.font = '20pt Courier'
	context.fillStyle = 'cornflowerblue'

	// draw the chords and lyrics onto the canvas
	for (let i = 0; i < words.length; i++) {
		if (words[i].isChord) { // make the chords green
			context.fillStyle = '#12961F';
			context.strokeStyle = '#12961F';
			// draw the chords at each location (without the square brackets)
			context.fillText(words[i].word.substring(1,
					words[i].word.length - 1), words[i].x, words[i].y);
			context.strokeText(words[i].word.substring(1,
					words[i].word.length - 1), words[i].x, words[i].y);
			// console.log("chord:" + words[i].word)
		} else { // make the lyrics blue
			context.fillStyle = '#0060B0';
			context.strokeStyle = '#0060B0';
			context.fillText(words[i].word, words[i].x, words[i].y);
			context.strokeText(words[i].word, words[i].x, words[i].y);
			// console.log("lyric:" + words[i].word)
		}
	}

	let rows = 0;
	// find the row of the last word
	if (words.length > 0)
		rows = words[words.length - 1].row
		// draw lines beneath the rows
		// this helps with determining the words' positions
		// https://www.w3schools.com/tags/canvas_lineto.asp
	for (let i = 0; i <= rows; i++) {
		context.moveTo(20, 80 + i * 80);
		context.lineTo(canvas.width - 20, 80 + i * 80);
	}

	context.stroke()
}

function handleMouseDown(e) {

	// get mouse location relative to canvas top left
	let rect = canvas.getBoundingClientRect()

	let canvasX = e.pageX - rect.left // use jQuery event object pageX & pageY
	let canvasY = e.pageY - rect.top

	console.log("mouse down:" + canvasX + ", " + canvasY)

	wordBeingMoved = getWordAtLocation(canvasX, canvasY)
	if (wordBeingMoved != null) {
		deltaX = wordBeingMoved.x - canvasX
		deltaY = wordBeingMoved.y - canvasY
		$("#canvas1").mousemove(handleMouseMove)
		$("#canvas1").mouseup(handleMouseUp)
	}

	// stop propagation of the event
	// stop any default browser behaviour
	e.stopPropagation()
	e.preventDefault()

	drawCanvas()
}

function handleMouseMove(e) {

	console.log("mouse move")

	// get mouse location relative to canvas top left
	let rect = canvas.getBoundingClientRect()
	let canvasX = e.pageX - rect.left
	let canvasY = e.pageY - rect.top

	wordBeingMoved.x = canvasX + deltaX
	wordBeingMoved.y = canvasY + deltaY
	// estimate which row the word being moved is in
	wordBeingMoved.row = Math.floor(wordBeingMoved.y / 80)

	e.stopPropagation()

	drawCanvas()
}

function handleMouseUp(e) {
	console.log("mouse up")

	e.stopPropagation()

	// remove mouse move and mouse up handlers but leave mouse down handler
	$("#canvas1").off("mousemove", handleMouseMove) // remove mouse move handler
	$("#canvas1").off("mouseup", handleMouseUp) // remove mouse up handler

	drawCanvas() // redraw the canvas
}

// KEY CODES
// should clean up these hard coded key codes
const ENTER = 13
const RIGHT_ARROW = 39
const LEFT_ARROW = 37
const UP_ARROW = 38
const DOWN_ARROW = 40

function handleKeyDown(e) {

	console.log("keydown code = " + e.which)

	let keyCode = e.which
	if (keyCode == UP_ARROW | keyCode == DOWN_ARROW) {
		// prevent browser from using these with text input drop downs
		e.stopPropagation()
		e.preventDefault()
	}

}

function handleKeyUp(e) {
	if (e.which == ENTER) {
		handleSubmitButton() // treat ENTER key like you would a submit
		$('#userTextField').val('') // clear the user text field
	}

	e.stopPropagation()
	e.preventDefault()
}

// clear the HTML paragraph
function clearTextDiv() {
	let textDiv = document.getElementById("text-area")
	textDiv.innerHTML = '';
}

// print text to the HTML paragraph
function printText(str) {
	let textDiv = document.getElementById("text-area")
	textDiv.innerHTML += "<p>" + str + "</p>"
}

function handleSubmitButton() {
	// get text from text input field
	let userText = $('#userTextField').val();

	// user text was not empty
	if (userText && userText != '') {
		let userRequestObj = {
			text : userText
		} // make object to send to server
		// make JSON string
		let userRequestJSON = JSON.stringify(userRequestObj)
		$('#userTextField').val('') // clear the user text field

		// Prepare a POST message for the server and
		// a call back function to catch the server repsonse.
		// alert ("You typed: " + userText)
		// load the song the user requested
		$.post("loadSong", userRequestJSON, function(data, status) {
			console.log("data: " + data)
			console.log("typeof: " + typeof data)
			let responseObj = data

			// "code" in this case means error code
			// 0 means no errors, success
			if (responseObj.code === 0) {
				loadSong(responseObj)
			} else {
				// error
				// clear the words on the screen
				words.length = 0;
				clearTextDiv();
				printText(responseObj.text);
				drawCanvas();
			}
		})
	}
}

function handleRefreshButton() {
	for (let i = 0; i < words.length; i++) {
		if (words[i].isChord === 1) { // adjust the position of the chords
			words[i].y = words[i].row * 80 + 30;
		} else { // adjust the position of the lyrics
			words[i].y = words[i].row * 80 + 60;
		}
	}

	let lineArray = buildLineArray();

	drawCanvas()
	clearTextDiv()
	// print out each line of text
	lineArray.forEach(printText);

}

// ////////////////////////////////////////////////////////////
function buildLineArray() {
	// group words[] based on their line number
	let groups = []
	for (let i = 0; i < words.length; i++) {
		// groups[x] might be null so set it to [] if it is
		// make sure groups[x] is not null when pushing
		groups[words[i].row] = groups[words[i].row] || [];
		groups[words[i].row].push(words[i]);
	}

	// sort/order the elements in groups[x] by x-coordinates
	for (let i = 0; i < groups.length; i++) {
		groups[i].sort(function(a, b) {
			return a.x > b.x ? 1 : -1;
		});
	}

	// combine the elements in groups[x] into a single line
	let lineArray = [];
	for (let i = 0; i < groups.length; i++) {
		lineArray[i] = "";
		for (let j = 0; j < groups[i].length; j++)
			lineArray[i] += groups[i][j].word + " ";
	}

	return lineArray;
}

function loadSong(responseObj) {
	clearTextDiv()
	responseObj.lineArray.forEach(printText);

	// clear the existing words
	words.length = 0;

	let context = canvas.getContext('2d')
	let cSumHeight = 30; // for chords
	let lSumHeight = 60; // for lyrics

	for (let i = 0; i < responseObj.lineArray.length; i++) {
		let nextChord = 40; // where the next chord starts (x position)
		let nextLyric = 40; // where the next lyric starts (x position)

		// \s means whitespace, split at every whitespace
		let wordArray = responseObj.lineArray[i].trim().split(/\s+/);
		for (let j = 0; j < wordArray.length; j++) {
			let ww = wordArray[j];
			let strWidth = context.measureText(ww).width;
			let xx = 0;
			let yy = 0;
			let ic = 0; // ic means "isChord"
			if (ww.startsWith("[")) { // chord
				xx = Math.max(nextChord, nextLyric) - 20;
				yy = cSumHeight;
				ic = 1;
				nextChord = xx + strWidth + 20;
				nextLyric = xx + 20;
			} else { // lyrics
				xx = nextLyric;
				yy = lSumHeight;
				ic = 0;
				nextLyric = xx + strWidth + 20;
			}
			words.push({
				word : ww,
				x : xx,
				y : yy,
				isChord : ic,
				row : i,
			});

		}
		cSumHeight += 80;
		lSumHeight += 80;
	}

	// canvas height depends on how much lines the file has
	canvas.height = lSumHeight;
	drawCanvas()
}

function handleSaveButton() {
	let userText = $('#userTextField').val();
	if (userText == '')
		return;

	let lines = buildLineArray();
	let songName = userText;
	let userRequestObj = {
		text : songName,
		lineArray : lines
	} // make object to send to server
	// make JSON string
	let userRequestJSON = JSON.stringify(userRequestObj)

	$.post("saveSong", userRequestJSON, function(data, status) {
		console.log("data: " + data)
		console.log("typeof: " + typeof data)
		let responseObj = data

		if (responseObj.code > 0) {
			// clear the words on the screen
			words.length = 0;
			clearTextDiv()
			printText(responseObj.text);
			drawCanvas()
		} else {
			clearTextDiv()
			responseObj.lineArray.forEach(printText);
		}
	})
}

var notes1 = [ "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#" ];
var notes2 = [ "A", "Bb", "B", "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab" ];

function noteShift(word, offset) {
	// note that word doesn't contain the square brackets anymore
	// if the chord is 1 character long, ex. "A", "C"
	if (word.length == 1) {
		let id = notes1.indexOf(word);
		// go back to the start of the array
		// prevents array out of bound error
		return notes1[(id + offset + 12) % 12];
	}

	// if the second character of the chord is "#" or "b"
	if (word[1] == "#" || word[1] == "b") {
		// get the string before the "#" or "b"
		// and the string after the "#" or "b", if there is any
		let lStr = word.substring(0, 2);
		let rStr = word.substring(2);
		// take the left string and transpose it up or down
		let id = word[1] == "#" ? notes1.indexOf(lStr) : notes2.indexOf(lStr);
		// if (word[1] == "#") {
		// id = notes1.indexOf(lStr);
		// } else { // word[1] == "b"
		// id = notes2.indexOf(lStr);
		// }
		return notes1[(id + offset + 12) % 12] + rStr;
	}

	let lStr = word[0];
	let rStr = word.substring(1);
	let id = notes1.indexOf(lStr);
	return notes1[(id + offset + 12) % 12] + rStr;
}

// if this chord is a slash chord
function slash(word, offset) {
	let c1 = word.substring(0, word.indexOf('/'));
	let c2 = word.substring(word.indexOf('/') + 1);
	c1 = noteShift(c1, offset);
	c2 = noteShift(c2, offset);
	return c1 + "/" + c2;
}

function noteUp(word) {
	if (word.indexOf('/') > -1)
		return slash(word, 1);
	return noteShift(word, 1);
}

function noteDown(word) {
	if (word.indexOf('/') > -1)
		return slash(word, -1);
	return noteShift(word, -1);
}

// event handling when user presses the "Transpose Up" button
function handleTransUpButton() {
	for (let i = 0; i < words.length; i++) {
		if (words[i].word.indexOf("[") < 0)
			continue;
		// get the chord/note and transpose it up
		let note = words[i].word.substring(1, words[i].word.length - 1);
		words[i].word = "[" + noteUp(note) + "]";
	}
	drawCanvas()
}

// event handling when user presses the "Transpose Down" button
function handleTransDownButton() {
	for (let i = 0; i < words.length; i++) {
		if (words[i].word.indexOf("[") < 0)
			continue;
		// get the chord/note and transpose it down
		let note = words[i].word.substring(1, words[i].word.length - 1);
		words[i].word = "[" + noteDown(note) + "]";
	}
	drawCanvas()
}

$(document).ready(function() {
	// This is called after the broswer has loaded the web page

	// add mouse down listener to our canvas object
	$("#canvas1").mousedown(handleMouseDown)

	// add key handler for the document as a whole, not separate elements.
	$(document).keydown(handleKeyDown)
	$(document).keyup(handleKeyUp)

	// clearTimeout(timer) // to stop

	drawCanvas()

})

const fs = require("fs");

const RESET = "\x1b[0m";
const GREEN = "\x1b[42m";

var nrow;
var ncol;
var exitrow;
var exitcol;

var grid;
var visited = {};
var game = [];		// current sequence of moves
var sol = null;		// solution (shortest game so far)

var pieces;

load_game(process.argv[2]);

var savedpieces = pieces.slice();

run();

play();

// *********************************************************************

function run() {

	// if config already encountered
	var config = grid.join(",");
	if(visited[config] && visited[config] <= game.length) return 
		
	visited[config] = game.length;

	// look for a piece to move

	for(var pid=0;pid<pieces.length;pid++) {

		var piece = pieces[pid];
		
		var row = piece.row;
		var col = piece.col;

		if(piece.dir=="h") {
			if((col+piece.len<=5)&&(grid[row][col+piece.len]<0)) {
				// move piece to the right
				game.push(pid+"r");
				grid[row][col] = -1;
				grid[row][col+piece.len] = pid;
				piece.col++;
				win();
				run();

				// cancel move
				game.pop();
				grid[row][col+piece.len] = -1;
				grid[row][col] = pid;
				piece.col--;
			}

			if((col>0)&&(grid[row][col-1]<0)) {
				// move piece left
				game.push(pid+"l");
				grid[row][col+piece.len-1] = -1;
				grid[row][col-1] = pid;	
				piece.col--;
				run();

				// cancel move
				game.pop();
				grid[row][col-1] = -1;
				grid[row][col+piece.len-1] = pid;
				piece.col++;
			}

		}
		else if(pieces[pid].dir=="v") {

			if((row+piece.len<=5)&&(grid[row+piece.len][col]<0)) {
				// move piece to the bottom
				game.push(pid+"b");
				grid[row][col] = -1;
				grid[row+piece.len][col] = pid;
				piece.row++;
				run();

				// cancel move
				game.pop();
				grid[row+piece.len][col] = -1;
				grid[row][col] = pid;
				piece.row--;
			}

			if((row>0)&&(grid[row-1][col]<0)) {
				// move piece to the top		
				game.push(pid+"t");
				grid[row+piece.len-1][col] = -1;
				grid[row-1][col] = pid;		
				piece.row--;
				run();

				// cancel move
				game.pop();
				grid[row+piece.len-1][col] = pid;
				grid[row-1][col] = -1;
				piece.row++;
			}
		}
	}

}

// *********************************************************************

function win() {
	
	var row = exitrow;
	var col = exitcol;
	
	if(pieces[0].dir=="h") {
		for(var i=0;i<pieces[0].len;i++) {
			if(grid[row][col]!=0) return;
			col ++;
		}
	}
	else if(pieces[0].dir=="v") { 
		for(var i=0;i<pieces[0].col;i++) {
			if(grid[row][col]!=0) return;
			row ++;
		}
	}

	// winning position

	if(!sol)
		sol = game.slice();
	else if(game.length<sol.length)
		sol = game.slice();
}

// *********************************************************************

function load_game(filename) {
	if(!filename) abort("Usage: node unblock.js <filename>");

	try {
		var t = fs.readFileSync(filename,"utf8");
		t = JSON.parse(t);

		if(!("nrow" in t)) abort("Number of rows not specified");
		if(!("ncol" in t)) abort("Number of columns not specified");
		if(!("exitrow" in t)) abort("Exit-row not specified");
		if(!("exitcol" in t)) abort("Exit-column not specified");
		if(!t.pieces) abort("Pieces not specified");	

	
		nrow = t.nrow;
		ncol = t.ncol;
		exitrow = t.exitrow;
		exitcol = t.exitcol;
		pieces = t.pieces;

		grid = [];
		for(var row=0;row<nrow;row++) {
			grid[row] = [];
			for(var col=0;col<ncol;col++) 
				grid[row][col] = -1;
		}

		set_grid();
	}
	catch(err) {
		abort(err);
	}

}

// *********************************************************************

function set_grid() {

	for(var k=0;k<pieces.length;k++) {
		var p = pieces[k];

		if(!("dir" in p)) abort("Direction of piece "+k+" not specified");
		if(!("len" in p)) abort("Length of piece "+k+" not specified");
		if(!("row" in p)) abort("Row of piece "+k+" not specified");
		if(!("col" in p)) abort("Column of piece "+k+" not specified");
	
		var row = p.row;
		var col = p.col;

		for(var i=0;i<p.len;i++) {
			grid[row][col] = k
			row += (p.dir=="h") ? 0:1;
			col += (p.dir=="v") ? 0:1;
		}
	}	
}

// *********************************************************************

function dump_grid(pid) {
	for(var i=0;i<nrow;i++) {
		var s = "";	
		for(var j=0;j<ncol;j++)
			s += f(grid[i][j]);
		console.log(s);
	}
	console.log("-------------------------");

	function f(x) {
		if(x==-1)
			return "  .";

		var r = ""+x;
		while(r.length<2) r = " "+r;
		
		if(pid==x)
			return " "+GREEN+r+RESET;
		else
		
			return " "+r;
	}
}

// *********************************************************************

function play() {
const DIRS = {l:"left",r:"right",t:"top",b:"bottom"};

if(!sol) return;

pieces = savedpieces;

set_grid();		// reset grid from beginning

dump_grid(-1);

for(var i=0;i<sol.length;i++) {	
	var pid = parseInt(sol[i]);
	var dir = sol[i][sol[i].length-1];

	console.log(i+1+" : piece "+pid+" to "+DIRS[dir]);

	var len = pieces[pid].len;
	var row = pieces[pid].row;
	var col = pieces[pid].col;

	switch(dir) {
		case "r":
			pieces[pid].col++;
			grid[row][col] = -1;
			grid[row][col+len] = pid;
			break;

		case "l":
			pieces[pid].col--;
			grid[row][col-1] = pid;
			grid[row][col+len-1] = -1;
			break;

		case "t":
			pieces[pid].row--;
			grid[row-1][col] = pid;
			grid[row+len-1][col] = -1;
			break;

		case "b":
			pieces[pid].row++;
			grid[row][col] = -1;
			grid[row+len][col] = pid;
			break;
	}	
		
	dump_grid(pid);		
}


}

// *********************************************************************

function abort(msg) {
	console.log(msg);
	process.exit(1);
}

// *********************************************************************


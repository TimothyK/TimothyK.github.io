class Cell {
    constructor(cell) {
        this._cell = cell;

        for(let i = 1; i <= 3; i++) {
            if (cell.classList.contains('col' + i))
                this.column = i;
            if (cell.classList.contains('row' + i))
                this.row = i;
        }
        this.id = cell.id;
        this.position = parseInt(cell.id.slice(-1));        
    }

    isOpen() {
        return this._cell.classList.contains('open-cell');
    }

    mark(player) {
        this._cell.classList.remove('open-cell');
        this._cell.innerText = player.token;
        this._player = player;
    }

    getPlayer() {
        return this._player;
    }

    markAsWinner() {
        this._cell.classList.add('winning-cell');
    }
    markAsUnavailable() {
        this._cell.classList.remove('open-cell');
    }

    clear(player) {
        this._cell.classList.add('open-cell');
        this._cell.classList.remove('winning-cell');
        this._cell.innerHTML = '&nbsp;';
        this._player = undefined;
    }    
}

class Line {
    constructor(cells) {
        this.cells = Array.from(cells);
    }

    isWinner() {
        const players = this.cells
            .filter(cell => !cell.isOpen())
            .map(cell => cell.getPlayer());

        if (players.length < this.cells.length)
            return false;

        const firstPlayer = players[0];
        return players.every(x => x === firstPlayer);
    }

    winningPlayer() {
        if (this.isWinner())
            return this.cells[0].getPlayer();
    }
}


class GameBoard {
    static _root = document.getElementById('board');
    static cells = Array.from(this._root.querySelectorAll('td')).map(cell => new Cell(cell));

    static lines = [
        new Line(this.cells.filter(cell => cell.column === 1)),
        new Line(this.cells.filter(cell => cell.column === 2)),
        new Line(this.cells.filter(cell => cell.column === 3)),
        new Line(this.cells.filter(cell => cell.row === 1)),
        new Line(this.cells.filter(cell => cell.row === 2)),
        new Line(this.cells.filter(cell => cell.row === 3)),
        new Line(this.cells.filter(cell => [7,5,3].includes(cell.position))),
        new Line(this.cells.filter(cell => [1,5,9].includes(cell.position)))
    ]
    
    static clear() {
        this.cells.forEach(cell => cell.clear());
    }

    static deactivate() {
        this.cells.forEach(cell => cell.markAsUnavailable());
    }
    
    static highlightWinningLine(winningLine) {
        winningLine.cells.forEach(cell => cell.markAsWinner());
    }

    static findCellById(id) {
        return this.cells.filter(x => x.id === id)[0] || null;
    }
}
GameBoard._root.addEventListener('click', e => {
    const cell = GameBoard.findCellById(e.target.id);
    if (cell !== null)
        Game.onCellClick(cell)
});

class Player {
    constructor(token) {
        this.token = token;
        this.score = 0;
    }    
}

class btnPlayAgain {
    static _root = document.getElementById('btnPlayAgain');
    static show() {
        this._root.style.display = "inline";
        this._root.focus();
    }
    static hide() {
        this._root.style.display = "none";
    }    
}
btnPlayAgain._root.addEventListener('click', e => Game.startGame());

class Instructions {
    static _setInstruction(message) {
        document.getElementById("quickHelp").innerText = message;
    }

    static gameOverDraw() {
        this._setInstruction('The game is a draw');
        btnPlayAgain.show();
    }

    static gameOverYouWin(player) {
        this._setInstruction('Player ' + player.token + ' won.');
        btnPlayAgain.show();
    }

    static itsYourTurn(player) {    
        btnPlayAgain.hide();
        this._setInstruction("It is player " + player.token + "'s turn.");
    }
}

class ScoreBoard {
    static _drawCount = 0;
    static incrementDrawCount() {
        this._drawCount++;
        document.getElementById('score-draw').innerText = this._drawCount;
    }

    static incrementPlayerWins(player) {
        player.score++;
        document.getElementById('score-' + player.token.toLowerCase()).innerText = player.score;
    }
}

class Game {
    static playerX = new Player('X');
    static playerO = new Player('O');
    static currentPlayer = this.playerO;
    static switchPlayer() {
        if (this.currentPlayer === this.playerX)
            this.currentPlayer = this.playerO;
        else
            this.currentPlayer = this.playerX;

        Instructions.itsYourTurn(this.currentPlayer);
    }

    static startGame() {
        GameBoard.clear();
        this.switchPlayer();
    }

    static onCellClick(cell) {
        if (cell.isOpen())
            this.selectCell(cell);
    }

    static selectCell(cell) {
        cell.mark(this.currentPlayer);

        if (this.isGameOver()) {
            if (this.isDraw())
                this.reportDraw();
            else
                this.reportWinner(this.winningLine());
        }
        else {
            this.switchPlayer();
        }
    }
    
    static winningLine() {
        return GameBoard.lines.filter(line => line.isWinner())[0] || null;
    }

    static isGameOver() {
        const emptyCells = GameBoard.cells.filter(cell => cell.isOpen());
        return emptyCells.length === 0 || this.winningLine() !== null;
    }

    static isDraw() {
        return this.isGameOver() && this.winningLine() === null;
    }

    static reportDraw() {
        Instructions.gameOverDraw();
        ScoreBoard.incrementDrawCount();
    }

    static reportWinner(winningLine) {
        GameBoard.deactivate();
        GameBoard.highlightWinningLine(winningLine);        
        const player = winningLine.winningPlayer();
        Instructions.gameOverYouWin(player);
        ScoreBoard.incrementPlayerWins(player);
    }
}

Game.startGame();


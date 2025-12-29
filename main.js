const gameboard = (function () {
  // 3x3 board with undefined as a default value
  const enoughToWin = 3;
  const boardSize = 3;
  const board = Array.from(Array(boardSize), () =>
    new Array(boardSize).fill(undefined)
  );

  // Vectors of possible directions a player cam win in
  const boardDirections = {
    leftDiagonal: { row: 1, col: 1 },
    rightDiagonal: { row: 1, col: -1 },
    vertical: { row: 1, col: 0 },
    horizontal: { row: 0, col: 1 },
  };

  const getBoard = () => board;

  function placeMark(x, y, mark) {
    if (board[x][y]) {
      return;
    }
    board[x][y] = mark;
  }

  function clearBoard() {
    board.forEach((row) => row.fill(undefined));
  }

  // Starting on x, y, determine, whether there are three same marks in the direction
  function isDirectionWin(row, col, direction, mark, markCount = 0) {
    if (board[row][col] !== mark) return false;
    markCount++;
    if (markCount === enoughToWin) return true;
    return isDirectionWin(
      row + direction.row,
      col + direction.col,
      direction,
      mark,
      markCount
    );
  }

  function isBoardFull() {
    return !board.some((row) => row.includes(undefined));
  }

  function isWinner(row, col, mark) {
    const onLeftDiagonal = row === col;
    const onRightDiagonal = row === 2 - col;

    let isWinner =
      isDirectionWin(0, col, boardDirections.vertical, mark, 0) ||
      isDirectionWin(row, 0, boardDirections.horizontal, mark, 0);

    if (onLeftDiagonal)
      isWinner =
        isWinner || isDirectionWin(0, 0, boardDirections.leftDiagonal, mark, 0);

    if (onRightDiagonal)
      isWinner =
        isWinner ||
        isDirectionWin(0, 2, boardDirections.rightDiagonal, mark, 0);

    return isWinner;
  }

  return { getBoard, placeMark, isWinner, isBoardFull, clearBoard };
})();

const game = (function () {
  const maxPlayers = 2;
  let winner = undefined;
  let players = [];
  let cPlayerIndex = 0;
  let round = 0;

  const getPlayers = () => players;

  const getWinner = () => winner;

  function assignPlayer(playerName) {
    const playerMark = players.length === 0 ? "X" : "O";
    const player = createPlayer(playerName, playerMark, players.length + 1);

    players.push(player);
  }

  function _nextPlayerIndex() {
    cPlayerIndex = (cPlayerIndex + 1) % players.length;
  }

  function playRound(row, col) {
    if (players.length < 2) {
      throw new Error("Atleast two players must be present");
    }

    if (winner) {
      throw new Error("Game has already ended");
    }

    if (gameboard.getBoard()[row][col]) {
      throw new Error("This cell is already full");
    }

    round++;
    const cPlayer = players[cPlayerIndex];
    gameboard.placeMark(row, col, cPlayer.getMark());

    if (gameboard.isWinner(row, col, cPlayer.getMark())) winner = cPlayer;
    else if (gameboard.isBoardFull()) winner = false;

    _nextPlayerIndex();
  }

  function restart() {
    players = [];
    winner = undefined;
    gameboard.clearBoard();
    cPlayerIndex = 0;
    round = 0;
  }

  return {
    assignPlayer,
    playRound,
    restart,
    getPlayers,
    getWinner,
    maxPlayers,
  };
})();

function createPlayer(name, mark, id) {
  const getName = () => name;
  const getMark = () => mark;
  const getId = () => id;
  return { getName, getMark, getId };
}

const ui = (function () {
  // Cache dom
  const board = document.querySelector(".board");
  const btnRestart = document.querySelector(".btn--restart");
  const btnStart = document.querySelector(".btn--start");
  const errorMessage = document.querySelector("#error-message");
  const playerForm = document.querySelector("#player-form");
  const playerNameInput = playerForm.querySelector("#player-name");
  const players = document.querySelector(".players");

  // Event listeners
  board.addEventListener("click", handleBoardClick);
  playerForm.addEventListener("submit", handleFormSubmit);
  btnRestart.addEventListener("click", handleRestartClick);
  btnStart.addEventListener("click", handleStartClick);

  // btnRestart.addEventListener("click", handleRestartClick);

  // Event handlers
  function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const playerName = formData.get("player-name");

    game.assignPlayer(playerName);
    _renderPlayer();
    _hideMessage();

    playerNameInput.value = "";
    if (game.getPlayers().length === game.maxPlayers) {
      _toggleForm();
    }
  }

  function handleBoardClick(e) {
    // Edge cases
    if (e.target.dataset.type !== "tile") return;

    if (game.getPlayers().length < game.maxPlayers) {
      _renderMessage("Player/s missing");
      return;
    }

    if (typeof game.getWinner() !== "undefined") return;

    // Functionality - play one round
    _hideMessage();

    const row = parseFloat(e.target.dataset.row);
    const col = parseFloat(e.target.dataset.col);
    game.playRound(row, col);
    _renderBoard();

    const winner = game.getWinner();
    if (typeof winner === "undefined") return;

    // We have a winner;
    const message = winner ? `${winner.name} has won the game!` : "A tie!";
    _renderMessage(message, false);
    _toggleBtn(btnRestart);
  }

  function handleRestartClick() {
    game.restart();
    _renderBoard(true);
    _deletePlayers();
    _toggleBtn(btnStart);
    _toggleBtn(btnRestart);
    _hideMessage();
  }

  function handleStartClick() {
    _renderBoard();
    _toggleForm();
    _toggleBtn(btnStart);
  }

  // DOM creators
  function createTile(row, col, mark) {
    const tile = document.createElement("div");
    tile.textContent = mark;
    tile.classList.add("board__tile");
    tile.dataset.type = "tile";
    tile.dataset.row = `${row}`;
    tile.dataset.col = `${col}`;
    return tile;
  }

  // Renders
  function _renderBoard(hide = false) {
    if (hide) {
      board.classList.add("hidden");
      return;
    }

    board.classList.remove("hidden");
    board.textContent = "";
    const boardScheme = gameboard.getBoard();
    // For each board cell, we create a tile from it and append it to the board
    boardScheme.forEach((row, rowIndex) =>
      row.forEach((col, colIndex) =>
        board.appendChild(
          createTile(
            rowIndex,
            colIndex,
            boardScheme[rowIndex][colIndex]
              ? boardScheme[rowIndex][colIndex]
              : ""
          )
        )
      )
    );
  }

  function _renderPlayer() {
    // Get the latest added player and render it
    const player = game.getPlayers().at(-1);
    const output = document.createElement("output");
    output.textContent = `Player ${player.getId()}: ${player.getName()} with mark ${player.getMark()}`;
    players.appendChild(output);
  }

  function _renderMessage(message, alert = true) {
    errorMessage.textContent = message;
    const state = alert ? "alert" : "success";
    errorMessage.classList.add(state);
    errorMessage.classList.remove("hidden");
  }

  function _deletePlayers() {
    players.textContent = "";
  }

  function _hideMessage() {
    errorMessage.classList.remove("alert", "success");
    errorMessage.classList.add("hidden");
  }

  function _toggleForm() {
    playerForm.classList.toggle("hidden");
  }

  function _toggleBtn(btn) {
    btn.classList.toggle("hidden");
  }
})();

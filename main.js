const gameboard = (function () {
  let board = Array.from(Array(3), () => new Array(3).fill(undefined));

  // $ possible directions to win in
  const boardDirections = {
    leftDiagonal: { x: 1, y: 1 },
    rightDiagonal: { x: 1, y: -1 },
    horizontal: { x: 1, y: 0 },
    vertical: { x: 0, y: 1 },
  };

  const getBoard = () => board;

  function placeMark(x, y, mark) {
    if (board[x][y]) {
      return;
    }
    board[x][y] = mark;
  }

  function clearBoard() {
    board = Array.from(Array(3), () => new Array(3).fill(undefined));
  }

  // Starting on x, y, determine, whether there are three same marks in the direction
  function isDirectionWin(x, y, direction, mark, markCount = 0) {
    if (board[x][y] !== mark) return false;
    markCount++;
    if (markCount === 3) return true;
    return isDirectionWin(
      x + direction.x,
      y + direction.y,
      direction,
      mark,
      markCount
    );
  }

  function isTie() {
    return !board.some((row) => row.includes(undefined));
  }

  function isWinner(x, y, mark) {
    const onLeftDiagonal = x === y;
    const onRightDiagonal = x === 2 - y;

    let isWinner =
      isDirectionWin(0, y, boardDirections.horizontal, mark, 0) ||
      isDirectionWin(x, 0, boardDirections.vertical, mark, 0);

    if (onLeftDiagonal)
      isWinner =
        isWinner || isDirectionWin(0, 0, boardDirections.leftDiagonal, mark, 0);

    if (onRightDiagonal)
      isWinner =
        isWinner ||
        isDirectionWin(0, 2, boardDirections.rightDiagonal, mark, 0);

    return isWinner;
  }

  return { getBoard, placeMark, isWinner, isTie, clearBoard };
})();

const game = (function () {
  const maxPlayers = 2;
  let winner;
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

  function playRound(x, y) {
    if (players.length < 2) {
      throw new Error("Atleast two players must be present");
    }

    if (winner) {
      throw new Error("Game has already ended");
    }

    round++;
    const cPlayer = players[cPlayerIndex];
    gameboard.placeMark(x, y, cPlayer.mark);

    if (gameboard.isWinner(x, y, cPlayer.mark)) {
      winner = cPlayer;
    } else if (gameboard.isTie()) {
      winner = false;
    }

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
  return { name, mark, id };
}

const ui = (function () {
  // Cache dom
  const board = document.querySelector(".board");
  const boardTiles = board.querySelectorAll(".board__tile");
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
    if (e.target.dataset.type !== "tile") return;

    if (game.getPlayers().length < game.maxPlayers) {
      _renderMessage("Player/s missing");
      return;
    }

    if (typeof game.getWinner() !== "undefined") {
      return;
    }

    _hideMessage();

    const x = parseFloat(e.target.dataset.x);
    const y = parseFloat(e.target.dataset.y);

    game.playRound(x, y);
    _renderBoard();

    const winner = game.getWinner();
    if (winner) {
      _renderMessage(`${winner.name} has won the game!`, false);
      _toggleBtn(btnRestart);
    } else if (winner === false) {
      _renderMessage("A tie!");
      _toggleBtn(btnRestart);
    }
  }

  function handleRestartClick() {
    game.restart();
    _renderBoard();
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
  function createTile(x, y, mark) {
    const tile = document.createElement("div");
    tile.textContent = mark;
    tile.classList.add("board__tile");
    tile.dataset.type = "tile";
    tile.dataset.x = `${x}`;
    tile.dataset.y = `${y}`;
    return tile;
  }

  // Renders
  function _renderBoard() {
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
    const player = game.getPlayers().at(-1);
    const output = document.createElement("output");
    output.textContent = `Player ${player.id}: ${player.name} with mark ${player.mark}`;
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

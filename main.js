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

  const getBoard = () => board.map((row) => [...row]);

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
  function checkLine(startRow, startCol, direction, mark) {
    for (let i = 0; i < enoughToWin; i++) {
      const r = startRow + i * direction.row;
      const c = startCol + i * direction.col;
      if (board[r][c] !== mark) return false;
    }
    return true;
  }

  function isBoardFull() {
    return !board.some((row) => row.includes(undefined));
  }

  function isWinner(row, col, mark) {
    const onLeftDiagonal = row === col;
    const onRightDiagonal = row === boardSize - 1 - col;

    let isWinner =
      checkLine(0, col, boardDirections.vertical, mark) ||
      checkLine(row, 0, boardDirections.horizontal, mark);

    if (onLeftDiagonal)
      isWinner =
        isWinner || checkLine(0, 0, boardDirections.leftDiagonal, mark);

    if (onRightDiagonal)
      isWinner =
        isWinner ||
        checkLine(0, boardSize - 1, boardDirections.rightDiagonal, mark);

    return isWinner;
  }

  return { getBoard, placeMark, isWinner, isBoardFull, clearBoard };
})();

const game = (function () {
  const maxPlayers = 2;
  const players = [];
  const boardSize = 3;
  // "setup" | "playing" | "win" | "tie"
  let status = "setup";
  let winner = null;
  let cPlayerIndex = 0;

  const getPlayers = () => [...players];

  const getWinner = () => winner;

  const getStatus = () => status;

  const getBoardSize = () => boardSize;

  function assignPlayer(playerName) {
    if (players.length >= maxPlayers) {
      throw new Error("Maximum players reached");
    }

    const playerMark = players.length === 0 ? "X" : "O";
    const player = createPlayer(playerName, playerMark, players.length + 1);
    players.push(player);

    if (players.length === maxPlayers) {
      status = "playing";
    }
  }

  function _nextPlayerIndex() {
    cPlayerIndex = (cPlayerIndex + 1) % players.length;
  }

  function playRound(row, col) {
    if (players.length < 2) {
      throw new Error("At least two players must be present");
    }

    if (status !== "playing") {
      throw new Error("Game has already ended");
    }

    if (gameboard.getBoard()[row][col]) {
      throw new Error("This cell is already full");
    }

    const cPlayer = players[cPlayerIndex];
    gameboard.placeMark(row, col, cPlayer.getMark());

    if (gameboard.isWinner(row, col, cPlayer.getMark())) {
      winner = cPlayer;
      status = "win";
    } else if (gameboard.isBoardFull()) {
      status = "tie";
    }

    _nextPlayerIndex();

    return cPlayer;
  }

  function restart() {
    // clear players
    players.splice(0, players.length);
    winner = null;
    status = "setup";
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
    getStatus,
    getBoardSize,
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
    renderPlayer();
    hideMessage();

    playerNameInput.value = "";
    if (game.getStatus() === "playing") {
      toggleForm();
    }
  }

  function handleBoardClick(e) {
    if (e.target.dataset.type !== "tile") return;

    try {
      const row = parseInt(e.target.dataset.row);
      const col = parseInt(e.target.dataset.col);
      const cPlayer = game.playRound(row, col);
      handleGameState();
      e.target.textContent = cPlayer.getMark();
    } catch (error) {
      renderMessage(error.message);
    }
  }

  function handleGameState() {
    const status = game.getStatus();

    switch (status) {
      case "win":
        const winner = game.getWinner();
        renderMessage(
          `Player ${winner.getName()} with mark ${winner.getMark()} has won.`,
          false
        );
        toggleBtn(btnRestart);
        break;
      case "tie":
        renderMessage("A tie!", false);
        toggleBtn(btnRestart);
        break;
    }
  }

  function handleRestartClick() {
    game.restart();
    renderBoard();
    deletePlayers();
    toggleBtn(btnStart);
    toggleBtn(btnRestart);
    toggleBoard();
    hideMessage();
  }

  function handleStartClick() {
    renderBoard();
    toggleBoard();
    toggleForm();
    toggleBtn(btnStart);
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
  function renderBoard() {
    board.textContent = "";
    const boardSize = game.getBoardSize();
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        board.appendChild(createTile(i, j));
      }
    }
  }

  function renderPlayer() {
    // Get the latest added player and render it
    const player = game.getPlayers().at(-1);
    const output = document.createElement("output");
    output.textContent = `Player ${player.getId()}: ${player.getName()} with mark ${player.getMark()}`;
    players.appendChild(output);
  }

  function renderMessage(message, alert = true) {
    errorMessage.classList.remove("alert", "success");
    errorMessage.textContent = message;
    const state = alert ? "alert" : "success";
    errorMessage.classList.add(state);
    errorMessage.classList.remove("hidden");
  }

  function deletePlayers() {
    players.textContent = "";
  }

  function hideMessage() {
    errorMessage.classList.remove("alert", "success");
    errorMessage.classList.add("hidden");
  }

  function toggleBoard() {
    board.classList.toggle("hidden");
  }

  function toggleForm() {
    playerForm.classList.toggle("hidden");
  }

  function toggleBtn(btn) {
    btn.classList.toggle("hidden");
  }
})();

const gameboard = (function () {
  let board = Array.from(Array(3), () => new Array(3));

  // $ possible directions to win in
  const boardDirections = {
    leftDiagonal: { x: 1, y: 1 },
    rightDiagonal: { x: -1, y: -1 },
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
    board = Array.from(Array(3), () => new Array(3));
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
    const onRightDiagonal = 3 - x === y;

    let isWinner =
      isDirectionWin(0, y, boardDirections.horizontal, mark, 0) ||
      isDirectionWin(x, 0, boardDirections.vertical, mark, 0);

    if (onLeftDiagonal)
      isWinner =
        isWinner || isDirectionWin(0, 0, boardDirections.leftDiagonal, mark, 0);

    if (onRightDiagonal)
      isWinner =
        isWinner ||
        isDirectionWin(2, 0, boardDirections.rightDiagonal, mark, 0);

    return isWinner;
  }

  return { getBoard, placeMark, isWinner, isTie, clearBoard };
})();

const game = (function () {
  let winner = null;
  const players = [];
  let cPlayerIndex = 0;
  let round = 0;

  function assignPlayer(player) {
    players.push(player);
  }

  function _nextPlayerIndex() {
    cPlayerIndex = (cPlayerIndex + 1) % players.length;
  }

  function playRound(x, y) {
    if (players.length < 2) {
      throw new Error("Atleast two players must be present");
    }

    round++;
    const cPlayer = players[cPlayerIndex];
    gameboard.placeMark(x, y, cPlayer.mark);

    if (gameboard.isWinner(x, y, cPlayer.mark)) {
      winner = cPlayer;
      return;
    } else if (gameboard.isTie()) {
      return;
    }

    _nextPlayerIndex();
  }

  function restart() {
    winner = null;
    gameboard.clearBoard();
    cPlayerIndex = 0;
    round = 0;
  }

  return { assignPlayer, playRound, restart };
})();

function createPlayer(name, mark) {
  return { name, mark };
}

const ui = (function () {
  // const board;

  function cacheDOM() {
    board = board || document.querySelector("#board");
  }

  function render() {}
})();

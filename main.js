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

  return { getBoard, placeMark, isWinner };
})();

function createGame(players) {
  let round = 0;
  let cPlayerIndex = 0;
  let cPlayer = players[0];

  function nextPlayer() {
    cPlayerIndex = (cPlayerIndex + 1) % players.length;
    cPlayer = players[cPlayerIndex];
  }

  function playRound(x, y) {
    round++;
    gameboard.placeMark(x, y, cPlayer.mark);
    console.log(`Round ${round}, ${cPlayer.name}'s turn with ${cPlayer.mark}`);
    console.log(gameboard.getBoard());

    if (gameboard.isWinner(x, y, cPlayer.mark)) {
      console.log(`${cPlayer.name} has won.`);
      return;
    }

    nextPlayer();
  }

  return { playRound };
}

function createPlayer(name, mark) {
  return { name, mark };
}

// const jeff = createPlayer("Jeff", "X");
// const george = createPlayer("George", "O");

// const game = createGame([jeff, george]);
// game.playRound(0, 0);
// game.playRound(1, 0);
// game.playRound(1, 1);
// game.playRound(2, 0);
// game.playRound(2, 2);

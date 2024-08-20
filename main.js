let chessArray = [];
let moves = [];
let isWhiteTurn = true;
const boardSquares = document.getElementsByClassName("square");
const pieces = document.getElementsByClassName("piece");
const piecesImages = document.getElementsByTagName("img");

function fillchessArray() {
  const boardSquares = document.getElementsByClassName("square");
  for (let i = 0; i < boardSquares.length; i++) {
    let row = 8 - Math.floor(i / 8);
    let column = String.fromCharCode(97 + (i % 8));
    let square = boardSquares[i];
    square.id = column + row;
    let color = "";
    let pieceType = "";
    let pieceId = "";
    if (square.querySelector(".piece")) {
      color = square.querySelector(".piece").getAttribute("color");
      pieceType = square.querySelector(".piece").classList[1];
      pieceId = square.querySelector(".piece").id;
    } else {
      color = "blank";
      pieceType = "blank";
      pieceId = "blank";
    }
    let arrayElement = {
      squareId: square.id,
      pieceColor: color,
      pieceType: pieceType,
      pieceId: pieceId,
    };
    chessArray.push(arrayElement);
  }
}
function updatechessArray(currentSquareId, destinationSquareId, chessArray) {
  let currentSquare = chessArray.find(
    (element) => element.squareId === currentSquareId
  );
  let destinationSquareElement = chessArray.find(
    (element) => element.squareId === destinationSquareId
  );
  let pieceColor = currentSquare.pieceColor;
  let pieceType = currentSquare.pieceType;
  let pieceId = currentSquare.pieceId;
  destinationSquareElement.pieceColor = pieceColor;
  destinationSquareElement.pieceType = pieceType;
  destinationSquareElement.pieceId = pieceId;
  currentSquare.pieceColor = "blank";
  currentSquare.pieceType = "blank";
  currentSquare.pieceId = "blank";
}

function deepCopyArray(array) {
  let arrayCopy = array.map((element) => {
    return { ...element };
  });
  return arrayCopy;
}
setupBoardSquares();
setupPieces();
fillchessArray();
function makeMove(
  startSquareId,
  destinationSquareId,
  pieceType,
  pieceColor,
  captured
) {
  moves.push({
    from: startSquareId,
    to: destinationSquareId,
    pieceType: pieceType,
    pieceColor: pieceColor,
    captured: captured,
  });
}

function setupBoardSquares() {
  for (let i = 0; i < boardSquares.length; i++) {
    boardSquares[i].addEventListener("dragover", allowDrop);
    boardSquares[i].addEventListener("drop", drop);
    let row = 8 - Math.floor(i / 8);
    let column = String.fromCharCode(97 + (i % 8));
    let square = boardSquares[i];
    square.id = column + row;
  }
}
function setupPieces() {
  for (let i = 0; i < pieces.length; i++) {
    pieces[i].addEventListener("dragstart", drag);
    pieces[i].setAttribute("draggable", true);
    pieces[i].id =
      pieces[i].className.split(" ")[1] + pieces[i].parentElement.id;
  }
  for (let i = 0; i < piecesImages.length; i++) {
    piecesImages[i].setAttribute("draggable", false);
  }
}
function allowDrop(ev) {
  ev.preventDefault();
}
function drag(ev) {
  const piece = ev.target;
  const pieceColor = piece.getAttribute("color");
  const pieceType = piece.classList[1];
  const pieceId = piece.id;
  if (
    (isWhiteTurn && pieceColor == "white") ||
    (!isWhiteTurn && pieceColor == "black")
  ) {
    const startSquareId = piece.parentNode.id;
    ev.dataTransfer.setData("text", piece.id + "|" + startSquareId);
    const pieceObject = {
      pieceColor: pieceColor,
      pieceType: pieceType,
      pieceId: pieceId,
    };
    let legalSquares = getPossibleMoves(startSquareId, pieceObject, chessArray);
    let legalSquaresJson = JSON.stringify(legalSquares);
    ev.dataTransfer.setData("application/json", legalSquaresJson);
  }
}

function drop(ev) {
  ev.preventDefault();
  let data = ev.dataTransfer.getData("text");
  let [pieceId, startSquareId] = data.split("|");
  let legalSquaresJson = ev.dataTransfer.getData("application/json");
  if (legalSquaresJson.length == 0) return;
  let legalSquares = JSON.parse(legalSquaresJson);

  const piece = document.getElementById(pieceId);
  const pieceColor = piece.getAttribute("color");
  const pieceType = piece.classList[1];

  const destinationSquare = ev.currentTarget;
  let destinationSquareId = destinationSquare.id;

  legalSquares = isMoveValidAgainstCheck(
    legalSquares,
    startSquareId,
    pieceColor,
    pieceType
  );

  if (pieceType == "king") {
    let isCheck = isKingInCheck(destinationSquareId, pieceColor, chessArray);
    if (isCheck) return;
  }

  let squareContent = getPieceAtSquare(destinationSquareId, chessArray);
  if (
    squareContent.pieceColor == "blank" &&
    legalSquares.includes(destinationSquareId)
  ) {
    destinationSquare.appendChild(piece);
    isWhiteTurn = !isWhiteTurn;
    updatechessArray(startSquareId, destinationSquareId, chessArray);
    let captured = false;
    makeMove(
      startSquareId,
      destinationSquareId,
      pieceType,
      pieceColor,
      captured
    );
    checkForCheckMate();
    return;
  }
  if (
    squareContent.pieceColor != "blank" &&
    legalSquares.includes(destinationSquareId)
  ) {
    let children = destinationSquare.children;
    for (let i = 0; i < children.length; i++) {
      if (!children[i].classList.contains("coordinate")) {
        destinationSquare.removeChild(children[i]);
      }
    }
    // while (destinationSquare.firstChild) {
    //   destinationSquare.removeChild(destinationSquare.firstChild);
    // }
    destinationSquare.appendChild(piece);
    isWhiteTurn = !isWhiteTurn;
    updatechessArray(startSquareId, destinationSquareId, chessArray);
    let captured = true;
    makeMove(
      startSquareId,
      destinationSquareId,
      pieceType,
      pieceColor,
      captured
    );
    checkForCheckMate();
    return;
  }
}

function getPossibleMoves(startSquareId, piece, chessArray) {
  const pieceColor = piece.pieceColor;
  const pieceType = piece.pieceType;
  let legalSquares = [];
  if (pieceType == "rook") {
    legalSquares = getRookMoves(startSquareId, pieceColor, chessArray);
    return legalSquares;
  }
  if (pieceType == "bishop") {
    legalSquares = getBishopMoves(startSquareId, pieceColor, chessArray);
    return legalSquares;
  }
  if (pieceType == "queen") {
    legalSquares = getQueenMoves(startSquareId, pieceColor, chessArray);
    return legalSquares;
  }
  if (pieceType == "knight") {
    legalSquares = getKnightMoves(startSquareId, pieceColor, chessArray);
    return legalSquares;
  }

  if (pieceType == "pawn") {
    legalSquares = getPawnMoves(startSquareId, pieceColor, chessArray);
    return legalSquares;
  }
  if (pieceType == "king") {
    legalSquares = getKingMoves(startSquareId, pieceColor, chessArray);
    return legalSquares;
  }
}

function getPawnMoves(startSquareId, pieceColor, chessArray) {
  let diogonalSquares = checkPawnDiagonalCaptures(
    startSquareId,
    pieceColor,
    chessArray
  );
  let forwardSquares = checkPawnForwardMoves(
    startSquareId,
    pieceColor,
    chessArray
  );
  let legalSquares = [...diogonalSquares, ...forwardSquares];
  return legalSquares;
}

function checkPawnDiagonalCaptures(startSquareId, pieceColor, chessArray) {
  const file = startSquareId.charAt(0);
  const rank = startSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let legalSquares = [];
  let currentFile = file;
  let currentRank = rankNumber;
  let currentSquareId = currentFile + currentRank;

  const direction = pieceColor == "white" ? 1 : -1;
  if (!(rank == 8 && direction == 1) && !(rank == 1 && direction == -1))
    currentRank += direction;
  for (let i = -1; i <= 1; i += 2) {
    currentFile = String.fromCharCode(file.charCodeAt(0) + i);
    if (
      currentFile >= "a" &&
      currentFile <= "h" &&
      currentRank <= 8 &&
      currentRank >= 1
    ) {
      currentSquareId = currentFile + currentRank;
      let currentSquare = chessArray.find(
        (element) => element.squareId === currentSquareId
      );
      let squareContent = currentSquare.pieceColor;
      if (squareContent != "blank" && squareContent != pieceColor)
        legalSquares.push(currentSquareId);
    }
  }
  return legalSquares;
}
function checkPawnForwardMoves(startSquareId, pieceColor, chessArray) {
  const file = startSquareId.charAt(0);
  const rank = startSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let legalSquares = [];

  let currentFile = file;
  let currentRank = rankNumber;
  let currentSquareId = currentFile + currentRank;

  const direction = pieceColor == "white" ? 1 : -1;
  currentRank += direction;
  currentSquareId = currentFile + currentRank;
  let currentSquare = chessArray.find(
    (element) => element.squareId === currentSquareId
  );
  let squareContent = currentSquare.pieceColor;
  if (squareContent != "blank") return legalSquares;
  legalSquares.push(currentSquareId);
  if (
    !(
      (rankNumber == 2 && pieceColor == "white") ||
      (rankNumber == 7 && pieceColor == "black")
    )
  )
    return legalSquares;
  currentRank += direction;
  currentSquareId = currentFile + currentRank;
  currentSquare = chessArray.find(
    (element) => element.squareId === currentSquareId
  );
  squareContent = currentSquare.pieceColor;
  if (squareContent != "blank")
    if (squareContent != "blank") return legalSquares;
  legalSquares.push(currentSquareId);
  return legalSquares;
}

function getKnightMoves(startSquareId, pieceColor, chessArray) {
  const file = startSquareId.charCodeAt(0) - 97;
  const rank = startSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentFile = file;
  let currentRank = rankNumber;
  let legalSquares = [];

  const moves = [
    [-2, 1],
    [-1, 2],
    [1, 2],
    [2, 1],
    [2, -1],
    [1, -2],
    [-1, -2],
    [-2, -1],
  ];
  moves.forEach((move) => {
    currentFile = file + move[0];
    currentRank = rankNumber + move[1];
    if (
      currentFile >= 0 &&
      currentFile <= 7 &&
      currentRank > 0 &&
      currentRank <= 8
    ) {
      let currentSquareId = String.fromCharCode(currentFile + 97) + currentRank;
      let currentSquare = chessArray.find(
        (element) => element.squareId === currentSquareId
      );
      let squareContent = currentSquare.pieceColor;
      if (squareContent != "blank" && squareContent == pieceColor)
        return legalSquares;
      legalSquares.push(String.fromCharCode(currentFile + 97) + currentRank);
    }
  });
  return legalSquares;
}
function getRookMoves(startSquareId, pieceColor, chessArray) {
  let moveToEighthRankSquares = moveToEighthRank(
    startSquareId,
    pieceColor,
    chessArray
  );
  let moveToFirstRankSquares = moveToFirstRank(
    startSquareId,
    pieceColor,
    chessArray
  );
  let moveToAFileSquares = moveToAFile(startSquareId, pieceColor, chessArray);
  let moveToHFileSquares = moveToHFile(startSquareId, pieceColor, chessArray);
  let legalSquares = [
    ...moveToEighthRankSquares,
    ...moveToFirstRankSquares,
    ...moveToAFileSquares,
    ...moveToHFileSquares,
  ];
  return legalSquares;
}

function getBishopMoves(startSquareId, pieceColor, chessArray) {
  let moveToEighthRankHFileSquares = moveToEighthRankHFile(
    startSquareId,
    pieceColor,
    chessArray
  );
  let moveToEighthRankAFileSquares = moveToEighthRankAFile(
    startSquareId,
    pieceColor,
    chessArray
  );
  let moveToFirstRankHFileSquares = moveToFirstRankHFile(
    startSquareId,
    pieceColor,
    chessArray
  );
  let moveToFirstRankAFileSquares = moveToFirstRankAFile(
    startSquareId,
    pieceColor,
    chessArray
  );
  let legalSquares = [
    ...moveToEighthRankHFileSquares,
    ...moveToEighthRankAFileSquares,
    ...moveToFirstRankHFileSquares,
    ...moveToFirstRankAFileSquares,
  ];
  return legalSquares;
}
function getQueenMoves(startSquareId, pieceColor, chessArray) {
  let bishopMoves = getBishopMoves(startSquareId, pieceColor, chessArray);
  let rookMoves = getRookMoves(startSquareId, pieceColor, chessArray);
  let legalSquares = [...bishopMoves, ...rookMoves];
  return legalSquares;
}

function getKingMoves(startSquareId, pieceColor, chessArray) {
  const file = startSquareId.charCodeAt(0) - 97; // get the second character of the string
  const rank = startSquareId.charAt(1); // get the second character of the string
  const rankNumber = parseInt(rank); // convert the second character to a number
  let currentFile = file;
  let currentRank = rankNumber;
  let legalSquares = [];
  const moves = [
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 0],
    [-1, 1],
    [-1, -1],
    [1, 0],
  ];

  moves.forEach((move) => {
    let currentFile = file + move[0];
    let currentRank = rankNumber + move[1];

    if (
      currentFile >= 0 &&
      currentFile <= 7 &&
      currentRank > 0 &&
      currentRank <= 8
    ) {
      let currentSquareId = String.fromCharCode(currentFile + 97) + currentRank;
      let currentSquare = chessArray.find(
        (element) => element.squareId === currentSquareId
      );
      let squareContent = currentSquare.pieceColor;
      if (squareContent != "blank" && squareContent == pieceColor) {
        return legalSquares;
      }
      legalSquares.push(String.fromCharCode(currentFile + 97) + currentRank);
    }
  });
  return legalSquares;
}

function moveToEighthRank(startSquareId, pieceColor, chessArray) {
  const file = startSquareId.charAt(0);
  const rank = startSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentRank = rankNumber;
  let legalSquares = [];
  while (currentRank != 8) {
    currentRank++;
    let currentSquareId = file + currentRank;
    let currentSquare = chessArray.find(
      (element) => element.squareId === currentSquareId
    );
    let squareContent = currentSquare.pieceColor;
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares;
    legalSquares.push(currentSquareId);
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares;
}
function moveToFirstRank(startSquareId, pieceColor, chessArray) {
  const file = startSquareId.charAt(0);
  const rank = startSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentRank = rankNumber;
  let legalSquares = [];
  while (currentRank != 1) {
    currentRank--;
    let currentSquareId = file + currentRank;
    let currentSquare = chessArray.find(
      (element) => element.squareId === currentSquareId
    );
    let squareContent = currentSquare.pieceColor;
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares;
    legalSquares.push(currentSquareId);
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares;
}
function moveToAFile(startSquareId, pieceColor, chessArray) {
  const file = startSquareId.charAt(0);
  const rank = startSquareId.charAt(1);
  let currentFile = file;
  let legalSquares = [];

  while (currentFile != "a") {
    currentFile = String.fromCharCode(
      currentFile.charCodeAt(currentFile.length - 1) - 1
    );
    let currentSquareId = currentFile + rank;
    let currentSquare = chessArray.find(
      (element) => element.squareId === currentSquareId
    );
    let squareContent = currentSquare.pieceColor;
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares;
    legalSquares.push(currentSquareId);
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares;
}
function moveToHFile(startSquareId, pieceColor, chessArray) {
  const file = startSquareId.charAt(0);
  const rank = startSquareId.charAt(1);
  let currentFile = file;
  let legalSquares = [];
  while (currentFile != "h") {
    currentFile = String.fromCharCode(
      currentFile.charCodeAt(currentFile.length - 1) + 1
    );
    let currentSquareId = currentFile + rank;
    let currentSquare = chessArray.find(
      (element) => element.squareId === currentSquareId
    );
    let squareContent = currentSquare.pieceColor;
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares;
    legalSquares.push(currentSquareId);
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares;
}
function moveToEighthRankAFile(startSquareId, pieceColor, chessArray) {
  const file = startSquareId.charAt(0);
  const rank = startSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentFile = file;
  let currentRank = rankNumber;
  let legalSquares = [];
  while (!(currentFile == "a" || currentRank == 8)) {
    currentFile = String.fromCharCode(
      currentFile.charCodeAt(currentFile.length - 1) - 1
    );
    currentRank++;
    let currentSquareId = currentFile + currentRank;
    let currentSquare = chessArray.find(
      (element) => element.squareId === currentSquareId
    );
    let squareContent = currentSquare.pieceColor;
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares;
    legalSquares.push(currentSquareId);
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares;
}
function moveToEighthRankHFile(startSquareId, pieceColor, chessArray) {
  const file = startSquareId.charAt(0);
  const rank = startSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentFile = file;
  let currentRank = rankNumber;
  let legalSquares = [];
  while (!(currentFile == "h" || currentRank == 8)) {
    currentFile = String.fromCharCode(
      currentFile.charCodeAt(currentFile.length - 1) + 1
    );
    currentRank++;
    let currentSquareId = currentFile + currentRank;
    let currentSquare = chessArray.find(
      (element) => element.squareId === currentSquareId
    );
    let squareContent = currentSquare.pieceColor;
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares;
    legalSquares.push(currentSquareId);
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares;
}
function moveToFirstRankAFile(startSquareId, pieceColor, chessArray) {
  const file = startSquareId.charAt(0);
  const rank = startSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentFile = file;
  let currentRank = rankNumber;
  let legalSquares = [];
  while (!(currentFile == "a" || currentRank == 1)) {
    currentFile = String.fromCharCode(
      currentFile.charCodeAt(currentFile.length - 1) - 1
    );
    currentRank--;
    let currentSquareId = currentFile + currentRank;
    let currentSquare = chessArray.find(
      (element) => element.squareId === currentSquareId
    );
    let squareContent = currentSquare.pieceColor;
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares;
    legalSquares.push(currentSquareId);
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares;
}
function moveToFirstRankHFile(startSquareId, pieceColor, chessArray) {
  const file = startSquareId.charAt(0);
  const rank = startSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentFile = file;
  let currentRank = rankNumber;
  let legalSquares = [];
  while (!(currentFile == "h" || currentRank == 1)) {
    currentFile = String.fromCharCode(
      currentFile.charCodeAt(currentFile.length - 1) + 1
    );
    currentRank--;
    let currentSquareId = currentFile + currentRank;
    let currentSquare = chessArray.find(
      (element) => element.squareId === currentSquareId
    );
    let squareContent = currentSquare.pieceColor;
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares;
    legalSquares.push(currentSquareId);
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares;
}
function getPieceAtSquare(squareId, chessArray) {
  let currentSquare = chessArray.find(
    (element) => element.squareId === squareId
  );
  const color = currentSquare.pieceColor;
  const pieceType = currentSquare.pieceType;
  const pieceId = currentSquare.pieceId;
  return { pieceColor: color, pieceType: pieceType, pieceId: pieceId };
}

function isKingInCheck(squareId, pieceColor, chessArray) {
  let legalSquares = getRookMoves(squareId, pieceColor, chessArray);
  for (let squareId of legalSquares) {
    let pieceProperties = getPieceAtSquare(squareId, chessArray);
    if (
      (pieceProperties.pieceType == "rook" ||
        pieceProperties.pieceType == "queen") &&
      pieceColor != pieceProperties.pieceColor
    )
      return true;
  }
  legalSquares = getBishopMoves(squareId, pieceColor, chessArray);
  for (let squareId of legalSquares) {
    let pieceProperties = getPieceAtSquare(squareId, chessArray);
    if (
      (pieceProperties.pieceType == "bishop" ||
        pieceProperties.pieceType == "queen") &&
      pieceColor != pieceProperties.pieceColor
    )
      return true;
  }
  legalSquares = checkPawnDiagonalCaptures(squareId, pieceColor, chessArray);
  for (let squareId of legalSquares) {
    let pieceProperties = getPieceAtSquare(squareId, chessArray);
    if (
      pieceProperties.pieceType == "pawn" &&
      pieceColor != pieceProperties.pieceColor
    )
      return true;
  }
  legalSquares = getKnightMoves(squareId, pieceColor, chessArray);
  for (let squareId of legalSquares) {
    let pieceProperties = getPieceAtSquare(squareId, chessArray);
    if (
      pieceProperties.pieceType == "knight" &&
      pieceColor != pieceProperties.pieceColor
    )
      return true;
  }
  legalSquares = getKingMoves(squareId, pieceColor, chessArray);
  for (let squareId of legalSquares) {
    let pieceProperties = getPieceAtSquare(squareId, chessArray);
    if (
      pieceProperties.pieceType == "king" &&
      pieceColor != pieceProperties.pieceColor
    )
      return true;
  }
  return false;
}

function isMoveValidAgainstCheck(
  legalSquares,
  startSquareId,
  pieceColor,
  pieceType
) {
  let kingSquare = isWhiteTurn
    ? getKingLastMove("white")
    : getKingLastMove("black");
  let chessArrayCopy = deepCopyArray(chessArray);
  let legalSquaresCopy = legalSquares.slice();
  legalSquaresCopy.forEach((element) => {
    let destinationId = element;
    chessArrayCopy = deepCopyArray(chessArray);
    updatechessArray(startSquareId, destinationId, chessArrayCopy);
    if (
      pieceType != "king" &&
      isKingInCheck(kingSquare, pieceColor, chessArrayCopy)
    ) {
      legalSquares = legalSquares.filter((item) => item != destinationId);
    }
    if (
      pieceType == "king" &&
      isKingInCheck(destinationId, pieceColor, chessArrayCopy)
    ) {
      legalSquares = legalSquares.filter((item) => item != destinationId);
    }
  });
  return legalSquares;
}

function checkForCheckMate() {
  let kingSquare = isWhiteTurn
    ? getKingLastMove("white")
    : getKingLastMove("black");
  let pieceColor = isWhiteTurn ? "white" : "black";
  let chessArrayCopy = deepCopyArray(chessArray);
  let kingIsCheck = isKingInCheck(kingSquare, pieceColor, chessArrayCopy);
  if (!kingIsCheck) return;
  let possibleMoves = getAllPossibleMoves(chessArrayCopy, pieceColor);
  if (possibleMoves.length > 0) return;
  let message = "";
  isWhiteTurn ? (message = "Black Wins!") : (message = "White Wins!");
  showAlert(message);
}
function getAllPossibleMoves(squaresArray, color) {
  return squaresArray
    .filter((square) => square.pieceColor === color)
    .flatMap((square) => {
      const { pieceColor, pieceType, pieceId } = getPieceAtSquare(
        square.squareId,
        squaresArray
      );
      if (pieceId === "blank") return [];
      let squaresArrayCopy = deepCopyArray(squaresArray);
      const pieceObject = {
        pieceColor: pieceColor,
        pieceType: pieceType,
        pieceId: pieceId,
      };
      let legalSquares = getPossibleMoves(
        square.squareId,
        pieceObject,
        squaresArrayCopy
      );
      legalSquares = isMoveValidAgainstCheck(
        legalSquares,
        square.squareId,
        pieceColor,
        pieceType
      );
      return legalSquares;
    });
}
function getKingLastMove(color) {
  let kingLastMove = moves.find(
    (element) => element.pieceType === "king" && element.pieceColor === color
  );
  if (kingLastMove == undefined) {
    return isWhiteTurn ? "e1" : "e8";
  }
  return kingLastMove.to;
}
function showAlert(message) {
  const alert = document.getElementById("alert");
  alert.innerHTML = message;
  alert.style.display = "block";

  setTimeout(function () {
    alert.style.display = "none";
  }, 3000);
}

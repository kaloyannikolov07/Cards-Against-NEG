const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 4000;
const HAND_SIZE = 7;
const MIN_PLAYERS = 3;
const MAX_ROUNDS = 5;

const blackCardsSeed = [
  "В час по математика, госпожата не издържа и каза: \"Стига с това ___!\"",
  "Най-голямата тайна в нашето училище е ___.",
  "На училищния бал всички ще помнят ___.",
  "Новата забрана в училище: никакво ___.",
  "Когато директорът влезе в стаята, всички скриха ___.",
  "Най-доброто оправдание за закъснение: ___.",
  "На междучасието всички говорят само за ___.",
  "Новият предмет догодина: \"Въведение в ___\".",
  "Печелившата стратегия за контролно е ___.",
  "В ученическото шкафче винаги има ___."
];

const whiteCardsSeed = [
  "домашно, написано от ChatGPT",
  "баничка с айрян",
  "копиране в последния момент",
  "учебник, който никой не е отварял",
  "легендарно отсъствие по физическо",
  "бърз тест без предупреждение",
  "петък последен час",
  "счупен маркер на дъската",
  "меме от класа",
  "безкрайна презентация в PowerPoint",
  "тайната група в Messenger",
  "контролно по история с 5 страници",
  "измислена бележка от родител",
  "училищен Wi-Fi, който не работи",
  "преписване от най-умния в класа",
  "строго \"Телефоните в чантите!\"",
  "бутилка с мистериозна течност",
  "неочаквана проверка на тетрадки",
  "абсурдно дълго домашно",
  "сандвич от лавката"
];

const app = express();
app.use(cors());
app.get("/health", (_, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

/**
 * In-memory room store.
 * key: roomCode, value: room object
 */
const rooms = {};

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return rooms[code] ? createRoomCode() : code;
}

function createDeck(seedCards) {
  return shuffle(seedCards);
}

function drawCard(deck, seedCards) {
  if (deck.length === 0) {
    deck.push(...createDeck(seedCards));
  }
  return deck.pop();
}

function findPlayer(room, socketId) {
  return room.players.find((player) => player.id === socketId);
}

function getWinningPlayers(players) {
  if (players.length === 0) {
    return [];
  }
  const topScore = Math.max(...players.map((player) => player.score));
  return players
    .filter((player) => player.score === topScore)
    .map((player) => ({ id: player.id, name: player.name, score: player.score }));
}

function buildStateForPlayer(room, playerId) {
  const me = room.players.find((player) => player.id === playerId);
  const judge = room.players[room.judgeIndex];

  return {
    roomCode: room.code,
    started: room.started,
    status: room.status,
    round: room.round,
    hostId: room.hostId,
    currentJudgeId: judge ? judge.id : null,
    currentJudgeName: judge ? judge.name : null,
    currentBlackCard: room.currentBlackCard,
    submittedAnswers: room.submittedAnswers.map((entry) => ({
      id: entry.id,
      cardText: entry.cardText
    })),
    players: room.players.map((player) => ({
      id: player.id,
      name: player.name,
      score: player.score
    })),
    myId: me ? me.id : null,
    myHand: me ? me.hand : [],
    hasSubmitted: me ? room.submittedAnswers.some((entry) => entry.playerId === me.id) : false,
    minPlayers: MIN_PLAYERS,
    maxRounds: MAX_ROUNDS,
    gameEnded: room.gameEnded,
    winners: room.winners
  };
}

function emitRoomState(room) {
  room.players.forEach((player) => {
    io.to(player.id).emit("roomState", buildStateForPlayer(room, player.id));
  });
}

function startRound(room) {
  room.round += 1;
  room.status = "answering";
  room.currentBlackCard = drawCard(room.blackDeck, blackCardsSeed);
  room.submittedAnswers = [];

  room.players.forEach((player, index) => {
    // Only non-judge players need cards this round.
    if (index !== room.judgeIndex) {
      while (player.hand.length < HAND_SIZE) {
        player.hand.push(drawCard(room.whiteDeck, whiteCardsSeed));
      }
    }
  });

  emitRoomState(room);
}

function tryMoveToJudging(room) {
  const judge = room.players[room.judgeIndex];
  const expectedSubmissions = room.players.filter((player) => player.id !== judge.id).length;
  if (room.submittedAnswers.length === expectedSubmissions) {
    room.status = "judging";
    room.submittedAnswers = shuffle(room.submittedAnswers);
    emitRoomState(room);
  }
}

function removePlayerFromRoom(socketId) {
  const room = Object.values(rooms).find((entry) =>
    entry.players.some((player) => player.id === socketId)
  );
  if (!room) {
    return;
  }

  const removedIndex = room.players.findIndex((player) => player.id === socketId);
  room.players = room.players.filter((player) => player.id !== socketId);
  room.submittedAnswers = room.submittedAnswers.filter((entry) => entry.playerId !== socketId);

  if (room.players.length === 0) {
    delete rooms[room.code];
    return;
  }

  if (room.hostId === socketId) {
    room.hostId = room.players[0].id;
  }

  if (removedIndex < room.judgeIndex) {
    room.judgeIndex -= 1;
  }
  if (room.judgeIndex >= room.players.length) {
    room.judgeIndex = 0;
  }

  if (room.started && room.players.length < MIN_PLAYERS) {
    room.started = false;
    room.status = "lobby";
    room.gameEnded = false;
    room.winners = [];
    room.currentBlackCard = null;
    room.submittedAnswers = [];
    io.to(room.code).emit("systemMessage", "Недостатъчно играчи. Играта се върна в лобито.");
  } else if (room.started && room.status === "answering") {
    tryMoveToJudging(room);
  }

  emitRoomState(room);
}

io.on("connection", (socket) => {
  socket.on("createRoom", ({ playerName }, callback = () => {}) => {
    const trimmedName = String(playerName || "").trim();
    if (!trimmedName) {
      callback({ ok: false, message: "Името е задължително." });
      return;
    }

    const roomCode = createRoomCode();
    const room = {
      code: roomCode,
      hostId: socket.id,
      started: false,
      status: "lobby",
      round: 0,
      judgeIndex: 0,
      gameEnded: false,
      winners: [],
      currentBlackCard: null,
      submittedAnswers: [],
      blackDeck: createDeck(blackCardsSeed),
      whiteDeck: createDeck(whiteCardsSeed),
      players: [
        {
          id: socket.id,
          name: trimmedName,
          score: 0,
          hand: []
        }
      ]
    };

    rooms[roomCode] = room;
    socket.join(roomCode);
    callback({ ok: true, roomCode });
    emitRoomState(room);
  });

  socket.on("joinRoom", ({ roomCode, playerName }, callback = () => {}) => {
    const cleanCode = String(roomCode || "").trim().toUpperCase();
    const trimmedName = String(playerName || "").trim();
    const room = rooms[cleanCode];

    if (!room) {
      callback({ ok: false, message: "Стаята не съществува." });
      return;
    }
    if (room.players.length >= 10) {
      callback({ ok: false, message: "Стаята е пълна (макс. 10)." });
      return;
    }
    if (!trimmedName) {
      callback({ ok: false, message: "Името е задължително." });
      return;
    }

    room.players.push({
      id: socket.id,
      name: trimmedName,
      score: 0,
      hand: []
    });
    socket.join(cleanCode);
    callback({ ok: true, roomCode: cleanCode });
    emitRoomState(room);
  });

  socket.on("startGame", (_, callback = () => {}) => {
    const room = Object.values(rooms).find((entry) =>
      entry.players.some((player) => player.id === socket.id)
    );
    if (!room) {
      callback({ ok: false, message: "Не сте в стая." });
      return;
    }
    if (room.hostId !== socket.id) {
      callback({ ok: false, message: "Само създателят може да стартира играта." });
      return;
    }
    if (room.players.length < MIN_PLAYERS) {
      callback({ ok: false, message: `Нужни са поне ${MIN_PLAYERS} играчи.` });
      return;
    }

    room.started = true;
    room.status = "answering";
    room.gameEnded = false;
    room.winners = [];
    room.round = 0;
    room.judgeIndex = 0;
    room.currentBlackCard = null;
    room.submittedAnswers = [];
    room.blackDeck = createDeck(blackCardsSeed);
    room.whiteDeck = createDeck(whiteCardsSeed);

    room.players.forEach((player) => {
      player.score = 0;
      player.hand = [];
    });

    startRound(room);
    callback({ ok: true });
  });

  socket.on("submitAnswer", ({ cardText }, callback = () => {}) => {
    const room = Object.values(rooms).find((entry) =>
      entry.players.some((player) => player.id === socket.id)
    );
    if (!room || !room.started || room.status !== "answering") {
      callback({ ok: false, message: "Не може да подадете отговор в момента." });
      return;
    }

    const judge = room.players[room.judgeIndex];
    if (judge.id === socket.id) {
      callback({ ok: false, message: "Съдията не може да подава отговор." });
      return;
    }

    const player = findPlayer(room, socket.id);
    const chosenCard = String(cardText || "");
    if (!player || !player.hand.includes(chosenCard)) {
      callback({ ok: false, message: "Невалиден избор на карта." });
      return;
    }
    if (room.submittedAnswers.some((entry) => entry.playerId === socket.id)) {
      callback({ ok: false, message: "Вече сте подали карта за този рунд." });
      return;
    }

    const removeIndex = player.hand.indexOf(chosenCard);
    if (removeIndex > -1) {
      player.hand.splice(removeIndex, 1);
    }
    player.hand.push(drawCard(room.whiteDeck, whiteCardsSeed));

    room.submittedAnswers.push({
      id: `${socket.id}-${Date.now()}`,
      playerId: socket.id,
      cardText: chosenCard
    });

    callback({ ok: true });
    tryMoveToJudging(room);
    emitRoomState(room);
  });

  socket.on("chooseWinner", ({ submissionId }, callback = () => {}) => {
    const room = Object.values(rooms).find((entry) =>
      entry.players.some((player) => player.id === socket.id)
    );
    if (!room || !room.started || room.status !== "judging") {
      callback({ ok: false, message: "В момента не може да избирате победител." });
      return;
    }

    const judge = room.players[room.judgeIndex];
    if (!judge || judge.id !== socket.id) {
      callback({ ok: false, message: "Само съдията избира победител." });
      return;
    }

    const winningSubmission = room.submittedAnswers.find((entry) => entry.id === submissionId);
    if (!winningSubmission) {
      callback({ ok: false, message: "Невалиден избор." });
      return;
    }

    const winner = room.players.find((player) => player.id === winningSubmission.playerId);
    if (winner) {
      winner.score += 1;
    }

    io.to(room.code).emit(
      "systemMessage",
      winner ? `Рундът е спечелен от ${winner.name}!` : "Избран е победител."
    );

    room.status = "round-end";
    emitRoomState(room);
    callback({ ok: true });

    setTimeout(() => {
      // Room could be deleted or changed while waiting.
      const refreshedRoom = rooms[room.code];
      if (!refreshedRoom || !refreshedRoom.started) {
        return;
      }
      if (refreshedRoom.round >= MAX_ROUNDS) {
        refreshedRoom.started = false;
        refreshedRoom.status = "game-ended";
        refreshedRoom.gameEnded = true;
        refreshedRoom.winners = getWinningPlayers(refreshedRoom.players);
        refreshedRoom.currentBlackCard = null;
        refreshedRoom.submittedAnswers = [];
        io.to(refreshedRoom.code).emit("systemMessage", `Играта приключи след ${MAX_ROUNDS} рунда.`);
        emitRoomState(refreshedRoom);
        return;
      }
      refreshedRoom.judgeIndex = (refreshedRoom.judgeIndex + 1) % refreshedRoom.players.length;
      startRound(refreshedRoom);
    }, 2500);
  });

  socket.on("disconnect", () => {
    removePlayerFromRoom(socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

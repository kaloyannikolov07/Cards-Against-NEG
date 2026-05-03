//initialize the constants
//Test
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const connectDB = require("./db");
const Room = require("./models/Room");
const Game = require("./models/Game");

const PORT = process.env.PORT || 4000;
const HAND_SIZE = 7;
const MIN_PLAYERS = 3;
const MAX_ROUNDS = 10;
const ROUND_RESULT_MS = 4000;

const blackCardsSeed = [
  "Краузе го нямаше, защото ___!",
  "Каназирска чете конско, защото ___.",
  "Манова написа отсъствия, защото ___.",
  "Манова написа отсъствия, защото ___.",
  "Най-големия стрес в НЕГ е ___.",
  "Нено влезе и каза: ___.",
  "Най-доброто оправдание за закъснение: ___.",
  "На междучасието всички говорят само за ___.",
  "Новият предмет догодина: \"Въведение в ___\".",
  "Печелившата стратегия за контролно е ___.",
  "Пусна се пожарната аларма, защото ___.",
  "Шефа не беше на работа, защото ___.",
  "Матурата ще я изкараме с ___.",
  "Отворих школо и видях ___.",
  "Звънеца би и запя: ___.",
  "Пратиха теста в групата и си помислих за ___.",
  "Звърших благодарение на ___.",
  "Най-хубавото нещо в НЕГ е ___.",
  "Тестовете на Велчев водят до ___.",
  "Отсъствах заради ___.",
  "Мис Петрова(Пантера) днес е в настроение, защото ___.",
  "Фашингът се помни с ___.",
  "Първото междучасие винаги е за ___.",
  "Вакарелски чу \"Ваканция\" и си помисли ___.",
  "Kaiser-ът на НЕГ се знае с ___.",
  "Изпитът винаги е полят, когато ___.",
  "Най-голямата разлика между Leistung и DSD е ___.",
  "Всеки заек в Немската знае за ___.",
  "Завършилите НЕГ се връщат да преподават, заради ___.",
  "Учениците се сближават най-много покрай ___."
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
  "метрото спука гума",
  "имаше опашка на турникетите",
  "пуш пауза на оградата",
  "шефа правеше комплименти",
  "ме напъна корема",
  "не съм си изпил кафето",
  "беше заключен/а в кенефа",
  "свършили са фурнетите в лавката",
  "от Доминос отмениха промоцията във вторник",
  "дискотека петък вечер",
  "Фииз и Краузе на афтъра",
  "ChatGPT",
  "СТЕМ надписа с тревичка",
  "сезонна депресия",
  "Раденка",
  "седянка по физическо",
  "гиросите на гърба на НЕG",
  "Шефката",
  "фурнетите в лафката",
  "1,2,3...12!",
  "пуш-пауза на оградата",
  "бърза дрямка",
  "белот на последния чин",
  "пищов в джоба",
  "поредното закъснение",
  "огромният ни двор",
  "дрескодът на Нели Георгиева",
  "синият аутфит на г-жа Цуцуманова",
  "липсата на тоалетна хартия",
  "общия кенеф на втория етаж",
  "да те хванат с пищов",
  "футбол на двора"
];

const app = express();
const path = require("path");

// Connect to MongoDB (async, don't block server start)
connectDB().catch(console.error);

app.use(cors());
app.use(express.json());
app.get("/health", (_, res) => res.json({ ok: true }));

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "./dist")));
  app.get("*", (_, res) => res.sendFile(path.join(__dirname, "./dist/index.html")));
}

// Create room endpoint
app.post("/create-room", async (req, res) => {
  try {
    const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const room = new Room({
      code: roomCode,
      players: [req.body.name || "Player"],
    });

    await room.save();
    res.json({ ok: true, roomCode, room });
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({ ok: false, message: "Failed to create room" });
  }
});

const server = http.createServer(app);
// Socket.IO configuration
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

// Save room state to MongoDB
async function saveRoom(room) {
  try {
    await Game.findOneAndUpdate(
      { roomCode: room.code },
      {
        roomCode: room.code,
        players: room.players.map(p => ({
          name: p.name,
          score: p.score,
          hand: p.hand,
          socketId: p.id,
          hasSwappedCards: p.hasSwappedCards
        })),
        currentRound: room.round,
        blackCard: room.currentBlackCard,
        whiteCardsPlayed: new Map(room.submittedAnswers.map(e => [e.playerId, [e.cardText]])),
        czarSocketId: room.players[room.judgeIndex]?.id || null,
        gameStatus: room.status,
        roundWinner: room.roundResult?.winnerName || room.winners?.[0]?.name || null,
        roundResult: room.roundResult
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error("Error saving room to MongoDB:", err);
  }
}

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

function drawHand(deck, seedCards) {
  return Array.from({ length: HAND_SIZE }, () => drawCard(deck, seedCards));
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
    hasSwappedCards: me ? Boolean(me.hasSwappedCards) : false,
    minPlayers: MIN_PLAYERS,
    maxRounds: MAX_ROUNDS,
    gameEnded: room.gameEnded,
    winners: room.winners,
    roundResult: room.roundResult
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
  room.roundResult = null;

  room.players.forEach((player, index) => {
    player.hand = index === room.judgeIndex ? [] : drawHand(room.whiteDeck, whiteCardsSeed);
  });

  saveRoom(room); // Save to MongoDB
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
    room.roundResult = null;
    room.currentBlackCard = null;
    room.submittedAnswers = [];
    io.to(room.code).emit("systemMessage", "Недостатъчно играчи. Играта се върна в лобито.");
  } else if (room.started && room.status === "answering") {
    tryMoveToJudging(room);
  }

  saveRoom(room); // Save to MongoDB
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
      roundResult: null,
      currentBlackCard: null,
      submittedAnswers: [],
      blackDeck: createDeck(blackCardsSeed),
      whiteDeck: createDeck(whiteCardsSeed),
      players: [
        {
          id: socket.id,
          name: trimmedName,
          score: 0,
          hand: [],
          hasSwappedCards: false
        }
      ]
    };

    rooms[roomCode] = room;
    socket.join(roomCode);
    saveRoom(room); // Save to MongoDB
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
    if (room.started || room.status !== "lobby") {
      callback({ ok: false, message: "Game already started. You cannot join this room now." });
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
      hand: [],
      hasSwappedCards: false
    });
    socket.join(cleanCode);
    saveRoom(room); // Save to MongoDB
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
    room.roundResult = null;
    room.round = 0;
    room.judgeIndex = 0;
    room.currentBlackCard = null;
    room.submittedAnswers = [];
    room.blackDeck = createDeck(blackCardsSeed);
    room.whiteDeck = createDeck(whiteCardsSeed);

    room.players.forEach((player) => {
      player.score = 0;
      player.hand = [];
      player.hasSwappedCards = false;
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

    room.submittedAnswers.push({
      id: `${socket.id}-${Date.now()}`,
      playerId: socket.id,
      cardText: chosenCard
    });

    saveRoom(room); // Save to MongoDB
    callback({ ok: true });
    tryMoveToJudging(room);
    emitRoomState(room);
  });

  socket.on("swapCards", (_, callback = () => {}) => {
    const room = Object.values(rooms).find((entry) =>
      entry.players.some((player) => player.id === socket.id)
    );
    if (!room || !room.started || room.status !== "answering") {
      callback({ ok: false, message: "You cannot swap cards right now." });
      return;
    }

    const judge = room.players[room.judgeIndex];
    if (judge?.id === socket.id) {
      callback({ ok: false, message: "The judge cannot swap cards this round." });
      return;
    }

    const player = findPlayer(room, socket.id);
    if (!player) {
      callback({ ok: false, message: "You are not in a room." });
      return;
    }
    if (player.hasSwappedCards) {
      callback({ ok: false, message: "You already swapped your cards this game." });
      return;
    }
    if (room.submittedAnswers.some((entry) => entry.playerId === socket.id)) {
      callback({ ok: false, message: "You cannot swap cards after submitting an answer." });
      return;
    }

    player.hand = drawHand(room.whiteDeck, whiteCardsSeed);
    player.hasSwappedCards = true;
    saveRoom(room);
    callback({ ok: true });
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
    room.roundResult = {
      winnerId: winner ? winner.id : null,
      winnerName: winner ? winner.name : "Unknown",
      cardText: winningSubmission.cardText
    };

    io.to(room.code).emit(
      "systemMessage",
      winner ? `Рундът е спечелен от ${winner.name}!` : "Избран е победител."
    );

    room.status = "round-end";
    saveRoom(room); // Save to MongoDB
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
        saveRoom(refreshedRoom); // Save to MongoDB
        io.to(refreshedRoom.code).emit("systemMessage", `Играта приключи след ${MAX_ROUNDS} рунда.`);
        emitRoomState(refreshedRoom);
        return;
      }
      refreshedRoom.judgeIndex = (refreshedRoom.judgeIndex + 1) % refreshedRoom.players.length;
      startRound(refreshedRoom);
    }, ROUND_RESULT_MS);
  });

  socket.on("disconnect", () => {
    removePlayerFromRoom(socket.id);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});


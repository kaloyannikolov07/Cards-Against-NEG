import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import Lobby from "./components/Lobby";
import Game from "./components/Game";
import EndScreen from "./components/EndScreen";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "";

function App() {
  const socket = useMemo(() => io(SERVER_URL, { autoConnect: true }), []);

  const [name, setName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [roomState, setRoomState] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    socket.on("roomState", (nextState) => {
      setRoomState(nextState);
    });

    socket.on("systemMessage", (text) => {
      setMessage(text);
    });
    socket.on("connect_error", () => {
      setMessage("Cannot connect to server. Make sure backend is running on port 4000.");
    });

    return () => {
      socket.off("roomState");
      socket.off("systemMessage");
      socket.off("connect_error");
    };
  }, [socket]);

  function createRoom() {
    setMessage("");
    socket.emit("createRoom", { playerName: name }, (result) => {
      if (!result.ok) {
        setMessage(result.message);
      } else {
        setRoomCodeInput(result.roomCode);
      }
    });
  }

  function joinRoom() {
    setMessage("");
    socket.emit("joinRoom", { roomCode: roomCodeInput, playerName: name }, (result) => {
      if (!result.ok) {
        setMessage(result.message);
      }
    });
  }

  function startGame() {
    setMessage("");
    socket.emit("startGame", {}, (result) => {
      if (!result.ok) {
        setMessage(result.message);
      }
    });
  }

  function submitAnswer(cardText) {
    setMessage("");
    socket.emit("submitAnswer", { cardText }, (result) => {
      if (!result.ok) {
        setMessage(result.message);
      }
    });
  }

  function chooseWinner(submissionId) {
    setMessage("");
    socket.emit("chooseWinner", { submissionId }, (result) => {
      if (!result.ok) {
        setMessage(result.message);
      }
    });
  }

  const canJoinOrCreate = name.trim().length > 0;

  if (!roomState) {
    return (
      <div className="container board-container">
        <section className="board-shell" aria-labelledby="board-title">
          <header className="board-banner">
            <h1 id="board-title">Cards Against NEG</h1>
            <p className="board-subtitle">Gather your friends and start the game</p>
          </header>

          <div className="panel player-name-panel">
            <label htmlFor="name">🎲 Your name</label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Example: Kaloyan"
            />
          </div>

          <div className="lobby-cards">
            <section className="panel lobby-card" aria-labelledby="create-room-title">
              <h2 id="create-room-title">🃏 Create Room</h2>
              <p className="card-hint">Start a fresh table and invite players.</p>
              <button type="button" onClick={createRoom} disabled={!canJoinOrCreate} className="btn-create">
                Create Room
              </button>
            </section>

            <section className="panel lobby-card" aria-labelledby="join-room-title">
              <h2 id="join-room-title">🎯 Join Room</h2>
              <p className="card-hint">Use a room code to jump right in.</p>
              <label htmlFor="roomCode">Room code</label>
              <input
                id="roomCode"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="ABCDE"
              />
              <button
                type="button"
                onClick={joinRoom}
                disabled={!canJoinOrCreate || roomCodeInput.length < 4}
                className="btn-join"
              >
                Join Room
              </button>
            </section>
          </div>

          {message && <p className="message">{message}</p>}
        </section>
      </div>
    );
  }

  return (
    <>
      {!roomState.started ? (
        roomState.gameEnded ? (
          <EndScreen state={roomState} onStartGame={startGame} />
        ) : (
          <Lobby state={roomState} onStartGame={startGame} />
        )
      ) : (
        <Game state={roomState} onSubmitAnswer={submitAnswer} onChooseWinner={chooseWinner} />
      )}
      {message && (
        <div className="container">
          <p className="message">{message}</p>
        </div>
      )}
    </>
  );
}

export default App;

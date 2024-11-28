const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname + "/public"));

const players = {}; // Armazenar jogadores e suas posições

io.on("connection", (socket) => {
  console.log("Novo jogador conectado:", socket.id);

  // Criar novo jogador com posição inicial
  players[socket.id] = { x: Math.random() * 400, y: Math.random() * 400 };

  // Enviar estado inicial para o novo jogador
  socket.emit("estadoInicial", players);

  // Informar a todos que um novo jogador entrou
  socket.broadcast.emit("novoJogador", { id: socket.id, ...players[socket.id] });

  // Atualizar a posição do jogador quando ele se move
  socket.on("movimento", (dados) => {
    if (players[socket.id]) {
      players[socket.id].x += dados.dx;
      players[socket.id].y += dados.dy;
      io.emit("atualizarJogador", { id: socket.id, ...players[socket.id] });
    }
  });

  // Remover jogador quando desconectar
  socket.on("disconnect", () => {
    console.log("Jogador desconectado:", socket.id);
    delete players[socket.id];
    io.emit("removerJogador", socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

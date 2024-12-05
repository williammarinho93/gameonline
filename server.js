const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname + "/public"));

const players = {}; // Jogadores e suas informações
let quadradoPontos = gerarQuadrado(); // Quadrado preto inicial

// Função para gerar posição aleatória do quadrado de pontos
function gerarQuadrado() {
  return {
    x: Math.random() * 480,
    y: Math.random() * 480,
    tamanho: 20,
  };
}

io.on("connection", (socket) => {
  console.log("Novo jogador conectado:", socket.id);

  // Adicionar jogador com posição inicial e pontuação 0
  players[socket.id] = {
    x: Math.random() * 400,
    y: Math.random() * 400,
    pontos: 0,
    nome: `Jogador ${socket.id.slice(0, 5)}`, // Nome padrão
  };

  // Enviar estado inicial para o novo jogador
  socket.emit("estadoInicial", { players, quadradoPontos });

  // Informar a todos que um novo jogador entrou
  socket.broadcast.emit("novoJogador", { id: socket.id, ...players[socket.id] });

  // Atualizar nome do jogador
  socket.on("atualizarNome", (nome) => {
    if (players[socket.id]) {
      players[socket.id].nome = nome || `Jogador ${socket.id.slice(0, 5)}`;
      io.emit("atualizarRanking", players);
    }
  });

  // Atualizar posição do jogador
  socket.on("movimento", (dados) => {
    if (players[socket.id]) {
      players[socket.id].x += dados.dx;
      players[socket.id].y += dados.dy;

      // Verificar se o jogador pegou o quadrado de pontos
      if (
        players[socket.id].x < quadradoPontos.x + quadradoPontos.tamanho &&
        players[socket.id].x + 20 > quadradoPontos.x &&
        players[socket.id].y < quadradoPontos.y + quadradoPontos.tamanho &&
        players[socket.id].y + 20 > quadradoPontos.y
      ) {
        players[socket.id].pontos += 1; // Incrementar pontuação
        quadradoPontos = gerarQuadrado(); // Gerar novo quadrado
        io.emit("novoQuadrado", quadradoPontos); // Atualizar o quadrado para todos
      }

      io.emit("atualizarJogador", { id: socket.id, ...players[socket.id] });
      io.emit("atualizarRanking", players); // Atualizar ranking para todos
    }
  });

  // Remover jogador ao desconectar
  socket.on("disconnect", () => {
    console.log("Jogador desconectado:", socket.id);
    delete players[socket.id];
    io.emit("removerJogador", socket.id);
    io.emit("atualizarRanking", players);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

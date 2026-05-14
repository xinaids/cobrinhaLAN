# 🐍 cobrinhaLAN

> Snake multiplayer em tempo real para jogar na rede local — WebSocket + Canvas 2D

![Jogadores](https://img.shields.io/badge/jogadores-até%204-brightgreen)
![Node](https://img.shields.io/badge/node-%3E%3D16-green)
![Licença](https://img.shields.io/badge/licença-MIT-blue)

## O que é

cobrinhaLAN é um jogo da cobrinha multiplayer que roda direto no navegador, sem instalar nada nos clientes. Um jogador sobe o servidor Node.js, compartilha o IP na rede local, e todo mundo entra pelo browser — até 4 jogadores simultâneos.

## Funcionalidades

- Até 4 jogadores simultâneos com cores distintas
- Lobby de espera antes de iniciar
- Placar em tempo real durante a partida
- Contagem regressiva 3-2-1-GO ao iniciar
- Reinício de partida sem precisar reconectar
- Controles por teclado (WASD ou setas) e D-pad touch para mobile
- Swipe gesture no canvas para celular
- Nome salvo automaticamente entre sessões
- Visual cyberpunk com scanlines e efeitos de glow
- Responsivo — funciona em qualquer tela

## Dependências

- [Node.js](https://nodejs.org) v16+
- Pacote `ws` (WebSocket)

## Instalar e rodar

```bash
npm install
node server.js
```

Acesse no navegador:

```
http://localhost:8080
```

## Rede local (outros jogadores)

Descubra seu IP local:

```bash
# Linux/macOS
ip addr show   # ou: hostname -I

# Windows
ipconfig
```

Compartilhe com os outros jogadores:

```
http://192.168.1.X:8080
```

## Estrutura

```
server.js    → servidor Node.js (WebSocket :12345, HTTP :8080)
index.html   → cliente completo (Canvas 2D, controles, UI)
package.json → dependências
```

## Portas

| Serviço   | Porta |
|-----------|-------|
| HTTP (jogo) | 8080 |
| WebSocket   | 12345 |

Mude no `server.js` se necessário.

## Controles

| Dispositivo | Controles |
|-------------|-----------|
| Teclado | WASD ou Setas direcionais |
| Mobile  | D-pad na tela ou swipe no canvas |

## Por que não funciona no GitHub Pages?

O jogo depende de um servidor WebSocket rodando em Node.js — o GitHub Pages só hospeda arquivos estáticos, então **não é compatível**. Para jogar, basta rodar `node server.js` em qualquer máquina na rede local e acessar pelo IP.

Se quiser expor para a internet, use um servidor com suporte a WebSocket (Railway, Render, VPS própria).

## Licença

MIT

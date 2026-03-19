# CobreLAN Web 🐍
Snake multiplayer no navegador — WebSocket + Canvas

## Dependências
- [Node.js](https://nodejs.org) (v16+)

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
server.js    → servidor Node.js (WebSocket na porta 12345, HTTP na 8080)
index.html   → cliente completo (Canvas 2D, teclado, D-pad mobile)
```

## Portas
| Serviço    | Porta |
|------------|-------|
| HTTP (jogo)| 8080  |
| WebSocket  | 12345 |

Mude no server.js se necessário.

## Controles
- **Teclado:** WASD ou Setas
- **Mobile:** D-pad aparece automaticamente em telas touch

## Funcionalidades
- ✅ Até 4 jogadores simultâneos
- ✅ Lobby de espera antes de iniciar
- ✅ Placar em tempo real
- ✅ Reiniciar partida sem reconectar
- ✅ Responsivo (funciona no celular)
- ✅ Compatível com qualquer navegador moderno

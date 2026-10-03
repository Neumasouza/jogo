# MEGAMANIA Clone — Shmup Espacial 8-bit

Shmup de tela fixa inspirado no Megamania (Atari). Nave move só na horizontal, tiro vertical rápido, 5 ondas, barra de energia que drena sempre.

## Rodar

- Desktop: abra `index.html` no navegador. Setas/AD movem, Espaço atira.
- Mobile: abra `index.html`, use ◀ ▶ + FIRE ou arraste no canvas.

Sem build, sem dependências. Som 100% sintetizado (Web Audio).

## Regras

- Energia (100) drena ~3.6/s. Limpar a onda: +40. Trocar de fase: renova 100. Zerar: perde 1 vida.
- 3 vidas. Contato com inimigo ou tiro inimigo = morte.
- Inimigos: zigue-zague + descida lenta. Só 1 tiro inimigo ativo por vez.
- Ondas: 1 Hambúrguer, 2 Bolacha, 3 Ferro, 4 Gravata, 5 Diamante. Velocidade +15-20% por fase. Após fase 5: modo infinito.
- Score em cima, energia embaixo. HI salvo em `localStorage`.

## Arquivos

- `index.html` — shell + overlays + touch
- `css/style.css` — layout responsivo, canvas pixelated
- `js/main.js` — loop timestep fixo 60Hz
- `js/game.js` — estados, colisão AABB reduzida, energia, score
- `js/entities.js` — pools (bullets/partículas)
- `js/sprites.js` — pixel-art procedural 16px
- `js/levels.js` — 5 ondas
- `js/input.js` — teclado + touch
- `js/audio.js` — laser + explosão crushing

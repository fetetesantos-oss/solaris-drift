# SOLARIS DRIFT

Jogo arcade de ação e combate espacial em **3D (WebGL)** feito em HTML5, CSS e JavaScript puro — zero dependências externas, carregamento instantâneo e jogável no PC e no celular.

**Jogar agora (GitHub Pages):** https://fetetesantos-oss.github.io/solaris-drift/

## Recursos

- **Motor WebGL 3D customizado** com shaders GLSL próprios (iluminação direcional, especular, Fresnel rim lighting, névoa de profundidade e campo estelar em GPU)
- **3 naves selecionáveis:** *Valkyrie Mk.IV* (Equilibrada), *Interceptor S-9* (Velocidade) e *Bastion Heavy* (Blindada)
- **Cânion orbital procedural** com 3 setores de atmosfera distintos (*Órbita Solaris*, *Cânion Criogênico* e *Fenda de Ignição*)
- **Combate dinâmico:** asteroides, pilares orbitais, esquadrões *Viper* e *Mantis*, anéis de combo, power-ups (*Escudo*, *Canhão Triplo*, *Pulso PEM Nova*) e batalhas contra o chefão **Couraçado Leviathan**
- **Áudio procedural** sintetizado em tempo real via Web Audio API
- **Recordes persistidos** localmente no navegador (`localStorage`)

## Controles

| Ação | Teclado | Mouse / Celular |
| --- | --- | --- |
| Mover nave | `W A S D` ou `↑ ↓ ← →` | Arrastar na tela (ou modo **Mouse Livre**) |
| Atirar | `Espaço` ou `J` (ou `F` para **Auto-Tiro**) | Clique esquerdo / tocar na tela |
| Turbo (2× pontos) | `Shift` | Botão **Turbo** na tela |
| Manobra 360° (esquiva e deflexão) | `E`, `Q` ou toque duplo em `A`/`D` | Clique direito / botão **360°** |
| Pausar / Silenciar | `P` ou `Esc` / `M` | Botões no topo direito |

## Executar localmente

Como não há dependências nem etapa de build, basta abrir [index.html](index.html) em qualquer navegador moderno ou iniciar um servidor estático:

```bash
python3 -m http.server 8080
```

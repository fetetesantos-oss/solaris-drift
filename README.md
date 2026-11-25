# SOLARIS DRIFT

Jogo arcade de ação, combate e exploração espacial em **3D (WebGL 2/1)** feito em HTML5, CSS puro e ES Modules JavaScript — zero dependências externas, carregamento instantâneo e jogável no PC e no celular.

**Jogar agora (GitHub Pages):** https://fetetesantos-oss.github.io/solaris-drift/

## Destaques da Evolução Visual & Criativa

- **Motor WebGL 2/1 Modular (`js/render/`):**
  - Skybox procedural de **nebulosas e Via Láctea** pré-renderizado na GPU por região (60 FPS estáveis no mobile)
  - **Bloom seletivo em FBO** (meia resolução) + **ACES Filmic Tone Mapping** + aberração cromática no Turbo
  - Shader **PBR-lite Heliotech** com matriz normal corrigida, micro-painéis metálicos e dano visual progressivo
  - **Planetas gigantes atmosféricos** (5 tipos: gigante gasoso, exoplaneta com nuvens, mundo criogênico, estrela vulcânica e singularidade)
  - **Escudo hexagonal 3D** com onda de impacto, **rastros contínuos nas pontas das asas** (*wingtip ribbons*) e explosões multicamada com billboards aditivos em lote
  - **Perfis gráficos adaptativos** (`Auto / Alto / Médio / Leve`)
- **5 Regiões Espaciais com Geometria e Mecânicas Próprias:**
  1. **Órbita Solaris** — megaestrutura heliotécnica e anéis solares
  2. **Cinturão de Kharon** — espaço aberto 360° com asteroides fragmentáveis
  3. **Nebulosa Criogênica** — nuvens luminosas, monolitos de gelo e drones escudados *Aegis*
  4. **Fenda de Ignição** — coroa estelar com alertas e varreduras de **Erupção Solar**
  5. **Ruínas do Horizonte** — portais monolíticos antigos orbitando uma singularidade
- **Combate, Missões & Chefões Exclusivos:**
  - 6 classes de inimigos (*Viper*, *Mantis*, *Aegis* escudado, *Spectre Sniper* com mira laser, *Enxame* e *Minas em cadeia*)
  - 4 chefões únicos (*Couraçado Leviathan*, *Colosso Minerador Krag*, *Arconte Criogênico* e *Fênix Solar*)
  - **Mapa Estelar ramificado** entre setores + missões dinâmicas (*Escaneamento de Relíquias*, *Interceptação de Comboio* e *Fenda de Velocidade*) + **Códice Estelar**
- **Hangar 3D Interativo & Progressão:**
  - 5 naves Heliotech (*Valkyrie Mk.IV*, *Interceptor S-9*, *Bastion Heavy*, *Mirage-X* e *Aurelia Prime*)
  - Upgrades permanentes (Blindagem, Armas, Reator, Lançador de Mísseis Teleguiados) e 5 esquemas de pintura/propulsores
  - Áudio procedural adaptativo via Web Audio API (trilha dinâmica entre exploração, combate e chefão)

## Controles

| Ação | Teclado | Mouse / Celular |
| --- | --- | --- |
| Mover nave | `W A S D` ou `↑ ↓ ← →` | Arrastar na tela (ou modo **Mouse Livre**) |
| Atirar | `Espaço` ou `J` (`F` = **Auto-Tiro**) | Clique esquerdo / tocar na tela |
| Mísseis Teleguiados | `R` | Botão **Míssil** na tela |
| Turbo (2× pontos) | `Shift` | Botão **Turbo** na tela |
| Manobra 360° (esquiva e deflexão) | `E`, `Q` ou toque duplo em `A`/`D` | Clique direito / botão **360°** |
| Pausar / Silenciar | `P` ou `Esc` / `M` | Botões no topo direito |

## Arquitetura Modular

```text
├── index.html
├── style.css
├── manifest.webmanifest
└── js/
    ├── game.js              # Loop principal, IA, missões, Hangar 3D e HUD
    ├── math.js              # Mat4 + matriz normal inversa-transposta
    ├── storage.js           # Persistência v2 com migração automática de v1
    ├── audio.js             # Sintetizador SFX + trilha procedural adaptativa
    ├── render/
    │   ├── shaders.js       # Shaders GLSL (PBR-lite, Nebula, Planet, Shield, Bloom)
    │   ├── meshBuilder.js   # Construtor procedural flat/smooth + esferas suaves
    │   └── renderer.js      # Pipeline WebGL2/1, FBO Bloom, Ribbons e Billboards
    ├── models/
    │   └── models.js        # 5 naves, 6 inimigos, 4 chefões e cenários
    └── world/
        └── regions.js       # 5 biomas espaciais, Mapa Estelar e Códice Estelar
```

## Executar localmente

Como o projeto utiliza ES Modules nativos (sem build step), execute um servidor HTTP estático na raiz:

```bash
python3 -m http.server 8080
```

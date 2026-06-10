import { useRef, useState, useEffect } from 'react';
import { View, Image, TouchableWithoutFeedback, Text, StyleSheet, Dimensions } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

const GRAVITY = 0.6;
const JUMP = -10;
const PIPE_WIDTH = 70;
const PIPE_GAP = 250; // Espaço vertical para o Cleiton passar
const PIPE_SPEED = 4;
const BIRD_SIZE = 80;
const BIRD_X = 60; // Recuado um pouquinho para dar mais tempo de reação no celular
const BALL_SIZE = 50;

// 250px é a distância horizontal perfeita para telas de celulares como o Pixel 7
const PIPE_SPACING = 250; 

function getInitialState() {
  const topH1 = Math.random() * (H * 0.4) + 60;
  const topH2 = Math.random() * (H * 0.4) + 60;
  
  return {
    birdY: H / 2,
    birdVY: 0,
    // Já começamos com 2 canos enfileirados com espaçamento perfeito para não haver vácuos
    pipes: [
      { x: W * 0.9, topH: topH1, scored: false },
      { x: W * 0.9 + PIPE_SPACING, topH: topH2, scored: false }
    ],
    ball: null,
    score: 0,
    frame: 0,
    running: false,
    dead: false,
    won: false,
  };
}

export default function App() {
  const state = useRef(getInitialState());
  const [tick, setTick] = useState(0);
  const interval = useRef(null);
  const loopFn = useRef(null);

  const die = () => {
    state.current.running = false;
    state.current.dead = true;
    clearInterval(interval.current);
    setTick(t => t + 1);
  };

  const win = () => {
    state.current.running = false;
    state.current.won = true;
    clearInterval(interval.current);
    setTick(t => t + 1);
  };

  loopFn.current = () => {
    const s = state.current;
    if (!s.running) return;

    s.birdVY += GRAVITY;
    s.birdY += s.birdVY;
    s.frame++;

    // Movimenta todos os canos juntos
    s.pipes.forEach(p => { p.x -= PIPE_SPEED; });

    // Gerador contínuo mantendo rigorosamente a mesma distância
    const lastPipe = s.pipes[s.pipes.length - 1];
    if (s.score < 9) {
      if (!lastPipe || (W - lastPipe.x) >= PIPE_SPACING) {
        const topH = Math.random() * (H * 0.4) + 60;
        s.pipes.push({ x: W, topH, scored: false });
      }
    }

    // Sistema de pontuação
    s.pipes.forEach(p => {
      if (!p.scored && (p.x + PIPE_WIDTH) < BIRD_X) {
        p.scored = true;
        s.score += 1;
        if (s.score === 10 && !s.ball) {
          s.ball = { x: W, y: Math.random() * (H * 0.5) + 80 };
        }
      }
    });

    s.pipes = s.pipes.filter(p => p.x > -PIPE_WIDTH);

    if (s.ball) {
      s.ball.x -= PIPE_SPEED;
      const inX = s.ball.x < BIRD_X + BIRD_SIZE && s.ball.x + BALL_SIZE > BIRD_X;
      const inY = s.ball.y < s.birdY + BIRD_SIZE && s.ball.y + BALL_SIZE > s.birdY;
      if (inX && inY) { win(); return; }
      if (s.ball.x < -BALL_SIZE) s.ball = null;
    }

    if (s.birdY > H - BIRD_SIZE || s.birdY < 0) { die(); return; }

    for (const p of s.pipes) {
      const inX = p.x < BIRD_X + BIRD_SIZE - 10 && p.x + PIPE_WIDTH > BIRD_X + 10;
      const inY = s.birdY < p.topH || s.birdY + BIRD_SIZE > p.topH + PIPE_GAP;
      if (inX && inY) { die(); return; }
    }

    setTick(t => t + 1);
  };

  const startGame = () => {
    state.current = getInitialState();
    state.current.running = true;
    clearInterval(interval.current);
    interval.current = setInterval(() => loopFn.current(), 30);
  };

  const jump = () => {
    if (state.current.dead || !state.current.running) { startGame(); return; }
    if (state.current.won) { startGame(); return; }
    state.current.birdVY = JUMP;
  };

  useEffect(() => () => clearInterval(interval.current), []);

  const s = state.current;

  return (
    <TouchableWithoutFeedback onPress={jump}>
      <View style={styles.container}>

        {/* 1. Canos estruturados em camadas inferiores */}
        {s.pipes.map((p, i) => (
          <View key={i} style={[styles.pipeContainer, { left: p.x }]}>
            <View style={[styles.pipeTop, { height: p.topH }]} />
            <View style={[styles.pipeBottom, { top: p.topH + PIPE_GAP, height: H - p.topH - PIPE_GAP }]}>
              <Image
                source={require('./assets/unipar.png')}
                style={styles.uniparLogo}
                resizeMode="contain"
              />
            </View>
          </View>
        ))}

        {/* 2. Item Bola de Tênis */}
        {s.ball && (
          <Text style={[styles.ball, { left: s.ball.x, top: s.ball.y }]}>🎾</Text>
        )}

        {/* 3. Imagem do Professor Cleiton (Sem propriedades inválidas) */}
        <Image
          source={require('./assets/cleitonBird.png')}
          style={[styles.bird, { top: s.birdY }]}
        />

        {/* 4. Interface de textos flutuantes (Garantidos no topo pelo zIndex e ordem JSX) */}
        <Text style={styles.score}>{s.score}</Text>

        {!s.running && !s.dead && !s.won && (
          <Text style={styles.msg}>Toque para começar</Text>
        )}
        
        {s.dead && (
          <Text style={styles.msg}>{'💀 Game Over\nScore: ' + s.score + '\nToque para reiniciar'}</Text>
        )}
        
        {s.won && (
          <View style={styles.wonContainer}>
            <Text style={styles.wonText}>🏆🎾</Text>
            <Text style={styles.wonMsg}>Parabéns, Cleiton chegou ao beach tênis com sucesso!</Text>
            <Text style={styles.wonSub}>{'Score: ' + s.score + '\nToque para jogar novamente'}</Text>
          </View>
        )}

      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#70c5ce', overflow: 'hidden' },
  bird: { position: 'absolute', left: BIRD_X, width: BIRD_SIZE, height: BIRD_SIZE, borderRadius: 40, zIndex: 5 },
  pipeContainer: { position: 'absolute', width: PIPE_WIDTH, top: 0, bottom: 0, zIndex: 1 },
  pipeTop: { width: PIPE_WIDTH, backgroundColor: '#cc0000' },
  pipeBottom: { position: 'absolute', width: PIPE_WIDTH, backgroundColor: '#ffffff', borderColor: '#8b0000', borderWidth: 3, alignItems: 'center' },
  uniparLogo: { width: PIPE_WIDTH - 6, height: 50, marginTop: 10, transform: [{ rotate: '90deg' }] },
  ball: { position: 'absolute', fontSize: 40, zIndex: 4 },
  
  // Estilos de texto totalmente responsivos para qualquer celular (Centralização Nativa)
  score: { position: 'absolute', top: 60, left: 0, right: 0, fontSize: 50, fontWeight: 'bold', color: 'white', textAlign: 'center', zIndex: 10 },
  msg: { position: 'absolute', left: 20, right: 20, top: H / 2 - 60, fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.2)', padding: 15, borderRadius: 10 },
  wonContainer: { position: 'absolute', left: 20, right: 20, top: H / 2 - 120, alignItems: 'center', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.4)', padding: 20, borderRadius: 15 },
  wonText: { fontSize: 60 },
  wonMsg: { fontSize: 22, fontWeight: 'bold', color: 'white', textAlign: 'center', marginTop: 10 },
  wonSub: { fontSize: 18, color: 'white', textAlign: 'center', marginTop: 12 },
});g
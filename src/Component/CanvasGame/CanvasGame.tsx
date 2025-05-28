import { useEffect, useRef, useState } from "react";
import { ProjectImages } from "../../assets/ProjectImages";
import { Pipe } from "./../Pipe/Pipe";
import { Coin } from "../Coin/Coin";
import useSound from "use-sound";
import "./CanvasGame.css";
import { ProjectAudio } from "../../assets/ProjectAudio";

export let pipeSpeed = -2.5; //-3.5  -4.5 -2.5

interface ClassComponentProps {
  width: number;
  height: number;
  x: number;
  y: number;
}

let currentIdx = 0;
const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 750;
const GROUND_HEIGHT = 95;
const BIRD_WIDTH = 60;
const BIRD_HEIGHT = 40;
const BIRD_INITIAL_X = CANVAS_WIDTH / 3.5;
const BIRD_INITIAL_Y = CANVAS_HEIGHT / 4.3;
const JUMP_SPEED = -6.4; //-4
const PIPE_WIDTH = 85;
const PIPE_MIN_HEIGHT = 150;
const PIPE_GAP = 150;
const DOWN_ANGLE = 75;
const UP_ANGLE = -30;
const COIN_WIDTH = 55;
const COIN_HEIGHT = 55;
const COIN_GAP = 500;
let backgroundSpeed = -0.2;

class Component {
  width: number;
  height: number;
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  gravity: number;
  gravitySpeed: number;
  birdFrames: HTMLImageElement[];
  ctx: CanvasRenderingContext2D;
  angle: number;

  constructor(props: ClassComponentProps, ctx: CanvasRenderingContext2D) {
    this.width = props.width;
    this.height = props.height;
    this.x = props.x;
    this.y = props.y;
    this.speedX = 0;
    this.speedY = 0;
    this.gravity = 0.3;
    this.gravitySpeed = 0;
    this.ctx = ctx;
    this.birdFrames = [new Image(), new Image(), new Image()];
    this.birdFrames[0].src = ProjectImages.BIRD_UP_FLAP;
    this.birdFrames[1].src = ProjectImages.BIRD_MID_FLAP;
    this.birdFrames[2].src = ProjectImages.BIRD_DOWN_FLAP;
    this.angle = 0;
  }

  update(frameCounter: number) {
    if (frameCounter % 10 === 0) {
      currentIdx = (currentIdx + 1) % this.birdFrames.length;
    }
    const birdImage = this.birdFrames[currentIdx];
    this.ctx.save();
    this.ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    this.ctx.rotate(this.angle);
    this.ctx.drawImage(
      birdImage,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );
    this.ctx.restore();
  }

  newPos(canvasHeight: number, hasCrashedRef: any, pipeCrashRef: any) {
    this.gravitySpeed += this.gravity;
    this.x += this.speedX;
    this.y += this.speedY + this.gravitySpeed;

    const maxDownwardAngle = DOWN_ANGLE * (Math.PI / 180);
    const maxUpwardAngle = UP_ANGLE * (Math.PI / 180);
    if (this.gravitySpeed < 0) {
      this.angle = maxUpwardAngle;
    } else {
      this.angle = Math.min(maxDownwardAngle, this.angle + 0.04);
    }

    this.hitBottom(canvasHeight, hasCrashedRef);
    this.hitTop(hasCrashedRef, pipeCrashRef);
  }

  hitBottom(canvasHeight: number, hasCrashedRef: any) {
    const bottom = canvasHeight - GROUND_HEIGHT - this.height;
    if (this.y > bottom) {
      hasCrashedRef.current = true;
    }
  }

  hitTop(hasCrashedRef: any, pipeCrashRef: any) {
    if (this.y < 0 + this.width / 2.6) {
      pipeCrashRef.current = true;
      console.log(hasCrashedRef);
    }
  }

  crashWithPipe(pipe: Pipe) {
    const birdLeft = this.x;
    const birdRight = this.x + this.width;
    const birdTop = this.y;
    const birdBottom = this.y + this.height;
    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + pipe.width;
    const pipeTop = pipe.y;
    const pipeBottom = pipe.y + pipe.height;

    if (birdRight < pipeLeft || birdLeft > pipeRight) return false;
    return !(birdBottom < pipeTop || birdTop > pipeBottom);
  }

  coinCrash(coin: any) {
    const birdLeft = this.x;
    const birdRight = this.x + this.width;
    const birdTop = this.y;
    const birdBottom = this.y + this.height;
    const coinLeft = coin?.x;
    const coinRight = coin?.x + coin?.width;
    const coinTop = coin?.y;
    const coinBottom = coin?.y + coin?.height;

    return !(
      birdBottom < coinTop ||
      birdTop > coinBottom ||
      birdRight < coinLeft ||
      birdLeft > coinRight
    );
  }

  jump() {
    this.gravitySpeed = JUMP_SPEED;
  }
}

function CanvasGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gamePieceRef = useRef<Component | null>(null);

  // const intervalRef = useRef<any | null>(null);
  // const animationRef = useRef<any | null>(null);

  const pipesRef = useRef<Pipe[]>([]);
  const coinRef = useRef<Coin | null>(null);
  const bottomBg = new Image();
  bottomBg.src = ProjectImages.BOTTOM_BG;
  const bottomBgXRef = useRef(0);
  const pipeCrashRef = useRef(false);

  const mainBg = new Image();
  mainBg.src = ProjectImages.BACKGROUND_IMAGE;
  const mainBgXRef = useRef(0);

  const [isGameStarted, setIsGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [isGameover, setIsGameover] = useState(false);
  const hasCrashedRef = useRef(false);
  const [highScore, setHighScore] = useState<number | null>(0);
  const [play] = useSound(ProjectAudio.GAME_OVER);
  const [playCoinSound] = useSound(ProjectAudio.COIN_CRASH);
  let tempSpeed = pipeSpeed;
  let tempBgSpeed = backgroundSpeed;
  // let lastDistance = 0;

  function restartGame() {
    pipeCrashRef.current = false;
    setScore(0);
    setIsGameover(false);
    pipesRef.current = [];
    coinRef.current = null;
    setIsGameStarted(false);
    hasCrashedRef.current = false;
  }

  function handleSpeed(selectedSpeed: number) {
    pipeSpeed = -selectedSpeed;
    setIsGameStarted(true);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.code === "Space") {
      e.preventDefault();
      if (
        isGameStarted &&
        gamePieceRef.current &&
        !pipeCrashRef.current &&
        !isGameover
      ) {
        gamePieceRef.current.jump();
        console.log("jump");
      } else if (isGameover) {
        restartGame();
        console.log("restart game");
      } else if (!isGameStarted) {
        setIsGameStarted(true);
        console.log("starts the game");
      }
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    if (isGameover) {
      play();
      const item = localStorage.getItem("highScore") || "0";
      if (score && Number(item) < score)
        localStorage.setItem("highScore", JSON.stringify(score));
    }
    setHighScore(Number(localStorage.getItem("highScore")));
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isGameStarted, isGameover]);

  useEffect(() => {
    if (!isGameStarted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    gamePieceRef.current = new Component(
      {
        width: BIRD_WIDTH,
        height: BIRD_HEIGHT,
        x: BIRD_INITIAL_X,
        y: BIRD_INITIAL_Y,
      },
      ctx
    );

    let frameCounter = 0;

    // function will start here.................................................
    let frameId: number;
    let lastTime: number = 0;

    function GameLoop(currentTime: number) {
      const canvas = canvasRef.current;

      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (!lastTime) lastTime = currentTime;

      frameCounter++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      mainBgXRef.current += backgroundSpeed;
      if (mainBgXRef.current <= -canvas.width) {
        mainBgXRef.current = 0;
      }
      ctx.drawImage(mainBg, mainBgXRef.current, 0, canvas.width, canvas.height);
      ctx.drawImage(
        mainBg,
        mainBgXRef.current + canvas.width - 2,
        0,
        canvas.width,
        canvas.height
      );

      bottomBgXRef.current -= -pipeSpeed;
      if (bottomBgXRef.current <= -canvas.width) {
        bottomBgXRef.current = 0;
      }
      ctx.drawImage(
        bottomBg,
        bottomBgXRef.current,
        canvas.height - GROUND_HEIGHT,
        canvas.width,
        GROUND_HEIGHT
      );
      ctx.drawImage(
        bottomBg,
        bottomBgXRef.current + canvas.width,
        canvas.height - GROUND_HEIGHT,
        canvas.width,
        GROUND_HEIGHT
      );

      if (frameCounter % COIN_GAP === 0) {
        coinRef.current = new Coin(
          {
            width: COIN_WIDTH,
            height: COIN_HEIGHT,
            x: canvas.width,
            y: canvas.height / 2,
            coinImageSrc: ProjectImages.COIN,
            crashed: false,
            coinPipeCrash: false,
          },
          ctx
        );
      }
      const piece = gamePieceRef.current;

      if (
        coinRef.current &&
        piece &&
        piece.coinCrash(coinRef.current) &&
        !coinRef.current.crashed &&
        !pipeCrashRef.current
      ) {
        setScore((prev) => prev + 5);
        coinRef.current.remove();
        playCoinSound();
      }

      //coin
      coinRef.current?.move();
      coinRef.current?.draw();

      // time logic
      // pipeSpeed = -2

      const deltaTime = currentTime / 1000 - lastTime / 1000;
      const pipeDistance = 5;
      let currentDistance = -1 * pipeSpeed * deltaTime;

      if (currentDistance > pipeDistance) {
        // lastDistance = currentDistance;
        lastTime = currentTime;

        const gap = PIPE_GAP;
        const minHeight = PIPE_MIN_HEIGHT;
        const maxPipeBottomY = canvas.height - GROUND_HEIGHT - 60;
        const topPipeHeight = Math.floor(
          Math.random() * (maxPipeBottomY - gap - minHeight - 95) + minHeight
        );
        const bottomPipeY = topPipeHeight + gap;
        const bottomPipeHeight = canvas.height - GROUND_HEIGHT - bottomPipeY;

        pipesRef.current.push(
          new Pipe(
            {
              width: PIPE_WIDTH,
              height: topPipeHeight,
              x: canvas.width,
              y: 0,
              isTopPipe: true,
              topImageSrc: ProjectImages.PIPE_TOP,
              bottomImageSrc: ProjectImages.PIPE_BOTTOM,
            },
            ctx
          )
        );
        pipesRef.current.push(
          new Pipe(
            {
              width: PIPE_WIDTH,
              height: bottomPipeHeight,
              x: canvas.width,
              y: bottomPipeY,
              isTopPipe: false,
              topImageSrc: ProjectImages.PIPE_TOP,
              bottomImageSrc: ProjectImages.PIPE_BOTTOM,
            },
            ctx
          )
        );
      }

      // pipes
      pipesRef.current.forEach((pipe) => {
        pipe.move();
        pipe.draw();
        if (
          !pipe.isTopPipe &&
          !pipe.scored &&
          piece &&
          piece.x > pipe.x + pipe.width
        ) {
          setScore((prev) => prev + 1);
          pipe.scored = true;
        }
        if (piece && (piece.crashWithPipe(pipe) || pipeCrashRef.current)) {
          pipeCrashRef.current = true;
          pipeSpeed = 0;
          backgroundSpeed = 0;
        }

        if (coinRef.current) {
          const coin = coinRef.current;
          const coinLeft = coin.x;
          const coinRight = coin.x + coin.width;
          const coinTop = coin.y;
          const coinBottom = coin.y + coin.height;

          const pipeLeft = pipe.x;
          const pipeRight = pipe.x + pipe.width;
          const pipeTop = pipe.y;
          const pipeBottom = pipe.y + pipe.height;

          const isOverlapping = !(
            pipeBottom < coinTop ||
            pipeTop > coinBottom ||
            pipeRight < coinLeft ||
            pipeLeft > coinRight
          );

          if (isOverlapping) {
            coin.coinPipeCrash = true;
            console.log("Coin is crashing with pipe");
          }
        }
      });

      if (piece) {
        piece.newPos(canvas.height, hasCrashedRef, pipeCrashRef);
        piece.update(frameCounter);
      }

      if (pipeCrashRef.current || hasCrashedRef.current) {
        if (hasCrashedRef.current) {
          pipeSpeed = tempSpeed;
          backgroundSpeed = tempBgSpeed;
          setIsGameover(true);
          cancelAnimationFrame(frameId);
        }
      }
      console.log("yo its frame id", frameId);
      if (!hasCrashedRef.current) frameId = requestAnimationFrame(GameLoop);
    }
    frameId = requestAnimationFrame(GameLoop);

    // will end here............................................................................

    return () => cancelAnimationFrame(frameId);
  }, [isGameStarted]);

  function handleClick() {
    if (gamePieceRef.current && !pipeCrashRef.current) {
      gamePieceRef.current.jump();
    }
  }

  return (
    <>
      {isGameStarted && (
        <div className="canvas-wrapper">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{
              border: "1px solid #d3d3d3",
              backgroundColor: "#f1f1f1",
            }}
            onClick={handleClick}
          />
          <div className="game-score">
            <h4>{score}</h4>
          </div>
          {isGameover && (
            <div className="game-over-modal">
              <h2>Game Over</h2>
              <h4>Score: {score}</h4>
              <h4>Best: {highScore}</h4>
              <button className="restart-button" onClick={restartGame}>
                Restart
              </button>
            </div>
          )}
        </div>
      )}
      {!isGameStarted && (
        <div className="canvas-wrapper-start">
          <div className="start-canvas">
            <img src={ProjectImages.BACKGROUND_IMAGE} />
            <div className="bird-container">
              <img src={ProjectImages.BIRD_UP_FLAP} />
            </div>
            <button onClick={() => setIsGameStarted(true)}>Start</button>
          </div>
          <div className="canvas-background" onClick={handleClick}>
            <img src={ProjectImages.BOTTOM_BG} />
          </div>
          <div className="speed-btn-container">
            <button
              className={pipeSpeed === -2.5 ? "selected-speed" : ""}
              onClick={() => handleSpeed(2.5)}
            >
              1X
            </button>
            <button
              className={pipeSpeed === -3.5 ? "selected-speed" : ""}
              onClick={() => handleSpeed(3.5)}
            >
              2X
            </button>
            <button
              className={pipeSpeed === -4.5 ? "selected-speed" : ""}
              onClick={() => handleSpeed(4.5)}
            >
              3X
            </button>
          </div>
        </div>
      )}
    </>
  );
}
export default CanvasGame;

// coin behind pipe

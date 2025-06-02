import { useEffect, useRef, useState } from "react";
import { ProjectImages } from "../../assets/ProjectImages";
import { Pipe } from "./../Pipe/Pipe";
import { Coin } from "../Coin/Coin";
import useSound from "use-sound";
import "./CanvasGame.css";
import { ProjectAudio } from "../../assets/ProjectAudio";

export let pipeSpeed = -2;

interface ClassComponentProps {
  width: number;
  height: number;
  x: number;
  y: number;
}

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 750;
const GROUND_HEIGHT = 95;
const BIRD_WIDTH = 50;
const BIRD_HEIGHT = 40;
const BIRD_INITIAL_X = CANVAS_WIDTH / 3.5;
const BIRD_INITIAL_Y = CANVAS_HEIGHT / 4.3;
const JUMP_SPEED = -6;
const PIPE_WIDTH = 85;
const PIPE_MIN_HEIGHT = 150;
const PIPE_GAP = 150;
const DOWN_ANGLE = 75;
const UP_ANGLE = -30;
const COIN_WIDTH = 55;
const COIN_HEIGHT = 55;
const WING_MOVEMENT = 0.1;
const DOWN_ROTATION_MOVEMENT = 0.04;
const PIPE_DISTANCE = 5;
const COIN_DISTANCE = 23;
let currentIdx = 0;
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

  constructor(
    props: ClassComponentProps,
    ctx: CanvasRenderingContext2D,
    selectedBird: string
  ) {
    this.width = props.width;
    this.height = props.height;
    this.x = props.x;
    this.y = props.y;
    this.speedX = 0;
    this.speedY = 0;
    this.gravity = 0.3;
    this.gravitySpeed = 0;
    this.ctx = ctx;
    this.angle = 0;
    this.birdFrames = [new Image(), new Image(), new Image()];

    switch (selectedBird) {
      case "BIRD3":
        this.birdFrames[0].src = ProjectImages.BIRD3_UP;
        this.birdFrames[1].src = ProjectImages.BIRD3_MID;
        this.birdFrames[2].src = ProjectImages.BIRD3_DOWN;
        break;

      case "BIRD2":
        this.birdFrames[0].src = ProjectImages.BIRD2_UP;
        this.birdFrames[1].src = ProjectImages.BIRD2_MID;
        this.birdFrames[2].src = ProjectImages.BIRD2_DOWN;
        break;

      case "BIRD4":
        this.birdFrames[0].src = ProjectImages.BIRD4_UP;
        this.birdFrames[1].src = ProjectImages.BIRD4_MID;
        this.birdFrames[2].src = ProjectImages.BIRD4_DOWN;
        break;

      case "BIRD5":
        this.birdFrames[0].src = ProjectImages.BIRD5_UP;
        this.birdFrames[1].src = ProjectImages.BIRD5_MID;
        this.birdFrames[2].src = ProjectImages.BIRD5_DOWN;
        break;

      default:
        this.birdFrames[0].src = ProjectImages.BIRD1_UP;
        this.birdFrames[1].src = ProjectImages.BIRD1_MID;
        this.birdFrames[2].src = ProjectImages.BIRD1_DOWN;
        break;
    }
  }


  update(currentTime: number, lastFlap: number, isPipeCrash: boolean) {
    if (currentTime / 1000 - lastFlap / 1000 > WING_MOVEMENT && !isPipeCrash) {
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

  newPos(
    canvasHeight: number,
    hasCrashedRef: any,
    pipeCrashRef: any,
    playHitSound: any
  ) {
    this.gravitySpeed += this.gravity;
    this.x += this.speedX;
    this.y += this.speedY + this.gravitySpeed;

    const maxDownwardAngle = DOWN_ANGLE * (Math.PI / 180);
    const maxUpwardAngle = UP_ANGLE * (Math.PI / 180);
    if (this.gravitySpeed < 0) {
      this.angle = maxUpwardAngle;
    } else {
      this.angle = Math.min(
        maxDownwardAngle,
        this.angle + DOWN_ROTATION_MOVEMENT
      );
    }

    this.hitBottom(canvasHeight, hasCrashedRef);
    this.hitTop(pipeCrashRef, playHitSound);
  }

  hitBottom(canvasHeight: number, hasCrashedRef: any) {
    const bottom = canvasHeight - GROUND_HEIGHT - this.height;
    if (this.y > bottom ) {
      hasCrashedRef.current = true;
    }
  }

  hitTop(pipeCrashRef: any, playHitSound: any) {
    if (this.y < 0 + this.width / 2.6) {
      if (!pipeCrashRef.current) playHitSound();
      pipeCrashRef.current = true;
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
  const pipesRef = useRef<Pipe[]>([]);
  const coinRef = useRef<Coin | null>(null);
  const bottomBg = new Image();
  bottomBg.src = ProjectImages.BOTTOM_BG;

  const bottomBgXRef = useRef(0);
  const pipeCrashRef = useRef(false);
  const mainBg = new Image();
  const mainBgXRef = useRef(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [isGameover, setIsGameover] = useState(false);
  const hasCrashedRef = useRef<boolean>(false);
  const [highScore, setHighScore] = useState<number | null>(0);
  // const [play] = useSound(ProjectAudio.GAME_OVER);
  const [play] = useSound("");
  const [playCoinSound] = useSound(ProjectAudio.COIN_CRASH);
  const [playJumpSound] = useSound(ProjectAudio.JUMP);
  const [playHitSound] = useSound(ProjectAudio.HIT);
  const [selectedBird, setSelectedBird] = useState("BIRD1");
  const birdData = [
    { image: ProjectImages.BIRD1_UP, value: "BIRD1" },
    { image: ProjectImages.BIRD2_UP, value: "BIRD2" },
    { image: ProjectImages.BIRD3_UP, value: "BIRD3" },
    { image: ProjectImages.BIRD4_UP, value: "BIRD4" },
    { image: ProjectImages.BIRD5_UP, value: "BIRD5" },
  ];
  const [birdIndex, setBirdIndex] = useState(0);
  const [GameSpeed, setGameSpeed] = useState(-2);

  let tempSpeed = pipeSpeed;
  let tempBgSpeed = backgroundSpeed;

  //bird selection
  function birdSelection(arrowType: string) {
    if (arrowType == "right-arrow" && birdIndex + 1 != birdData.length) {
      setBirdIndex((birdIndex + 1) % birdData.length);
      setSelectedBird(birdData[(birdIndex + 1) % birdData.length].value);
    } else if (arrowType == "left-arrow" && birdIndex != 0) {
      setBirdIndex((birdIndex - 1) % birdData.length);
      setSelectedBird(birdData[(birdIndex - 1) % birdData.length].value);
    }
  }

  function restartGame() {
    pipeCrashRef.current = false;
    setScore(0);
    scoreRef.current = 0;
    setIsGameover(false);
    pipesRef.current = [];
    coinRef.current = null;
    setIsGameStarted(false);
    hasCrashedRef.current = false;
  }

  function handleSpeed(selectedSpeed: number) {
    pipeSpeed = -selectedSpeed;
    // setIsGameStarted(true);
    setGameSpeed(-selectedSpeed);
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
        playJumpSound();
      } else if (isGameover) {
        restartGame();
      } else if (!isGameStarted) {
        setIsGameStarted(true);
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
        width:  BIRD_WIDTH,    //50
        height: (selectedBird == "BIRD2" || selectedBird == "BIRD3") ? 50 : BIRD_HEIGHT,  //40
        x: BIRD_INITIAL_X,
        y: BIRD_INITIAL_Y,
      },
      ctx,
      selectedBird
    );

    let frameId: number = 0;
    let lastTime: number = 0;
    let lastFlap = 0;

    function GameLoop(currentTime: number) {
      const deltaTime = currentTime / 1000 - lastTime / 1000;
      const canvas = canvasRef.current;
      // mainBg.src = ProjectImages.BACKGROUND_IMAGE;
      mainBg.src =
        scoreRef.current < 20
          ? ProjectImages.BACKGROUND_IMAGE
          : ProjectImages.BACKGROUND_NIGHT;

      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (!lastTime) lastTime = currentTime;
      if (!lastFlap) lastFlap = currentTime;

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

      let coinCovered = -1 * pipeSpeed * deltaTime;

      if (coinCovered > COIN_DISTANCE) {
        coinCovered = 0;
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
        scoreRef.current = scoreRef.current + 5;
        coinRef.current.remove();
        playCoinSound();
      }

      //coin
      coinRef.current?.move();
      coinRef.current?.draw();

      let currentDistance = -1 * pipeSpeed * deltaTime;

      if (currentDistance > PIPE_DISTANCE) {
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
          scoreRef.current++;
          pipe.scored = true;
        }
        if (piece && (piece.crashWithPipe(pipe) || pipeCrashRef.current)) {
          if (!pipeCrashRef.current) playHitSound();
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
          }
        }
      });

      if (piece) {
        piece.newPos(canvas.height, hasCrashedRef, pipeCrashRef, playHitSound);
        piece.update(currentTime, lastFlap, pipeCrashRef.current);
        if (currentTime / 1000 - lastFlap / 1000 > WING_MOVEMENT)
          lastFlap = currentTime;
      }

      if (pipeCrashRef.current || hasCrashedRef.current) {
        if (hasCrashedRef.current) {
          if (!pipeCrashRef.current) playHitSound();
          pipeSpeed = tempSpeed;
          backgroundSpeed = tempBgSpeed;
          setIsGameover(true);
          cancelAnimationFrame(frameId);
        }
      }
      if (!hasCrashedRef.current) frameId = requestAnimationFrame(GameLoop);
    }
    frameId = requestAnimationFrame(GameLoop);

    return () => cancelAnimationFrame(frameId);
  }, [isGameStarted, selectedBird]);

  function handleClick() {
    if (gamePieceRef.current && !pipeCrashRef.current) {
      gamePieceRef.current.jump();
      playJumpSound();
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
            <>
              <img
                src={ProjectImages.GAME_OVER}
                className="game-over-message"
              />
              <div className="game-over-modal">
                <h4>Score: {score}</h4>
                <h4>Best: {highScore}</h4>
                <button
                  className="restart-button retry-button"
                  onClick={restartGame}
                >
                  Restart
                </button>
              </div>
            </>
          )}
        </div>
      )}
      {!isGameStarted && (
        <div className="canvas-wrapper-start">
          <div className="start-canvas">
            <img src={ProjectImages.BACKGROUND_IMAGE} alt="background" />
            <button onClick={() => setIsGameStarted(true)}>Start</button>
          </div>
          <div className="canvas-background" onClick={handleClick}>
            <img src={ProjectImages.BOTTOM_BG} alt="ground" />
          </div>

          {/* bird selection */}
          <div className="bird__selection">
            <div
              className="left-arrow arrow-container"
              onClick={() => birdSelection("left-arrow")}
            >
              <img src={ProjectImages.ARROW} />
            </div>
            <div className="bird-image-container">
              <img src={birdData[birdIndex].image}></img>
            </div>
            <div
              className="right-arrow arrow-container"
              onClick={() => birdSelection("right-arrow")}
            >
              <img src={ProjectImages.ARROW} />
            </div>
          </div>
          {/* end of bird selection */}

          <div className="speed-btn-container">
            <button
              className={GameSpeed === -2 ? "selected-speed" : ""}
              onClick={() => handleSpeed(2)}
            >
              1X
            </button>
            <button
              className={GameSpeed === -3 ? "selected-speed" : ""}
              onClick={() => handleSpeed(3)}
            >
              2X
            </button>
            <button
              className={GameSpeed === -4 ? "selected-speed" : ""}
              onClick={() => handleSpeed(4)}
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
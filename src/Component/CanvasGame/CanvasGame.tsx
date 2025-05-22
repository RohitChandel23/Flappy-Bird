import { useEffect, useRef, useState } from "react";
import { ProjectImages } from "../../assets/ProjectImages";
import { Pipe } from "./Pipe/Pipe";
import "./CanvasGame.css";

export let pipeSpeed = -2;

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
const JUMP_SPEED = -3;
const PIPE_WIDTH = 85;
const PIPE_MIN_HEIGHT = 150;
const PIPE_GAP = 150;

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
    this.gravity = 0.1;
    this.gravitySpeed = 0;
    this.ctx = ctx;
    this.birdFrames = [new Image(), new Image(), new Image()];
    this.birdFrames[0].src = ProjectImages.BIRD_UP_FLAP;
    this.birdFrames[1].src = ProjectImages.BIRD_MID_FLAP;
    this.birdFrames[2].src = ProjectImages.BIRD_DOWN_FLAP;
    this.angle = 0;
  }

  update(frameCounter: number) {
    if (frameCounter % 10 == 0) {
      currentIdx = (currentIdx + 1) % this.birdFrames.length;
    }
    const birdImage = this.birdFrames[currentIdx];
    this.ctx.save();
    this.ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    this.ctx.rotate(this.angle);
    this.ctx.drawImage(birdImage,-this.width / 2,-this.height / 2,this.width,this.height);
    this.ctx.restore();
  }

  newPos(canvasHeight: number, hasCrashedRef: any) {
    this.gravitySpeed += this.gravity;
    this.x += this.speedX;
    this.y += this.speedY + this.gravitySpeed;
    const maxDownwardAngle = 75 * (Math.PI / 180);
    const maxUpwardAngle = -30 * (Math.PI / 180);
    if (this.gravitySpeed < 0) {
      this.angle = maxUpwardAngle;
    } else {
      this.angle = Math.min(maxDownwardAngle, this.angle + 0.0399999999);
    }
    this.hitBottom(canvasHeight, hasCrashedRef);
    this.hitTop(hasCrashedRef);
  }

  hitBottom(canvasHeight: number, hasCrashedRef: any) {
    const bottom = canvasHeight - GROUND_HEIGHT - this.height;
    if (this.y > bottom) {
      hasCrashedRef.current = true;
    }
  }

  hitTop(hasCrashedRef: any) {
    if (this.y < 0) {
      hasCrashedRef.current = true;
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

  jump() {
    this.gravitySpeed = JUMP_SPEED;
  }
}

function CanvasGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gamePieceRef = useRef<Component | null>(null);
  const intervalRef = useRef<any | null>(null);
  const pipesRef = useRef<Pipe[]>([]);
  const bottomBg = new Image();
  bottomBg.src = ProjectImages.BOTTOM_BG;
  const bottomBgXRef = useRef(0);

  const [isGameStarted, setIsGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [isGameover, setIsGameover] = useState(false);
  const hasCrashedRef = useRef(false);

  function restartGame() {
    setScore(0);
    setIsGameover(false);
    pipesRef.current = [];

    setIsGameStarted(false);
    hasCrashedRef.current = false;
  }

  function handleSpeed(selectedSpeed:number){
    pipeSpeed = -selectedSpeed;
     setIsGameStarted(true);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.code === "Space") {
      e.preventDefault();
      if (isGameStarted && !isGameover && gamePieceRef.current) {
        gamePieceRef.current.jump();
      } else if (!isGameStarted) {
        setIsGameStarted(true);
      }
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
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
    intervalRef.current = setInterval(() => {
      frameCounter++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

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

      const piece = gamePieceRef.current;
      if (piece) {
        piece.newPos(canvas.height, hasCrashedRef);
        piece.update(frameCounter);
      }

      //185 -> -1.5
      //125 -> -2.5
      //65 -> -3.5
      //const newPipeFrame =  (PIPE_SPEED * 120)/5; -1.5 then 185, -2.5 then 125, -3.5 then 65

      const newPipeFrame = 60 * pipeSpeed + 270;
      if (frameCounter % newPipeFrame == 0) {
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

      let crashed = false;
      pipesRef.current.forEach((pipe) => {
        pipe.move();
        pipe.draw();

        if (
          !pipe.isTopPipe &&
          !pipe.scored &&
          gamePieceRef.current &&
          gamePieceRef.current.x > pipe.x + pipe.width
        ) {
          setScore((prev) => prev + 1);
          pipe.scored = true;
        }

        if (piece && piece.crashWithPipe(pipe)) crashed = true;
      });

      if ((crashed || hasCrashedRef.current) ) {
        setIsGameover(true);
        clearInterval(intervalRef.current);
      }
    }, 9);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isGameStarted]);

  function handleClick() {
    if (gamePieceRef.current) {
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
              <h4>Your Score: {score}</h4>
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
        <button className = {pipeSpeed ==-1 ? 'selected-speed':''} onClick={()=>handleSpeed(1)}>1X</button>
        <button className = {pipeSpeed ==-2 ? 'selected-speed':''} onClick={()=>handleSpeed(2)}>2X</button>
        <button className = {pipeSpeed ==-3 ? 'selected-speed':''} onClick={()=>handleSpeed(3)}>3X</button>
      </div>
        </div>
      )}  
    </>
  );
}
export default CanvasGame;


// bird animation
// bottom bg image: improvement ***
// pipe generation: improvement ***
// setInterval method : look for alternatives
// paralleX effect
//max 60 , 0


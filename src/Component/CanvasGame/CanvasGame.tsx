import { useEffect, useRef, useState } from "react";
import { ProjectImages } from "../../assets/ProjectImages";
import { Pipe } from "./Pipe/Pipe";

import "./CanvasGame.css";

interface ClassComponentProps {
  width: number;
  height: number;
  x: number;
  y: number;
}

class Component {
  width: number;
  height: number;
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  gravity: number;
  gravitySpeed: number;
  image: HTMLImageElement;
  ctx: CanvasRenderingContext2D;

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

    this.image = new Image();
    this.image.src = ProjectImages.BIRD;
  }

  update() {
    this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }

  newPos(canvasHeight: number, hasCrashedRef:any) {
    this.gravitySpeed += this.gravity;
    this.x += this.speedX;
    this.y += this.speedY + this.gravitySpeed;
    this.hitBottom(canvasHeight, hasCrashedRef);
  }

  hitBottom(canvasHeight: number,hasCrashedRef:any) {
    const bottom = canvasHeight - this.height;
    if (this.y > bottom) {
      this.y = bottom;
      this.gravitySpeed = 0;
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

    if (birdRight < pipeLeft || birdLeft > pipeRight) {
      return false;
    }

    if (pipe.isTopPipe) {
      return birdBottom > pipeTop && birdTop < pipeBottom;
    } else {
      return birdTop < pipeBottom && birdBottom > pipeTop;
    }
  }

  jump() {
    this.gravitySpeed = -2.9;
  }
}

function CanvasGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gamePieceRef = useRef<Component | null>(null);
  const intervalRef = useRef<any | null>(null);
  const pipesRef = useRef<Pipe[]>([]);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isGameover, setIsGameover] = useState<boolean>(false);
  const hasCrashedRef = useRef<boolean>(false);

  function restartGame() {
    setScore(0);
    setIsGameover(false);
    pipesRef.current = [];

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (canvas && ctx) {
      gamePieceRef.current = new Component(
        { width: 50, height: 40, x: 130, y: 150 },
        ctx
      );
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    setIsGameStarted(false);
    hasCrashedRef.current = false;
  }

  useEffect(() => {
    if (!isGameStarted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    gamePieceRef.current = new Component(
      { width: 50, height: 40, x: 130, y: 150 },
      ctx
    );

    let frameCounter = 0;
    intervalRef.current = setInterval(() => {
      frameCounter++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const piece = gamePieceRef.current;
      if (piece) {
        piece.newPos(canvas.height, hasCrashedRef);
        piece.update();
      }

      // if (frameCounter % 310 == 0) {
      //   setScore((prev) => prev + 1);
      //   // console.log(score);
      // }

      if (frameCounter % 250 == 0) {
        const gap = 150;
        const minHeight = 150;
        const maxHeight = 400;
        const topPipeHeight = Math.floor(
          Math.random() * (maxHeight - minHeight) + minHeight
        );
        const bottomPipeY = topPipeHeight + gap;

        pipesRef.current.push(
          new Pipe(
            {
              width: 85,
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
              width: 85,
              height: canvas.height - bottomPipeY,
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

       console.log(hasCrashedRef.current)
      let crashed = false;
      pipesRef.current.forEach((pipe) => {
        pipe.move();
        pipe.draw();

        if(!pipe.isTopPipe && !pipe.scored && gamePieceRef.current){
          if(gamePieceRef.current.x > pipe.x + pipe.width){
            setScore(prev => prev+1);
            pipe.scored = true;
          }
        }

        if (piece && piece.crashWithPipe(pipe)) 
          crashed = true;
      });
      if (crashed || hasCrashedRef.current) {  
        setIsGameover((prev) => !prev);
        clearInterval(intervalRef.current);
      }
    }, 9);

    return () => {
      if (intervalRef.current) 
        clearInterval(intervalRef.current);
    };
  }, [isGameStarted]);

  function handleClick() {
    if (gamePieceRef.current) 
      gamePieceRef.current.jump();
  }

  return (
    <>
      {isGameStarted && (
        <div className="canvas-wrapper">
          <canvas
            ref={canvasRef}
            width={480}
            height={730}
            style={{
              border: "1px solid #d3d3d3",
              backgroundColor: "#f1f1f1",
            }}
            onClick={handleClick}
          />
          <div className="canvas-background" onClick={handleClick}>
            <img src={ProjectImages.BOTTOM_BG} />
          </div>

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
        <div className="canvas-wrapper">
          <div className="start-canvas">
            <img src={ProjectImages.BACKGROUND_IMAGE} />
            <div className="bird-container">
              <img src={ProjectImages.BIRD} />
            </div>
            <button onClick={() => setIsGameStarted(true)}>start</button>
          </div>
          <div className="canvas-background" onClick={handleClick}>
            <img src={ProjectImages.BOTTOM_BG} />
          </div>
        </div>
      )}
    </>
  );
}
export default CanvasGame;


//game start ***
//game over -> game over modal  ***
//game score -> score calculation ***

//on crash bird should fall to the ground
//scoreboard -> username and score  
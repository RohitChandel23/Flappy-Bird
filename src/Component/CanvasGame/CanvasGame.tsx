import { useEffect, useRef } from "react";
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

  newPos(canvasHeight: number) {
    this.gravitySpeed += this.gravity;
    this.x += this.speedX;
    this.y += this.speedY + this.gravitySpeed;
    this.hitBottom(canvasHeight);
  }

  hitBottom(canvasHeight: number) {
    const bottom = canvasHeight - this.height;
    if (this.y > bottom) {
      this.y = bottom;
      this.gravitySpeed = 0;
    }
  }

  jump() {
    this.gravitySpeed = -2.8;
  }
}

function CanvasGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gamePieceRef = useRef<Component | null>(null);
  const intervalRef = useRef<any | null>(null);
  const pipesRef = useRef<Pipe[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    gamePieceRef.current = new Component(
      { width: 30, height: 30, x: 130, y: 150 },
      ctx
    );

    let frameCounter = 0;

    intervalRef.current = setInterval(() => {
      frameCounter++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const piece = gamePieceRef.current;
      if (piece) {
        piece.newPos(canvas.height);
        piece.update();
      }


      if (frameCounter % 150 == 0) {
        const gap = 100;
        const minHeight = 50;
        const maxHeight = 200;
        const topPipeHeight = Math.floor(
          Math.random() * (maxHeight - minHeight) + minHeight
        );
        const bottomPipeY = topPipeHeight + gap;

        pipesRef.current.push(
          new Pipe(
            {
              width: 50,
              height: topPipeHeight,
              x: canvas.width,
              y: 0,
              topImageSrc: ProjectImages.PIPE_TOP,
              bottomImageSrc: ProjectImages.PIPE_BOTTOM,
            },
            ctx
          )
        );

        pipesRef.current.push(
          new Pipe(
            {
              width: 50,
              height: canvas.height - bottomPipeY,
              x: canvas.width,
              y: bottomPipeY,
              topImageSrc: ProjectImages.PIPE_TOP,
              bottomImageSrc: ProjectImages.PIPE_BOTTOM,
            },
            ctx
          )
        );
      }

      pipesRef.current.forEach((pipe) => {
        pipe.move();
        pipe.draw();    
      });
    }, 9);


    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function handleClick() {
    if (gamePieceRef.current) gamePieceRef.current.jump();
  }

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        style={{
          border: "1px solid #d3d3d3",
          backgroundColor: "#f1f1f1",
        }}
        onClick={handleClick}
      />
    </div>
  );
}

export default CanvasGame;

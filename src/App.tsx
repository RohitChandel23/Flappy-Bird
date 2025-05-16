import { useEffect, useRef } from 'react';
import { ProjectImages } from './assets/ProjectImages';

interface ClassComponentProps {
  width: number;
  height: number;
  color: string;
  x: number;
  y: number;
}

class Component {
  width: number;
  height: number;
  color: string;
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  gravity: number;
  gravitySpeed: number;
  image:HTMLImageElement;
  ctx: CanvasRenderingContext2D;

  constructor(props: ClassComponentProps, ctx: CanvasRenderingContext2D) {
    this.width = props.width;
    this.height = props.height;
    this.color = props.color;
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
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(this.x, this.y, this.width, this.height);
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

  jump(){
    this.gravitySpeed = -2.8; 
  }

}

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gamePieceRef = useRef<Component | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    gamePieceRef.current = new Component(
      { width: 30, height: 30, color: 'red', x: 80, y: 150 }, ctx );

    intervalRef.current = setInterval(() => {
       ctx.clearRect(0, 0, canvas.width, canvas.height);
      const piece = gamePieceRef.current;
      if (piece) {
        piece.newPos(canvas.height);
        piece.update();
      }
    }, 9);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function handleClick(){
    if(gamePieceRef.current)
      gamePieceRef.current.jump();
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        style={{
          border: '1px solid #d3d3d3',
          backgroundColor: '#f1f1f1',
        }}

        onClick = {handleClick} 
      />
      <button onClick = {handleClick}>UP</button>
    </div>
  );
}

export default App;

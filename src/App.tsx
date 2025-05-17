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

  jump(){
    this.gravitySpeed = -2.8; 
  }

}

class Pipe{
  x:number;
  y:number;
  width:number;
  height:number;
  speedX:number;
  image:HTMLImageElement;
  ctx: CanvasRenderingContext2D;

  constructor(x:number, y:number, width:number, height:number, speedX:number, imageSrc:string, ctx:CanvasRenderingContext2D){
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speedX = speedX;
    this.image = new Image();
    this.image.src = imageSrc;
    this.ctx = ctx;
  }

  update(){
    this.x += this.speedX;
    this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gamePieceRef = useRef<Component | null>(null);
  const pipesRef = useRef<Pipe[]>([]);
  const frameCountRef = useRef<number>(0);

  // const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bird = new Component(
      { width: 30, height: 30, color: 'red', x: 80, y: 150 }, ctx );
      gamePieceRef.current = bird;

      const generatePipePair = ()=>{
        const gap = 120;
        const pipeWidth = 60;
        const pipeSpeed = -2;
        const minHeight = 50;
        const maxHeight = 200;

        const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
        const bottomY = topHeight + gap;
        const bottomHeight = canvas.height - bottomY;

        pipesRef.current.push(
          new Pipe(canvas.width, 0, pipeWidth, topHeight, pipeSpeed, ProjectImages.PIPE_TOP, ctx),
          new Pipe(canvas.width, bottomY, pipeWidth, bottomHeight, pipeSpeed, ProjectImages.PIPE_BOTTOM, ctx)
        );  
      };

      const updateGameArea = () => {
      ctx.clearRect(0,0,canvas.width, canvas.height);

      frameCountRef.current++;
      if(frameCountRef.current % 150 === 0){
        generatePipePair();
      }

      const bird = gamePieceRef.current;
      if(bird){
        bird.newPos(canvas.height);
        bird.update();
      }

      pipesRef.current.forEach(pipe => pipe.update());
      pipesRef.current = pipesRef.current.filter(pipe => pipe.x + pipe.width > 0);
      requestAnimationFrame(updateGameArea);
    }      

    updateGameArea();

    return () =>{
      cancelAnimationFrame(updateGameArea as unknown as number);
    }
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


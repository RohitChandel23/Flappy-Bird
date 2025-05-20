    export interface PipeProps {
        width: number;
        height: number;
        x: number;
        y: number;
        bottomImageSrc: string;
        topImageSrc: string;
        isTopPipe?: boolean; 
      }
      
      export class Pipe {
        width: number;
        height: number;
        x: number;
        y: number;
        topImage: HTMLImageElement;
        bottomImage: HTMLImageElement;
        ctx: CanvasRenderingContext2D;
        gap: number;
        isTopPipe: boolean;
        scored: boolean;
      
        constructor(props: PipeProps, ctx: CanvasRenderingContext2D) {
          this.width = props.width;
          this.height = props.height;
          this.x = props.x;
          this.y = props.y;
          this.gap = 150;
          this.ctx = ctx;
          this.isTopPipe = props.isTopPipe || false; 
      
          this.topImage = new Image();
          this.topImage.src = props.topImageSrc;
          this.bottomImage = new Image();
          this.bottomImage.src = props.bottomImageSrc;
          this.scored = false;  
        }
      
        draw() {
          if (this.isTopPipe) {
            this.ctx.drawImage(this.topImage, this.x, this.y, this.width, this.height);
          } else {
            this.ctx.drawImage(this.bottomImage, this.x, this.y, this.width, this.height);
          }
        }
      
        move() {
          this.x += -1;
        }
      } 
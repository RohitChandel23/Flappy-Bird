import {pipeSpeed} from '../CanvasGame/CanvasGame';

export interface CoinProps {
        width: number;
        height: number;
        x: number;
        y: number;
        coinImageSrc: string;
        crashed: boolean;
        coinPipeCrash: boolean;
      }
      
      export class Coin {
        width: number;
        height: number;
        x: number;
        y: number;
        coinImage: HTMLImageElement;
        ctx: CanvasRenderingContext2D;
        crashed: boolean;
        coinPipeCrash: boolean;
      
        constructor(props: CoinProps, ctx: CanvasRenderingContext2D) {
          this.width = props.width;
          this.height = props.height;
          this.x = props.x;
          this.y = props.y;
          this.ctx = ctx;
      
          this.coinImage = new Image();
          this.coinImage.src = props.coinImageSrc;
          this.crashed = false;
          this.coinPipeCrash = false;
        }
      
        draw() {
            if(!this.crashed && !this.coinPipeCrash)
            this.ctx.drawImage(this.coinImage, this.x, this.y, this.width, this.height);
        }
      
        move() {
          this.x +=pipeSpeed;
        }

        remove(){
            this.crashed = true;

        }
      } 
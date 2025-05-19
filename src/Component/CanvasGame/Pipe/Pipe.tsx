export interface PipeProps{
width: number,
height: number,
x: number,
y: number,
bottomImageSrc: string,
topImageSrc: string,
}

export class Pipe{
    width: number;
    height: number;
    x: number;
    y: number;
    topImage: HTMLImageElement;
    bottomImage: HTMLImageElement;
    ctx: CanvasRenderingContext2D;
    gap: number;

    constructor(props: PipeProps, ctx: CanvasRenderingContext2D){
        this.width = props.width;
        this.height = props.height;
        this.x = props.x;
        this.y = props.y;
        this.gap = 100;
        this.ctx = ctx;

        this.topImage = new Image();
        this.topImage.src = props.topImageSrc;
        this.bottomImage = new Image();
        this.bottomImage.src = props.bottomImageSrc;
    }

    draw(){
        this.ctx.drawImage(this.topImage, this.x, 0, this.width, this.y);
        this.ctx.drawImage(this.bottomImage, this.x, this.y + this.gap, this.width, this.height);
    }

    move(){
        this.x += -2;
    }
}
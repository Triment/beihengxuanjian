
interface Draw {
    draw(ctx: CanvasRenderingContext2D, width: number, height: number): void;
}

type PalaceParams = {
    width: number;
    height: number;
}
class Palace implements Draw {
    private width: number;
    private height: number;
    constructor( params: PalaceParams) {
        this.width = params.width;
        this.height = params.height;

    }
    draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
        ctx.fillStyle = 'gold';
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = 'black';
        ctx.font = '20px Arial';
        ctx.fillText('Palace', this.width / 2 - 30, this.height / 2);
    }
}


const elements: Draw[] = [];
elements.push(new Palace({ width: 200, height: 100 }));
document.onload = () => {
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
        console.log('Canvas context obtained successfully');
        elements.forEach(element => {
            element.draw(ctx, canvas.width, canvas.height);
        });
    } else {
        console.error('Failed to get 2D context');
    }
} else {
    console.error('Canvas element not found');
}
}
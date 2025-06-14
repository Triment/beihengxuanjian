// 事件接口
interface HandleEvent {
    type: string;
    x: number;
    y: number;
}

// 鼠标点击事件
class MouseClickEvent implements HandleEvent {
    type: string = 'click';
    constructor(public x: number, public y: number) { }
}

// 事件处理器接口
interface EventHandler {
    handleEvent(event: HandleEvent): void;
}

// Shape接口 - 所有图形元素的基础接口
interface Shape extends EventHandler {
    x: number;
    y: number;
    width: number;
    height: number;
    children: Shape[];
    parent: Shape | null;

    draw(ctx: CanvasRenderingContext2D): void;
    addChild(child: Shape): void;
    removeChild(child: Shape): void;
    containsPoint(x: number, y: number): boolean;
    getAbsoluteX(): number;
    getAbsoluteY(): number;
}

// 抽象基类 - 实现Shape接口的共同功能
abstract class BaseShape implements Shape {
    children: Shape[] = [];
    parent: Shape | null = null;

    constructor(
        public x: number,
        public y: number,
        public width: number,
        public height: number
    ) { }

    // 抽象方法 - 子类必须实现
    abstract draw(ctx: CanvasRenderingContext2D): void;

    // 添加子元素
    addChild(child: Shape): void {
        this.children.push(child);
        child.parent = this;
    }

    // 移除子元素
    removeChild(child: Shape): void {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parent = null;
        }
    }

    // 检查点是否在图形内
    containsPoint(x: number, y: number): boolean {
        // 转换为相对于当前元素的坐标
        const localX = x - this.getAbsoluteX();
        const localY = y - this.getAbsoluteY();

        return (
            localX >= 0 &&
            localX <= this.width &&
            localY >= 0 &&
            localY <= this.height
        );
    }

    // 获取绝对X坐标（考虑父元素）
    getAbsoluteX(): number {
        if (this.parent) {
            return this.parent.getAbsoluteX() + this.x;
        }
        return this.x;
    }

    // 获取绝对Y坐标（考虑父元素）
    getAbsoluteY(): number {
        if (this.parent) {
            return this.parent.getAbsoluteY() + this.y;
        }
        return this.y;
    }

    // 默认事件处理
    handleEvent(event: HandleEvent): void {
        // 首先检查子元素是否处理了事件
        for (let i = this.children.length - 1; i >= 0; i--) {
            const child = this.children[i];
            if (child.containsPoint(event.x, event.y)) {
                child.handleEvent(event);
                return; // 事件被子元素处理
            }
        }

        // 子元素没有处理事件，当前元素处理
        if (event.type === 'click') {
            this.onClick(event as MouseClickEvent);
        }
    }

    // 点击事件处理 - 可由子类重写
    onClick(event: MouseClickEvent): void {
        console.log(`Clicked on shape at (${this.x}, ${this.y})`);
    }
}

// 矩形实现
class Rectangle extends BaseShape {
    constructor(
        x: number,
        y: number,
        width: number,
        height: number,
        public strokeColor: string = 'black'
    ) {
        super(x, y, width, height);
    }

    draw(ctx: CanvasRenderingContext2D): void {
        const absX = this.getAbsoluteX();
        const absY = this.getAbsoluteY();

        ctx.strokeStyle = this.strokeColor;
        ctx.strokeRect(absX, absY, this.width, this.height);

        // 绘制子元素
        this.children.forEach(child => child.draw(ctx));
    }

    // 重写点击事件
    onClick(event: MouseClickEvent): void {
        console.log(`Clicked on rectangle at (${this.getAbsoluteX()}, ${this.getAbsoluteY()})`);
    }
}

// 圆形实现
class Circle extends BaseShape {
    constructor(
        x: number,
        y: number,
        public radius: number,
        public fillColor: string = 'black'
    ) {
        super(x, y, radius * 2, radius * 2);
    }

    draw(ctx: CanvasRenderingContext2D): void {
        const absX = this.getAbsoluteX() + this.radius;
        const absY = this.getAbsoluteY() + this.radius;

        ctx.fillStyle = this.fillColor;
        ctx.beginPath();
        ctx.arc(absX, absY, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // 绘制子元素
        this.children.forEach(child => child.draw(ctx));
    }

    // 重写点包含检查
    containsPoint(x: number, y: number): boolean {
        const centerX = this.getAbsoluteX() + this.radius;
        const centerY = this.getAbsoluteY() + this.radius;

        // 计算点到圆心的距离
        const distance = Math.sqrt(
            Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
        );

        return distance <= this.radius;
    }

    // 重写点击事件
    onClick(event: MouseClickEvent): void {
        console.log(`Clicked on circle at (${this.getAbsoluteX() + this.radius}, ${this.getAbsoluteY() + this.radius})`);
    }
}

// 文本实现
class CustomText extends BaseShape {
    constructor(
        x: number,
        y: number,
        public text: string,
        public font: string = '16px Arial',
        public fillColor: string = 'black'
    ) {
        super(x, y, 0, 0); // 宽高将在绘制时计算
    }

    draw(ctx: CanvasRenderingContext2D): void {
        const absX = this.getAbsoluteX();
        const absY = this.getAbsoluteY();

        ctx.font = this.font;
        ctx.fillStyle = this.fillColor;
        ctx.fillText(this.text, absX, absY + 16); // 加16是为了基线对齐

        // 更新宽高（用于点击检测）
        this.width = ctx.measureText(this.text).width;
        this.height = 16; // 近似字体高度

        // 绘制子元素
        this.children.forEach(child => child.draw(ctx));
    }

    // 重写点击事件
    onClick(event: MouseClickEvent): void {
        console.log(`Clicked on text "${this.text}" at (${this.getAbsoluteX()}, ${this.getAbsoluteY()})`);
    }
}

// 场景类 - 作为所有元素的根容器
class Scene extends BaseShape {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(canvasId: string) {
        super(0, 0, 0, 0);

        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!this.canvas) {
            throw new Error(`Canvas with id ${canvasId} not found`);
        }

        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        if (!this.ctx) {
            throw new Error('Failed to get canvas context');
        }

        // 设置场景大小为画布大小
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // 添加事件监听
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const event = new MouseClickEvent(x, y);
            this.handleEvent(event);
        });
    }

    draw(): void {
        // 清除画布
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 绘制所有子元素
        this.children.forEach(child => child.draw(this.ctx));
    }

    // 重写基类方法，场景不需要计算绝对坐标
    getAbsoluteX(): number {
        return 0;
    }

    getAbsoluteY(): number {
        return 0;
    }
}

class PalaceContainer extends BaseShape {
    constructor(
        x: number,
        y: number,
        width: number,
        height: number,
        public strokeColor: string = 'black'
    ) {
        super(x, y, width, height);
    }

    draw(ctx: CanvasRenderingContext2D): void {
        const absX = this.getAbsoluteX();
        const absY = this.getAbsoluteY();

        ctx.strokeStyle = this.strokeColor;
        ctx.strokeRect(absX, absY, this.width, this.height);

        // 绘制子元素
        this.children.forEach(child => child.draw(ctx));
    }

    // 重写点击事件
    onClick(event: MouseClickEvent): void {
        console.log(`宫位点击:${this.x},${this.y}`);
    }
}

// 示例用法
document.addEventListener('DOMContentLoaded', () => {
    // 创建场景
    const scene = new Scene('canvas');

    // 创建一个矩形
    //const rect = new Rectangle(0, 0, 90, 120, 'blue');
    let coordinates = [
        [2, 3],
        [1, 3],
        [0, 3],
        [0, 2],
        [0, 1],
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
        [3, 1],
        [3, 2],
        [3, 3],
    ]
    let palaceWidth = 160;//宫位宽度
    let palaceHeight = 200;//宫位高度

    let Palaces = [
        new PalaceContainer(0, 0, 90, 120, 'black'),
        new PalaceContainer(0, 120, 90, 120, 'black'),
        new PalaceContainer(90, 0, 90, 120, 'black'),
        new PalaceContainer(90, 120, 90, 120, 'black'),
    ];
    for (const [x, y] of coordinates) {
        let palace = new PalaceContainer(x * palaceWidth, y * palaceHeight, palaceWidth, palaceHeight, 'black');
        scene.addChild(palace);
    }
    //   scene.addChild(rect);

    //   // 创建一个圆形
    //   const circle = new Circle(200, 100, 40, 'red');
    //   scene.addChild(circle);

    //   // 创建一个文本
    //   const text = new CustomText(300, 150, 'Hello, 2D!', '24px Arial', 'green');
    //   scene.addChild(text);

    //   // 创建一个子矩形（相对于父矩形定位）
    //   const childRect = new Rectangle(10, 10, 30, 30, 'yellow');
    //   rect.addChild(childRect);

    // 绘制场景
    scene.draw();
});
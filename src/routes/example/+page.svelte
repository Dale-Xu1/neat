<script lang="ts">
import { onMount } from "svelte"

let canvas: HTMLCanvasElement
let c: CanvasRenderingContext2D

let width: number, height: number
let dt: number = 0.05

class Vector2
{

    public static ZERO: Vector2 = new Vector2(0, 0)

    public static angle(angle: number): Vector2 { return new Vector2(Math.cos(angle), Math.sin(angle)) }
    public constructor(public readonly x: number, public readonly y: number) { }


    public add(vector: Vector2): Vector2 { return new Vector2(this.x + vector.x, this.y + vector.y) }
    public sub(vector: Vector2): Vector2 { return new Vector2(this.x - vector.x, this.y - vector.y) }

    public mul(value: number): Vector2 { return new Vector2(this.x * value, this.y * value) }
    public div(value: number): Vector2 { return new Vector2(this.x / value, this.y / value) }

    public lerp(vector: Vector2, t: number): Vector2
    {
        return new Vector2(this.x + (vector.x - this.x) * t, this.y + (vector.y - this.y) * t)
    }

}

interface PlayerController
{

    forward: number
    direction: number

    shoot: boolean

}

abstract class Body
{

    private previousPos: Vector2
    private previousAngle: number

    protected constructor(protected pos: Vector2, protected angle: number)
    {
        this.previousPos = pos
        this.previousAngle = angle
    }
    

    public update()
    {
        this.previousPos = this.pos
        this.previousAngle = this.angle
    }

    private lerp(a: number, b: number, t: number): number { return a + (b - a) * t }
    public render(alpha: number)
    {
        let pos = this.previousPos.lerp(this.pos, alpha)
        let angle = this.lerp(this.previousAngle, this.angle, alpha)

        c.save()
        c.translate(pos.x, pos.y)
        c.rotate(angle)
    }

}

class Player extends Body
{

    private vel: Vector2 = Vector2.ZERO
    private avel: number = 0

    public constructor(private readonly game: AsteroidsGame, private readonly controller: PlayerController)
    {
        super(new Vector2(width / 2, height / 2), -Math.PI / 2)
    }


    private delay: number = 0

    public override update()
    {
        super.update()

        if (this.controller.forward)
        {
            this.vel = this.vel.add(Vector2.angle(this.angle).mul(3))
        }
        this.avel += this.controller.direction * 0.06

        if (this.delay <= 0)
        {
            if (this.controller.shoot)
            {
                this.delay = 5
                this.game.bullets.push(new Bullet(this.pos, this.angle))
            }
        }
        else this.delay--

        this.pos = this.pos.add(this.vel)
        this.vel = this.vel.mul(0.8)

        this.angle += this.avel
        this.avel = this.avel * 0.8

        let margin = 30
        if (this.pos.x < -margin)
        {
            this.pos = new Vector2(width + margin, this.pos.y)
            super.update()
        }
        else if (this.pos.x > width + margin)
        {
            this.pos = new Vector2(-margin, this.pos.y)
            super.update()
        }

        if (this.pos.y < -margin)
        {
            this.pos = new Vector2(this.pos.x, height + margin)
            super.update()
        }
        else if (this.pos.y > height + margin)
        {
            this.pos = new Vector2(this.pos.x, -margin)
            super.update()
        }
    }

    public override render(alpha: number)
    {
        super.render(alpha)

        c.strokeStyle = "white"
        c.lineWidth = 2

        c.beginPath()
        c.moveTo(-20, 10)
        c.lineTo(20, 0.25)
        c.lineTo(20, -0.25)
        c.lineTo(-20, -10)
        c.stroke()
        
        c.beginPath()
        c.moveTo(-15, 9)
        c.lineTo(-15, -9)
        c.stroke()

        if (this.controller.forward > 0.2)
        {
            c.beginPath()
            c.moveTo(-15, 4)
            c.lineTo(-24, 0)
            c.lineTo(-15, -4)
            c.stroke()
        }

        c.restore()
    }

}

class Bullet extends Body
{

    private readonly vel: Vector2

    public constructor(pos: Vector2, angle: number)
    {
        let dir = Vector2.angle(angle)
        super(pos.add(dir.mul(20)), angle)

        this.vel = Vector2.angle(angle).mul(40)
    }


    public update(): boolean
    {
        super.update()
        this.pos = this.pos.add(this.vel)

        let margin = 10
        return this.pos.x < -margin || this.pos.x > width + margin ||
            this.pos.y < -margin || this.pos.y > height + margin
    }

    public render(alpha: number)
    {
        super.render(alpha)

        c.strokeStyle = "white"
        c.lineWidth = 2

        c.beginPath()
        c.moveTo(-3, 0)
        c.lineTo(3, 0)
        c.stroke()

        c.restore()
    }

}

class AsteroidsGame
{

    private readonly player: Player = new Player(this, new ManualController())
    public readonly bullets: Bullet[] = []

    public constructor()
    {
        this.loop = this.loop.bind(this)
    }


    private update()
    {
        this.player.update()
        for (let i = this.bullets.length - 1; i >= 0; i--)
        {
            let bullet = this.bullets[i]
            if (bullet.update()) this.bullets.splice(i, 1)
        }
    }

    private render(alpha: number)
    {
        c.clearRect(0, 0, width, height)

        this.player.render(alpha)
        for (let bullet of this.bullets) bullet.render(alpha)
    }

    private readonly delay: number = 1000 * dt

    private previous!: number
    private accumulated: number = 0

    public start() { window.requestAnimationFrame(this.loop) }
    private loop(now: number)
    {
        this.start()
        
        if (this.previous) this.accumulated += now - this.previous
        else this.update()

        this.previous = now
        while (this.accumulated > this.delay)
        {
            this.accumulated -= this.delay
            this.update()
        }

        this.render(this.accumulated / this.delay)
    }

}

class ManualController implements PlayerController
{

    public forward: number = 0
    public get direction(): number { return this.right - this.left }

    private left: number = 0
    private right: number = 0

    public shoot: boolean = false

    public constructor()
    {
        window.addEventListener("keydown", this.keydown.bind(this))
        window.addEventListener("keyup", this.keyup.bind(this))
    }


    private keydown(e: KeyboardEvent)
    {
        switch (e.key)
        {
            case "w": case "ArrowUp": this.forward = 1; break
            case "a": case "ArrowLeft": this.left = 1; break
            case "d": case "ArrowRight": this.right = 1; break
            case " ": this.shoot = true; break
        }
    }

    private keyup(e: KeyboardEvent)
    {
        switch (e.key)
        {
            case "w": case "ArrowUp": this.forward = 0; break
            case "a": case "ArrowLeft": this.left = 0; break
            case "d": case "ArrowRight": this.right = 0; break
            case " ": this.shoot = false; break
        }
    }

}

onMount(() =>
{
    c = canvas.getContext("2d")!
    let ratio = window.devicePixelRatio

    width = window.innerWidth, height = window.innerHeight

    canvas.width = width * ratio
    canvas.height = height * ratio
    c.scale(ratio, ratio)

    let asteroids = new AsteroidsGame()
    asteroids.start()
})

</script>
<canvas bind:this={canvas}></canvas>

<style>
:global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:global(body) {
    overflow: hidden;
}

canvas {
    width: 100%;
    height: 100vh;
    background-color: black;
}

</style>

import type Genome from "./neat/Genome"
import type { Gene } from "./neat/Genome"

const MARGIN = 0.1
const RADIUS = 8

export default class GenomeRenderer
{

    private static generator(seed: number): () => number {
        let a = 0x9E3779B9, b = 0x243F6A88, c = 0xB7E15162, d = seed ^ 0xDEADBEEF
        return function() {
            a >>>= 0, b >>>= 0, c >>>= 0, d >>>= 0

            let t = (a + b) | 0
            a = b ^ b >>> 9
            b = c + (c << 3) | 0
            c = (c << 21 | c >>> 11)
            d = d + 1 | 0
            t = t + d | 0
            c = c + t | 0

            return (t >>> 0) / 4294967296
        }
    }


    private readonly genes: Gene[]
    private readonly nodes: [number, number][] = []


    public constructor(genome: Genome)
    {
        this.genes = genome.genes

        for (let i = 0; i < genome.inputs + 1; i++) this.nodes.push([MARGIN, (i + 1) / (genome.inputs + 2)])
        for (let i = 0; i < genome.outputs; i++) this.nodes.push([1 - MARGIN, (i + 1) / (genome.outputs + 1)])

        let m = MARGIN * 1.5
        let n = 1 / (Math.max(genome.inputs + 1, genome.outputs) + 1)

        let random = GenomeRenderer.generator(2)

        let nodes = genome.inputs + genome.outputs + 1
        for (let i = nodes; i < genome.nodes; i++)
        {
            this.nodes.push([random() * (1 - 2 * m) + m, random() * (1 - 2 * n) + n])
        }
    }


    public render(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number)
    {
        c.save()
        c.translate(x, y)

        this.renderConnections(c, w, h)
        this.renderNodes(c, w, h)

        c.restore()
    }

    private renderConnections(c: CanvasRenderingContext2D, w: number, h: number)
    {
        for (let gene of this.genes)
        {
            if (!gene.enabled) continue

            let [fx, fy] = this.nodes[gene.from]
            let [tx, ty] = this.nodes[gene.to]

            let alpha = Math.min(Math.abs(gene.weight), 1)

            c.strokeStyle = gene.weight > 0 ? `rgba(255, 0, 0, ${alpha})` : `rgba(0, 0, 255, ${alpha})`
            c.lineWidth = Math.abs(gene.weight) + 1

            if (gene.from === gene.to)
            {
                let r = RADIUS * 1.5
                c.strokeRect(fx * w - r, fy * h - r, 2 * r, r)
            }
            else
            {
                c.beginPath()
                c.moveTo(fx * w, fy * h)
                c.lineTo(tx * w, ty * h)
                c.stroke()
            }
        }
    }

    private renderNodes(c: CanvasRenderingContext2D, w: number, h: number)
    {
        c.fillStyle = "white"
        c.strokeStyle = "black"
        c.lineWidth = 1

        for (let [x, y] of this.nodes)
        {
            c.beginPath()
            c.arc(x * w, y * h, RADIUS, 0, 2 * Math.PI)

            c.fill()
            c.stroke()
        }
    }

}

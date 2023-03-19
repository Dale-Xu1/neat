import type Genome from "./neat/Genome"
import type { Gene } from "./neat/Genome"

const MARGIN = 0.1
const RADIUS = 8

export default class GenomeRenderer
{

    private readonly genes: Gene[]
    private readonly nodes: [number, number][] = []


    public constructor(genome: Genome)
    {
        this.genes = genome.genes.filter(gene => gene.enabled)

        for (let i = 0; i < genome.inputs + 1; i++) this.nodes.push([MARGIN, (i + 1) / (genome.inputs + 2)])
        for (let i = 0; i < genome.outputs; i++) this.nodes.push([1 - MARGIN, (i + 1) / (genome.outputs + 1)])

        let layers = this.organize(genome)
        for (let i = 0; i < layers.length; i++)
        {
            let layer = layers[i]
            let x = MARGIN + ((i + 1) / (layers.length + 1)) * (1 - 2 * MARGIN)

            for (let j = 0; j < layer.length; j++) this.nodes[layer[j]] = [x, (j + 1) / (layer.length + 1)]
        }
    }

    private organize(genome: Genome): number[][]
    {
        let layers: number[][] = [[]]

        let nodes = genome.inputs + genome.outputs + 1
        for (let i = nodes; i < genome.nodes; i++)
        {
            let layer = layers.find(layer => this.compatible(i, layer))

            if (layer) layer.push(i)
            else layers.push([ i ])
        }

        return layers
    }

    private compatible(i: number, layer: number[]): boolean
    {
        for (let gene of this.genes.filter(gene => gene.to === i))
        {
            for (let j of layer) if (gene.from === j) return false
        }
        for (let gene of this.genes.filter(gene => gene.from === i))
        {
            for (let j of layer) if (gene.to === j) return false
        }

        return true
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
            let [fx, fy] = this.nodes[gene.from]
            let [tx, ty] = this.nodes[gene.to]

            let alpha = Math.min(Math.abs(gene.weight) / 2, 1)

            c.strokeStyle = gene.weight > 0 ? `rgba(125, 240, 105, ${alpha})` : `rgba(240, 80, 80, ${alpha})`
            c.lineWidth = Math.abs(gene.weight) + 1

            if (gene.from === gene.to)
            {
                let r = 1.8 * RADIUS
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
            c.fillRect(x * w - RADIUS, y * h - RADIUS, 2 * RADIUS, 2 * RADIUS)
            c.strokeRect(x * w - RADIUS, y * h - RADIUS, 2 * RADIUS, 2 * RADIUS)
        }
    }

}

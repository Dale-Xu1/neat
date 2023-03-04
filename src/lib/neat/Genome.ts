import { Random } from "../Math"

const MUTATE_WEIGHT = 0.8 // Chance of mutating a weight
const ADD_CONNECTION = 0.05 // Chance of adding a connection
const ADD_NODE = 0.03 // Chance of adding a node

const RESET_WEIGHT = 0.1 // Chance of resetting a weight during mutation
const WEIGHT_SHIFT = 0.05 // Standard deviation when weight is shifted
const ENABLE_GENE = 0.25 // Chance a gene is enabled if it is disabled in either parent

export default class Genome
{

    public static init(inputs: number, outputs: number): Genome
    {
        let nodes = inputs + outputs + 1 // Extra node is bias input
        let genome = new Genome([], inputs, outputs, nodes)

        genome.genes.push(genome.randomConnection())
        return genome
    }

    private constructor(public readonly genes: Gene[],

        public readonly inputs: number,
        public readonly outputs: number,

        public readonly nodes: number) { }


    private copy(genes: Gene[], nodes: number): Genome { return new Genome(genes, this.inputs, this.outputs, nodes) }
    public mutate(): Genome
    {
        let genes: Gene[] = []
        for (let gene of this.genes)
        {
            genes.push(Random.bool(MUTATE_WEIGHT) ? gene.mutate() : gene)
        }

        let nodes = this.nodes
        if (Random.bool(ADD_CONNECTION)) genes.push(this.randomConnection())
        if (Random.bool(ADD_NODE))
        {
            let i = Random.int(genes.length)
            let gene = genes[i]

            let n = nodes++

            // Disable original connection and create new connections
            genes[i] = gene.disable()
            genes.push(Gene.init(gene.from, n, 1))
            genes.push(Gene.init(n, gene.to, gene.weight))
        }

        return this.copy(genes, nodes)
    }

    private randomConnection(): Gene
    {
        let from = Random.int(this.nodes)
        let to = Random.int(this.nodes)

        // Connection cannot lead to input or already exist
        if (to <= this.inputs) return this.randomConnection()
        for (let gene of this.genes)
        {
            if (gene.from === from && gene.to === to) return this.randomConnection()
        }

        return Gene.init(from, to, Random.normal())
    }

    public crossover(genome: Genome): Genome
    {
        let genes: Gene[] = []
        for (let gene of this.genes)
        {
            // Test if gene has a matching gene
            for (let other of genome.genes) if (gene.innovation === other.innovation)
            {
                gene = gene.crossover(other)
            }

            genes.push(gene)
        }

        return this.copy(genes, this.nodes)
    }

}

export class Gene
{

    private static readonly innovations: Map<string, number> = new Map()
    private static n: number = 0

    public static clearHistory() { this.innovations.clear() }
    private static getInnovation(from: number, to: number): number
    {
        let hash = `${from} ${to}`

        let number = this.innovations.get(hash)
        if (number) return number

        this.innovations.set(hash, this.n)
        return this.n++
    }


    public static init(from: number, to: number, weight: number): Gene
    {
        let innovation = this.getInnovation(from, to)
        return new Gene(innovation, from, to, weight, true)
    }

    private constructor(public readonly innovation: number,
        
        public readonly from: number,
        public readonly to: number,

        public readonly weight: number,
        public readonly enabled: boolean) { }


    public disable(): Gene { return this.copy(this.weight, false) }
    private copy(weight: number, enabled: boolean): Gene
    {
        return new Gene(this.innovation, this.from, this.to, weight, enabled)
    }

    public mutate(): Gene
    {
        // Either reset or randomly shift weight
        let weight: number
        if (Random.bool(RESET_WEIGHT)) weight = Random.normal()
        else weight = this.weight + Random.normal(WEIGHT_SHIFT)

        return this.copy(weight, this.enabled)
    }

    public crossover(gene: Gene): Gene
    {
        let weight = Random.bool() ? this.weight : gene.weight
        let enabled = (this.enabled && gene.enabled) || Random.bool(ENABLE_GENE)

        return this.copy(weight, enabled)
    }

}

const MARGIN = 0.1
const RADIUS = 10

export class GenomeRenderer
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
            c.lineWidth = Math.abs(gene.weight + 1)

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

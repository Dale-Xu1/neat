import { Random } from "../Math"
import type { Selectable } from "./NEAT"

const MUTATE_WEIGHT = 0.8 // Chance of mutating a weight
const ADD_CONNECTION = 0.05 // Chance of adding a connection
const ADD_NODE = 0.03 // Chance of adding a node

const RESET_WEIGHT = 0.1 // Chance of resetting a weight during mutation
const WEIGHT_SHIFT = 0.05 // Standard deviation when weight is shifted
const ENABLE_GENE = 0.25 // Chance a gene is enabled if it is disabled in either parent

export default class Genome implements Selectable
{

    public static init(inputs: number, outputs: number): Genome
    {
        let nodes = inputs + outputs + 1 // Extra node is bias input
        let genome = new Genome([], inputs, outputs, nodes)

        genome.genes[0] = genome.randomConnection()
        return genome
    }


    public fitness: number = 0

    private constructor(public readonly genes: Gene[],

        public readonly inputs: number,
        public readonly outputs: number,

        public readonly nodes: number) { }


    private copy(genes: Gene[], nodes: number): Genome { return new Genome(genes, this.inputs, this.outputs, nodes) }
    public mutate(): Genome
    {
        let genes = this.genes.map(gene => Random.bool(MUTATE_WEIGHT) ? gene.mutate() : gene)

        let nodes = this.nodes
        let max = nodes * (nodes - this.inputs - 1)

        if (Random.bool(ADD_CONNECTION) && genes.length < max) genes.push(this.randomConnection())
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
        let genes = this.genes.map(gene =>
        {
            // Test if gene has a matching gene
            for (let other of genome.genes) if (gene.innovation === other.innovation) return gene.crossover(other)
            return gene
        })

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
        let hash = `${from}-${to}`

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

export class NeuralNetwork
{

    private readonly nodes: Node[]

    private readonly inputs: Node[] = []
    private readonly outputs: Node[] = []


    public constructor(genome: Genome,
        private readonly activation: ActivationFunction = Activation.linear,
        hidden: ActivationFunction = Activation.reLU)
    {
        if (hidden === Activation.softmax) throw new Error("Softmax cannot be used for hidden nodes")

        for (let i = 0; i < genome.inputs + 1; i++) this.inputs[i] = new Node()
        for (let i = 0; i < genome.outputs; i++) this.outputs[i] = new Node()

        this.nodes = this.inputs.concat(this.outputs)
        for (let i = this.nodes.length; i < genome.nodes; i++) this.nodes[i] = new Node(hidden)

        // Convert connections to network nodes
        for (let gene of genome.genes)
        {
            if (!gene.enabled) continue

            let from = this.nodes[gene.from]
            let to = this.nodes[gene.to]

            to.connections.push([from, gene.weight])
        }
    }

    public predict(input: number[]): number[]
    {
        let n = input.length
        if (n !== this.inputs.length - 1) throw new Error("Invalid input")

        // Initialize input values
        for (let i = 0; i < n; i++) this.inputs[i].init(input[i])
        this.inputs[n].init(1)

        // Evaluate outputs
        let output: number[] = this.activation(this.outputs.map(node => node.evaluate()))
        for (let i = 0; i < output.length; i++) this.outputs[i].init(output[i])

        for (let node of this.nodes) node.reset()
        return output
    }

}

class Node
{

    public readonly connections: [Node, number][] = []

    private value: number = 0
    private evaluated: boolean = false

    public constructor(private readonly activation: ActivationFunction = Activation.linear) { }


    public reset() { this.evaluated = false }
    public init(value: number)
    {
        this.value = value
        this.evaluated = true
    }

    public evaluate(): number
    {
        if (this.evaluated) return this.value
        this.evaluated = true

        // Calculate weighted sum
        let sum = 0
        for (let [node, weight] of this.connections)
        {
            sum += node.evaluate() * weight
        }

        return this.value = this.activation([ sum ])[0]
    }

}

interface ActivationFunction
{

    (inputs: number[]): number[]

}

export namespace Activation
{

    export function linear(inputs: number[]): number[] { return inputs }
    export function sigmoid(inputs: number[]): number[]
    {
        return inputs.map(value => 1 / (1 + Math.pow(Math.E, -4.9 * value)))
    }

    export function reLU(inputs: number[]): number[] { return inputs.map(value => value > 0 ? value : 0) }
    export function softmax(inputs: number[]): number[]
    {
        let max = Math.max(...inputs)
        let exp = inputs.map(value => Math.exp(value - max))

        let sum = exp.reduce((a, b) => a + b)
        return exp.map(value => value / sum)
    }

}

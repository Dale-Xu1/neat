import { Random } from "../Math"
import Genome, { Gene } from "./Genome"

const COPY_GENOME = 5 // Minimum genomes in a species for the best to be copied
const NO_CROSSOVER = 0.25 // Chance a child is created without crossover

const MIN_NORMAL = 20 // Minimum gene length where normalizer is 1
const DISJOINT = 1 // How much disjoint genes contribute to distance
const WEIGHTS = 3 // How much weight differences contribute to distance
const DIFFERENCE_THRESHOLD = 4 // Distance threshold for whether is genome is part of a species

export default class NEAT
{

    public population: Genome[] = []
    private species: Species[] = []


    public constructor(inputs: number, outputs: number, private readonly n: number)
    {
        for (let i = 0; i < n; i++) this.population[i] = Genome.init(inputs, outputs)
        this.sortSpecies()
    }

    public get best(): Genome
    {
        let best: Genome | null = null
        for (let genome of this.population) if (!best || genome.fitness > best.fitness) best = genome

        return best!
    }



    public next()
    {
        this.nextGenomes()
        this.sortSpecies()

        Gene.clearHistory()
    }

    private nextGenomes()
    {
        // Copy best genomes from large enough species
        this.population = []
        for (let species of this.species) if (species.genomes.length > COPY_GENOME) this.population.push(species.best)

        let species = this.species.map(species => new GenomeSelector(species.genomes))
        let selector = new Selector(species)

        // Generate new population
        for (let i = this.population.length; i < this.n; i++)
        {
            let species = selector.next()
            this.population[i] = species.next().mutate()
        }
    }

    private sortSpecies()
    {
        this.species = this.species.map(species => new Species(species.representative))
        for (let genome of this.population)
        {
            let compatible: Species | null = null
            for (let species of this.species) if (species.distance(genome) < DIFFERENCE_THRESHOLD)
            {
                compatible = species
                break
            }

            // Create new species if genome is not compatible with existing
            if (!compatible) this.species.push(compatible = new Species(genome))
            compatible.genomes.push(genome)
        }

        this.species = this.species.filter(species => species.genomes.length > 0)
    }

}

export interface Selectable
{

    fitness: number

}

class Selector<T extends Selectable>
{

    private readonly sum: number = 0

    public constructor(private readonly list: T[])
    {
        for (let item of list) this.sum += item.fitness
    }


    public next(): T
    {
        if (this.sum === 0) return this.list[Random.int(this.list.length)]

        // Randomly select item over weighted distribution
        let r = Random.next(this.sum)
        let acc = 0

        for (let item of this.list)
        {
            acc += item.fitness
            if (acc > r) return item
        }

        throw new Error()
    }

}

class Species
{

    public readonly genomes: Genome[] = []

    public constructor(public readonly representative: Genome) { }


    public get best(): Genome
    {
        let best: Genome | null = null
        for (let genome of this.genomes) if (!best || genome.fitness > best.fitness) best = genome

        return best!
    }

    public distance(genome: Genome): number
    {
        let length = Math.max(this.representative.genes.length, genome.genes.length)
        let normalizer = Math.max(length - MIN_NORMAL, 1)

        let disjoint = this.disjoint(genome)
        let weights = this.weightDifference(genome)

        return DISJOINT * disjoint / normalizer + WEIGHTS * weights
    }

    private disjoint(genome: Genome): number
    {
        let matching = 0
        for (let gene of this.representative.genes)
        {
            // Test if gene has a matching gene
            for (let other of genome.genes) if (gene.innovation === other.innovation)
            {
                matching++
                break
            }
        }

        let total = this.representative.genes.length + genome.genes.length
        return total - 2 * matching
    }

    private weightDifference(genome: Genome): number
    {
        let difference = 0, total = 0
        for (let gene of this.representative.genes)
        {
            for (let other of genome.genes) if (gene.innovation === other.innovation)
            {
                difference += Math.abs(gene.weight - other.weight)
                total++
                break
            }
        }

        if (total === 0) return Infinity
        return difference / total
    }

}

class GenomeSelector extends Selector<Genome> implements Selectable
{

    public readonly fitness: number

    public constructor(genomes: Genome[])
    {
        super(genomes)

        let sum = 0
        for (let genome of genomes) sum += genome.fitness

        this.fitness = sum / genomes.length
    }


    public override next(): Genome
    {
        if (Random.bool(NO_CROSSOVER)) return super.next()

        let a = super.next()
        let b = super.next()

        return a.fitness > b.fitness ? a.crossover(b) : b.crossover(a)
    }

}

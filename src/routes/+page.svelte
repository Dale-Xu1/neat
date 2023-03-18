<script lang="ts">
    import NEAT from "$lib/neat/NEAT";
import { onMount } from "svelte"

import Genome, { NeuralNetwork } from "../lib/neat/Genome"
import GenomeRenderer from "../lib/Renderer"

let canvas: HTMLCanvasElement
onMount(() =>
{
    let c = canvas.getContext("2d")!

    let width = 300, height = 150
    let ratio = window.devicePixelRatio

    canvas.width = width * ratio
    canvas.height = height * ratio

    canvas.style.width = width + "px"
    canvas.style.height = height + "px"

    c.scale(ratio, ratio)

    let inputs = [[0, 0], [1, 0], [0, 1], [1, 1]]
    let outputs = [0, 1, 1, 0]

    function evaluatePopulation()
    {
        for (let genome of neat.population)
        {
            let network = new NeuralNetwork(genome)
            let error = 0

            let indices = [0, 1, 2, 3] // .sort(() => Math.random() - 0.5)
            for (let j of indices) error += (network.predict(inputs[j])[0] - outputs[j]) ** 2

            genome.fitness = 1 / error
        }
    }

    let neat = new NEAT(2, 1, 500)
    for (let i = 0; i < 100; i++)
    {
        evaluatePopulation()
        neat.next()
    }

    evaluatePopulation()
    console.log(neat)

    let genome = neat.best
    let network = new NeuralNetwork(genome)

    let renderer = new GenomeRenderer(genome)
    renderer.render(c, 0, 0, width, height)

    console.log(network.predict([0, 0]))
    console.log(network.predict([1, 0]))
    console.log(network.predict([0, 1]))
    console.log(network.predict([1, 1]))
})

</script>

<canvas bind:this={canvas}></canvas>

<style>

</style>

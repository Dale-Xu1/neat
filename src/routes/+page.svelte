<script lang="ts">
import { onMount } from "svelte"

import Genome, { Gene, NeuralNetwork } from "../lib/neat/Genome"
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

    let a = Genome.init(2, 1)
    let b = Genome.init(2, 1)
    for (let i = 0; i < 10; i++)
    {
        a = a.mutate()
        b = b.mutate()
    }

    let genome = a.crossover(b)

    let network = new NeuralNetwork(genome)
    let renderer = new GenomeRenderer(genome)

    c.scale(ratio, ratio)
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

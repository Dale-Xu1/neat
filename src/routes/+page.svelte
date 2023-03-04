<script lang="ts">
import { onMount } from "svelte"

import Genome, { GenomeRenderer } from "../lib/neat/Genome"

let canvas: HTMLCanvasElement

onMount(() =>
{
    let c = canvas.getContext("2d")!

    canvas.width = 400
    canvas.height = 200

    let genome = Genome.init(4, 3)
    for (let i = 0; i < 100; i++) genome = genome.mutate()

    let renderer = new GenomeRenderer(genome)
    renderer.render(c, 0, 0, canvas.width, canvas.height)

    console.log(genome)
})

</script>

<canvas bind:this={canvas}></canvas>

<style>

</style>

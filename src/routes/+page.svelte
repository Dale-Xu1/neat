<script lang="ts">
import { onMount } from "svelte"

import NEAT from "../lib/neat/NEAT"
import { NeuralNetwork } from "../lib/neat/Genome"
import GenomeRenderer from "../lib/Renderer"

let canvas: HTMLCanvasElement
onMount(() =>
{
    let c = canvas.getContext("2d")!

    let width = 500, height = 250
    let ratio = window.devicePixelRatio

    canvas.width = width * ratio
    canvas.height = height * ratio

    canvas.style.width = width + "px"
    canvas.style.height = height + "px"

    c.scale(ratio, ratio)

    let inputs = [[0, 0], [1, 0], [0, 1], [1, 1]]
    let outputs = [[0, 1], [1, 0], [1, 0], [0, 1]]

    function evaluatePopulation()
    {
        for (let genome of neat.population)
        {
            let network = new NeuralNetwork(genome)

            let error = 0
            for (let n = 0; n < 8; n++)
            {
                let indices = [0, 1, 2, 3].sort(() => Math.random() - 0.5)
                for (let i of indices)
                {
                    let prediction = network.predict(inputs[i])
                    for (let j = 0; j < 2; j++) error += (prediction[j] - outputs[i][j]) ** 2
                }
            }

            genome.fitness = Math.exp(4 - error)
        }
    }

    let neat = new NEAT(2, 2, 500)
    let i = 0

    loop()
    function loop()
    {
        evaluatePopulation()
        console.log(i++, neat.best.fitness)

        let genome = neat.best
        let renderer = new GenomeRenderer(genome)

        c.clearRect(0, 0, width, height)
        renderer.render(c, 0, 0, width, height)

        neat.next()
        if (i > 100)
        {
            let network = new NeuralNetwork(genome)

            console.log(network.predict([0, 0]))
            console.log(network.predict([1, 0]))
            console.log(network.predict([0, 1]))
            console.log(network.predict([1, 1]))
        }
        else requestAnimationFrame(loop)
    }
})

</script>
<canvas bind:this={canvas}></canvas>

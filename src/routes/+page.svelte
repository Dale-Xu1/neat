<script lang="ts">
import { onMount } from "svelte"

let canvas: HTMLCanvasElement

onMount(() =>
{
    let x = 0
    console.log(x)
})

</script>

<h1>Hi</h1>
<canvas bind:this={canvas}></canvas>

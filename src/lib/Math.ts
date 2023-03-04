export class Random
{

    public static next(range: number = 1): number { return Math.random() * range }

    public static int(range: number): number { return Math.trunc(Random.next(range)) }
    public static bool(p: number = 0.5): boolean { return Math.random() < p }

    public static normal(sd: number = 1): number
    {
        let u = 1 - Math.random()
        let v = 1 - Math.random()

        return Math.sqrt(-2 * Math.log(u)) * Math.sin(2 * Math.PI * v) * sd
    }

}

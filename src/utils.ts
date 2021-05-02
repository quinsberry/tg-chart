import { MouseProxy } from './chart'
import { Columns, Types } from './data'

export function formatDate(timestamp: number, withDay: boolean = false): string {
    const shortMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    const date = new Date(timestamp)
    return withDay
        ? `${shortDays[date.getDay()]}, ${shortMonth[date.getMonth()]} ${date.getDate()}`
        : `${shortMonth[date.getMonth()]} ${date.getDate()}`
}

export function isMouseOver(mouse: MouseProxy, x: number, length: number, width: number): boolean {
    const dWidth = width / length
    return Math.abs(x - mouse.coords.x) < dWidth / 2
}

export function line(ctx: CanvasRenderingContext2D, coords: number[][], color: string, translate: number = 0): void {
    ctx.beginPath()
    ctx.save()
    ctx.lineWidth = 4
    ctx.translate(translate, 0)
    ctx.strokeStyle = color
    for (const [x, y] of coords) {
        ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.restore()
    ctx.closePath()
}

export function circle(ctx: CanvasRenderingContext2D, [x, y]: [number, number], color: string, radius: number) {
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.fillStyle = '#fff'
    ctx.lineWidth = 2
    ctx.arc(x, y, radius, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
    ctx.closePath()
}

export function computeBoundaries(columns: Columns, types: Types): [number, number] {
    let min
    let max

    columns.forEach(column => {
        if (types[column[0]] !== 'line') {
            return
        }

        if (typeof min !== 'number') min = column[1]
        if (typeof max !== 'number') max = column[1]

        if (min > column[1]) min = column[1]
        if (max < column[1]) max = column[1]

        for (let i = 2; i < column.length; i++) {
            if (min > column[i]) min = column[i]
            if (max < column[i]) max = column[i]
        }
    })

    return [min, max]
}

export function css(el: HTMLElement, styles = {}) {
    Object.assign(el.style, styles)
}

export function toCoords(xRatio: number, yRatio: number, dpiHeight, padding, yMin): (column: (string | number)[]) => number[][] {
    return (col) =>
        col.map((y, i) => [
                Math.floor((i - 1) * xRatio),
                Math.floor(dpiHeight - padding - (+y - yMin) / yRatio),
            ]).filter((_, i) => i > 0)
}

export function computeYRatio(height: number, max: number, min: number): number {
    return (max - min) / height
}

export function computeXRatio(width: number, length: number): number {
    return width / (length - 2)
}

import { Data } from './data'
import {
    circle,
    computeBoundaries,
    computeXRatio,
    computeYRatio,
    css,
    formatDate,
    isMouseOver,
    line,
    toCoords,
} from './utils'
import {
    Chart,
    CIRCLE_RADIUS,
    ROW_FILL,
    ROW_FONT,
    ROWS_COLOR,
} from './constants'
import { tooltip } from './tooltip'
import { sliderChart } from './slider'


export interface MouseProxyCoords {
    x: number
}

export interface MouseProxyTooltip {
    left: number
    top: number
}

export interface MouseProxy {
    coords: MouseProxyCoords,
    tooltip: MouseProxyTooltip
}

export interface Proxy {
    mouse: MouseProxy
    pos: [number, number]
    max: number
}

interface ChartOutput {
    init: () => void
    destroy: () => void
}

export function chart(root: HTMLElement, data: Data): ChartOutput {

    const canvas: HTMLCanvasElement = root.querySelector('[data-el="main"]')
    const tip = tooltip(root.querySelector('[data-el="tooltip"]') as HTMLElement)
    const slider = sliderChart({
        root: root.querySelector('[data-el="slider"]'),
        data,
        options: {
            dpiWidth: Chart.DPI_WIDTH,
        },
    })

    let requestAnimationFrameRef: number
    let prevMax: number

    const ctx = canvas.getContext('2d')

    canvas.width = Chart.DPI_WIDTH
    canvas.height = Chart.DPI_HEIGHT
    css(canvas, {
        width: Chart.WIDTH + 'px',
        height: Chart.HEIGHT + 'px',
    })

    const proxyTarget: Proxy = {
        mouse: {
            coords: { x: undefined },
            tooltip: {
                left: undefined,
                top: undefined,
            },
        },
        pos: [undefined, undefined],
        max: undefined,
    }
    const proxy = new Proxy<Proxy>(proxyTarget, {
        set(...args) {
            requestAnimationFrameRef = requestAnimationFrame(paint)
            return Reflect.set(...args)
        },
    })

    slider.subscribe(pos => proxy.pos = pos)

    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)

    // function getMax(max: number): number {
    //     const step = (max - prevMax) / Animation.SPEED
    //
    //     if (proxy.max < max) {
    //         proxy.max += step
    //     } else if (proxy.max > max) {
    //         proxy.max = max
    //         prevMax = max
    //     }
    //
    //     return proxy.max
    // }
    //
    // function translateX(length: number, xRatio: number, left: number): number {
    //     return -1 * Math.round((left * length * xRatio) / 100)
    // }

    function onMouseMove({ clientX, clientY }: MouseEvent) {
        const { left, top } = canvas.getBoundingClientRect()
        proxy.mouse = {
            coords: {
                x: (clientX - left) * 2,
            },
            tooltip: {
                left: clientX - left,
                top: clientY - top,
            },
        }
    }

    function onMouseLeave() {
        proxy.mouse.coords.x = undefined
        tip.hide()
    }

    function clearCanvas() {
        ctx.clearRect(0, 0, Chart.DPI_WIDTH, Chart.DPI_HEIGHT)
    }

    function paint() {
        clearCanvas()

        const length = data.columns[0].length

        const [leftPos, rightPos] = proxy.pos
        const leftIndex = Math.round(length * leftPos / 100)
        const rightIndex = Math.round(length * rightPos / 100)

        const columns = data.columns.map(column => {
            const limitedColumns = column.slice(leftIndex, rightIndex)

            if (typeof limitedColumns[0] !== 'string') {
                limitedColumns.unshift(column[0])
            }
            return limitedColumns
        })

        const [yMin, yMax] = computeBoundaries(columns, data.types)

        if (!prevMax) {
            prevMax = yMax
            proxy.max = yMax
        }

        // const max = getMax(yMax)

        const yRatio = computeYRatio(Chart.VIEW_HEIGHT, yMax, yMin)
        const xRatio = computeXRatio(Chart.VIEW_WIDTH, columns[0].length)

        // const translate = translateX(data.columns[0].length, xRatio, proxy.pos[0])

        const yData = columns.filter(column => data.types[column[0]] === 'line')
        const xData = columns.filter(column => data.types[column[0]] !== 'line')[0]

        yAxis(yMax, yMin)
        xAxis(xData, yData, xRatio, yRatio)

        yData.map(toCoords(xRatio, yRatio, Chart.DPI_HEIGHT, Chart.PADDING, yMin)).forEach((coords, idx) => {
            const color = data.colors[yData[idx][0]]
            line(ctx, coords, color)

            for (const [x, y] of coords) {
                if (isMouseOver(proxy.mouse, x, coords.length, Chart.DPI_WIDTH)) {
                    circle(ctx, [x, y], color, CIRCLE_RADIUS)
                    break
                }
            }
        })
    }

    function xAxis(xData: (string | number)[], yData: (string | number)[][], xRatio: number, yRatio: number, colsCount = 6): void {
        const step = Math.round(xData.length / colsCount)
        ctx.beginPath()
        for (let i = 1; i < xData.length; i++) {
            const x = i * xRatio

            if ((i - 1) % step === 0) {
                const text = formatDate(+xData[i], true)
                ctx.fillText(text.toString(), x, Chart.DPI_HEIGHT - 10)
            }

            if (isMouseOver(proxy.mouse, x, xData.length, Chart.DPI_WIDTH)) {
                ctx.save()
                ctx.moveTo(x, Chart.PADDING / 2)
                ctx.lineTo(x, Chart.DPI_HEIGHT - Chart.PADDING)
                ctx.restore()

                tip.show(proxy.mouse.tooltip, {
                    title: formatDate(+xData[i], true),
                    items: yData.map(column => ({
                        name: data.names[column[0]],
                        value: column[i + 1],
                        color: data.colors[column[0]],
                    })),
                })
            }
        }
        ctx.stroke()
        ctx.closePath()
    }

    function yAxis(yMax: number, yMin: number): void {
        const step = Chart.VIEW_HEIGHT / Chart.ROWS_COUNT
        const textStep = (yMax - yMin) / Chart.ROWS_COUNT

        ctx.beginPath()
        ctx.lineWidth = 1
        ctx.strokeStyle = ROWS_COLOR
        ctx.font = ROW_FONT
        ctx.fillStyle = ROW_FILL
        for (let i = 1; i <= Chart.ROWS_COUNT; i++) {
            const y = step * i
            const text = Math.round(yMax - textStep * i)
            ctx.fillText(String(text), 5, y + Chart.PADDING - 10)
            ctx.moveTo(0, y + Chart.PADDING)
            ctx.lineTo(Chart.DPI_WIDTH, y + Chart.PADDING)
        }
        ctx.stroke()
        ctx.closePath()
    }

    return {
        init() {
            paint()
        },
        destroy() {
            cancelAnimationFrame(requestAnimationFrameRef)
            canvas.removeEventListener('mousemove', onMouseMove)
            canvas.removeEventListener('mouseleave', onMouseLeave)
            slider.destroy()
        },
    }
}

import { Data } from './data'
import { computeBoundaries, computeXRatio, computeYRatio, css, line, toCoords } from './utils'
import { Chart, Slider } from './constants'



function noop(...args: any) {}

enum DataElements {
    WINDOW = 'window',
    LEFT = 'left',
    RIGHT = 'right',
}

interface sliderChartConfig {
    root: HTMLElement
    data: Data
    options: {
        dpiWidth: number
    }
}

interface sliderChartOutput {
    subscribe: (fn: (...args: any) => void) => void
    destroy: () => void
}

export function sliderChart({ root, data, options }: sliderChartConfig): sliderChartOutput {

    const WIDTH = options.dpiWidth / 2
    const MIN_WIDTH = WIDTH * 0.05

    const canvas = root.querySelector('canvas')
    const leftEl = root.querySelector(`[data-el=${DataElements.LEFT}]`) as HTMLElement
    const windowEl = root.querySelector(`[data-el=${DataElements.WINDOW}]`) as HTMLElement
    const rightEl = root.querySelector(`[data-el=${DataElements.RIGHT}]`) as HTMLElement

    const ctx = canvas.getContext('2d')
    canvas.width = options.dpiWidth
    canvas.height = Slider.DPI_HEIGHT
    css(canvas, {
        width: WIDTH + 'px',
        height: Slider.HEIGHT + 'px',
    })

    let nextFn = noop

    root.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mouseup', onMouseUp)

    function next() {
        nextFn(getPosition())
    }

    function onMouseUp() {
        document.onmousemove = null
    }

    function onMouseDown(e: MouseEvent) {
        const type = (<HTMLDivElement>e.target).dataset.type
        const dimensions = {
            left: parseInt(windowEl.style.left),
            right: parseInt(windowEl.style.right),
            width: parseInt(windowEl.style.width),
        }

        const startX = e.pageX

        if (type === DataElements.WINDOW) {
            document.onmousemove = e => {
                const delta = startX - e.pageX
                if (delta === 0) return

                const left = dimensions.left - delta
                const right = WIDTH - left - dimensions.width

                setPosition(left, right)
                next()
            }
        } else if (type === DataElements.LEFT) {
            document.onmousemove = e => {
                const delta = startX - e.pageX
                if (delta === 0) return

                const left = WIDTH - (dimensions.width + delta) - dimensions.right
                const right = WIDTH - (dimensions.width + delta) - left
                setPosition(left, right)
                next()
            }
        } else if (type === DataElements.RIGHT) {
            document.onmousemove = e => {
                const delta = startX - e.pageX
                if (delta === 0) return

                const right = WIDTH - (dimensions.width - delta) - dimensions.left
                setPosition(dimensions.left, right)
                next()
            }
        }
    }

    function setPosition(left: number, right: number): void {
        const width = WIDTH - right - left

        if (width < MIN_WIDTH) {
            css(windowEl, {
                width: MIN_WIDTH + 'px',
            })
            return
        }

        if (left < 0) {
            css(windowEl, { left: 0 })
            css(leftEl, { width: 0 })
            return
        }

        if (right < 0) {
            css(windowEl, { right: 0 })
            css(rightEl, { width: 0 })
            return
        }

        css(windowEl, {
            width: width + 'px',
            left: left + 'px',
            right: right + 'px',
        })
        css(rightEl, { width: right + 'px' })
        css(leftEl, { width: left + 'px' })
    }

    function getPosition(): [number, number] {
        const left = parseInt(leftEl.style.width)
        const right = WIDTH - parseInt(rightEl.style.width)

        return [(left * 100) / WIDTH, (right * 100) / WIDTH]
    }

    const defaultWidth = WIDTH * 0.3
    setPosition(0, WIDTH - defaultWidth)

    const [yMin, yMax] = computeBoundaries(data.columns, data.types)
    const yRatio = computeYRatio(Slider.DPI_HEIGHT, yMax, yMin)
    const xRatio = computeXRatio(Chart.DPI_WIDTH, data.columns[0].length)

    const yData = data.columns.filter(column => data.types[column[0]] === 'line')

    yData.map(toCoords(xRatio, yRatio, Slider.DPI_HEIGHT, Slider.PADDING, yMin)).forEach((coords, idx) => {
        const color = data.colors[yData[idx][0]]
        line(ctx, coords, color)
    })

    return {
        subscribe(fn: (...args: any) => void) {
            nextFn = fn
            fn(getPosition())
        },
        destroy() {
            root.removeEventListener('mousedown', onMouseDown)
            document.removeEventListener('mouseup', onMouseUp)
        },
    }
}
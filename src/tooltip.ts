import { css } from './utils'
import { MouseProxyTooltip } from './chart'
import { Chart } from './constants'

const template = (data: TooltipData): string => `
    <div class="tooltip-title">${data.title}</div>
    <ul class="tooltip-list">
        ${data.items.map(item => `
            <li class="tooltip-list-item">
                <div class="name">${item.name}</div>
                <div class="value" style="color: ${item.color}">${item.value}</div>
            </li>
        `).join('\n')}
    </ul>
`

export interface TooltipData {
    title: string
    items: {
        color: string
        name: unknown
        value: unknown
    }[]
}

interface ToolTipOutput {
    show: (position: MouseProxyTooltip, data: TooltipData) => void
    hide: () => void
}

export function tooltip(el: HTMLElement): ToolTipOutput {
    const clear = (): void => {
        el.innerHTML = ''
    }
    return {
        show(position, data) {
            clear()

            const { left, top } = position
            const { height, width } = el.getBoundingClientRect()

            css(el, {
                display: 'block',
                top: (top - height) + 'px',
                left: (Chart.WIDTH / 2 > left ? (left + width / 4) : (left - width * 1.2)) + 'px',
            })

            el.insertAdjacentHTML('afterbegin', template(data))
        },
        hide() {
            css(el, { display: 'none' })
        },
    }
}
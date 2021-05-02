import { data } from './data'
import { chart } from './chart'

const tgChart = chart(document.getElementById('chart') as HTMLCanvasElement, data[0])
tgChart.init()
import { data } from './data'
import { chart } from './chart'
import './styles.scss'

const tgChart = chart(document.getElementById('chart') as HTMLCanvasElement, data[0])
tgChart.init()
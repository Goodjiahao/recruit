import axios from 'axios'

// 开发期走 Vite 代理（/api -> localhost:8080），生产可改为完整地址
const http = axios.create({
  baseURL: '/api',
  timeout: 20000
})

export async function getMetrics() {
  const { data } = await http.get('/metrics')
  return data.data || []
}

export async function getMetricData(board, metric) {
  const { data } = await http.get(`/${board}/${metric}`)
  return data.data || []
}

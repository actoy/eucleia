import redUp from './images/红涨绿跌.png'
import redDown from './images/绿涨红跌.png'

export const themes = [
  {
    logo: redUp,
    text: '红涨绿跌',
    eqCls: 'black',
    gtCls: 'red',
    ltCls: 'green',
    upColor: '#ec0000',
    upBorderColor: '#ec0000',
    downColor: '#00da3c',
    downBorderColor: '#00da3c',
  },
  {
    logo: redDown,
    text: '绿涨红跌',
    eqCls: 'black',
    gtCls: 'green',
    ltCls: 'red',
    upColor: '#00da3c',
    upBorderColor: '#00da3c',
    downColor: '#ec0000',
    downBorderColor: '#ec0000',
  }
]

//根据Type返回到不同的结构中来，如type = ndaq, 结果数据的key = ndaq_list
export const resultMap = {
  'ndaq': 'ndaq_list',
  'cpi': 'cpi_list',
  'interest_rate': 'rate_list',
  'ppi': 'ppi_list',
  'non-agricultural': 'non-agricultural_list',
  'dji': 'dji_list'
}

// http://123.56.108.201/v1/economic/trend/detail
// http://123.56.108.201/v1/economic/dji/trend/detail
export const marketDatas = [
  {
    label: '纳斯达克',
    value: 'ndaq',
    minLabel: 'NASDAQ',
    detailRrefixUrl: '/'
  },
  {
    label: '道琼斯',
    value: 'dji',
    minLabel: '道琼斯',
    detailRrefixUrl: '/dji' // 短期走势详情
  }
]
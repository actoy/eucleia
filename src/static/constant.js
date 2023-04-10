/*
 * @Author: jacob
 * @Date: 2023-04-04 16:15:06
 * @LastEditors: jacob
 * @LastEditTime: 2023-04-10 14:55:21
 * @Description: 
 */
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
    upBorderColor: '#8A0000',
    downColor: '#00da3c',
    downBorderColor: '#008F28',
  },
  {
    logo: redDown,
    text: '绿涨红跌',
    eqCls: 'black',
    gtCls: 'green',
    ltCls: 'red',
    upColor: '#00da3c',
    upBorderColor: '#008F28',
    downColor: '#ec0000',
    downBorderColor: '#8A0000',
  }
]

//根据Type返回到不同的结构中来，如type = ndaq, 结果数据的key = ndaq_list
export const resultMap = {
  'ndaq': 'ndaq_list',
  'cpi': 'cpi_list',
  'interest_rate': 'rate_list',
  'ppi': 'ppi_list',
  'non-agricultural': 'non-agricultural_list'
}
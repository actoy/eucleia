import './index.css';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkPointComponent
} from 'echarts/components';
import {
  CandlestickChart,
  LineChart
} from 'echarts/charts';
import { UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import { Button, Empty, Space } from 'antd';
import PubSub from 'pubsub-js';
import Cookies from 'js-cookie'
import { fetch } from '../../modules';
import { AppContext } from "../../App";
import moment from 'moment';
import _ from 'lodash'
import { themes, resultMap, marketDatas } from '../../static/constant';
import { toThousandFilter } from '../../util/helper';

echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkPointComponent,
  CandlestickChart,
  LineChart,
  CanvasRenderer,
  UniversalTransition
]);

const MyStockTrendEcharts = () => {

  const { theme } = useContext(AppContext)
  const chartRef = useRef()

  const [options, setOptions] = useState({})
  const [loading, setLoading] = useState(false)
  const [base, setBase] = useState({
    marketTime: [], // '日K', '周K', '月K'
    startTime: '',
    endTime: '',
    type: 'cpi',
    market: 'ndaq'
  })
  // 周期内的CPI最高值，以及最高值相对于起始值的涨幅（绝对值：最高值-起始值），大盘指数累积 涨跌幅就用周期末的指数/周期开始的指数 - 1就行。
  // cpi起始值
  const [initPrice, setInitPrice] = useState(0)
  // cpi最高值
  const [highestPrice, setHighestPrice] = useState(0)
  // cpi涨幅
  const [upRate, setUpRate] = useState(0)
  // 指数累计
  const [accumulate, setAccumulate] = useState(0)

  const [empty, setEmpty] = useState(false)

  const upColor = useMemo(() => {
    return themes[theme].upColor;
  }, [theme])
  const upBorderColor = useMemo(() => {
    return themes[theme].upBorderColor;
  }, [theme])
  const downColor = useMemo(() => {
    return themes[theme].downColor;
  }, [theme])
  const downBorderColor = useMemo(() => {
    return themes[theme].downBorderColor;
  }, [theme])

  function splitData(rawData) {
    const categoryData = [];
    const values = [];
    for (var i = 0; i < rawData.length; i++) {
      categoryData.push(rawData[i].splice(0, 1)[0]);
      values.push(rawData[i]);
    }
    return {
      categoryData: categoryData,
      values: values
    };
  }
  // const calculateMA = useCallback((data0, dayCount) => {
  //   var result = [];
  //   for (var i = 0, len = data0.values.length; i < len; i++) {
  //     if (i < dayCount) {
  //       result.push('-');
  //       continue;
  //     }
  //     var sum = 0;
  //     for (var j = 0; j < dayCount; j++) {
  //       sum += +data0.values[i - j][1];
  //     }
  //     result.push(sum / dayCount);
  //   }
  //   return result;
  // }, [])

  const getCpi = (data0, cpis, key) => {
    return data0.categoryData.map(cate => {
      const find = cpis.find(item => moment(item.PublishDate).format('YYYY/MM/DD') === cate)
      if (find) {
        return [moment(find.PublishDate).format('YYYY/MM/DD'), find[key]]
      }
      return ''
    }).filter(item => !!item)
  }

  const fetchEconomicStock = () => {
    return fetch({
      url: '/v1/economic/stock',
      method: 'post',
      data: {
        type: base.market,
        start_time: base.startTime,
        end_time: base.endTime,
      },
    });
  }

  const fetchEconomicIndicators = () => {
    return fetch({
      url: '/v1/economic/indicators',
      method: 'post',
      data: {
        type: base.type,
        start_time: base.startTime,
        end_time: base.endTime,
      },
    });
  }

  const fetchInterestRateIndicators = () => {
    return fetch({
      url: '/v1/economic/indicators',
      method: 'post',
      data: {
        type: 'interest_rate',
        start_time: base.startTime,
        end_time: base.endTime,
      },
    });
  }

  const getG2Data = () => {
    if (!base.startTime || !base.endTime) return
    setLoading(true)
    let promises = [fetchEconomicStock(), fetchEconomicIndicators()]
    if (base.type === 'cpi') {
      promises.push(fetchInterestRateIndicators())
    }
    Promise.all(promises).then(([economicStock, economicIndicators, interestRateIndicators]) => {
      setLoading(false)
      console.log(economicStock.data)
      setEmpty(false)
      if (!economicStock.data[resultMap[base.market]] || economicStock.data[resultMap[base.market]].length === 0) {
        setEmpty(true)
      }
      // Each item: date, open，close，lowest，highest
      const convert = economicStock.data[resultMap[base.market]]
      const data0 = splitData(convert.map((item, index) => {
        // (当前最新成交价（或收盘价）-开盘参考价)÷开盘参考价×100% 开盘参考价一般是指这只股票在上一个交易日收盘时所呈现出的价格
        let rate = null
        let prev = null
        if (index > 0) {
          prev = convert[index - 1]
          if (moment(item.PublishDate).isSame(moment(prev.PublishDate).add(1, 'day'))) {
            rate = (((item.ClosingPrice - prev.ClosingPrice) / prev.ClosingPrice) * 100).toFixed(2)
          } else {
            prev = null
          }
        }
        return [
          moment(item.PublishDate).format('YYYY/MM/DD'),
          item.OpeningPrice,
          item.ClosingPrice,
          item.LowestPrice,
          item.HighestPrice,
          rate,
          prev
        ]
      }))
      // console.log(data0)

      const predictValues = getCpi(data0, economicIndicators.data[resultMap[base.type]], 'PredictionValue')
      const publishValues = getCpi(data0, economicIndicators.data[resultMap[base.type]], 'PublishValue')
      let interestRateValues = []
      if (interestRateIndicators) {
        interestRateValues = getCpi(data0, interestRateIndicators.data['rate_list'], 'PublishValue')
      }

      // 最高值
      const indicators = economicIndicators.data[resultMap[base.type]]
      if (indicators.length > 0) {
        const highestMap = indicators.map(item => item.PublishValue)
        const highest = Math.max(...highestMap)
        const init = indicators[0].PublishValue
        setInitPrice(init.toFixed(2))
        setHighestPrice(highest.toFixed(2))
        setUpRate((highest - init).toFixed(2) )
        const last = indicators[indicators.length - 1].PublishValue
        const first = indicators[0].PublishValue
        setAccumulate((((last * 100) / (first * 100)) / 100 -1).toFixed(2))
      }

      let legend = ['日K', 'CPI公布', 'CPI预测', '利率决议']
      let publishName = 'CPI公布'
      let predictName = 'CPI预测'
      if (base.type === 'interest_rate') {
        legend = ['日K', '利率公布', '利率预测']
        publishName = '利率公布'
        predictName = '利率预测'
      }
      

      setOptions({
        title: {
          text: '',
          left: 0
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          },
          formatter: (params) => {
            const theme = Number(Cookies.get('eucleia-theme')) || 0
            console.log(theme)
            let res = ''
            let formatName = ['', '开盘', '收盘', '最高', '最低', '涨跌幅']
            if (params.length > 0) {
              let date = params[0].axisValueLabel
              res += `<div style="display:flex;justify-content: space-between;"><span>${date}</span>`
              params.forEach(param => {
                if (param.componentSubType === 'line') {
                  res += `<span class="markLabel">${param.seriesName}:&nbsp;&nbsp;${toThousandFilter(param.data[1])}%</span>`
                }
              })
              res += '</div><br/>' 
              params.forEach(param => {
                if (param.componentSubType === 'candlestick') {
                  // <span class="markPoint" style="background: ${param.color}; ">
                  res += '<div style="display:flex;flex-wrap: wrap; margin-top:-10px;">'
                  param.data.forEach((item, index) => {
                    // 6 为前一个值
                    if (index < 6) {
                      const prevData = param.data[6]
                      let color = '#333'
                      if (prevData) {
                        if (item < prevData.ClosingPrice) {
                          color = themes[theme].downColor
                        } else if (item > prevData.ClosingPrice) {
                          color = themes[theme].upColor
                        }
                      }
                      if (index === 5) {
                        color = item > 0 ? themes[theme].upColor : item < 0 ? themes[theme].downColor : '#333'
                      }
                      let subfix = (index === 5 && item !== null) ? '%' : ''
                      let prefix = (index === 5 && item > 0) ? '+' : ''
                      if (index > 0) {
                        res += `<span class="markLabel" style="width: 33.33%"> ${formatName[index]}:&nbsp;&nbsp;<i style="color:${color}">${prefix}${toThousandFilter(item)}${subfix}</i></span>`
                      }
                    }
                  })
                  res += '</div>'
                }
              })
              return res
            } else {
              return null
            }
          },
          backgroundColor: '#F0F0F0',
          alwaysShowContent: false,
          padding: [10, 30],
          textStyle: {
            color: '#797980',
            fontFamily: 'PingFangSC-Regular',
            fontSize: 10
          },
          extraCssText: 'box-shadow: none;right:0;z-index:99;',
          position: function (pos, params, el, elRect, size) {
            var obj = {
                top: -20,
                left: 0
            };
            // obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 5;
            return obj;
          }
        },
        legend: {
          data: legend
        },
        grid: {
          left: '12%',
          right: '8%',
          bottom: '30px'
        },
        xAxis: {
          type: 'category',
          data: data0.categoryData,
          boundaryGap: false,
          axisLine: { onZero: false },
          splitLine: { show: false },
          min: 'dataMin',
          max: 'dataMax'
        },
        yAxis: [{
          scale: true,
          splitArea: {
            show: true
          }
        }, {
          type: 'value',
          axisLabel: {
            formatter: (text) => {
              return text.toFixed(0) + '%'
            }
          }
        }],
        dataZoom: [
          {
            type: 'inside',
            start: 0,
            end: 100
          },
          {
            show: false,
            type: 'slider',
            top: '90%',
            start: 70,
            end: 100
          }
        ],
        series: [
          {
            name: '日K',
            type: 'candlestick',
            data: data0.values,
            itemStyle: {
              color: upColor,
              color0: downColor,
              borderColor: upBorderColor,
              borderColor0: downBorderColor
            },
            // markPoint: {
            //   label: {
            //     formatter: function (param) {
            //       return param != null ? Math.round(param.value) + '' : '';
            //     }
            //   },
            //   data: [
            //     {
            //       name: 'highest value',
            //       type: 'max',
            //       valueDim: 'highest'
            //     },
            //     {
            //       name: 'lowest value',
            //       type: 'min',
            //       valueDim: 'lowest'
            //     },
            //     {
            //       name: 'average value on close',
            //       type: 'average',
            //       valueDim: 'close'
            //     }
            //   ],
            //   tooltip: {
            //     formatter: function (param) {
            //       return param.name + '<br>' + (param.data.coord || '');
            //     }
            //   }
            // },
            // markLine: {
            //   symbol: ['none', 'none'],
            //   data: [
            //     [
            //       {
            //         name: 'from lowest to highest',
            //         type: 'min',
            //         valueDim: 'lowest',
            //         symbol: 'circle',
            //         symbolSize: 10,
            //         label: {
            //           show: false
            //         },
            //         emphasis: {
            //           label: {
            //             show: false
            //           }
            //         }
            //       },
            //       {
            //         type: 'max',
            //         valueDim: 'highest',
            //         symbol: 'circle',
            //         symbolSize: 10,
            //         label: {
            //           show: false
            //         },
            //         emphasis: {
            //           label: {
            //             show: false
            //           }
            //         }
            //       }
            //     ],
            //     {
            //       name: 'min line on close',
            //       type: 'min',
            //       valueDim: 'close'
            //     },
            //     {
            //       name: 'max line on close',
            //       type: 'max',
            //       valueDim: 'close'
            //     }
            //   ]
            // }
          },
          {
            name: publishName,
            type: 'line',
            yAxisIndex: 1,
            data: publishValues,
            z: 9,
            showAllSymbol: true,
            symbolSize: 4,
            smooth: false,
            lineStyle: {
              opacity: 0.5,
              type: 'dashed'
            }
          },
          {
            name: predictName,
            type: 'line',
            yAxisIndex: 1,
            z: 8,
            data: predictValues,
            showAllSymbol: true,
            symbolSize: 4,
            smooth: false,
            lineStyle: {
              opacity: 0.5,
              type: 'dashed'
            }
          },
          ...base.type === 'cpi' ? [
            {
              name: '利率决议',
              type: 'line',
              yAxisIndex: 1,
              data: interestRateValues,
              showAllSymbol: true,
              symbolSize: 4,
              smooth: false,
              lineStyle: {
                opacity: 0.5,
                type: 'dashed'
              }
            },
          ] : []
        ]
      })
    });
  }

  useEffect(() => {
    setOptions(options => {
      const resizeOptions = _.cloneDeep(options)
      const series = resizeOptions.series
      if (series) {
        series[0].itemStyle = {
          color: upColor,
          color0: downColor,
          borderColor: upBorderColor,
          borderColor0: downBorderColor
        }
      }
      resizeOptions.series = series
      return resizeOptions
    })
  }, [upColor, downColor, upBorderColor, downBorderColor])

  useEffect(() => {
    getG2Data();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base])

  useEffect(() => {
    PubSub.subscribe('choosePeriodTime', (msgName, data) => {
      setBase(base => ({
        ...base,
        ...data
      }))
    });
  }, [])

  useEffect(() => {
    PubSub.subscribe('fromData', (msgName, data) => {
      setBase(base => ({
        ...base,
        ...data
      }))
    });
  }, []);

  useEffect(() => {
    PubSub.subscribe('marketData', (msgName, data) => {
      setBase(base => ({
        ...base,
        ...data
      }))
    });
  }, []);

  const stockTitle = useMemo(() => {
    const currentMarket = marketDatas.find(item => item.value === base.market)
    let minLabel = currentMarket ? currentMarket.minLabel : 'NASDAQ'
    let title = `通胀周期内${minLabel}指数趋势`
    if (base.type === 'interest_rate') {
      title = `加息周期内${minLabel}指数趋势`
    }
    return title
  }, [base.type, base.market])

  const summary = useMemo(() => {
    let title = `周期内CPI最高值为${highestPrice}%，CPI涨幅为${upRate}% (${initPrice}%>${highestPrice}%)，大盘指数累计${accumulate}%`
    if (base.type === 'interest_rate') {
      title = `周期内加息最高值为${highestPrice}%，加息涨幅为${upRate}% (${initPrice}%>${highestPrice}%)，大盘指数累计${accumulate}%`
    }
    return title
  }, [highestPrice, upRate, accumulate, initPrice, base.type])

  const emptyTitle = useMemo(() => {
    if (!base.startTime || !base.endTime) return '暂无数据'
    const currentMarket = marketDatas.find(item => item.value === base.market)
    let minLabel = currentMarket ? currentMarket.minLabel : 'NASDAQ'
    return `暂无${moment(base.startTime).format('YYYY.MM')} - ${moment(base.endTime).format('YYYY.MM')}内${minLabel}数据`
  }, [base.startTime, base.endTime, base.market])

  return <div className="stock-trend-container">
        <div className="stock-trend-title">{stockTitle}</div>
        {/* <div className="stock-trend-tip">{tipTitle}</div> */}
        <div className="stock-trend-chart">
          <div className="stock-trend-index">
            {/* <Radio.Group style={{display: 'none'}} value={base.market} onChange={onChangeMarket} buttonStyle="solid">
              {base.marketIndex.map((item, index) => (
                <Radio.Button value={item.value} key={item.value} size="small">
                  {item.label}
                </Radio.Button>
              ))}
            </Radio.Group> */}
            <Space wrap size={5}>
              {base.marketTime.map((item, index) => (
                <Button type={index === 0 ? 'primary' : 'default'} key={item} size="small">
                  {item}
                </Button>
              ))}
            </Space>
          </div>
          <div id="container">
            {
              !empty ?
              <ReactEChartsCore
                ref={chartRef}
                echarts={echarts}
                option={options}
                notMerge={true}
                lazyUpdate={true}
                showLoading={loading}
              /> : <Empty description={emptyTitle}/>
            }
          </div>
        </div>
        <div className='stock-trend-summary'>
          <div>
            <img className="summary-logo" src={require('../../static/images/用研.png')} alt="wave-fish" />
            <label>{summary}</label>
          </div>
        </div>
      </div>
}

export default MyStockTrendEcharts;
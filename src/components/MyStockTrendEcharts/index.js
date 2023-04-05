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
import { Button, Space, Radio } from 'antd';
import PubSub from 'pubsub-js';
import { fetch } from '../../modules';
import { AppContext } from "../../App";
import moment from 'moment';
import _ from 'lodash'
import { themes } from '../../static/constant';

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
    marketIndex: ['纳斯达克' ,'道琼斯', '标普500'],
    marketTime: [], // '日K', '周K', '月K'
    startTime: '',
    endTime: '',
    type: 'cpi'
  })

  const [market, setMarket] = useState('纳斯达克')

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
        type: 'ndaq',
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

  const getG2Data = () => {
    setLoading(true)
    Promise.all([fetchEconomicStock(), fetchEconomicIndicators()]).then(([economicStock, economicIndicators]) => {
      setLoading(false)
      // Each item: date, open，close，lowest，highest
      const data0 = splitData(economicStock.data.ndaq_list.map(item => ([
        moment(item.PublishDate).format('YYYY/MM/DD'),
        item.OpeningPrice,
        item.ClosingPrice,
        item.LowestPrice,
        item.HighestPrice
      ])))

      const predictValues = getCpi(data0, economicIndicators.data.cpi_list, 'PredictionValue')
      const publishValues = getCpi(data0, economicIndicators.data.cpi_list, 'PublishValue')

      setOptions({
        title: {
          text: '',
          left: 0
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          }
        },
        legend: {
          data: ['日K', 'CPI公布', 'CPI预测']
        },
        grid: {
          left: '10%',
          right: '10%',
          bottom: '60px'
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
              return text.toFixed(2) + '%'
            }
          }
        }],
        dataZoom: [
          {
            type: 'inside',
            start: 70,
            end: 100
          },
          {
            show: true,
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
            markPoint: {
              label: {
                formatter: function (param) {
                  return param != null ? Math.round(param.value) + '' : '';
                }
              },
              data: [
                {
                  name: 'highest value',
                  type: 'max',
                  valueDim: 'highest'
                },
                {
                  name: 'lowest value',
                  type: 'min',
                  valueDim: 'lowest'
                },
                {
                  name: 'average value on close',
                  type: 'average',
                  valueDim: 'close'
                }
              ],
              tooltip: {
                formatter: function (param) {
                  return param.name + '<br>' + (param.data.coord || '');
                }
              }
            },
            markLine: {
              symbol: ['none', 'none'],
              data: [
                [
                  {
                    name: 'from lowest to highest',
                    type: 'min',
                    valueDim: 'lowest',
                    symbol: 'circle',
                    symbolSize: 10,
                    label: {
                      show: false
                    },
                    emphasis: {
                      label: {
                        show: false
                      }
                    }
                  },
                  {
                    type: 'max',
                    valueDim: 'highest',
                    symbol: 'circle',
                    symbolSize: 10,
                    label: {
                      show: false
                    },
                    emphasis: {
                      label: {
                        show: false
                      }
                    }
                  }
                ],
                {
                  name: 'min line on close',
                  type: 'min',
                  valueDim: 'close'
                },
                {
                  name: 'max line on close',
                  type: 'max',
                  valueDim: 'close'
                }
              ]
            }
          },
          {
            name: 'CPI公布',
            type: 'line',
            yAxisIndex: 1,
            data: publishValues,
            smooth: false,
            lineStyle: {
              opacity: 0.5,
              type: 'dashed'
            }
          },
          {
            name: 'CPI预测',
            type: 'line',
            yAxisIndex: 1,
            data: predictValues,
            smooth: false,
            lineStyle: {
              opacity: 0.5,
              type: 'dashed'
            }
          }
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
        startTime: data.startTime,
        endTime: data.endTime
      }))
    });
  }, [])

  useEffect(() => {
    PubSub.subscribe('fromData', (msgName, data) => {
      setBase(base => ({
        ...base,
        type: data.type
      }))
    });
  }, []);

  const onChangeMarket = ({ target: { value } }) => {
    setMarket(value);
  };

  return <div className="stock-trend-container">
        <div className="stock-trend-title">CPI通胀周期内大盘整体走势</div>
        <div className="stock-trend-chart">
          <div className="stock-trend-index">
            {/* <Space wrap size={5}>
              {base.marketIndex.map((item, index) => (
                <Button type={index === 0 ? 'primary' : 'default'} key={item} size="small">
                  {item}
                </Button>
              ))}
            </Space> */}
            <Radio.Group value={market} onChange={onChangeMarket} buttonStyle="solid">
              {base.marketIndex.map((item, index) => (
                <Radio.Button value={item} key={item} size="small">
                  {item}
                </Radio.Button>
              ))}
            </Radio.Group>
            <Space wrap size={5}>
              {base.marketTime.map((item, index) => (
                <Button type={index === 0 ? 'primary' : 'default'} key={item} size="small">
                  {item}
                </Button>
              ))}
            </Space>
          </div>
          <div id="container">
            <ReactEChartsCore
              ref={chartRef}
              echarts={echarts}
              option={options}
              notMerge={false}
              lazyUpdate={false}
              showLoading={loading}
            />
          </div>
        </div>
        <div className='stock-trend-summary'>
          <img className="summary-logo" src={require('../../static/images/用研.png')} alt="wave-fish" />
          <label>我是一段总结，我是一段总结，我是一段总结，我是一段总结，我是一段总结，我是一段总结。</label>
        </div>
      </div>
}

export default MyStockTrendEcharts;
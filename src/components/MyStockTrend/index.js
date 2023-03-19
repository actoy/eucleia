import './index.css';
import React from 'react';
import { Button, Space } from 'antd';
import { Line, Stock, DualAxes } from '@antv/g2plot';
import { fetch } from '../../modules';
import moment from 'moment';
import PubSub from 'pubsub-js';

class MyStockTrend extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      marketIndex: ['纳斯达克'], // '道琼斯', '标普500'
      marketTime: [], // '日K', '周K', '月K'
    };
    PubSub.subscribe('choosePeriodTime', (msgName, data) => {
      this.getG2Data(data.startTime, data.endTime);
    });
  }

  fetchEconomicStock(startTime, endTime) {
    return fetch({
      url: '/v1/economic/stock',
      method: 'post',
      data: {
        type: 'ndaq',
        start_time: startTime,
        end_time: endTime,
      },
    });
  }

  fetchEconomicIndicators(startTime, endTime) {
    return fetch({
      url: '/v1/economic/indicators',
      method: 'post',
      data: {
        type: 'cpi',
        start_time: startTime,
        end_time: endTime,
      },
    });
  }

  getG2Data(startTime, endTime) {
    Promise.all([this.fetchEconomicStock(startTime, endTime), this.fetchEconomicIndicators(startTime, endTime)]).then(([economicStock, economicIndicators]) => {
      this.dualAxes.changeData([economicStock.data.ndaq_list, economicIndicators.data.cpi_list]);
    });
  }

  componentDidMount() {
    this.dualAxes = new DualAxes('container', {
      data: [[], []],
      xField: 'PublishDate',
      reversed: true,
      yField: ['ClosingPrice', 'PublishValue'],
      smooth: true,
      width: 400,
      height: 250,
      xAxis: {
        label: {
          formatter: (v) => {
            return moment(v).format('YYYY-MM-DD');
          },
        },
      },
      meta: {
        ClosingPrice: {
          alias: '纳斯达克',
        },
        PublishValue: {
          alias: 'CPI',
        },
      },
      geometryOptions: [
        {
          geometry: 'line',
          color: 'orange',
        },
        {
          geometry: 'line',
          color: '#5B8FF9',
          lineStyle: {
            lineWidth: 1,
            lineDash: [5, 5],
          },
          point: {
            size: 2,
            // shape: 'diamond',
            style: {
              fill: 'transparent',
              stroke: '#5B8FF9',
              lineWidth: 2,
              fillOpacity: 0.6,
            },
          },
        },
      ],
    });
    this.dualAxes.render();
  }

  render() {
    return (
      <div className="stock-trend-container gray-top-border">
        <div className="stock-trend-title gray-bottom-border">CPI通胀周期内大盘整体走势</div>
        <div className="stock-trend-chart">
          <div className="stock-trend-index">
            <Space wrap size={5}>
              {this.state.marketIndex.map((item, index) => (
                <Button type={index === 0 ? 'primary' : 'default'} key={item} size="small">
                  {item}
                </Button>
              ))}
            </Space>
            <Space wrap size={5}>
              {this.state.marketTime.map((item, index) => (
                <Button type={index === 0 ? 'primary' : 'default'} key={item} size="small">
                  {item}
                </Button>
              ))}
            </Space>
          </div>
          <div id="container"></div>
        </div>
      </div>
    );
  }
}

export default MyStockTrend;

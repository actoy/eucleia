import './index.css';
import moment from 'moment';
import { useState, useEffect, useMemo, useContext } from 'react';
import { Radio, Table } from 'antd';
import { fetch } from '../../modules';
import PubSub from 'pubsub-js';
import {themes} from '../../static/constant'
import { AppContext } from "../../App";
const { Column, ColumnGroup } = Table;

// const onChange = (value: string) => {
//   console.log(`selected ${value}`);
// };

// const periodTime = [
//   {
//     value: '7',
//     label: '7日涨跌',
//   },
//   {
//     value: '15',
//     label: '15日涨跌',
//   },
//   {
//     value: '30',
//     label: '30日涨跌',
//   },
// ];

// const data = [
//   {
//     key: '1',
//     publishedTime: '2020.3.12',
//     publishedValue: '6.5%',
//     predictedValue: '6.2%',
//     TradingDay7: '-2.5%',
//     TradingDay15: '2.3%',
//     TradingDay30: '1.5%',
//   },
//   {
//     key: '2',
//     publishedTime: '2020.3.12',
//     publishedValue: '6.5%',
//     predictedValue: '6.2%',
//     TradingDay7: '-2.5%',
//     TradingDay15: '2.3%',
//     TradingDay30: '1.5%',
//   },
//   {
//     key: '3',
//     publishedTime: '2020.3.12',
//     publishedValue: '6.5%',
//     predictedValue: '6.2%',
//     TradingDay7: '-2.5%',
//     TradingDay15: '2.3%',
//     TradingDay30: '1.5%',
//   }
// ];

// setTimeout(() => {
//   const data = [
//     { year: '2020-02-13', value: 3 },
//     { year: '2020-02-14', value: 4 },
//     { year: '2020-02-17', value: 4.9 },
//     { year: '2020-02-18', value: 6 },
//     { year: '2020-02-19', value: 7 },
//     { year: '2020-02-20', value: 9 },
//     { year: '2020-02-21', value: 13 },
//   ];

//   const line = new Line('a', {
//     data,
//     xField: 'year',
//     yField: 'value',
//     padding: 20,
//     xAxis: {
//       autoHide: true,
//     },
//     yAxis: {
//       autoHide: true,
//     },
//     smooth: true,
//     width: 150,
//     height: 100,
//   });
//   line.render();
// }, 100);
// const res = [
//   {
//     cpi_info: {
//       Id: 5811,
//       PublishDate: '2022-10-13T20:30:00+08:00',
//       PredictionValue: 8.1,
//       PublishValue: 8.2,
//       CreatedAt: '2023-03-12T16:48:55+08:00',
//       UpdatedAt: '2023-03-12T16:48:55+08:00',
//     },
//     trend_info: {
//       trending_7: 0.003,
//       trending_15: 0.1,
//       trending_30: -0.589,
//     },
//   },
// ];
let startTime, endTime, current1;
const MyStockDetail = () => {
  const [tabsData, setTabsData] = useState({});
  const [current, setCurrent] = useState('all');
  const [data, setData] = useState([]);
  const [risingInfo, setRisingInfo] = useState([]);

  const { theme } = useContext(AppContext)

  const toFixedPercent = (num1, num2) => {
    if (num1 && num2) {
      return ((num1 / num2) * 100).toFixed(2);
    } else {
      return 0;
    }
  };
  const getTrendDetail = function (expect, startTime, endTime) {
    return fetch({
      url: 'v1/economic/trend/detail',
      method: 'post',
      data: {
        expect: expect || 'all',
        startTime,
        endTime,
        page: 1, // 从 1 开始
        size: 200,
      },
    }).then(({ data }) => {
      setData(data.lists);
      setRisingInfo(data.rising_info);
    });
  };

  useEffect(() => {
    PubSub.subscribe('choosePeriodTime', (msgName, data) => {
      startTime = data.startTime;
      endTime = data.endTime;
      fetch({ url: `/v1/cpi/detail/tabs?startTime=${startTime}&endTime=${endTime}` }).then(({ data }) => {
        setTabsData(data);
        getTrendDetail(current1, startTime, endTime);
      });
    });
  }, []);
  const onClick = (e) => {
    const { value } = e.target;
    if (!value) return;
    setCurrent(value);
    current1 = value;
    getTrendDetail(value, startTime, endTime);
  };
  const color = (val1, val2) => {
    if (val1 === val2) return themes[theme].eqCls;
    if (val1 > val2) return themes[theme].gtCls;
    if (val1 < val2) return themes[theme].ltCls;
  };

  const groupTitle = useMemo(() => {
    let text = 'T日内上涨概率：'
    let compare = 1
    if (current === 'all') {
      compare = tabsData.total
    } else if (current === 'highest') {
      compare = tabsData.high_value
    } else if (current === 'lowest') {
      compare = tabsData.low_value
    } else if (current === 'equal') {
      compare = tabsData.equal_value
    }
    text += `7交日内${toFixedPercent(risingInfo.rising_number_7, compare)}%, 15日内${toFixedPercent(risingInfo.rising_number_15, compare)}%，30日内${toFixedPercent(risingInfo.rising_number_30, compare)}%`
    return <label className='group-title'>
      {text}
    </label>
  }, [current, risingInfo, tabsData])

  const cssTitle = (title) => {
    return <label className='normal-title'>{ title }</label>
  }

  return (
    <div className="stock-detail-container">
      <div className="stock-detail-title">CPI数据发布后短期走势</div>
      <div className='stock-detail-tab'>
        <Radio.Group value={current} onChange={onClick} buttonStyle="solid">
          <Radio.Button value='all' key='all' size="small">
            全部({tabsData.total}次)
          </Radio.Button>
          <Radio.Button value='highest' key='highest' size="small">
            高于预期({tabsData.high_value}次)
          </Radio.Button>
          <Radio.Button value='lowest' key='lowest' size="small">
            低于预期({tabsData.low_value}次)
          </Radio.Button>
          <Radio.Button value='equal' key='equal' size="small">
            符合预期({tabsData.equal_value}次)
          </Radio.Button>
        </Radio.Group>
      </div>
      <ul className="stock-detail">
        {/* <li className="stock-detail-item-title">
          <Space wrap size={20}>
            <span>公布日</span>
            <span>公布值/预期值</span>
          </Space>
          <div>
            <Select
              showSearch
              placeholder="请选择经济周期"
              optionFilterProp="children"
              onChange={onChange}
              value="7"
              // onSearch={onSearch}
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={periodTime}
              style={{ width: 100 }}
            />
          </div>
        </li> */}
        {/* {current === 'all' ? (
          <li className="stock-detail-item-tip gray-bottom-border">
            周期内CPI共发布{tabsData.total}次，7个交易日上涨概率{toFixedPercent(risingInfo.rising_number_7, tabsData.total)}%，15个交易日上涨概率
            {toFixedPercent(risingInfo.rising_number_15, tabsData.total)}%，30个交易日上涨概率{toFixedPercent(risingInfo.rising_number_30, tabsData.total)}%
          </li>
        ) : current === 'highest' ? (
          <li className="stock-detail-item-tip gray-bottom-border">
            周期内CPI发布高于预期共{tabsData.high_value}次，7个交易日上涨概率{toFixedPercent(risingInfo.rising_number_7, tabsData.high_value)}%，15个交易日上涨概率
            {toFixedPercent(risingInfo.rising_number_15, tabsData.high_value)}%，30个交易日上涨概率{toFixedPercent(risingInfo.rising_number_30, tabsData.high_value)}%
          </li>
        ) : current === 'lowest' ? (
          <li className="stock-detail-item-tip gray-bottom-border">
            周期内CPI发布低于预期共{tabsData.low_value}次，7个交易日上涨概率{toFixedPercent(risingInfo.rising_number_7, tabsData.low_value)}%，15个交易日上涨概率
            {toFixedPercent(risingInfo.rising_number_15, tabsData.low_value)}%，30个交易日上涨概率{toFixedPercent(risingInfo.rising_number_30, tabsData.low_value)}%
          </li>
        ) : (
          <li className="stock-detail-item-tip gray-bottom-border">
            周期内CPI发布符合预期共{tabsData.equal_value}次，7个交易日上涨概率{toFixedPercent(risingInfo.rising_number_7, tabsData.equal_value)}%，15个交易日上涨概率
            {toFixedPercent(risingInfo.rising_number_15, tabsData.equal_value)}%，30个交易日上涨概率{toFixedPercent(risingInfo.rising_number_30, tabsData.equal_value)}%
          </li>
        )} */}
        <li className="stock-detail-item-detail">
          <Table
            dataSource={data}
            pagination={false}
            bordered={false}
            // pagination={{
            //   pageSize: 50,
            // }}
            scroll={{
              y: 640,
            }}
          >
            <ColumnGroup title={groupTitle} key='group'>
              <Column 
                title={cssTitle("发布日期")} 
                dataIndex="cpi_info" 
                key="PublishDate" 
                align="center" 
                render={(cpi_info) => <label className='date-title'>{moment(cpi_info['PublishDate']).format('YYYY-MM-DD')}</label>} />
              <Column
                title={cssTitle("公布值(预测值)")}
                dataIndex="cpi_info"
                key="PublishValue"
                align="center"
                render={(cpi_info, record) => 
                  <label>
                    <i className={color(parseFloat(record.cpi_info.PublishValue), parseFloat(record.cpi_info.PredictionValue))}>{cpi_info['PublishValue']}%&nbsp;</i>
                    <span className='small'>({record.cpi_info['PredictionValue'] + '%'})</span>
                  </label>
                }
              />
              {/* <Column title={cssTitle("预测值" width="14%" dataIndex="cpi_info" key="PredictionValue" align="center" render={(cpi_info) => cpi_info['PredictionValue'] + '%'} /> */}
              <Column
                title={cssTitle("7日")}
                dataIndex="trend_info"
                key="trending_7"
                align="center"
                render={(trend_info) => <i className={color(parseFloat(trend_info['trending_7']), 0)}>{(trend_info['trending_7']*100).toFixed(1)}%</i>}
              />
              <Column
                title={cssTitle("15日")}
                dataIndex="trend_info"
                key="trending_15"
                align="center"
                render={(trend_info) => <i className={color(parseFloat(trend_info['trending_15']), 0)}>{(trend_info['trending_15']*100).toFixed(1)}%</i>}
              />
              <Column
                title={cssTitle("30日")}
                dataIndex="trend_info"
                key="trending_30"
                align="center"
                render={(trend_info) => <i className={color(parseFloat(trend_info['trending_30']), 0)}>{(trend_info['trending_30']*100).toFixed(1)}%</i>}
              />
            </ColumnGroup>
          </Table>
          {/* <Table columns={columns} dataSource={data} pagination={false}/> */}
          {/* <Space wrap size={20}>
            <span>
              03-04
              <br />
              2022
            </span>
            <span>
              <i className="red">6.5%</i>/<i>6.2%</i>
              <br />
              <Button size="small" danger>
                高于预期
              </Button>
            </span>
          </Space>
          <div id="a" className="stack"></div>
          <div className="relative">
            <span className="red">-2.7%</span>
            <br />
            <span className="detail blue">查看30日完整走势</span>
            <div id="ADetail"></div>
          </div> */}
        </li>
      </ul>
    </div>
  );
};

export default MyStockDetail;

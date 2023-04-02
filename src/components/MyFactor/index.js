import './index.css';
import { useState, useEffect } from 'react';
import { Button, Space, Select } from 'antd';
import { fetch } from '../../modules';
import PubSub from 'pubsub-js';


const Factor = () => {
  const [periodTime, setPeriodTime] = useState(null);
  const [value, setValue] = useState(null);
  const [valueObj, setValueObj] = useState(null);
  useEffect(() => {
    fetch({ url: '/v1/economic/range' }).then(({ data }) => {
      const formatData = data.map((item) => {
        return {
          value: `${item.start_time},${item.end_time}`,
          label: `${item.start_time} ~ ${item.end_time}`,
          ...item
        };
      });
      setPeriodTime(formatData);
      setValue(formatData[0]);
      setValueObj(formatData[0]);
      const time = formatData[0].value.split(',');
      PubSub.publish('choosePeriodTime', { startTime: time[0], endTime:time[1] });
    });
  }, []);

  const onChange = (value,valueObj) => {
    setValue(value);
    setValueObj(valueObj);
    const time = value.split(',');
    PubSub.publish('choosePeriodTime', { startTime: time[0],endTime:time[1] });
  };

  return (
    <ul className="factor-container">
      <li className="factor-item gray-bottom-border">
        <span className="factor-label">影响因素：</span>
        <Space wrap size={10}>
          <Button type="primary">经济指标</Button>
          {/* <Button>宏观事件</Button> */}
        </Space>
      </li>
      <li className="factor-item">
        <span className="factor-label">经济数据：</span>
        <Space wrap size={10}>
          <Button type="primary">未季调CPI年率</Button>
          {/* <Button>PPI</Button>
          <Button>非农</Button>
          <Button>利率</Button> */}
        </Space>
      </li>
      <li className="factor-item">
        <span className="observation-period factor-label">观察周期：</span>
        <Select
          placeholder="请选择经济周期"
          optionFilterProp="children"
          onChange={onChange}
          // onSearch={onSearch}
          value={value}
          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          options={periodTime}
          style={{ width: 220, height: 50 }}
        />
        <span className="cpi-value">{valueObj?.start_value}% > {valueObj?.highest_value}% > {valueObj?.end_value}% </span>
      </li>
    </ul>
  );
};
export default Factor;

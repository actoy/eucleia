import './index.css';
import { useState, useEffect } from 'react';
import { Tag } from 'antd';
import {
  CaretDownOutlined
} from '@ant-design/icons'
import { Picker } from 'antd-mobile';
import { fetch } from '../../modules';
import PubSub from 'pubsub-js';
const { CheckableTag } = Tag;

const Reasons = [{
  label: '经济指标',
  value: '0'
},{
  label: '宏观事件',
  value: '1'
}]

const FromDatas = [{
  label: 'CPI',
  value: 'cpi'
},{
  label: 'PPI',
  value: 'ppi'
},{
  label: '非农',
  value: '0'
},{
  label: '利率',
  value: '1'
}]

const Factor = () => {
  const [periodTime, setPeriodTime] = useState([]);
  const [value, setValue] = useState([]);
  const [reason, setReason] = useState(['0']);
  const [fromData, setFromData] = useState(['cpi'])

  useEffect(() => {
    fetch({ url: '/v1/economic/range' }).then(({ data }) => {
      const formatData = data.map((item) => {
        return {
          value: `${item.start_time},${item.end_time}`,
          label: <div className="option-label-item">
            <label className='picker-main'>{ `${item.start_time} ~ ${item.end_time}` }</label>
            <label className='picker-sub'>({item?.start_value}% &gt; {item?.highest_value}% &gt; {item?.end_value}%)</label>
          </div>
        };
      });
      console.log(formatData)
      setPeriodTime([formatData]);
      setValue([formatData[0].value]);
      const time = formatData[0].value.split(',');
      PubSub.publish('choosePeriodTime', { startTime: time[0], endTime:time[1] });
    });
  }, []);

  const onChange = (value) => {
    console.log(value)
    setValue(value);
    const time = value[0].split(',');
    PubSub.publish('choosePeriodTime', { startTime: time[0],endTime:time[1] });
  };

  const handleChangeReason = (tag, checked) => {
    setReason(tag.value);
    PubSub.publish('reasonData', {type: tag.value})
  };

  const handleChangeFromData = (tag, checked) => {
    setFromData(tag.value);
    PubSub.publish('fromData', {type: tag.value})
  };

  const periodChildren = (_, actions) => {
    if (!periodTime || periodTime.length === 0) return '请选择'
    const datas = periodTime[0]
    const current = datas.find(item => item.value === value[0])
    return <div className='picker-children' onClick={actions.open}>
      {current?.label ?? '请选择'}<CaretDownOutlined />
    </div>
  }

  return (
    <ul className="factor-container">
      <li className="factor-item gray-bottom-border">
        <span className="factor-label">影响因素：</span>
        {/* <Space wrap size={10}>
          <Button type="primary">经济指标</Button>
        </Space> */}
        {Reasons.map((tag) => (
          <CheckableTag
            className='factor-tag'
            key={tag.value}
            checked={reason.indexOf(tag.value) > -1}
            onChange={(checked) => handleChangeReason(tag, checked)}
          >
            {tag.label}
          </CheckableTag>
        ))}
      </li>
      <li className="factor-item">
        <span className="factor-label">经济数据：</span>
        {FromDatas.map((tag) => (
          <CheckableTag
            className='factor-tag'
            key={tag.value}
            checked={fromData.indexOf(tag.value) > -1}
            onChange={(checked) => handleChangeFromData(tag, checked)}
          >
            {tag.label}
          </CheckableTag>
        ))}
      </li>
      <li className="factor-item" style={{display: 'flex', alignItems: 'center'}}>
        <span className="factor-label">观察周期：</span>
        {/* <Select
          placeholder="请选择经济周期"
          optionFilterProp="children"
          onChange={onChange}
          // onSearch={onSearch}
          value={value}
          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          // options={periodTime}
          style={{ width: 220, height: 50 }}
        >
            {
              (periodTime || []).map(period => {
                return  <Select.Option value={period.value} label={period.label}>
                  <div className="option-label-item">
                    <p style={{lineHeight: '25px'}}>{ period.label }</p>
                    <p style={{fontSize: 10, lineHeight: '20px'}}>({period?.start_value}% &gt; {period?.highest_value}% &gt; {period?.end_value}%)</p>
                  </div>
                </Select.Option>
              })
            }
        </Select> */}
        {/* <span className="cpi-value">{valueObj?.start_value}% &gt; {valueObj?.highest_value}% &gt; {valueObj?.end_value}% </span> */}
        {
          periodTime ? <Picker
            title=""
            columns={periodTime}
            value={value}
            // onSelect={onChange}
            onConfirm={onChange}
          >
            {periodChildren}
          </Picker> : null
        }
      </li>
    </ul>
  );
};
export default Factor;

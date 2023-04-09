import "./index.css";
import { Tabs } from 'antd';
import { useState } from 'react';
const items = [
  {
    label: '大盘影响因素分析',
    key: 'StockMarket',
  },
  // {
  //   label: '我的关注',
  //   key: 'Favorite',
  // },
];
const MyMenu = () => {
  const [current, setCurrent] = useState('StockMarket');

  const onClick = (e) => {
    setCurrent(e);
  };
  return <div className='menu'>
    <Tabs 
      items={items} 
      onChange={onClick} 
      centered
      activeKey={current}
      tabBarGutter={10}
    />
  </div>;
};
export default MyMenu;

import { StockOutlined, SlidersOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
import { useState } from 'react';
const items = [
  {
    label: '大盘趋势分析',
    key: 'StockMarket',
    icon: <StockOutlined />,
  },
  // {
  //   label: '$TESLA',
  //   key: 'Tesla',
  //   // icon: <SlidersOutlined />,
  // },
];
const MyMenu = () => {
  const [current, setCurrent] = useState('StockMarket');
  const onClick = (e) => {
    console.log('click ', e);
    setCurrent(e.key);
  };
  return <Menu className='menu' onClick={onClick} selectedKeys={[current]} mode="horizontal" items={items} />;
};
export default MyMenu;

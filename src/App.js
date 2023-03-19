import React from 'react';
import 'antd/dist/reset.css';
import './App.css';


import MyLogo from './components/MyLogo';
import MyMenu from './components/MyMenu';
import MyFactor from './components/MyFactor';
import MyStockTrend from './components/MyStockTrend';
import MyStockDetail from './components/MyStockDetail';

const App = () => (
  <div className="App">
    <MyLogo />
    <MyMenu />
    <MyFactor />
    <MyStockTrend />
    <MyStockDetail />
  </div>
);

export default App;

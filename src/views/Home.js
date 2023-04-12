import React from 'react';

import MyFactor from '../components/MyFactor';
import MyStockDetail from '../components/MyStockDetail';
import MyStockTrendEcharts from '../components/MyStockTrendEcharts';

const Home = () => {

  return  <div>
        <MyFactor />
        <MyStockTrendEcharts />
        <MyStockDetail />
    </div>
}

export default Home;
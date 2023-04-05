import React, { useState } from 'react';
import 'antd/dist/reset.css';
import './App.css';


import MyLogo from './components/MyLogo';
import MyMenu from './components/MyMenu';
import MyFactor from './components/MyFactor';
// import MyStockTrend from './components/MyStockTrend';
import MyStockDetail from './components/MyStockDetail';
import MyStockTrendEcharts from './components/MyStockTrendEcharts';

export const AppContext = React.createContext(null)

const App = () => {
  const [theme, setTheme] = useState(0)

  return  <div className="App">
      <MyLogo theme={theme} setTheme={setTheme}/>
      <MyMenu />
      <MyFactor />
      <AppContext.Provider value={
        {
          theme
        }
      }>
        <MyStockTrendEcharts />
        <MyStockDetail />
      </AppContext.Provider>
    </div>
}

export default App;

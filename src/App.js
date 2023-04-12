import React, { useState } from 'react';
import 'antd/dist/reset.css';
import zhCN from 'antd/es/locale/zh_CN';
import { ConfigProvider } from 'antd'
import Cookies from 'js-cookie'
import { useRoutes } from 'react-router';
import routes from './router'
import './App.css';


import MyLogo from './components/MyLogo';
import MyMenu from './components/MyMenu';

export const AppContext = React.createContext(null)

const App = () => {
  const [theme, setTheme] = useState(Number(Cookies.get('eucleia-theme')) || 0)

  const handleSetTheme = (theme) => {
    setTheme(theme)
    Cookies.set('eucleia-theme', theme)
  }

  return  <div className="App">
      <ConfigProvider locale={zhCN}>
        <MyLogo theme={theme} setTheme={handleSetTheme}/>
        <MyMenu />
        <AppContext.Provider value={
          {
            theme
          }
        }>
          {
            useRoutes(routes)
          }
        </AppContext.Provider>
      </ConfigProvider>
    </div>
}

export default App;

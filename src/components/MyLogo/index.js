import "./index.css";

import {themes} from '../../static/constant'

const MyLogo = (props) => {
  const { theme, setTheme } = props

  const changeTheme = () => {
    setTheme(theme => Number(!theme))
  }

  return (
    <div className="logo-container">
      <div className="inner-container">
        <img className="logo" src={require('../../static/images/浪越大鱼越贵.png')} alt="wave-fish" />
        {/* <span className="logan">浪越大鱼越贵</span> */}
      </div>
      <div className="outer-container" onClick={changeTheme}>
        <img className="theme-logo" src={themes[theme].logo} alt={themes[theme].text} />{themes[theme].text}
      </div>
    </div>
  );
};
export default MyLogo;

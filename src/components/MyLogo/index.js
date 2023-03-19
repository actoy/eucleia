import "./index.css";
import { SlidersOutlined } from "@ant-design/icons";

const MyLogo = () => {
  return (
    <div className="logo-container gray-bottom-border">
      <div className="inner-container">
        <img className="logo" src={require('../../static/wave-fish.jpg')} alt="wave-fish" />
        <span className="logan">浪越大鱼越贵</span>
      </div>
      <div className="outer-container"><SlidersOutlined className="slider-outlined" /> &nbsp;红涨绿跌</div>
    </div>
  );
};
export default MyLogo;

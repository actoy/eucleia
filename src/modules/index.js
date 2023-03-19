import axios from 'axios';
// 获取数据
const fetch = async ({ method, url, data }) => {
  try {
    const options = {
      method: method || 'get',
      url,
    }

    if(data) {
      method === 'get' ? (options.params = data) : (options.data = data);
    }

    const res = await axios(options);
    return res;
  } catch(err){
    console.error('数据获取错误，请稍后重试~', err);
  }
};

export {
  fetch
}
import api from '../utils/api';

const useApi = () => {
  const get = async (url, params = {}) => {
    const response = await api.get(url, { params });
    return response.data;
  };

  const post = async (url, data = {}) => {
    const response = await api.post(url, data);
    return response.data;
  };

  const put = async (url, data = {}) => {
    const response = await api.put(url, data);
    return response.data;
  };

  return { get, post, put };
};

export default useApi;

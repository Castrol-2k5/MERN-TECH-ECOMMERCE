import axiosClient from '../../../services/axiosClient.js';

export const hqService = {
  async getCommandCenter() {
    const response = await axiosClient.get('/hq/command-center');
    return response?.data || response;
  }
};

export default hqService;

import axiosClient from '../../../services/axiosClient.js';

export const reviewService = {
  createReview: async ({ orderId, rating, comment = '', tags = [] }) => {
    const res = await axiosClient.post('/reviews', {
      orderId,
      rating,
      comment,
      tags,
    });
    return res?.data?.review || null;
  },

  getMyReviews: async () => {
    const res = await axiosClient.get('/reviews/my-reviews');
    return res?.data?.reviews || [];
  },

  getBranchReviews: async (params = {}) => {
    const res = await axiosClient.get('/reviews/branch', { params });
    return {
      reviews: res?.data?.reviews || [],
      summary: res?.data?.summary || { totalReviews: 0, fiveStarCount: 0, avgRating: 0 },
      meta: res?.meta || {},
    };
  },
};

export default reviewService;

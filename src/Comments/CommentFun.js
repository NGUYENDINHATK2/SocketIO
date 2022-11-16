
const axios = require('axios');
const API_URL = require('../../types');
const getAllCommentPostApi = (token, idPost) => {
    console.log("Get all comments post");
    const config = {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }
    const res = axios.post(`${API_URL.API_URL}/api/showComment`, {
        where_comment: idPost
    }, config);
    if (res) {
        console.log(res);
        return res;
    }
}
module.exports = { getAllCommentPostApi };
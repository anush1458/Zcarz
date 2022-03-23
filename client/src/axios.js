import axios from 'axios';

//axios instance to base url
const instance = axios.create({
    baseURL: "https://zcars.herokuapp.com/api"
});

export default instance;
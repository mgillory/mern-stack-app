import axios from "axios";
import jwt_decode from "jwt-decode";
import { GET_ERRORS } from "./types";
import { SET_CURRENT_USER } from "./types";
import setAuthToken from "../utils/setAuthToken";

// register user
export const registerUser = (userData, history) => dispatch => {
  axios
    .post("/api/users/register", userData)
    .then(res => history.push("/login"))
    .catch(err => dispatch({ type: GET_ERRORS, payload: err.response.data }));
};

// login user
export const loginUser = userData => dispatch => {
  axios
    .post("/api/users/login", userData)
    .then(res => {
      // save token to local storage and set to auth header
      const { token } = res.data;
      localStorage.setItem("jwtToken", token);
      setAuthToken(token);

      // set current user
      const decoded = jwt_decode(token);
      dispatch(setCurrentUser(decoded));
    })
    .catch(err => dispatch({ type: GET_ERRORS, payload: err.response.data }));
};

export const setCurrentUser = decoded => {
  return {
    type: SET_CURRENT_USER,
    payload: decoded
  };
};

import { SET_CURRENT_USER } from "../actions/types";
import isEmpty from "../utils/isEmpty";

const initialState = {
  isAuthenticaded: false,
  user: {}
};

export default function(state = initialState, action) {
  switch (action.type) {
    case SET_CURRENT_USER:
      return {
        ...state,
        isAuthenticaded: !isEmpty(action.payload),
        user: action.payload
      };
    default:
      return state;
  }
}

import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const AppContext = createContext(null);

const AppContextProvider = (props) => {
  
  const url = "http://localhost:4000/"

  const contextValue = {
    url
  }
  return (
    <AppContext.Provider value={contextValue}>
      {props.children}
    </AppContext.Provider>
  )
  
}
export default AppContextProvider;
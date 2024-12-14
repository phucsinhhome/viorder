import { useEffect } from "react";
import "./App.css";
import { Menu } from "./Components/Food/Menu"
import { BrowserRouter as Router, Link, Route, Routes } from "react-router-dom"

const tele = window.Telegram.WebApp;
export const DEFAULT_PAGE_SIZE = process.env.REACT_APP_DEFAULT_PAGE_SIZE

export const initialUser = tele.initDataUnsafe.user
export const currentUser = tele.initDataUnsafe.user || {
  id: "1351151927",
  first_name: "Minh",
  last_name: "Tran"
}

export const currentUserFullname = () => {
  let sufix = currentUser.last_name === null || currentUser.last_name === undefined || currentUser.last_name === "" ? "" : (" " + currentUser.last_name)
  return currentUser.first_name + sufix
}

export default function App() {

  useEffect(() => {
    document.title = "PSO"
    tele.ready();
    tele.expand();
    tele.disableVerticalSwipes();
    console.info("TELEGRAM BOT API VERSION: %s", tele.version)

  }, []);


  return (
    <div className="flex flex-col relative h-[100dvh] min-h-0 bg-slate-50">
      <Router>
        <div className="mt-2 ml-2 pr-4 w-full flex flex-row items-center space-x-2">
          <Link to="menu/food/r1" className="px-2 py-1 bg-gray-200 text-center text-amber-900 text-sm font-sans rounded-sm shadow-sm" state={{ pageNumber: 0, pageSize: DEFAULT_PAGE_SIZE }}>Food</Link>
          <Link to="menu/baverage/r1" className="px-2 py-1 bg-gray-200 text-center text-amber-900 text-sm font-sans rounded-sm shadow-sm" state={{ pageNumber: 0, pageSize: DEFAULT_PAGE_SIZE }}>Baverage</Link>
        </div>
        <Routes>
          <Route path="menu/:group/:resolverId" element={<Menu />} />
        </Routes>
      </Router>
      <div className="absolute top-0 right-0 flex flex-col mt-10 mr-2 bg-neutral-200 p-1 opacity-90 rounded-md shadow-lg">
        <span className=" font text-[10px] font-bold text-gray-800 dark:text-white">{currentUserFullname()}</span>
        <span className=" font text-[8px] italic text-gray-600 dark:text-white">{currentUser.id}</span>
        <span className=" font font-mono text-center text-[8px] text-gray-900 dark:text-white">{"API " + tele.version}</span>
      </div>
    </div>
  );
}

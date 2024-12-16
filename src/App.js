import { useEffect, useState } from "react";
import "./App.css";
import { Menu } from "./Components/Menu"
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

  const [resolverId, setResolverId] = useState('r1')

  const updateResolver = (rId) => {
    console.info("Update the resolver id to %s", rId)
    setResolverId(rId)
  }

  return (
    <div className="flex flex-col relative h-[100dvh] min-h-0 bg-slate-50">
      <Router>
        <div className="mt-2 ml-2 pr-4 w-full flex flex-row items-center space-x-2">
          <Link to={"menu/food/" + resolverId} className="px-2 py-1 bg-gray-200 text-center text-amber-900 text-sm font-sans rounded-sm shadow-sm">Food</Link>
          <Link to={"menu/baverage/" + resolverId} className="px-2 py-1 bg-gray-200 text-center text-amber-900 text-sm font-sans rounded-sm shadow-sm">Baverage</Link>
        </div>
        <Routes>
          <Route path="menu/:group/:resolverId" element={<Menu argChangeResolverId={(id) => updateResolver(id)} />} />
        </Routes>
      </Router>
    </div>
  );
}

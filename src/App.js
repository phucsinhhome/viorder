import { useEffect, useState } from "react";
import "./App.css";
import { Menu } from "./Components/Menu"
import { BrowserRouter as Router, Link, Route, Routes, Navigate } from "react-router-dom"

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

  const [activeGroup, setActiveGroup] = useState('food')
  const [resolverId, setResolverId] = useState('r1')

  const updateResolver = (rId) => {
    console.info("Update the resolver id to %s", rId)
    setResolverId(rId)
  }
  const menus = ['food', 'baverage', 'breakfast']
  const resolveMenuStyle = (menu) => {
    var st = "px-2 py-1 text-center text-amber-900 text-sm font-sans rounded-sm shadow-sm"
    if (menu === activeGroup) {
      st = st + ' bg-gray-400'
    } else {
      st = st + ' bg-gray-200'
    }
    return st
  }

  return (
    <div className="flex flex-col relative h-[100dvh] min-h-0 bg-slate-50">
      <Router>
        <div className="mt-2 ml-2 pr-4 w-full flex flex-row items-center space-x-2">
          {
            menus.map(menu => <Link to={"menu/" + menu + "/" + resolverId} className={resolveMenuStyle(menu)}>{menu.toLocaleUpperCase()}</Link>)
          }
        </div>
        <Routes>
          <Route path="/" element={<Navigate to={"menu/" + activeGroup + "/" + resolverId} />} />
          <Route path="menu/:group/:resolverId"
            element={<Menu argChangeResolverId={(id) => updateResolver(id)} argChangeActiveGroup={group => setActiveGroup(group)} />}
          />
        </Routes>
      </Router>
    </div>
  );
}

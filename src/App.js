import { useEffect, useState } from "react";
import "./App.css";
import { Menu } from "./Components/Menu"
import { BrowserRouter as Router, Link, Route, Routes, Navigate } from "react-router-dom"
import { getProductGroup } from "./db/pgroup";
import { Button } from "flowbite-react";

export const menuNames = process.env.REACT_APP_PRODUCT_GROUPS.split(',')
export const defaultMenuName = menuNames[0]

export default function App() {
  const [activeGroup, setActiveGroup] = useState(menuNames[0])
  const [resolverId, setResolverId] = useState('r1')

  const [groups, setGroups] = useState([])

  useEffect(() => {
    document.title = "PSO";
    menuNames.forEach(group => {
      getProductGroup(group)
        .then(rsp => {
          if (rsp.ok) {
            return rsp.json()
              .then(data => {
                setGroups(groups => [...groups, data])
              })
          }
        })
    })
  }, []);

  const resolveMenuStyle = (focused) => {
    return focused ? "px-2 py-1 text-center text-white text-sm font-sans rounded-lg shadow-lg bg-green-700"
      : "px-2 py-1 text-center text-white text-sm font-sans rounded-lg shadow-lg bg-green-400"
  }

  return (
    <div className="flex flex-col relative h-[100dvh] min-h-0 bg-slate-50">
      <Router>
        <div className="mt-2 ml-2 pr-4 w-full flex flex-row items-center space-x-1.5">
          {
            menuNames.map(grp => groups.find(g => g.name === grp))
              .map(menu => menu
                ? <Link
                  to={"menu/" + menu.name + "/" + resolverId}
                  key={menu.name}
                  className={resolveMenuStyle(activeGroup === menu.name)}
                >{menu.displayName}</Link>
                : <div></div>)
          }
        </div>
        <Routes>
          <Route path="/" element={<Navigate to={"menu/" + activeGroup + "/" + resolverId} />} />
          <Route path="menu/:group/:resolverId"
            element={<Menu
              changeResolverId={(id) => setResolverId(id)}
              changeActiveGroup={(group) => setActiveGroup(group)}
            />}
          />
        </Routes>
      </Router>

    </div>
  );
}

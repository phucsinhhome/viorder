import { useEffect, useState } from "react";
import "./App.css";
import { Menu } from "./Components/Menu"
import { BrowserRouter as Router, Link, Route, Routes, Navigate } from "react-router-dom"

export const tenantGroup = (group) => {
  return `${process.env.REACT_APP_TENANT}${group}`
}

export default function App() {
  const [activeGroup, setActiveGroup] = useState(tenantGroup('food'))
  const [resolverId, setResolverId] = useState('r1')

  const menus = [{ name: 'food', displayName: 'Food' },
  { name: 'baverage', displayName: 'Beverage' },
  { name: 'breakfast', displayName: 'Breakfast' },
  { name: 'other', displayName: 'Other' }]

  useEffect(() => {
    document.title = "PSO"
  }, []);

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
            menus.map(menu => <Link key={menu.name} to={"menu/" + tenantGroup(menu.name) + "/" + resolverId} className={resolveMenuStyle(menu.name)}>{menu.displayName}</Link>)
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

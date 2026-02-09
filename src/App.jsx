import { useEffect, useState } from "react";
import "./App.css";
import { Menu } from "./Components/Menu"
import { BrowserRouter as Router, Link, Route, Routes, Navigate } from "react-router-dom"
import { getProductGroup } from "./db/pgroup";
import { Tour } from "./Components/Tour";
import { TourRequest } from "./Components/TourRequest";
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

  return (
    <div className="flex flex-col h-[100dvh] relative">

      <Router>
        <div className="h-12 w-full flex flex-row justify-center space-x-1 px-2 place-items-center">
          {
            menuNames.map(grp => groups.find(g => g.name === grp))
              .map(menu => menu
                ? <Button
                  size="xs"
                  color="green"
                  className="h-9 w-"
                >
                  <Link
                    to={"menu/" + menu.name + "/" + resolverId}
                    key={menu.name}
                  >{menu.displayName}</Link>
                </Button>
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
          <Route path="tour"
            element={<Tour resolverId={resolverId} />}
          />
          <Route path="tour/:tourId/:resolverId"
            element={<TourRequest />}
          />
        </Routes>
      </Router>

    </div>
  );
}

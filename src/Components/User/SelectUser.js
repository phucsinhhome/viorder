import { useState, useEffect } from "react";
import { Modal, ListGroup } from 'flowbite-react';
import { getUsers } from "../../db/users";
import {HiUserCircle} from 'react-icons/hi'

export const SelectUser = ({ initialUser, handleUserChange }) => {

  const [isShown, setShow] = useState(false)
  const onClick = () => {
    setShow(true)
  }
  const onClose = () => {
    setShow(false)
  }

  const members = getUsers()

  const [user, setUser] = useState({ id: "", name: "" })

  useEffect(() => {
    setUser(initialUser)
  }, [initialUser]);

  const handleItemSelection = (e) => {
    console.log(e)
    console.info("Selected User: %s ", e.target.value)
    let selectedItem = members.find((i) => i.id === e.target.value)
    console.log(selectedItem)
    handleUserChange(selectedItem)
    setUser(selectedItem)
    onClose()
  }

  return (
    <div>
      <HiUserCircle className="mr-3 h-6 w-6" onClick={onClick}/>
      <Modal
        show={isShown}
        size="md"
        popup={true}
        onClose={onClose}
      >
        <Modal.Header ><span>Select the user</span></Modal.Header>
        <Modal.Body>
          <div className="w-11/12">

            <ListGroup>
              {
                members.filter((m) => m.id !== user.id).map((mem) => {
                  return (
                    <ListGroup.Item key={mem.id} onClick={handleItemSelection} value={mem.id}>
                      {mem.name}
                    </ListGroup.Item>
                  )
                })
              }
            </ListGroup>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}

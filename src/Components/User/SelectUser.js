import { useState, useEffect } from "react";
import { Modal, ListGroup, TextInput } from 'flowbite-react';
import { getUsers } from "../../db/users";

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
      <svg aria-hidden="true" onClick={onClick} className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path></svg>
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
                members.map((mem) => {
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

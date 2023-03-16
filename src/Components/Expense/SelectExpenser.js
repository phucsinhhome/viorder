import { useState, useEffect } from "react";
import { Modal, ListGroup, TextInput } from 'flowbite-react';
import { getUsers } from "../../db/users";

export const SelectExpenser = ({ is, fncChangeIssuer }) => {

  const [isShown, setShow] = useState(false)
  const onClick = () => {
    setShow(true)
  }
  const onClose = () => {
    setShow(false)
  }

  const members = getUsers()

  const [iss, setIss] = useState({ issuerId: "", issuer: "" })

  useEffect(() => {
    setIss(is)
  }, [is]);

  const handleItemSelection = (e) => {
    console.log(e)
    console.info("Selected Issuer: %s ", e.target.value)
    let selectedItem = members.find((i) => i.id === e.target.value)
    console.log(selectedItem)
    fncChangeIssuer(selectedItem)
    setIss(selectedItem)
    onClose()
  }

  return (
    <div>
      <TextInput
        id="issuer"
        placeholder="Liễu Lê"
        required={true}
        value={iss.issuer}
        readOnly={true}
        onClick={onClick}
      />
      <Modal
        show={isShown}
        size="md"
        popup={true}
        onClose={onClose}
      >
        <Modal.Header ><span>Select the issuer</span></Modal.Header>
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

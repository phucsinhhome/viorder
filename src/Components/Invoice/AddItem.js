import { useState, useEffect } from "react";
import { Modal, ListGroup, Button } from 'flowbite-react';
import { getItemList } from "../../db/invoice";

export function AddItem({ fncAddItem }) {

  const [isShown, setShow] = useState(false)
  const onClick = () => {
    setShow(true)
  }
  const onClose = () => {
    setShow(false)
  }

  const items = getItemList()

  useEffect(() => {
  }, []);

  const handleItemSelection = (e) => {
    console.log(e)
    console.info("Selected Item: %s ", e.target.value)
    let selectedItem = items.find((i) => i.id === e.target.value)
    console.log(selectedItem)
    fncAddItem(selectedItem)
    onClose()
  }

  return (
    <div>
      <Button onClick={onClick}>
        Add Item
      </Button>
      <Modal
        show={isShown}
        size="md"
        popup={true}
        onClose={onClose}
      >
        <Modal.Header />
        <Modal.Body>
          <div className="w-11/12">
            <ListGroup>
              {
                items.map((room) => {
                  return (
                    <ListGroup.Item key={room.id} onClick={handleItemSelection} value={room.id}>
                      {room.name + " - " + room.price}
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

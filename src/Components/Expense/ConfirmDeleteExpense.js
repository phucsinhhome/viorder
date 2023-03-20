import { useState, useEffect } from "react";
import { Modal, ListGroup, Button } from 'flowbite-react';
import { getItemList } from "../../db/invoice";

export function ConfirmDeleteExpense({ abortDeletion, confirmDeletion }) {

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

  const handleConfirmation = (e) => {
    console.info("Expense deletion ", e)
    if (e) {
      confirmDeletion()
    } else {
      abortDeletion()
    }
    onClose()
  }

  return (
    <div>
      <Button onClick={onClick}>
        Delete
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
            <div className="font-serif italic">Are you sure ?</div>
            <div className="flex">
              <Button onClick={() => handleConfirmation(false)}>Abort</Button>
              <Button onClick={() => handleConfirmation(true)}>Confirm</Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}

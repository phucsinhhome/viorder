import { useState, useEffect } from "react";
import { Modal, ListGroup, Button } from 'flowbite-react';
import { getPaymentMethods } from "../../db/invoice";

export function ExportInvoice({ fncCallback }) {

  const [isShown, setShow] = useState(false)
  const onClick = () => {
    setShow(true)
  }
  const onClose = () => {
    setShow(false)
  }

  const methods = getPaymentMethods()

  useEffect(() => {
  }, []);

  const exportInv = (e) => {
    console.log(e)
    console.info("Selected Item: %s ", e.target.value)
    let selectedItem = methods.find((i) => i.id === e.target.value)
    console.log(selectedItem)
    fncCallback(selectedItem)
    onClose()
  }

  return (
    <div>
      <Button onClick={onClick}>
        Export
      </Button>
      <Modal
        show={isShown}
        size="md"
        popup={true}
        onClose={onClose}
      >
        <Modal.Header />
        <Modal.Body>
        <ListGroup>
              {
                methods.map((method) => {
                  return (
                    <ListGroup.Item key={method.id} onClick={exportInv} value={method.id}>
                      {method.name}
                    </ListGroup.Item>
                  )
                })
              }
            </ListGroup>
        </Modal.Body>
      </Modal>
    </div>
  );
}

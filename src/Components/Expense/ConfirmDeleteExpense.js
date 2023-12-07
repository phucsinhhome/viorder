import { useState, useEffect } from "react";
import { Modal } from 'flowbite-react';
import { Link } from "react-router-dom";

export function ConfirmDeleteExpense({ abortDeletion, confirmDeletion }) {

  const [isShown, setShow] = useState(false)
  const onClick = () => {
    setShow(true)
  }
  const onClose = () => {
    setShow(false)
  }

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
      <Link onClick={onClick} className="px-1 font-sans font-bold text-amber-800">
        Delete
      </Link>
      <Modal
        show={isShown}
        size="md"
        popup={true}
        onClose={onClose}
      >
        <Modal.Header />
        <Modal.Body>
          <div className="w-11/12">
            <div className="font-serif italic">Are you sure?</div>
            <div className="flex w-full space-x-4 mt-6">
              <span onClick={() => handleConfirmation(false)}
                className="font-medium text-blue-600 hover:underline dark:text-blue-500 cursor-pointer">Abort</span>
              <span onClick={() => handleConfirmation(true)}
                className="font-medium text-blue-600 hover:underline dark:text-blue-500 cursor-pointer">Confirm</span>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}

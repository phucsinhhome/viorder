import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { exportInvoice, getInvoice, updateInvoice } from "../../db/invoice";
import { EditItem } from "./EditItem";
import UpdateButton from "../Button/Button";
import { TextInput, Label } from 'flowbite-react';
import { Table } from "flowbite-react";
import { SelectUser } from "../User/SelectUser";
import { ExportInvoice } from "./ExportInvoice";
import * as minio from "minio";

var minioClient = new minio.Client({
  endPoint: 'phucsinhhcm.hopto.org',
  port: 9000,
  useSSL: false,
  accessKey: 'demo',
  secretKey: 'demo!123',
})

const getPresignedLink = (key, cbF) => {
  minioClient.presignedGetObject('invoices', key, 300, cbF)
}

const loadFile = (bucket, key) => {
  // var size = 0
  // minioClient.getObject(bucket, key, function (err, dataStream) {
  //   if (err) {
  //     return console.log(err)
  //   }
  //   dataStream.on('data', function (chunk) {
  //     size += chunk.length
  //   })
  //   dataStream.on('end', function () {
  //     console.log('End. Total size = ' + size)
  //   })
  //   dataStream.on('error', function (err) {
  //     console.log(err)
  //   })
  // })

  minioClient.fGetObject(bucket, key, 'C:/apps/abc.pdf', function (err) {
    if (err) {
      return console.log(err)
    }
    console.log('success')
  })
}

export const EditInvoice = () => {
  const [invoice, setInvoice] = useState(
    {
      "id": "000000000000000000",
      "guestName": "",
      "issuer": "",
      "issuerId": "",
      "subTotal": 0,
      "items": [
        {
          "id": "",
          "itemName": "",
          "unitPrice": 0,
          "quantity": 0,
          "amount": 0,
          "service": "FOOD"
        }
      ]
    }
  )

  const [invoiceUrl, setInvoiceUrl] = useState("")

  const { invoiceId } = useParams()

  useEffect(() => {
    console.info("Eding invoice %s", invoiceId)
    getInvoice(invoiceId).then(data => setInvoice(data))
  }, [invoiceId]);

  const handleDeleteItem = (item) => {
    console.info("Item %s is deleted", item.id)
    const nItems = invoice.items.filter((it) => it.id !== item.id)
    let ta = nItems.map(({ amount }) => amount).reduce((a1, a2) => a1 + a2, 0)
    const inv = {
      ...invoice,
      items: nItems,
      subTotal: ta
    }

    setInvoice(inv)
  }


  const onDataChange = (e) => {
    const inv = {
      ...invoice,
      [e.target.id]: e.target.value
    }
    setInvoice(inv)
  }

  const onIssuerChange = (member) => {
    console.log("Selected issuer: %s", member.id)
    const inv = {
      ...invoice,
      issuerId: member.id,
      issuer: member.name
    }

    setInvoice(inv)
  }

  const handleSaveInvoice = () => {
    console.info("Saving invoice")
    console.log(invoice)
    updateInvoice(invoice)
      .then((res) => {
        if (res.ok) {
          console.info("Invoice %s has been saved successfully", invoiceId);
        } else {
          console.info("Failed to save invoice %s", invoiceId);
        }
        console.info(res)
      })
  }

  const createOrUpdateItem = (item) => {
    let items = []
    if (item.id === null || item.id === "") {
      let newItemId = invoiceId + (Date.now() % 10000000)
      console.log("Added an item into invoice. Id [%s] was generated", newItemId)
      items = [
        ...invoice.items,
        {
          id: newItemId,
          itemName: item.itemName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          amount: item.unitPrice * item.quantity
        }
      ]
    } else {
      console.log("Update item [%s] ", item.id)
      items = invoice.items.map((i) => i.id === item.id ? item : i)
    }

    let ta = items.map(({ amount }) => amount).reduce((a1, a2) => a1 + a2, 0)
    const inv = {
      ...invoice,
      items: items,
      subTotal: ta
    }
    setInvoice(inv)
  }


  const donwloadInvoice = (invoicePath) => {
    loadFile('invoices', invoicePath)
  }

  const exportWithMethod = (method) => {
    console.log("Export invoice %s with method [%s]...", invoiceId, method.name)

    const inv = {
      ...invoice,
      paymentMethod: method.id
    }

    exportInvoice(inv)
      .then((res) => {
        if (res.ok) {
          console.info("Invoice %s has been exported successfully", invoiceId);
          setInvoice(inv);
          res.json().then((json) => {
            console.log(json)
            var withoutBucketPath = json.url.substring(json.url.indexOf('/'));
            console.info("Download invoice from url [%s]", withoutBucketPath);
            // donwloadInvoice(withoutBucketPath)
            getPresignedLink(withoutBucketPath, (err, url) => {
              if (err) {
                return console.log(err)
              }
              setInvoiceUrl(url)
            })
          });
        } else {
          console.info("Failed to export invoice %s", invoiceId);
        }
        console.info(res)
      })
  }


  return (
    <div class="bg-slate-50">
      <div class="py-2 px-2">
        <Link onClick={handleSaveInvoice} className="px-1 font-sans font-bold text-amber-800">
          Save
        </Link>
        {/* <UpdateButton title="Save" disable={false} onClick={handleSaveInvoice} /> */}
        <Link to=".." relative="path" className="px-1 font-sans font-bold text-amber-800">Back</Link>
      </div>
      <form class="flex flex-wrap mx-1">
        <div class="w-full md:w-1/2 px-1 mb-6">
          <div class="flex flex-wrap -mx-3 mb-6">
            <div class="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="guestName"
                  value="Guest Name"
                />
              </div>
              <TextInput
                id="guestName"
                placeholder="John Smith"
                required={true}
                value={invoice.guestName}
                onChange={onDataChange}
              />
            </div>
          </div>
          <div class="flex flex-wrap -mx-3 mb-6">
            <div class="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="checkInDate"
                  value="Check In"
                />
              </div>
              <TextInput
                id="checkInDate"
                placeholder="1"
                required={true}
                value={invoice.checkInDate}
                readOnly={false}
                type="date"
                onChange={onDataChange}
                rightIcon={() => {
                  return (
                    <svg aria-hidden="true" class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path></svg>
                  )
                }}
              />
            </div>
            <div class="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="checkOutDate"
                  value="Check Out"
                />
              </div>
              <TextInput
                id="checkOutDate"
                placeholder="1"
                required={true}
                value={invoice.checkOutDate}
                readOnly={false}
                type="date"
                rightIcon={() => {
                  return (
                    <svg aria-hidden="true" class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path></svg>
                  )
                }}
              />
            </div>
          </div>

          <div class="flex flex-wrap -mx-3 mb-2">
            <div class="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="issuer"
                  value="Issuer"
                />
              </div>
              <SelectUser initialUser={{ id: invoice.issuerId, name: invoice.issuer }}
                handleUserChange={onIssuerChange} />
            </div>
            <div class="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="totalAmount"
                  value="Total Amount"
                />
              </div>
              <TextInput
                id="totalAmount"
                placeholder="100000"
                required={true}
                value={invoice.subTotal}
                readOnly={true}
              />
            </div>
          </div>
        </div>
        {/** Second Column */}
        <div class="w-full md:w-1/2 px-1 mb-6">
          <div class="py-2 px-2 flex bg-green-300">
            <EditItem eItem={{
              "id": "",
              "itemName": "",
              "unitPrice": 0,
              "quantity": 0,
              "amount": 0
            }} onSave={createOrUpdateItem} onDelete={handleDeleteItem} displayName="Add"></EditItem>
            <ExportInvoice fncCallback={exportWithMethod} />
            <Link to={invoiceUrl} className="pl-5 font-thin" hidden={invoiceUrl === ""} >Click To Download</Link>
          </div>
          <Table hoverable={true}>
            <Table.Head>
              <Table.HeadCell>Item Name</Table.HeadCell>
              <Table.HeadCell>Unit Price</Table.HeadCell>
              <Table.HeadCell>Quantity</Table.HeadCell>
              <Table.HeadCell>Amount</Table.HeadCell>
              <Table.HeadCell>Service</Table.HeadCell>
              <Table.HeadCell>
                <span className="sr-only">
                  Edit
                </span>
              </Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {invoice.items.map((item) => {
                return (
                  <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
                    <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {item.itemName}
                    </Table.Cell>
                    <Table.Cell>
                      {item.unitPrice.toLocaleString('us-US', { style: 'currency', currency: 'VND' })}
                    </Table.Cell>
                    <Table.Cell>
                      {item.quantity}
                    </Table.Cell>
                    <Table.Cell>
                      {item.amount.toLocaleString('us-US', { style: 'currency', currency: 'VND' })}
                    </Table.Cell>
                    <Table.Cell>
                      {item.service}
                    </Table.Cell>
                    <Table.Cell>
                      {<EditItem eItem={item} onSave={createOrUpdateItem} onDelete={handleDeleteItem} displayName="Edit" />}
                    </Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>


        </div>
      </form>
    </div >
  );
}

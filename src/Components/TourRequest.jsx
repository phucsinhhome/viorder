import { Button, Modal } from "flowbite-react";
import { useState, useEffect } from "react";
import { FaPersonWalkingLuggage } from "react-icons/fa6";
import { formatISODateTime, formatShortHour, formatVND } from "../Service/Utils";
import { FaChild } from "react-icons/fa";
import { IoIosBoat } from "react-icons/io";
import { IoBackspaceOutline } from "react-icons/io5";
import { cancelRequestToJoin, listTourRequests, requestToJoin } from "../db/tour-request";
import { getTour } from "../db/tour";
import { resolveInvoice } from "../db/order";
import { useParams } from "react-router-dom";


export const TourRequest = () => {
    const [tour, setTour] = useState();
    const [invoice, setInvoice] = useState();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showRequestDetail, setShowRequestDetail] = useState(false)
    const [editingSlot, setEditingSlot] = useState()
    const [dates, setDates] = useState([])

    // const [tourId] = useState(1); // Assuming you get this from the URL or props
    // const [resolverId] = useState(2); // Assuming you get this from the URL or props
    // const [tourId, resolverId] = useLocation()
    const { tourId, resolverId } = useParams()

    const fetchTourRequests = async () => {
        let fromDate = invoice.checkInDate
        let toDate = invoice.checkOutDate
        let queryTime = formatISODateTime(new Date())
        let rsp = await listTourRequests(tourId, fromDate, toDate, queryTime)
        if (!rsp.ok) {
            return
        }
        let data = await rsp.json()
        if (data.length === 0) {
            setRequests([])
            setDates([])
            return
        }

        const arrD = data.map(req => req.date);
        const dates = arrD
            .reduce((arr, e) => {
                if (!arr.includes(e)) {
                    arr.push(e)
                }
                return arr;
            }, [])
        console.info("Change dates to %s", dates)

        let updatedReqs = await Promise.all(data.map(async (request) => {
            if (requested(request)) {
                return request
            }
            const req = {
                ...request,
                groups: request.groups ? [...request.groups, {
                    invoiceId: invoice.id,
                    numOfAdult: invoice.numOfAdult,
                    numOfKid: invoice.numOfKid
                }] : [{
                    invoiceId: invoice.id,
                    numOfAdult: invoice.numOfAdult,
                    numOfKid: invoice.numOfKid
                }]
            }
            return await join(req, true)
        }));
        setDates(dates)
        setRequests(updatedReqs)
        setLoading(false)
    }

    const requested = (request) => {
        if (request.requestId === undefined || request.requestId === null) {
            return false
        }
        let grp = request.groups?.find(g => g.invoiceId === invoice.id)
        return grp !== undefined
    }

    const indexRequests = (reqs) => {
        return reqs.reduce((map, e) => {
            const { key } = e.date;
            if (!map[key]) {
                map[key] = [];
            }
            map[key].push(e);
            return map;
        })
    }

    useEffect(() => {
        if (tourId === undefined || tourId === null) {
            console.info("Tour id is null")
            return
        }
        getTour(tourId)
            .then(rsp => {
                if (rsp.ok) {
                    rsp.json()
                        .then(data => {
                            setTour(data)
                        })
                }
            })

        // eslint-disable-next-line
    }, [tourId]);


    useEffect(() => {
        if (resolverId === undefined || resolverId === null) {
            return
        }
        resolveInvoice(resolverId)
            .then(rsp => {
                if (rsp.ok) {
                    rsp.json()
                        .then(data => {
                            setInvoice(data)
                        })
                }
            })

        // eslint-disable-next-line
    }, [resolverId]);


    useEffect(() => {
        if (tour && invoice) {
            fetchTourRequests()
        }
        // eslint-disable-next-line
    }, [tour, invoice]);

    const join = async (request, tryOut) => {
        try {

            let res = await requestToJoin(request, tryOut)
            if (!res.ok) {
                return request
            }
            let resJson = await res.json()
            console.info(`Request to join acceptance is ${resJson.accepted} with message ${resJson.message}`)
            return resJson.result
        } catch (err) {
            console.error(err)
            return request
        }
    }

    const confirmToJoin = async () => {
        if (editingSlot === undefined || editingSlot === null) {
            console.info("Editing slot is null")
            return
        }
        let req = {
            ...editingSlot,
            groups: editingSlot.groups ? [...editingSlot.groups, {
                invoiceId: invoice.id,
                numOfAdult: invoice.numOfAdult,
                numOfKid: invoice.numOfKid
            }] : [{
                invoiceId: invoice.id,
                numOfAdult: invoice.numOfAdult,
                numOfKid: invoice.numOfKid
            }]
        }
        let res = await join(req, false)
        if (res === undefined || res === null) {
            console.info("Join request is null")

            return
        }
        if (res.requestId === undefined || res.requestId === null) {
            console.info("Join request id is null")
            return
        }
        setRequests(requests.map(r => {
            if (r.requestId === res.requestId) {
                return res
            }
            return r
        }))
        setShowRequestDetail(false)
        setEditingSlot(undefined)
    }

    const cancelRequest = async (request) => {
        if (request === undefined || request === null) {
            console.info("Request is null")
            return
        }
        let req = {
            ...request,
            groups: request.groups.filter(g => g.invoiceId === invoice.id)
        }
        let res = await cancelRequestToJoin(req)
        if (!res.ok) {
            console.info("Cancel request failed")
            return
        }
        let resJson = await res.json()
        console.info(`Cancel request acceptance is ${resJson.accepted} with message ${resJson.message}`)
        if (!resJson.accepted) {
            console.info("Cancel request is not accepted")
            return
        }
        const result = resJson.result;
        if (result === undefined || result === null) {
            console.info("Cancel request result is null")
            return
        }
        if (result.requestId === undefined || result.requestId === null) {
            console.info("Cancel request id is null")
            return
        }
        setRequests(requests.map(r => {
            if (r.requestId === result.requestId) {
                return result
            }
            return r
        }))
        setShowRequestDetail(false)
        setEditingSlot(undefined)
    }


    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <div className="flex flex-col h-full bg-slate-50 pt-2 space-y-3">
                {
                    dates?.map((date, idx) => (<div className="flex flex-col divide-y px-2 py-0">
                        <div className="text-sm text-amber-800 font-medium text-center">{date}</div>
                        <div className="flex flex-row space-x-2">
                            {
                                requests.filter(req => req.date === date)
                                    .map((request) => (<div
                                        key={`${request.requestId}_${request.slot.id}`}
                                        className="flex flex-col space-y-1 border rounded-md px-1 py-0.5 shadow-md w-24"
                                    >
                                        <div className="flex flex-col  bg-green-500  rounded-md px-0.5">
                                            <span className="font font-bold text-sm text-white">{`${request.slot.summary}`}</span>
                                            <span className="text-xs text-gray-300">{`${formatShortHour(request.slot.startTime)} - ${formatShortHour(request.slot.endTime)}`}</span>
                                        </div>
                                        <div className="flex flex-row items-center space-x-4">
                                            <div className="flex flex-row items-center"><FaPersonWalkingLuggage className="mr-0.5" />{request.numOfAdult}</div>
                                            <div className="flex flex-row items-center"><FaChild className="mr-0.5" />{request.numOfKid}</div>
                                        </div>
                                        <div className="flex flex-row items-baseline">
                                            <span className="text-sm text-amber-900">{formatVND(request.estimatedPrice)}</span>
                                            <span className="text-[10px] text-gray-400">{"/one"}</span>
                                        </div>
                                        <div className="w-full justify-items-center">
                                            {
                                                requested(request) ?
                                                    <Button
                                                        size="xs"
                                                        color="red"
                                                        onClick={() => cancelRequest(request)}
                                                    ><IoIosBoat className="mr-2" />Cancel</Button>
                                                    : <Button
                                                        size="xs"
                                                        color="green"
                                                        onClick={() => {
                                                            setEditingSlot(request)
                                                            setShowRequestDetail(true)
                                                        }}
                                                    ><IoIosBoat className="mr-2" />Request</Button>
                                            }

                                        </div>
                                    </div>))
                            }
                        </div>
                    </div>))
                }
            </div>

            <Modal
                popup={true}
                show={showRequestDetail}
                onClose={() => setShowRequestDetail(false)}
            >
                <Modal.Header><span className="text-sm text-green-600 font-medium">Tour Details</span></Modal.Header>
                <Modal.Body className="flex flex-col px-2">
                    <span>Thank <b>{invoice.guestName}</b> so much!</span>
                    <span className="pb-3">please confirm following tour details:</span>
                    <span>Time: <b>{editingSlot?.date} {editingSlot?.slot.startTime}</b> - <b>{editingSlot?.slot.endTime}</b></span>
                    <span>Group: <b>{editingSlot?.numOfAdult}</b> adults & <b>{editingSlot?.numOfKid}</b> kids <span className="text-[12px] text-gray-500 italic">(under 10yrs)</span></span>
                    <span className="text-[12px] text-gray-500 italic pl-4">Including your group</span>
                    <span>Price: <b>{editingSlot ? formatVND(editingSlot.estimatedPrice) : 0}</b> per person</span>

                    <span className="text-green-700 font-serif text-sm pt-4">We will arrange and let you know soon</span>
                </Modal.Body>
                <Modal.Footer>
                    <div className="flex flex-row space-x-2 w-full justify-items-center items-center">
                        <Button
                            size="xs"
                            color="green"
                            onClick={() => confirmToJoin()}
                        ><IoIosBoat className="mr-2" />Confirm</Button>
                        <Button
                            size="xs"
                            color="green"
                            onClick={() => {
                                setEditingSlot(undefined)
                                setShowRequestDetail(false)
                            }}
                        ><IoBackspaceOutline className="mr-2" />Cancel</Button>
                    </div>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
import { Button, Modal } from "flowbite-react";
import { useState, useEffect } from "react";
import { FaPersonWalkingLuggage } from "react-icons/fa6";
import { formatShortHour, formatVND } from "../Service/Utils";
import { FaChild } from "react-icons/fa";
import { IoIosBoat } from "react-icons/io";
import { IoBackspaceOutline } from "react-icons/io5";
import { listTourRequests } from "../db/tour-request";
import { getTour } from "../db/tour";
import { resolveInvoice } from "../db/order";
import { useLocation, useParams } from "react-router-dom";


export const TourRequest = () => {
    const [tour, setTour] = useState();
    const [invoice, setInvoice] = useState();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showRequestDetail, setShowRequestDetail] = useState(false)
    const [choosenSlot, setChoosenSlot] = useState()
    const [editingSlot, setEditingSlot] = useState()
    const [dates, setDates] = useState([])

    // const [tourId] = useState(1); // Assuming you get this from the URL or props
    // const [resolverId] = useState(2); // Assuming you get this from the URL or props
    // const [tourId, resolverId] = useLocation()
    const { tourId, resolverId } = useParams()

    const fetchTourRequests = () => {
        let fromDate = invoice.checkInDate
        let toDate = invoice.checkOutDate
        listTourRequests(tourId, fromDate, toDate)
            .then(rsp => {
                if (rsp.ok) {
                    rsp.json()
                        .then(data => {
                            setRequests(data)
                            setLoading(false)
                        })
                }
            })
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

    useEffect(() => {
        if (requests == undefined || requests.length === 0) {
            setDates([])
            return
        }
        const arrD = requests.map(req => req.date);
        console.info("Request size %s", arrD)
        const dates = arrD
            .reduce((arr, e) => {
                if (!arr.includes(e)) {
                    arr.push(e)
                }
                return arr;
            }, [])
        console.info("Change dates to %s", dates)
        setDates(dates)
        requests.forEach(request=>{
            const req ={
                ...request,
                groups:[...request.groups,{
                    invoiceId: invoice.invoiceId,
                    numOfAdult: invoice.numOfAdult
                }]
            }
        })
        // eslint-disable-next-line
    }, [requests]);


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
                                        key={request.requestId}
                                        className={choosenSlot?.requestId === request.requestId
                                            ? "flex flex-col space-y-1 border rounded-md px-1 py-0.5 shadow-md w-24 bg-orange-500"
                                            : "flex flex-col space-y-1 border rounded-md px-1 py-0.5 shadow-md w-24"
                                        }
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
                                        <div className="w-full justify-items-center"><Button
                                            size="xs"
                                            color="green"
                                            onClick={() => {
                                                setEditingSlot(request)
                                                setShowRequestDetail(true)
                                            }}
                                            disabled={choosenSlot?.requestId === request.requestId}
                                        ><IoIosBoat className="mr-2" />Join</Button></div>
                                    </div>))
                            }
                        </div>
                    </div>))
                }
            </div>

            {/*
            <div className="flex flex-col h-full bg-slate-50 pt-2 space-y-3">
                {
                    requests.map((request) => (<div className="flex flex-col divide-y px-2 py-0">
                        <div className="text-sm text-amber-800 font-medium text-center">{request.date}</div>
                        <div className="flex flex-row space-x-2">
                            {
                                request.slots.map((slot) => (<div
                                    key={slot.id}
                                    className={choosenSlot?.slot.id === slot.id
                                        ? "flex flex-col space-y-1 border rounded-md px-1 py-0.5 shadow-md w-24 bg-orange-500"
                                        : "flex flex-col space-y-1 border rounded-md px-1 py-0.5 shadow-md w-24"
                                    }
                                >
                                    <div className="flex flex-col  bg-green-500  rounded-md px-0.5">
                                        <span className="font font-bold text-sm text-white">{`${slot.name}`}</span>
                                        <span className="text-xs text-gray-300">{`${slot.startTime} - ${slot.endTime}`}</span>
                                    </div>
                                    <div className="flex flex-row items-center space-x-4">
                                        <div className="flex flex-row items-center"><FaPersonWalkingLuggage className="mr-0.5" />{slot.numOfAdult}</div>
                                        <div className="flex flex-row items-center"><FaChild className="mr-0.5" />{slot.numOfKid}</div>
                                    </div>
                                    <div className="flex flex-row items-baseline">
                                        <span className="text-sm text-amber-900">{formatVND(slot.estimatedPrice)}</span>
                                        <span className="text-[10px] text-gray-400">{"/one"}</span>
                                    </div>
                                    <div className="w-full justify-items-center"><Button
                                        size="xs"
                                        color="green"
                                        onClick={() => {
                                            setEditingSlot({
                                                tour: { ...request },
                                                slot: { ...slot }
                                            })
                                            setShowRequestDetail(true)
                                        }}
                                        disabled={choosenSlot?.slot.id === slot.id}
                                    ><IoIosBoat className="mr-2" />Join</Button></div>
                                </div>))
                            }
                        </div>
                    </div>))
                }
            </div>*/}

            <Modal
                popup={true}
                show={showRequestDetail}
                onClose={() => setShowRequestDetail(false)}
            >
                <Modal.Header><span className="text-sm text-green-600 font-medium">Tour Details</span></Modal.Header>
                <Modal.Body className="flex flex-col px-2">
                    <span>Thank <b>{invoice.guestName}</b> so much!</span>
                    <span className="pb-3">please confirm following tour details:</span>
                    <span>Time: <b>{choosenSlot?.date} {choosenSlot?.slot.startTime}</b> - <b>{choosenSlot?.slot.endTime}</b></span>
                    <span>Group: <b>{choosenSlot?.numOfAdult}</b> adults & <b>{choosenSlot?.numOfKid}</b> kids <span className="text-[12px] text-gray-500 italic">(under 10yrs)</span></span>
                    <span className="text-[12px] text-gray-500 italic pl-4">Including your group</span>
                    <span>Price: <b>{choosenSlot ? formatVND(choosenSlot.estimatedPrice) : 0}</b> per person</span>

                    <span className="text-green-700 font-serif text-sm pt-4">We will arrange and let you know soon</span>
                </Modal.Body>
                <Modal.Footer>
                    <div className="flex flex-row space-x-2 w-full justify-items-center items-center">
                        <Button
                            size="xs"
                            color="green"
                            onClick={() => {
                                setChoosenSlot(editingSlot)
                                setShowRequestDetail(false)
                            }}
                        ><IoIosBoat className="mr-2" />Confirm</Button>
                        <Button
                            size="xs"
                            color="green"
                            onClick={() => {
                                setShowRequestDetail(false)
                            }}
                        ><IoBackspaceOutline className="mr-2" />Cancel</Button>
                    </div>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
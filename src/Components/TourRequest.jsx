import { Button, Modal } from "flowbite-react";
import { useState, useEffect } from "react";
import { FaPersonWalkingLuggage } from "react-icons/fa6";
import { formatVND } from "../Service/Utils";
import { FaChild } from "react-icons/fa";
import { IoIosBoat } from "react-icons/io";
import { IoBackspaceOutline } from "react-icons/io5";


export const TourRequest = () => {
    const [tour, setTour] = useState();
    const [invoice, setInvoice] = useState();
    const [tourRequest, setTourRequest] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showRequestDetail, setShowRequestDetail] = useState(false)
    const [choosenSlot, setChoosenSlot] = useState()
    const [editingSlot, setEditingSlot] = useState()

    const [tourId] = useState(1); // Assuming you get this from the URL or props
    const [resolverId] = useState(2); // Assuming you get this from the URL or props

    useEffect(() => {
        if (tour === undefined) {
            setTour({
                id: tourId,
                name: "Private Mekong Tour",
                info: "This is a sample tour description.",
                image: "https://phucsinhhcm.hopto.org/os/ps-dc-pub/tour/private_mekong_tour/private_mekong_tour_feature.jpg",
                price: 100,
            })
        }
        if (invoice === undefined) {
            setInvoice({
                id: "inv1",
                guestName: "John Doe",
                numOfGuest: 2,
                checkIn: "2023-10-01",
                checkOut: "2023-10-05"
            })
        }
    }, []);

    useEffect(() => {
        if (tour && invoice) {
            setTourRequest([
                {
                    id: 1,
                    tourId: tour.id,
                    date: "2023-10-01",
                    timeSlots: [{
                        id: "uuid1",
                        name: "Morning",
                        startTime: "08:00",
                        endTime: "12:30",
                        numOfAdult: 4,
                        numOfKid: 2,
                        estimatedPrice: 500000,
                        status: "Planning",
                        invoiceIds: ["inv1", "inv2"]
                    }, {
                        id: "uuid2",
                        name: "Afternoon",
                        startTime: "14:00",
                        endTime: "18:30",
                        numOfAdult: 2,
                        numOfKid: 1,
                        estimatedPrice: 700000,
                        status: "Planning",
                        invoiceIds: ["inv3"]
                    }, {
                        id: "uuid3",
                        name: "Firefly",
                        startTime: "15:00",
                        endTime: "17:30",
                        numOfAdult: 1,
                        numOfKid: 0,
                        estimatedPrice: 900000,
                        status: "Planning",
                        invoiceIds: ["inv4"]
                    }]
                }, {
                    id: 4,
                    tourId: tour.id,
                    date: "2023-10-03",
                    timeSlots: [{
                        id: "uuid4",
                        name: "Morning",
                        startTime: "08:00",
                        endTime: "12:30",
                        numOfAdult: 3,
                        numOfKid: 2,
                        estimatedPrice: 1200000,
                        status: "Planning",
                        invoiceIds: ["inv5", "inv6"]
                    }]
                }, {
                    id: 5,
                    tourId: tour.id,
                    date: "2023-10-04",
                    timeSlots: [{
                        id: "uuid5",
                        name: "Morning",
                        startTime: "08:00",
                        endTime: "12:30",
                        numOfAdult: 5,
                        numOfKid: 3,
                        estimatedPrice: 1500000,
                        status: "Planning",
                        invoiceIds: ["inv7"]
                    }]
                },
                {
                    id: 6,
                    tourId: tour.id,
                    date: "2023-10-05",
                    timeSlots: [{
                        id: "uuid6",
                        name: "Morning",
                        startTime: "08:00",
                        endTime: "12:30",
                        numOfAdult: 2,
                        numOfKid: 1,
                        estimatedPrice: 2000000,
                        status: "Planning",
                        invoiceIds: ["inv8"]
                    }]
                }]);
            setLoading(false);
        }
    }, [tour, invoice]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <di>
            <div className="flex flex-col h-full bg-slate-50 pt-2 space-y-3">
                {
                    tourRequest.map((request) => (<div className="flex flex-col divide-y px-2 py-0">
                        <div className="text-sm text-amber-800 font-medium text-center">{request.date}</div>
                        <div className="flex flex-row space-x-2">
                            {
                                request.timeSlots.map((slot) => (<div
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
                    <span>Time: <b>{choosenSlot?.tour.date} {choosenSlot?.slot.startTime}</b> - <b>{choosenSlot?.slot.endTime}</b></span>
                    <span>Group: <b>{choosenSlot?.slot.numOfAdult}</b> adults & <b>{choosenSlot?.slot.numOfKid}</b> kids <span className="text-[12px] text-gray-500 italic">(under 10yrs)</span></span>
                    <span className="text-[12px] text-gray-500 italic pl-4">Including your group</span>
                    <span>Price: <b>{choosenSlot ? formatVND(choosenSlot.slot.estimatedPrice) : 0}</b> per person</span>

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
        </di>
    );
}
import { Button } from "flowbite-react";
import { useState, useEffect } from "react";
import { BiSolidShow } from "react-icons/bi";
import { FaPersonWalkingLuggage } from "react-icons/fa6";
import { FaPeopleRobbery } from "react-icons/fa6";
import { formatVND } from "../Service/Utils";


export const TourRequest = () => {
    const [tour, setTour] = useState();
    const [invoice, setInvoice] = useState();
    const [tourRequest, setTourRequest] = useState([]);
    const [loading, setLoading] = useState(true);
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
                id: 1,
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
                        name: "Morning",
                        startTime: "08:00",
                        endTime: "12:30",
                        numOfAdult: 4,
                        numOfKid: 2,
                        estimatedPrice: 500000,
                        status: "Planning"
                    }, {
                        name: "Afternoon",
                        startTime: "14:00",
                        endTime: "18:30",
                        numOfAdult: 2,
                        numOfKid: 1,
                        estimatedPrice: 700000,
                        status: "Planning",
                    }, {
                        name: "Firefly",
                        startTime: "15:00",
                        endTime: "17:30",
                        numOfAdult: 1,
                        numOfKid: 0,
                        estimatedPrice: 900000,
                        status: "Planning"
                    }]
                }, {
                    id: 4,
                    tourId: tour.id,
                    date: "2023-10-03",
                    timeSlots: [{
                        name: "Morning",
                        startTime: "08:00",
                        endTime: "12:30",
                        numOfAdult: 3,
                        numOfKid: 2,
                        estimatedPrice: 1200000,
                        status: "Planning"
                    }]
                }, {
                    id: 5,
                    tourId: tour.id,
                    date: "2023-10-04",
                    timeSlots: [{
                        name: "Morning",
                        startTime: "08:00",
                        endTime: "12:30",
                        numOfAdult: 5,
                        numOfKid: 3,
                        estimatedPrice: 1500000,
                        status: "Planning",
                    }]
                },
                {
                    id: 6,
                    tourId: tour.id,
                    date: "2023-10-05",
                    timeSlots: [{
                        name: "Morning",
                        startTime: "08:00",
                        endTime: "12:30",
                        numOfAdult: 2,
                        numOfKid: 1,
                        estimatedPrice: 2000000,
                        status: "Planning",
                    }]
                }]);
            setLoading(false);
        }
    }, [tour, invoice]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 pt-2 space-y-3">
            {
                tourRequest.map((request) => (<div className="flex flex-col border rounded-sm px-2 py-1">
                    <div>{request.date}</div>
                    <div className="flex flex-row space-x-4">
                        {
                            request.timeSlots.map((slot) => (<div className="flex flex-col space-y-1 border rounded-md px-1 py-1 shadow-md w-24">
                                <div className="flex flex-col  bg-green-500  rounded-md px-0.5">
                                    <span className="font font-bold text-white">{`${slot.name}`}</span>
                                    <span className="text-xs">{`${slot.startTime} - ${slot.endTime}`}</span></div>
                                <div className="flex flex-row items-center"
                                ><FaPeopleRobbery className="mr-2" />{slot.numOfAdult}
                                </div>
                                <div className="flex flex-row items-baseline">
                                    <span className="text-sm text-amber-900">{formatVND(slot.estimatedPrice)}</span>
                                    <span className="text-[10px] text-gray-400">{"/one"}</span>
                                </div>
                            </div>))
                        }
                    </div>
                </div>))
            }
        </div>
    );
}
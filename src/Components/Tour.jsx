import { Button } from "flowbite-react";
import { useState, useEffect } from "react";
import { BiSolidShow } from "react-icons/bi";
import { FaPersonWalkingLuggage } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { listTours } from "../db/tour";

export const Tour = ({ resolverId }) => {
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTheTours = () => {
        listTours(0, 50)
            .then(rsp => {
                if (rsp.ok) {
                    rsp.json()
                        .then(data => {
                            setTours(data.content)
                            setLoading(false)
                        })
                }
            })
    }

    useEffect(() => {
        if (tours.length === 0) {
            fetchTheTours()
        }
        // eslint-disable-next-line
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col items-center justify-center h-full bg-slate-50">
            <div className="flex flex-col space-y-2">
                {tours.map((tour) => (
                    <div key={tour.tourId} className="flex flex-col space-y-2 bg-white shadow-lg rounded-lg py-1">
                        <img src={tour.featureImgUrl} alt={tour.name} className="h-32 w-auto rounded-lg" />
                        <div className="flex flex-col px-2">
                            <h2 className="text-green-700">{tour.name}</h2>
                            <span className="text-[12px] text-gray-500">{tour.details}</span>
                        </div>
                        <div className="flex flex-row items-center justify-between px-2 py-1">
                            <Button
                                size="xs"
                                color="green"
                            ><BiSolidShow className="mr-2" />Details</Button>
                            <Button
                                size="xs"
                                color="green"
                            ><FaPersonWalkingLuggage className="mr-2" />
                                <Link to={tour.tourId + "/" + resolverId}
                                // state={tou}
                                >Request to join</Link></Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
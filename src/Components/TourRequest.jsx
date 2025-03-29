import { Button } from "flowbite-react";
import { useState, useEffect } from "react";
import { BiSolidShow } from "react-icons/bi";
import { FaPersonWalkingLuggage } from "react-icons/fa6";


export const TourRequest = () => {
    const [tour, setTour] = useState();
    const [loading, setLoading] = useState(true);
    const [tourId] = useState(1); // Assuming you get this from the URL or props

    useEffect(() => {
        if (tour === undefined) {
            setTour({
                id: tourId,
                name: "Private Mekong Tour",
                info: "This is a sample tour description.",
                image: "https://phucsinhhcm.hopto.org/os/ps-dc-pub/tour/private_mekong_tour/private_mekong_tour_feature.jpg",
                price: 100,
            })
            setLoading(false);
        }
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col items-center justify-center h-full bg-slate-50">

        </div>
    );
}
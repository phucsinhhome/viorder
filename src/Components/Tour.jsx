import { Button } from "flowbite-react";
import { useState, useEffect } from "react";
import { BiSolidShow } from "react-icons/bi";
import { FaPersonWalkingLuggage } from "react-icons/fa6";
import { Link } from "react-router-dom";

export const Tour = () => {
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (tours.length === 0) {
            setTours([{
                id: 1,
                name: "Private Mekong Tour",
                info: "This is a sample tour description.",
                image: "https://phucsinhhcm.hopto.org/os/ps-dc-pub/tour/private_mekong_tour/private_mekong_tour_feature.jpg",
                price: 100,
            }, {
                id: 2,
                name: "Mekong Biking Tour",
                info: "This is a sample tour description.",
                image: "https://phucsinhhcm.hopto.org/os/ps-dc-pub/tour/mekong_biking_tour/mekong_biking_tour_feature.jpg",
                price: 100,
            }, {
                id: 3,
                name: "Bentre City Tour",
                info: "This is a sample tour description.",
                image: "https://phucsinhhcm.hopto.org/os/ps-dc-pub/tour/bentre_city_tour/bentre_city_tour_feature.jpg",
                price: 100,
            }])
            setLoading(false);
        }
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col items-center justify-center h-full bg-slate-50">
            <div className="flex flex-col space-y-2">
                {tours.map((tour) => (
                    <div key={tour.id} className="flex flex-col space-y-2 bg-white shadow-lg rounded-lg py-1">
                        <img src={tour.image} alt={tour.name} className="h-32 w-auto rounded-lg" />
                        <div className="flex flex-col px-2">
                            <h2 className="text-green-700">{tour.name}</h2>
                            <span className="text-[12px] text-gray-500">{tour.info}</span>
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
                                <Link to={"tour/"+tour.id}>Request to join</Link></Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
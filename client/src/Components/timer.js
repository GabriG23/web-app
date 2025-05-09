
import { useEffect, useState } from 'react';

function Timer(props) { // props: setStopRound = {props.setStopRound} timestamp = {props.timestamp}

    var d = props.timestamp + 60 * 1000;

    const calculateTimeLeft = () => {
        const difference = d - +new Date(); // timestamp iniziale + 60*1000 (ms) + il timestamp attuale
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        setTimeout(() => {
            var seconds = timeLeft.seconds + (timeLeft.minutes * 60);
            if (seconds <= 1) {
                props.setStopRound(true); // round chiuso invio la risposta
            }
            setTimeLeft(calculateTimeLeft());
        }, 1000);
    });

    return (
        <>
            {timeLeft.minutes || timeLeft.seconds ? (
                <h5>
                    <span>{timeLeft.minutes}m </span>
                    <span>: </span>
                    <span>{timeLeft.seconds}s</span>
                </h5>
            ) : "Round chiuso."}
        </>
    );
}

export default Timer;
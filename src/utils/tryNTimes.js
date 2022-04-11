const sleep = duration => new Promise(res => setTimeout(res, duration));



export default async function tryNTimes({ toTry, onErr = () => true, times = 5, interval = 100}) {
    if (times < 1) throw new Error(`Bad argument: 'times' must be greater than 0, but ${times} was received.`);
    let attemptCount = 0
    while (true) {
        try {
            const result = await toTry();
            return result;
        } catch(error) {
            if(onErr(error)) {
                if (++attemptCount >= times) throw error;
            } else {
                throw error
            }
        }
        await sleep(interval)
    }
}
export default function convertHourToMinutes(time: string) {
	const [hour, minutes] = time.split(':').map(Number);

	console.log(hour, minutes);
	const timeInMinutes = hour * 60 + minutes;
	return timeInMinutes;
}

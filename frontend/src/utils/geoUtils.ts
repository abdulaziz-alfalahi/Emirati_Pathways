export const calculateHaversineDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371; // Earth radius in km

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Heuristic for commute time
// Peak Speed: ~25 km/h
// Off-Peak: ~45 km/h
export const estimateCommuteTime = (distanceKm: number, isPeak: boolean = true): number => {
    const speed = isPeak ? 25 : 45;
    const timeHours = distanceKm / speed;
    return Math.round(timeHours * 60); // minutes
};

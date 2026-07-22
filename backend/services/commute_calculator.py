
import math

def haversine(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return None

    # Convert decimal degrees to radians 
    lon1, lat1, lon2, lat2 = map(math.radians, [float(lat1), float(lon1), float(lat2), float(lon2)])

    # Haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a)) 
    r = 6371 # Radius of earth in kilometers. Use 3956 for miles
    return c * r

def estimate_commute_time(distance_km, average_speed_kmh=40):
    """
    Estimate commute time in minutes based on distance and average speed.
    Default speed is 40 km/h (city driving).
    """
    if distance_km is None:
        return None
    time_hours = distance_km / average_speed_kmh
    return round(time_hours * 60)

def estimate_peak_hour_commute(distance_km):
    """
    Estimate commute time in minutes during peak hours in UAE.
    
    Peak hours typically have:
    - Morning (7-9 AM): Heavy congestion, ~25 km/h average
    - Evening (5-7 PM): Heavy congestion, ~20 km/h average
    
    Returns dict with normal and peak times.
    """
    if distance_km is None:
        return None
    
    # Normal traffic (40 km/h)
    normal_time = round((distance_km / 40) * 60)
    
    # Peak hour traffic (22.5 km/h average of morning + evening)
    peak_time = round((distance_km / 22.5) * 60)
    
    return {
        'normal_mins': normal_time,
        'peak_mins': peak_time,
        'peak_difference': peak_time - normal_time
    }



# ── Emirate-centroid fallback (issue #32) ────────────────────────────────
# Coordinate coverage is sparse (live 2026-07-22: 4/4092 candidate profiles,
# 8/28 jobs), so commute display falls back to emirate centroids when either
# side lacks lat/lon. Centroids are the main population centre of each
# emirate, not the geographic centre — commute estimates are city-to-city.
EMIRATE_CENTROIDS = {
    'abu dhabi': (24.4539, 54.3773),
    'dubai': (25.2048, 55.2708),
    'sharjah': (25.3463, 55.4209),
    'ajman': (25.4052, 55.5136),
    'umm al quwain': (25.5647, 55.5534),
    'ras al khaimah': (25.8007, 55.9762),
    'fujairah': (25.1288, 56.3265),
    # common spelling variants seen in the data
    'abudhabi': (24.4539, 54.3773),
    'uaq': (25.5647, 55.5534),
    'rak': (25.8007, 55.9762),
}


def _emirate_centroid(name):
    if not name:
        return (None, None)
    return EMIRATE_CENTROIDS.get(str(name).strip().lower(), (None, None))


def commute_info(cand_lat, cand_lon, cand_emirate, job_lat, job_lon, job_emirate):
    """Informational commute block for match displays (issue #32).

    NEVER a scoring input (owner rule, #12) — display only. Uses real
    coordinates when both sides have them, else emirate centroids; returns
    None when neither basis is available. `basis` tells the UI how rough
    the estimate is.
    """
    basis = 'coordinates'
    if cand_lat is None or cand_lon is None:
        cand_lat, cand_lon = _emirate_centroid(cand_emirate)
        basis = 'emirate'
    if job_lat is None or job_lon is None:
        job_lat, job_lon = _emirate_centroid(job_emirate)
        basis = 'emirate'

    distance = haversine(cand_lat, cand_lon, job_lat, job_lon)
    if distance is None:
        return None

    peak = estimate_peak_hour_commute(distance)
    return {
        'distance_km': round(distance, 1),
        'commute_mins': peak['normal_mins'],
        'peak_commute_mins': peak['peak_mins'],
        'basis': basis,
    }

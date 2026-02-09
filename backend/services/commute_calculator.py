
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


import math

# Synthetic cache of travel times (in minutes) based on distance and synthetic traffic
class SpatialEngine:
    def __init__(self):
        self.avg_speed_kmh = 30.0 # urban speed
        
    def haversine(self, lat1, lon1, lat2, lon2):
        R = 6371.0 # km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = R * c
        return distance
        
    def estimate_travel_time(self, lat1, lon1, lat2, lon2):
        dist = self.haversine(lat1, lon1, lat2, lon2)
        # Apply synthetic urban friction factor (1.2 to 1.8 multiplier depending on distance)
        friction = 1.5
        time_hours = (dist * friction) / self.avg_speed_kmh
        return time_hours * 60.0 # returns minutes

spatial_engine = SpatialEngine()

import random

class CashoutPredictor:
    def __init__(self):
        self.is_loaded = True
        
    def predict(self, features):
        prob = 0.05
        if features.get("velocity_5m", 0) > 20000:
            prob += 0.4
        if features.get("count_5m", 0) >= 3:
            prob += 0.3
        if features.get("account_age", 100) < 30:
            prob += 0.15
        
        return min(prob, 0.99)

predictor = CashoutPredictor()

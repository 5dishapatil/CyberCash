import numpy as np
from scipy.optimize import minimize

class PlattScaler:
    def __init__(self):
        self.A = 0.0
        self.B = 0.0
    def fit(self, scores, y):
        def obj_fn(params):
            A, B = params
            p = 1.0 / (1.0 + np.exp(A * scores + B))
            p = np.clip(p, 1e-10, 1 - 1e-10)
            return -np.sum(y * np.log(p) + (1 - y) * np.log(1 - p))
        res = minimize(obj_fn, [0.0, 0.0], method='BFGS')
        self.A, self.B = res.x
    def predict_proba(self, scores):
        return 1.0 / (1.0 + np.exp(self.A * scores + self.B))

class CalibratedModel:
    def __init__(self, base_model, scaler):
        self.base_model = base_model
        self.scaler = scaler
    def predict_proba(self, X):
        raw_scores = self.base_model.predict(X)
        return self.scaler.predict_proba(raw_scores)
    def predict_raw(self, X):
        return self.base_model.predict(X)

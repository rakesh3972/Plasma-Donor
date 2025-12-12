#!/usr/bin/env python3
"""
Blood Matching and Fraud Detection ML Service
This service provides machine learning capabilities for:
1. Blood group compatibility matching with logistic regression and random forest
2. Fraud detection using isolation forest
3. Automatic donor-requester matching optimization
"""

import json
import sys
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Import visualization libraries
try:
    import matplotlib
    matplotlib.use('Agg')  # Use non-interactive backend
    import matplotlib.pyplot as plt
    import seaborn as sns
    VISUALIZATION_AVAILABLE = True
except ImportError:
    VISUALIZATION_AVAILABLE = False
    print("Warning: matplotlib not available. Graphs will not be generated.")

class BloodMatchingML:
    def __init__(self, models_dir='models'):
        self.models_dir = models_dir
        os.makedirs(models_dir, exist_ok=True)
        
        # Blood compatibility matrix for PLASMA donation
        # Key: donor blood type -> Array: requester blood types that can receive
        self.blood_compatibility = {
            'A+': ['A+', 'A-'], # A+ donor can give plasma to A+ and A- requesters
            'A-': ['A+', 'A-', 'AB+', 'AB-'], # A- donor can give plasma to A and AB requesters  
            'B+': ['B+', 'B-'], # B+ donor can give plasma to B+ and B- requesters
            'B-': ['B+', 'B-', 'AB+', 'AB-'], # B- donor can give plasma to B and AB requesters
            'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], # AB+ universal plasma donor
            'AB-': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], # AB- universal plasma donor
            'O+': ['O+'], # O+ donor can only give plasma to O+ requesters
            'O-': ['O+', 'O-'] # O- donor can give plasma to O+ and O- requesters
        }
        
        # Health status priority weights
        self.health_weights = {
            'excellent': 1.0,
            'good': 0.85,
            'fair': 0.7,
            'post_covid': 0.6,
            'recovering': 0.4,
            'unavailable': 0.0
        }
        
        # Initialize models
        self.logistic_model = LogisticRegression(random_state=42)
        self.random_forest_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.fraud_detection_model = IsolationForest(contamination=0.1, random_state=42)
        self.ranking_model = RandomForestClassifier(n_estimators=200, random_state=42)
        
        # Encoders and scalers
        self.blood_encoder = LabelEncoder()
        self.role_encoder = LabelEncoder()
        self.scaler = StandardScaler()
        
        # Initialize encoders with known values
        self.blood_encoder.fit(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        self.role_encoder.fit(['donor', 'requester'])
        
    def haversine_distance(self, lat1, lng1, lat2, lng2):
        """Calculate distance between two points using Haversine formula"""
        R = 6371  # Earth's radius in km
        lat1, lng1, lat2, lng2 = map(np.radians, [lat1, lng1, lat2, lng2])
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlng/2)**2
        c = 2 * np.arcsin(np.sqrt(a))
        return R * c
    
    def is_blood_compatible(self, donor_blood, requester_blood):
        """Check if donor blood is compatible with requester blood"""
        return requester_blood in self.blood_compatibility.get(donor_blood, [])
    
    def prepare_features(self, users_data):
        """Prepare features for ML models"""
        df = pd.DataFrame(users_data)
        
        # Handle missing values
        df.fillna({
            'requestFrequency': 0,
            'successfulDonations': 0,
            'mlScore': 0,
            'suspiciousActivity': False,
            'location.lat': 0,
            'location.lng': 0
        }, inplace=True)
        
        # Extract features
        features = []
        for _, user in df.iterrows():
            feature = [
                self.blood_encoder.transform([user['bloodGroup']])[0],
                self.role_encoder.transform([user['role']])[0],
                user.get('requestFrequency', 0),
                user.get('successfulDonations', 0),
                user.get('location.lat', 0) if user.get('location.lat') else 0,
                user.get('location.lng', 0) if user.get('location.lng') else 0,
                1 if user.get('isAvailable', True) else 0,
                user.get('mlScore', 0)
            ]
            features.append(feature)
        
        return np.array(features)
    
    def generate_training_data(self, users_data, num_samples=1000):
        """Generate synthetic training data for ML models"""
        np.random.seed(42)
        
        blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        roles = ['donor', 'requester']
        
        training_data = []
        labels = []
        
        for _ in range(num_samples):
            donor_blood = np.random.choice(blood_types)
            requester_blood = np.random.choice(blood_types)
            
            # Calculate compatibility
            compatibility = self.is_blood_compatible(donor_blood, requester_blood)
            
            # Generate features
            distance = np.random.uniform(0.5, 50)  # Distance in km
            donor_success_rate = np.random.uniform(0, 1)
            requester_frequency = np.random.poisson(2)
            availability = np.random.choice([0, 1], p=[0.2, 0.8])
            
            # Create feature vector
            feature = [
                self.blood_encoder.transform([donor_blood])[0],
                self.blood_encoder.transform([requester_blood])[0],
                distance,
                donor_success_rate,
                requester_frequency,
                availability,
                np.random.uniform(0, 1),  # Random factor
                int(compatibility)  # Blood compatibility as feature
            ]
            
            # Label: 1 if good match, 0 if poor match
            # Good match: compatible blood + close distance + available + good success rate
            match_score = (
                int(compatibility) * 0.4 +
                (1 - min(distance / 50, 1)) * 0.3 +  # Closer is better
                availability * 0.2 +
                donor_success_rate * 0.1
            )
            
            label = 1 if match_score > 0.6 else 0
            
            training_data.append(feature)
            labels.append(label)
        
        return np.array(training_data), np.array(labels)
    
    def train_models(self, users_data):
        """Train ML models with user data"""
        try:
            # Generate training data
            X, y = self.generate_training_data(users_data)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Train logistic regression
            self.logistic_model.fit(X_train_scaled, y_train)
            
            # Train random forest
            self.random_forest_model.fit(X_train, y_train)
            
            # Train fraud detection (unsupervised)
            # Generate fraud features based on user activity patterns
            fraud_features = []
            for user in users_data:
                fraud_feature = [
                    user.get('requestFrequency', 0) / max(1, user.get('successfulDonations', 1)),  # Request to success ratio
                    user.get('requestFrequency', 0),
                    len(user.get('phoneNumber', '')) if user.get('phoneNumber') else 0,
                    1 if user.get('suspiciousActivity', False) else 0
                ]
                fraud_features.append(fraud_feature)
            
            if fraud_features:
                fraud_features = np.array(fraud_features)
                self.fraud_detection_model.fit(fraud_features)
            
            # Evaluate models
            logistic_pred = self.logistic_model.predict(X_test_scaled)
            rf_pred = self.random_forest_model.predict(X_test)
            
            logistic_accuracy = accuracy_score(y_test, logistic_pred)
            rf_accuracy = accuracy_score(y_test, rf_pred)
            
            # Generate visualization graphs
            if VISUALIZATION_AVAILABLE:
                self.generate_training_graphs(logistic_accuracy, rf_accuracy, len(X), y_test, logistic_pred, rf_pred)
            
            # Save models
            self.save_models()
            
            return {
                'status': 'success',
                'logistic_accuracy': float(logistic_accuracy),
                'random_forest_accuracy': float(rf_accuracy),
                'training_samples': len(X),
                'message': 'Models trained successfully'
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Training failed: {str(e)}'
            }
    
    def predict_compatibility(self, donor_data, requester_data):
        """Predict compatibility between donor and requester"""
        try:
            # Calculate distance
            distance = self.haversine_distance(
                donor_data.get('location', {}).get('lat', 0),
                donor_data.get('location', {}).get('lng', 0),
                requester_data.get('location', {}).get('lat', 0),
                requester_data.get('location', {}).get('lng', 0)
            )
            
            # Check blood compatibility
            blood_compatible = self.is_blood_compatible(
                donor_data.get('bloodGroup'),
                requester_data.get('bloodGroup')
            )
            
            if not blood_compatible:
                return {
                    'compatible': False,
                    'compatibility_score': 0.0,
                    'ml_score': 0.0,
                    'distance': distance,
                    'reason': 'Blood types not compatible'
                }
            
            # Prepare features for ML prediction
            feature = np.array([[
                self.blood_encoder.transform([donor_data.get('bloodGroup')])[0],
                self.blood_encoder.transform([requester_data.get('bloodGroup')])[0],
                distance,
                donor_data.get('successfulDonations', 0) / max(1, donor_data.get('requestFrequency', 1)),
                requester_data.get('requestFrequency', 0),
                1 if donor_data.get('isAvailable', True) else 0,
                np.random.uniform(0, 1),  # Random factor
                1  # Blood compatibility
            ]])
            
            # Get predictions from both models
            if hasattr(self, 'scaler') and self.scaler:
                feature_scaled = self.scaler.transform(feature)
                logistic_prob = self.logistic_model.predict_proba(feature_scaled)[0][1]
            else:
                logistic_prob = 0.5
                
            rf_prob = self.random_forest_model.predict_proba(feature)[0][1]
            
            # Combine predictions (weighted average)
            ml_score = (logistic_prob * 0.6 + rf_prob * 0.4)
            
            # Apply distance penalty
            distance_factor = max(0, 1 - distance / 50)  # Penalty for distance > 50km
            final_score = ml_score * distance_factor
            
            return {
                'compatible': blood_compatible,
                'compatibility_score': float(final_score),
                'ml_score': float(ml_score),
                'distance': distance,
                'logistic_score': float(logistic_prob),
                'random_forest_score': float(rf_prob),
                'blood_compatible': blood_compatible,
                'reason': 'Compatible match found' if final_score > 0.5 else 'Low compatibility score'
            }
            
        except Exception as e:
            return {
                'compatible': False,
                'compatibility_score': 0.0,
                'ml_score': 0.0,
                'distance': 0,
                'error': str(e)
            }
    
    def detect_fraud(self, user_data):
        """Detect potential fraud in user activity"""
        try:
            # Prepare fraud detection features
            fraud_feature = np.array([[
                user_data.get('requestFrequency', 0) / max(1, user_data.get('successfulDonations', 1)),
                user_data.get('requestFrequency', 0),
                len(user_data.get('phoneNumber', '')) if user_data.get('phoneNumber') else 0,
                1 if user_data.get('suspiciousActivity', False) else 0
            ]])
            
            # Predict anomaly (-1 for anomaly, 1 for normal)
            anomaly_score = self.fraud_detection_model.predict(fraud_feature)[0]
            decision_score = self.fraud_detection_model.decision_function(fraud_feature)[0]
            
            # Additional rule-based fraud detection
            suspicious_indicators = []
            
            # High request frequency with low success rate
            if user_data.get('requestFrequency', 0) > 10 and user_data.get('successfulDonations', 0) < 1:
                suspicious_indicators.append('High request frequency with no successful donations')
            
            # Very frequent requests in short time
            if user_data.get('requestFrequency', 0) > 5:
                suspicious_indicators.append('Unusually high request frequency')
            
            # Invalid phone number length
            phone = user_data.get('phoneNumber', '')
            if phone and (len(phone) < 8 or len(phone) > 15):
                suspicious_indicators.append('Invalid phone number format')
            
            # Already flagged as suspicious
            if user_data.get('suspiciousActivity', False):
                suspicious_indicators.append('Previously flagged for suspicious activity')
            
            is_fraud = anomaly_score == -1 or len(suspicious_indicators) >= 2
            
            return {
                'is_fraud': is_fraud,
                'fraud_score': float(abs(decision_score)),
                'anomaly_score': int(anomaly_score),
                'suspicious_indicators': suspicious_indicators,
                'fraud_confidence': min(1.0, len(suspicious_indicators) / 4.0),
                'message': 'Fraud detected' if is_fraud else 'User appears legitimate'
            }
            
        except Exception as e:
            return {
                'is_fraud': False,
                'fraud_score': 0.0,
                'error': str(e)
            }
    
    def calculate_advanced_ranking(self, donor_data, requester_data):
        """Calculate comprehensive AI-based donor ranking score"""
        try:
            # 1. Blood Group Compatibility Score (40% weight)
            blood_score = 1.0 if self.is_blood_compatible(donor_data.get('bloodGroup'), requester_data.get('bloodGroup')) else 0.0
            
            # 2. Distance Score (25% weight) - closer is better
            distance = self.calculate_distance(donor_data, requester_data)
            distance_score = max(0, (100 - distance) / 100)  # Normalize to 0-1, max 100km
            
            # 3. Time Since Last Donation Score (20% weight)
            last_donation = donor_data.get('lastDonation')
            if last_donation:
                days_since = (datetime.now() - datetime.fromisoformat(last_donation.replace('Z', '+00:00'))).days
                # Optimal: 60-90 days, score decreases before and after
                if 60 <= days_since <= 90:
                    donation_score = 1.0
                elif days_since < 60:
                    donation_score = max(0, days_since / 60)
                else:
                    donation_score = max(0, (365 - days_since) / 275)  # Decrease after 90 days
            else:
                donation_score = 0.8  # New donor gets decent score
            
            # 4. Health Status Score (10% weight)
            health_status = donor_data.get('healthStatus', 'good')
            health_score = self.health_weights.get(health_status, 0.7)
            
            # 5. Reliability Score (5% weight) - based on past donations/requests ratio
            successful_donations = donor_data.get('successfulDonations', 0)
            total_requests = donor_data.get('totalRequests', 0)
            if total_requests > 0:
                reliability_score = min(1.0, successful_donations / total_requests)
            else:
                reliability_score = 0.8  # New donors get neutral score
            
            # Calculate weighted final score
            final_score = (
                blood_score * 0.40 +
                distance_score * 0.25 +
                donation_score * 0.20 +
                health_score * 0.10 +
                reliability_score * 0.05
            )
            
            return {
                'total_score': final_score,
                'blood_score': blood_score,
                'distance_score': distance_score,
                'donation_score': donation_score,
                'health_score': health_score,
                'reliability_score': reliability_score,
                'distance_km': distance
            }
        except Exception as e:
            return {'total_score': 0.0, 'error': str(e)}

    def find_best_matches(self, requester_data, donors_data, max_matches=5):
        """Find best matching donors using advanced AI ranking"""
        matches = []
        
        for donor in donors_data:
            # Skip unavailable donors
            if not donor.get('isAvailable', True):
                continue
                
            # Check fraud status first - skip suspicious donors
            donor_fraud = self.detect_fraud(donor)
            if donor_fraud.get('is_fraud', False):
                continue
            
            # Check basic blood compatibility
            if not self.is_blood_compatible(donor.get('bloodGroup'), requester_data.get('bloodGroup')):
                continue
            
            # Calculate advanced AI ranking
            ranking = self.calculate_advanced_ranking(donor, requester_data)
            
            # Only include donors with reasonable scores
            if ranking['total_score'] > 0.3:
                match_data = {
                    'donor_id': donor.get('_id') or donor.get('id'),
                    'donor_name': donor.get('name'),
                    'donor_blood_group': donor.get('bloodGroup'),
                    'donor_phone': donor.get('phoneNumber'),
                    'donor_email': donor.get('email'),
                    'availability_status': donor.get('availabilityStatus', 'available'),
                    'health_status': donor.get('healthStatus', 'good'),
                    
                    # AI Ranking Scores
                    'ai_ranking_score': ranking['total_score'],
                    'blood_compatibility_score': ranking['blood_score'],
                    'distance_score': ranking['distance_score'],
                    'donation_timing_score': ranking['donation_score'],
                    'health_score': ranking['health_score'],
                    'reliability_score': ranking['reliability_score'],
                    
                    # Additional data
                    'distance': ranking['distance_km'],
                    'location': donor.get('location', {}),
                    'fraud_risk': donor_fraud.get('fraud_score', 0),
                    'last_donation': donor.get('lastDonation'),
                    'successful_donations': donor.get('successfulDonations', 0)
                }
                matches.append(match_data)
        
        # Sort by AI ranking score (descending) - best matches first
        matches.sort(key=lambda x: x['ai_ranking_score'], reverse=True)
        
        return matches[:max_matches]

    def calculate_distance(self, donor_data, requester_data):
        """Calculate distance between donor and requester"""
        try:
            donor_loc = donor_data.get('location', {})
            requester_loc = requester_data.get('location', {})
            
            if donor_loc.get('coordinates') and requester_loc.get('coordinates'):
                d_coords = donor_loc['coordinates']
                r_coords = requester_loc['coordinates']
                return self.haversine_distance(d_coords[1], d_coords[0], r_coords[1], r_coords[0])
            return 50  # Default moderate distance
        except:
            return 50
    
    def save_models(self):
        """Save trained models to disk"""
        try:
            joblib.dump(self.logistic_model, os.path.join(self.models_dir, 'logistic_model.pkl'))
            joblib.dump(self.random_forest_model, os.path.join(self.models_dir, 'random_forest_model.pkl'))
            joblib.dump(self.fraud_detection_model, os.path.join(self.models_dir, 'fraud_detection_model.pkl'))
            joblib.dump(self.scaler, os.path.join(self.models_dir, 'scaler.pkl'))
            joblib.dump(self.blood_encoder, os.path.join(self.models_dir, 'blood_encoder.pkl'))
            joblib.dump(self.role_encoder, os.path.join(self.models_dir, 'role_encoder.pkl'))
            return True
        except Exception as e:
            print(f"Error saving models: {e}")
            return False
    
    def generate_training_graphs(self, logistic_acc, rf_acc, num_samples, y_test, logistic_pred, rf_pred):
        """Generate and save training performance graphs"""
        try:
            graphs_dir = os.path.join(self.models_dir, 'graphs')
            os.makedirs(graphs_dir, exist_ok=True)
            
            # Set style
            sns.set_style("whitegrid")
            
            # 1. Model Accuracy Comparison
            plt.figure(figsize=(10, 6))
            models = ['Logistic Regression', 'Random Forest']
            accuracies = [logistic_acc * 100, rf_acc * 100]
            colors = ['#FF6B6B', '#4ECDC4']
            
            bars = plt.bar(models, accuracies, color=colors, alpha=0.8, edgecolor='black', linewidth=2)
            plt.ylabel('Accuracy (%)', fontsize=12, fontweight='bold')
            plt.title('ML Model Accuracy Comparison', fontsize=14, fontweight='bold')
            plt.ylim(0, 105)
            
            # Add value labels on bars
            for bar in bars:
                height = bar.get_height()
                plt.text(bar.get_x() + bar.get_width()/2., height,
                        f'{height:.1f}%',
                        ha='center', va='bottom', fontweight='bold', fontsize=11)
            
            plt.tight_layout()
            plt.savefig(os.path.join(graphs_dir, 'model_accuracy_comparison.png'), dpi=300, bbox_inches='tight')
            plt.close()
            
            # 2. Training Performance Metrics
            plt.figure(figsize=(12, 5))
            
            # Confusion Matrix for Logistic Regression
            plt.subplot(1, 2, 1)
            from sklearn.metrics import confusion_matrix
            cm_logistic = confusion_matrix(y_test, logistic_pred)
            sns.heatmap(cm_logistic, annot=True, fmt='d', cmap='Blues', cbar=False)
            plt.title('Logistic Regression\nConfusion Matrix', fontweight='bold')
            plt.ylabel('True Label')
            plt.xlabel('Predicted Label')
            
            # Confusion Matrix for Random Forest
            plt.subplot(1, 2, 2)
            cm_rf = confusion_matrix(y_test, rf_pred)
            sns.heatmap(cm_rf, annot=True, fmt='d', cmap='Greens', cbar=False)
            plt.title('Random Forest\nConfusion Matrix', fontweight='bold')
            plt.ylabel('True Label')
            plt.xlabel('Predicted Label')
            
            plt.tight_layout()
            plt.savefig(os.path.join(graphs_dir, 'confusion_matrices.png'), dpi=300, bbox_inches='tight')
            plt.close()
            
            # 3. Training Dataset Statistics
            plt.figure(figsize=(10, 6))
            metrics = ['Total Samples', 'Training Samples', 'Test Samples']
            values = [num_samples, int(num_samples * 0.8), int(num_samples * 0.2)]
            colors_dataset = ['#FFD93D', '#6BCB77', '#4D96FF']
            
            bars = plt.bar(metrics, values, color=colors_dataset, alpha=0.8, edgecolor='black', linewidth=2)
            plt.ylabel('Number of Samples', fontsize=12, fontweight='bold')
            plt.title('Training Dataset Distribution', fontsize=14, fontweight='bold')
            
            for bar in bars:
                height = bar.get_height()
                plt.text(bar.get_x() + bar.get_width()/2., height,
                        f'{int(height)}',
                        ha='center', va='bottom', fontweight='bold', fontsize=11)
            
            plt.tight_layout()
            plt.savefig(os.path.join(graphs_dir, 'dataset_statistics.png'), dpi=300, bbox_inches='tight')
            plt.close()
            
            # 4. Feature Importance (Random Forest)
            if hasattr(self.random_forest_model, 'feature_importances_'):
                plt.figure(figsize=(10, 6))
                feature_names = ['Donor Blood', 'Requester Blood', 'Distance', 'Success Rate', 
                               'Request Freq', 'Availability', 'Random Factor', 'Blood Compat']
                importances = self.random_forest_model.feature_importances_
                indices = np.argsort(importances)[::-1]
                
                plt.barh(range(len(indices)), importances[indices], color='#95E1D3', edgecolor='black', linewidth=1.5)
                plt.yticks(range(len(indices)), [feature_names[i] for i in indices])
                plt.xlabel('Feature Importance', fontsize=12, fontweight='bold')
                plt.title('Random Forest Feature Importance', fontsize=14, fontweight='bold')
                plt.tight_layout()
                plt.savefig(os.path.join(graphs_dir, 'feature_importance.png'), dpi=300, bbox_inches='tight')
                plt.close()
            
            print(f"✅ Training graphs saved to: {graphs_dir}")
            return True
            
        except Exception as e:
            print(f"Error generating graphs: {e}")
            return False
    
    def save_models(self):
        """Save trained models to disk"""
        joblib.dump(self.logistic_model, os.path.join(self.models_dir, 'logistic_model.pkl'))
        joblib.dump(self.random_forest_model, os.path.join(self.models_dir, 'random_forest_model.pkl'))
        joblib.dump(self.fraud_detection_model, os.path.join(self.models_dir, 'fraud_detection_model.pkl'))
        joblib.dump(self.scaler, os.path.join(self.models_dir, 'scaler.pkl'))
    
    def load_models(self):
        """Load trained models from disk"""
        try:
            self.logistic_model = joblib.load(os.path.join(self.models_dir, 'logistic_model.pkl'))
            self.random_forest_model = joblib.load(os.path.join(self.models_dir, 'random_forest_model.pkl'))
            self.fraud_detection_model = joblib.load(os.path.join(self.models_dir, 'fraud_detection_model.pkl'))
            self.scaler = joblib.load(os.path.join(self.models_dir, 'scaler.pkl'))
            return True
        except:
            return False

    def generate_synthetic_training_data(self, num_samples=2000):
        """Generate synthetic data for training ML models"""
        blood_groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        health_statuses = ['excellent', 'good', 'fair', 'post_covid', 'recovering']
        cities = [
            {'name': 'New York', 'lat': 40.7128, 'lng': -74.0060},
            {'name': 'Los Angeles', 'lat': 34.0522, 'lng': -118.2437},
            {'name': 'Chicago', 'lat': 41.8781, 'lng': -87.6298},
            {'name': 'Houston', 'lat': 29.7604, 'lng': -95.3698},
            {'name': 'Phoenix', 'lat': 33.4484, 'lng': -112.0740},
            {'name': 'Philadelphia', 'lat': 39.9526, 'lng': -75.1652},
            {'name': 'San Antonio', 'lat': 29.4241, 'lng': -98.4936},
        ]
        
        synthetic_users = []
        
        for i in range(num_samples):
            city = random.choice(cities)
            # Add some random variation to coordinates
            lat = city['lat'] + random.uniform(-0.5, 0.5)
            lng = city['lng'] + random.uniform(-0.5, 0.5)
            
            # Generate realistic donation history
            last_donation_days = random.randint(30, 365)
            successful_donations = random.randint(0, 20)
            total_requests = successful_donations + random.randint(0, 5)
            
            user = {
                'bloodGroup': random.choice(blood_groups),
                'age': random.randint(18, 65),
                'weight': random.randint(50, 120),
                'lastDonation': (datetime.now() - timedelta(days=last_donation_days)).isoformat(),
                'healthStatus': random.choice(health_statuses),
                'isAvailable': random.choice([True, True, True, False]),  # 75% available
                'location': {
                    'coordinates': [lng, lat],
                    'city': city['name']
                },
                'successfulDonations': successful_donations,
                'totalRequests': total_requests,
                'requestFrequency': random.randint(0, 10),
                'suspiciousActivity': random.choice([True, False]) if random.random() < 0.1 else False,
                'mlScore': random.uniform(0.1, 1.0),
                'phoneNumber': f"+1{random.randint(1000000000, 9999999999)}",
                'email': f"user{i}@example.com",
                'name': f"User {i+1}"
            }
            synthetic_users.append(user)
        
        return synthetic_users

    def auto_train_models(self):
        """Automatically train models with synthetic data"""
        try:
            # Generate synthetic training data silently
            synthetic_data = self.generate_synthetic_training_data(2000)
            
            # Train ML models silently
            result = self.train_models(synthetic_data)
            
            # Save trained models silently
            self.save_models()
            
            return {
                'status': 'success',
                'message': 'Models auto-trained successfully with synthetic data',
                'training_samples': len(synthetic_data),
                'logistic_accuracy': result.get('logistic_accuracy', 0),
                'random_forest_accuracy': result.get('random_forest_accuracy', 0)
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Auto-training failed: {str(e)}'
            }

def main():
    """Main function to handle command line arguments"""
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No command provided'}))
        return
    
    command = sys.argv[1]
    ml_service = BloodMatchingML()
    
    # Try to load existing models
    ml_service.load_models()
    
    if command == 'train':
        # Get training data from stdin
        input_data = json.loads(sys.stdin.read())
        users_data = input_data.get('users', [])
        result = ml_service.train_models(users_data)
        print(json.dumps(result))
        
    elif command == 'auto-train':
        # Automatically train with synthetic data
        result = ml_service.auto_train_models()
        print(json.dumps(result))
        
    elif command == 'predict':
        # Get prediction data from stdin
        input_data = json.loads(sys.stdin.read())
        donor_data = input_data.get('donor')
        requester_data = input_data.get('requester')
        result = ml_service.predict_compatibility(donor_data, requester_data)
        print(json.dumps(result))
        
    elif command == 'fraud':
        # Get user data for fraud detection
        input_data = json.loads(sys.stdin.read())
        user_data = input_data.get('user')
        result = ml_service.detect_fraud(user_data)
        print(json.dumps(result))
        
    elif command == 'match':
        # Find best matches
        input_data = json.loads(sys.stdin.read())
        requester_data = input_data.get('requester')
        donors_data = input_data.get('donors', [])
        max_matches = input_data.get('max_matches', 5)
        result = ml_service.find_best_matches(requester_data, donors_data, max_matches)
        print(json.dumps({'matches': result}))
        
    else:
        print(json.dumps({'error': f'Unknown command: {command}'}))

if __name__ == '__main__':
    main()
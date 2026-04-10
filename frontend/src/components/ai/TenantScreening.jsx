import React, { useState } from 'react';
import { aiService } from '../../services/aiService';

const TenantScreening = () => {
  const [tenantData, setTenantData] = useState({
    first_name: '',
    last_name: '',
    id_number: '',
    monthly_income: '',
    employment_years: '',
    age: '',
    current_address: '',
    employer_name: '',
    employer_phone: '',
    references: []
  });

  const [screening, setScreening] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTenantData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!tenantData.first_name) newErrors.first_name = 'First name is required';
    if (!tenantData.last_name) newErrors.last_name = 'Last name is required';
    if (!tenantData.id_number) newErrors.id_number = 'ID number is required';
    if (!tenantData.monthly_income || tenantData.monthly_income < 0) {
      newErrors.monthly_income = 'Valid monthly income is required';
    }
    if (!tenantData.employment_years || tenantData.employment_years < 0) {
      newErrors.employment_years = 'Valid employment years is required';
    }
    if (!tenantData.age || tenantData.age < 18) {
      newErrors.age = 'Valid age (18+) is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      const screeningData = await aiService.screenTenant(tenantData);
      setScreening(screeningData.screening);
    } catch (error) {
      console.error('Error in tenant screening:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#F44336';
      default: return '#666';
    }
  };

  const getCreditScoreColor = (score) => {
    if (score >= 750) return '#4CAF50';
    if (score >= 700) return '#8BC34A';
    if (score >= 650) return '#FF9800';
    if (score >= 600) return '#FF5722';
    return '#F44336';
  };

  return (
    <div className="tenant-screening">
      <div className="screening-header">
        <h2>AI-Powered Tenant Screening</h2>
        <p>Get comprehensive tenant analysis with AI insights</p>
      </div>

      {!screening ? (
        <div className="screening-form">
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Personal Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    value={tenantData.first_name}
                    onChange={handleInputChange}
                    className={errors.first_name ? 'error' : ''}
                  />
                  {errors.first_name && <span className="error-message">{errors.first_name}</span>}
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    value={tenantData.last_name}
                    onChange={handleInputChange}
                    className={errors.last_name ? 'error' : ''}
                  />
                  {errors.last_name && <span className="error-message">{errors.last_name}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>ID Number *</label>
                  <input
                    type="text"
                    name="id_number"
                    value={tenantData.id_number}
                    onChange={handleInputChange}
                    className={errors.id_number ? 'error' : ''}
                  />
                  {errors.id_number && <span className="error-message">{errors.id_number}</span>}
                </div>
                <div className="form-group">
                  <label>Age *</label>
                  <input
                    type="number"
                    name="age"
                    value={tenantData.age}
                    onChange={handleInputChange}
                    className={errors.age ? 'error' : ''}
                  />
                  {errors.age && <span className="error-message">{errors.age}</span>}
                </div>
              </div>
              <div className="form-group">
                <label>Current Address</label>
                <input
                  type="text"
                  name="current_address"
                  value={tenantData.current_address}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Financial Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Monthly Income (KES) *</label>
                  <input
                    type="number"
                    name="monthly_income"
                    value={tenantData.monthly_income}
                    onChange={handleInputChange}
                    className={errors.monthly_income ? 'error' : ''}
                  />
                  {errors.monthly_income && <span className="error-message">{errors.monthly_income}</span>}
                </div>
                <div className="form-group">
                  <label>Years at Current Job *</label>
                  <input
                    type="number"
                    name="employment_years"
                    value={tenantData.employment_years}
                    onChange={handleInputChange}
                    className={errors.employment_years ? 'error' : ''}
                  />
                  {errors.employment_years && <span className="error-message">{errors.employment_years}</span>}
                </div>
              </div>
              <div className="form-group">
                <label>Employer Name</label>
                <input
                  type="text"
                  name="employer_name"
                  value={tenantData.employer_name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Employer Phone</label>
                <input
                  type="tel"
                  name="employer_phone"
                  value={tenantData.employer_phone}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Analyzing...' : 'Run AI Screening'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setTenantData({})}>
                Clear Form
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="screening-results">
          <div className="results-header">
            <h3>Screening Results</h3>
            <button className="btn btn-secondary" onClick={() => setScreening(null)}>
              New Screening
            </button>
          </div>

          <div className="results-content">
            {/* Credit Score Section */}
            <div className="result-section">
              <h4>Credit Score Assessment</h4>
              <div className="score-display">
                <div 
                  className="score-circle"
                  style={{ borderColor: getCreditScoreColor(screening.credit_score) }}
                >
                  <span style={{ color: getCreditScoreColor(screening.credit_score) }}>
                    {screening.credit_score}
                  </span>
                </div>
                <div className="score-details">
                  <p>Credit Score: {screening.credit_score}</p>
                  <p>Rating: {
                    screening.credit_score >= 750 ? 'Excellent' :
                    screening.credit_score >= 700 ? 'Good' :
                    screening.credit_score >= 650 ? 'Fair' :
                    screening.credit_score >= 600 ? 'Poor' : 'Very Poor'
                  }</p>
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="result-section">
              <h4>Risk Assessment</h4>
              <div className="risk-display">
                <div 
                  className="risk-badge"
                  style={{ backgroundColor: getRiskLevelColor(screening.risk_assessment.risk_level) }}
                >
                  {screening.risk_assessment.risk_level.toUpperCase()} RISK
                </div>
                <div className="risk-details">
                  {screening.risk_assessment.risk_factors.map((factor, index) => (
                    <p key={index} className="risk-factor">- {factor}</p>
                  ))}
                </div>
                <div className="rent-recommendation">
                  <p><strong>Recommended Max Rent:</strong> KES {screening.risk_assessment.recommended_rent_ratio.recommended_max_rent.toLocaleString()}</p>
                  <p><strong>Rent-to-Income Ratio:</strong> {screening.risk_assessment.recommended_rent_ratio.rent_to_income_ratio.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Rental History */}
            <div className="result-section">
              <h4>Rental History Analysis</h4>
              {screening.rental_history.found ? (
                <div className="rental-history-found">
                  <div className="history-summary">
                    <div className="history-metric">
                      <span>Total Payments:</span>
                      <span>{screening.rental_history.total_payments}</span>
                    </div>
                    <div className="history-metric">
                      <span>Punctuality Rate:</span>
                      <span className={screening.rental_history.punctuality_rate >= 90 ? 'positive' : 'warning'}>
                        {screening.rental_history.punctuality_rate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="history-metric">
                      <span>Total Amount Paid:</span>
                      <span>KES {screening.rental_history.total_amount_paid.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rental-history-not-found">
                  <p>No rental history found in our system.</p>
                  <p className="warning">This requires manual verification of references.</p>
                </div>
              )}
            </div>

            {/* AI Recommendations */}
            <div className="result-section">
              <h4>AI Recommendations</h4>
              <div className="recommendations-list">
                {screening.recommendations.map((rec, index) => (
                  <div key={index} className={`recommendation ${rec.priority}`}>
                    <div className="recommendation-header">
                      <span className="rec-type">{rec.type}</span>
                      <span className={`rec-priority ${rec.priority}`}>{rec.priority}</span>
                    </div>
                    <p className="rec-message">{rec.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Decision Summary */}
            <div className="decision-summary">
              <h4>AI Decision Summary</h4>
              <div className="summary-content">
                <p>
                  Based on the analysis, this tenant has a <strong>{screening.risk_assessment.risk_level}</strong> risk profile 
                  with a credit score of <strong>{screening.credit_score}</strong>.
                </p>
                <p>
                  {screening.risk_assessment.risk_level === 'low' && 'This tenant appears to be a good candidate with stable financial background.'}
                  {screening.risk_assessment.risk_level === 'medium' && 'This tenant has some risk factors that should be carefully considered.'}
                  {screening.risk_assessment.risk_level === 'high' && 'This tenant presents significant risks and additional safeguards are recommended.'}
                </p>
                <div className="next-steps">
                  <h5>Recommended Next Steps:</h5>
                  <ul>
                    <li>Verify employment and income documentation</li>
                    <li>Contact provided references</li>
                    <li>Conduct background check</li>
                    {screening.risk_assessment.risk_level === 'high' && <li>Consider requiring additional security deposit or guarantor</li>}
                    {screening.risk_assessment.risk_level === 'medium' && <li>Consider shorter initial lease term</li>}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantScreening;

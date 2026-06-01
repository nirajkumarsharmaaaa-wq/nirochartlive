import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const BecomeModel = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    dob: '',
    bodyType: '',
    interests: '',
    idFront: null,
    idBack: null,
    selfie: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData({ ...formData, [name]: files[0] });
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

 const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Package the state into FormData
    const submissionData = new FormData();
    submissionData.append('email', formData.email);
    submissionData.append('password', formData.password);
    submissionData.append('displayName', formData.displayName);
    submissionData.append('dob', formData.dob);
    submissionData.append('bodyType', formData.bodyType);
    submissionData.append('interests', formData.interests);
    
    // Append the actual File objects
    submissionData.append('idFront', formData.idFront);
    submissionData.append('idBack', formData.idBack);
    submissionData.append('selfie', formData.selfie);

    try {
      // 2. Send the request to our FastAPI backend
      const response = await fetch('${import.meta.env.VITE_API_URL}/api/models/apply', {
        method: 'POST',
        body: submissionData, // fetch automatically sets the correct multipart/form-data headers
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Server Response:", result);
        nextStep(); // Move to the success screen
      } else {
        const errorData = await response.json();
        alert(
  typeof errorData.detail === "string"
    ? errorData.detail
    : JSON.stringify(errorData.detail, null, 2)
);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert("Network error. Please make sure the backend server is running.");
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center bg-gray-100 dark:bg-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-900 p-8 rounded-xl shadow-2xl">
        
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Become a Model
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Step {step} of 3
          </p>
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4 dark:bg-gray-700">
            <div className={`bg-purple-600 h-2.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : step >= 3 ? 'w-full' : ''}`}></div>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
          
          {/* STEP 1: Account Creation */}
          {step === 1 && (
            <div className="space-y-4 auto-animate">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                <input name="email" type="email" required onChange={handleChange} value={formData.email} className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-purple-500 focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <input name="password" type="password" required onChange={handleChange} value={formData.password} className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-purple-500 focus:border-purple-500" />
              </div>
              <button onClick={nextStep} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none">
                Next: Personal Details
              </button>
            </div>
          )}

          {/* STEP 2: Personal Details */}
          {step === 2 && (
            <div className="space-y-4 auto-animate">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
                <input name="displayName" type="text" required onChange={handleChange} value={formData.displayName} className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</label>
                <input name="dob" type="date" required onChange={handleChange} value={formData.dob} className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Body Type</label>
                <select name="bodyType" onChange={handleChange} value={formData.bodyType} className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                  <option value="">Select...</option>
                  <option value="petite">Petite</option>
                  <option value="athletic">Athletic</option>
                  <option value="curvy">Curvy</option>
                  <option value="slim">Slim</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Interests / Niche (Comma separated)</label>
                <input name="interests" type="text" placeholder="e.g., Gaming, Chatting, Music" onChange={handleChange} value={formData.interests} className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
              </div>
              <div className="flex space-x-4">
                <button onClick={prevStep} className="w-1/2 bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700">Back</button>
                <button onClick={nextStep} className="w-1/2 bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700">Next: Verification</button>
              </div>
            </div>
          )}

          {/* STEP 3: KYC Verification */}
          {step === 3 && (
            <div className="space-y-4 auto-animate">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ID Proof (Front)</label>
                <input type="file" name="idFront" accept="image/*" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ID Proof (Back)</label>
                <input type="file" name="idBack" accept="image/*" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Live Selfie</label>
                <input type="file" name="selfie" accept="image/*" capture="user" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
              </div>
              <div className="flex space-x-4 mt-6">
                <button onClick={prevStep} className="w-1/2 bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700">Back</button>
                <button onClick={handleSubmit} className="w-1/2 bg-green-600 text-white py-2 rounded-md hover:bg-green-700">Submit Details</button>
              </div>
            </div>
          )}

          {/* STEP 4: Success / Pending */}
          {step === 4 && (
            <div className="text-center space-y-4 py-8">
              <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">Application Received!</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Your details and ID proof have been sent to our admin team for verification. We will notify you via email once you are approved to go live.
              </p>
              <Link to="/" className="mt-4 inline-block bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700">
                Return to Home
              </Link>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default BecomeModel;
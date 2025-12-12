import React, { useState } from 'react';

function BloodCompatibilityChart() {
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('');

  const compatibilityData = {
    'A+': {
      canDonateTo: ['A+', 'AB+'],
      canReceiveFrom: ['A+', 'A-', 'O+', 'O-'],
      description: 'Can donate to A+ and AB+ recipients'
    },
    'A-': {
      canDonateTo: ['A+', 'A-', 'AB+', 'AB-'],
      canReceiveFrom: ['A-', 'O-'],
      description: 'Can donate to all A and AB blood groups'
    },
    'B+': {
      canDonateTo: ['B+', 'AB+'],
      canReceiveFrom: ['B+', 'B-', 'O+', 'O-'],
      description: 'Can donate to B+ and AB+ recipients'
    },
    'B-': {
      canDonateTo: ['B+', 'B-', 'AB+', 'AB-'],
      canReceiveFrom: ['B-', 'O-'],
      description: 'Can donate to all B and AB blood groups'
    },
    'AB+': {
      canDonateTo: ['AB+'],
      canReceiveFrom: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      description: 'Universal recipient - can receive from all blood groups'
    },
    'AB-': {
      canDonateTo: ['AB+', 'AB-'],
      canReceiveFrom: ['A-', 'B-', 'AB-', 'O-'],
      description: 'Can donate to AB+ and AB- recipients'
    },
    'O+': {
      canDonateTo: ['A+', 'B+', 'AB+', 'O+'],
      canReceiveFrom: ['O+', 'O-'],
      description: 'Can donate to all positive blood groups'
    },
    'O-': {
      canDonateTo: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      canReceiveFrom: ['O-'],
      description: 'Universal donor - can donate to all blood groups'
    }
  };

  const bloodGroups = Object.keys(compatibilityData);

  return (
    <div className="bg-white p-6 rounded shadow-md border border-red-200">
      <h2 className="text-xl font-semibold mb-4 text-red-700">Blood Group Compatibility Chart</h2>
      
      {/* Interactive Blood Group Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select your blood group to see compatibility:
        </label>
        <div className="grid grid-cols-4 gap-2">
          {bloodGroups.map(bg => (
            <button
              key={bg}
              onClick={() => setSelectedBloodGroup(bg)}
              className={`p-2 rounded border-2 transition-colors ${
                selectedBloodGroup === bg
                  ? 'border-red-600 bg-red-100 text-red-800'
                  : 'border-gray-300 hover:border-red-400'
              }`}
            >
              {bg}
            </button>
          ))}
        </div>
      </div>

      {/* Compatibility Details */}
      {selectedBloodGroup && (
        <div className="mb-6 p-4 bg-gray-50 rounded border">
          <h3 className="text-lg font-semibold text-red-700 mb-2">
            Blood Group {selectedBloodGroup}
          </h3>
          <p className="text-gray-600 mb-3">{compatibilityData[selectedBloodGroup].description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-green-700 mb-2">✓ Can Donate To:</h4>
              <div className="flex flex-wrap gap-1">
                {compatibilityData[selectedBloodGroup].canDonateTo.map(bg => (
                  <span key={bg} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                    {bg}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-blue-700 mb-2">✓ Can Receive From:</h4>
              <div className="flex flex-wrap gap-1">
                {compatibilityData[selectedBloodGroup].canReceiveFrom.map(bg => (
                  <span key={bg} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {bg}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Reference Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-red-100">
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Donor</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Recipients</th>
            </tr>
          </thead>
          <tbody>
            {bloodGroups.map(bg => (
              <tr key={bg} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2 font-semibold text-red-700">{bg}</td>
                <td className="border border-gray-300 px-3 py-2">
                  {compatibilityData[bg].canDonateTo.join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Important Notes */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-semibold text-yellow-800 mb-2">Important Notes:</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• O- donors are universal donors (can donate to all blood groups)</li>
          <li>• AB+ recipients are universal recipients (can receive from all blood groups)</li>
          <li>• Always consult medical professionals for actual donation compatibility</li>
          <li>• This chart is for educational purposes only</li>
        </ul>
      </div>
    </div>
  );
}

export default BloodCompatibilityChart; 
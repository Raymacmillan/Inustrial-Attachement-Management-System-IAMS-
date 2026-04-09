import React from 'react';

/**
 * @description A reusable visual indicator for password complexity.
 * @param {string} password - The current password string to evaluate.
 * @param {boolean} isFocused - Whether the parent input is currently active.
 */
export default function PasswordStrengthMeter({ password, isFocused }) {
  const getStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getStrength(password);
  

  const strengthColor = [
    "bg-gray-200", // Empty
    "bg-danger",   // Weak
    "bg-warning",  // Fair
    "bg-accent",   // Good
    "bg-success"   // Strong
  ];
  
  const strengthWidth = ["0%", "25%", "50%", "75%", "100%"];

 
  const isVisible = isFocused || password.length > 0;

  return (
    <div className={`space-y-2 transition-all duration-300 overflow-hidden ${
      isVisible ? 'max-h-20 opacity-100 mt-2' : 'max-h-0 opacity-0'
    }`}>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${strengthColor[strength]}`}
          style={{ width: strengthWidth[strength] }}
        />
      </div>
      
      <div className="flex justify-between text-[10px] sm:text-xs font-bold uppercase tracking-wider">
        <span className={strength >= 1 ? "text-success" : "text-gray-400"}>8+ Char</span>
        <span className={strength >= 2 ? "text-success" : "text-gray-400"}>Uppercase</span>
        <span className={strength >= 3 ? "text-success" : "text-gray-400"}>Number</span>
        <span className={strength >= 4 ? "text-success" : "text-gray-400"}>Symbol</span>
      </div>
    </div>
  );
}
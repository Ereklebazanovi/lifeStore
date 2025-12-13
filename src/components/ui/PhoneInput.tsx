import React, { useState, useEffect } from 'react';
import { Phone } from 'lucide-react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  required = false,
  className = '',
  placeholder = ''
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isValid, setIsValid] = useState(true);

  // Georgian mobile number patterns
  const patterns = [
    /^5\d{8}$/, // 5XXXXXXXX (9 digits)
    /^\+?995\s?5\d{8}$/, // +995 5XXXXXXXX or 995 5XXXXXXXX
  ];

  // Format phone number for display
  const formatPhoneNumber = (input: string): string => {
    // Remove all non-digits except +
    let cleaned = input.replace(/[^\d+]/g, '');

    // Handle country code scenarios
    if (cleaned.startsWith('+995')) {
      cleaned = cleaned.substring(4); // Remove +995
    } else if (cleaned.startsWith('995')) {
      cleaned = cleaned.substring(3); // Remove 995
    } else if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1); // Remove + if not followed by 995
    }

    // Ensure it starts with 5 (Georgian mobile prefix)
    if (cleaned.length > 0 && !cleaned.startsWith('5')) {
      if (cleaned.length === 8 && /^[0-9]/.test(cleaned)) {
        cleaned = '5' + cleaned; // Add 5 prefix if missing
      }
    }

    // Limit to 9 digits max
    if (cleaned.length > 9) {
      cleaned = cleaned.substring(0, 9);
    }

    // Format as 5XX XX XX XX
    if (cleaned.length >= 1) {
      let formatted = cleaned[0]; // First digit (should be 5)

      if (cleaned.length > 1) {
        formatted += cleaned.substring(1, 3); // Next 2 digits
      }
      if (cleaned.length > 3) {
        formatted += ' ' + cleaned.substring(3, 5); // Space + next 2 digits
      }
      if (cleaned.length > 5) {
        formatted += ' ' + cleaned.substring(5, 7); // Space + next 2 digits
      }
      if (cleaned.length > 7) {
        formatted += ' ' + cleaned.substring(7, 9); // Space + last 2 digits
      }

      return formatted;
    }

    return cleaned;
  };

  // Validate Georgian mobile number
  const validatePhoneNumber = (phoneNumber: string): boolean => {
    if (!phoneNumber) return true; // Empty is valid (unless required)

    // Clean the number for validation
    const cleaned = phoneNumber.replace(/\s/g, '');

    // Check if it matches Georgian mobile patterns
    return patterns.some(pattern => pattern.test(cleaned)) ||
           /^5\d{8}$/.test(cleaned); // Basic 5XXXXXXXX format
  };

  // Get clean phone number (remove formatting)
  const getCleanPhoneNumber = (formatted: string): string => {
    const cleaned = formatted.replace(/\s/g, '');

    // Ensure it starts with 5 and is 9 digits
    if (cleaned.length === 9 && cleaned.startsWith('5')) {
      return cleaned;
    }

    return formatted.replace(/\s/g, ''); // Return as-is if not standard format
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatPhoneNumber(inputValue);
    const cleanNumber = getCleanPhoneNumber(formatted);
    const valid = validatePhoneNumber(cleanNumber);

    setDisplayValue(formatted);
    setIsValid(valid);
    onChange(cleanNumber); // Send clean number to parent
  };

  // Update display value when prop value changes
  useEffect(() => {
    if (value !== getCleanPhoneNumber(displayValue)) {
      setDisplayValue(formatPhoneNumber(value));
      setIsValid(validatePhoneNumber(value));
    }
  }, [value]);

  // Get placeholder text
  const getPlaceholder = (): string => {
    if (placeholder) return placeholder;
    return '555 12 34 567';
  };

  // Get border color based on validation
  const getBorderColor = (): string => {
    if (!displayValue) return 'border-stone-300 focus:border-emerald-500';
    if (isValid) return 'border-emerald-300 focus:border-emerald-500';
    return 'border-red-300 focus:border-red-500';
  };

  return (
    <div className="relative">
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="tel"
          value={displayValue}
          onChange={handleInputChange}
          required={required}
          className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all ${getBorderColor()} ${className}`}
          placeholder={getPlaceholder()}
          maxLength={12} // Max formatted length: "555 12 34 567" (9 digits + 3 spaces)
        />

        {/* Country code indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-500 bg-stone-100 px-2 py-1 rounded">
          🇬🇪 +995
        </div>
      </div>

      {/* Validation feedback */}
      {!isValid && displayValue && (
        <p className="mt-1 text-sm text-red-600">
          გთხოვთ ჩაწეროთ სწორი ქართული მობილურის ნომერი (მაგ: 555 12 34 56)
        </p>
      )}

      {/* Helper text */}
      {!displayValue && (
        <p className="mt-1 text-xs text-stone-500">
          ქართული მობილურის ნომერი (5XX XX XX XX ფორმატში)
        </p>
      )}
    </div>
  );
};

export default PhoneInput;
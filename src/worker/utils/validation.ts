// Validation utilities for consistent input validation
import { ErrorHandler, ErrorType } from './database';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class Validator {
  // Email validation
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    
    if (!email) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Invalid email format');
    }
    
    return { valid: errors.length === 0, errors };
  }

  // Password validation
  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    
    if (!password) {
      errors.push('Password is required');
    } else {
      if (password.length < 6) {
        errors.push('Password must be at least 6 characters long');
      }
      if (password.length > 128) {
        errors.push('Password must be less than 128 characters');
      }
    }
    
    return { valid: errors.length === 0, errors };
  }

  // Username validation
  static validateUsername(username: string): ValidationResult {
    const errors: string[] = [];
    
    if (!username) {
      errors.push('Username is required');
    } else {
      if (username.trim().length < 2) {
        errors.push('Username must be at least 2 characters long');
      }
      if (username.length > 50) {
        errors.push('Username must be less than 50 characters');
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        errors.push('Username can only contain letters, numbers, underscores, and hyphens');
      }
    }
    
    return { valid: errors.length === 0, errors };
  }

  // Contact validation
  static validateContact(contact: any): ValidationResult {
    const errors: string[] = [];
    
    // At least one of first_name, last_name, or email is required
    if (!contact.first_name && !contact.last_name && !contact.email) {
      errors.push('At least one of first_name, last_name, or email is required');
    }
    
    // Validate email if provided
    if (contact.email) {
      const emailValidation = this.validateEmail(contact.email);
      if (!emailValidation.valid) {
        errors.push(...emailValidation.errors);
      }
    }
    
    // Validate phone if provided
    if (contact.phone && !/^[\d\s+()-]{10,}$/.test(contact.phone)) {
      errors.push('Invalid phone format');
    }
    
    // Validate URLs if provided
    const urlFields = ['website', 'linkedin', 'twitter', 'facebook', 'instagram'];
    urlFields.forEach(field => {
      if (contact[field]) {
        try {
          new URL(contact[field]);
        } catch {
          errors.push(`Invalid URL for ${field}`);
        }
      }
    });
    
    // Validate string lengths
    const stringFields = {
      first_name: 100,
      last_name: 100,
      email: 100,
      phone: 15,
      company: 255,
      job_title: 255,
      address_street: 255,
      address_city: 100,
      address_state: 100,
      address_zip: 20,
      address_country: 100
    };
    
    Object.entries(stringFields).forEach(([field, maxLength]) => {
      if (contact[field] && contact[field].length > maxLength) {
        errors.push(`${field} must be less than ${maxLength} characters`);
      }
    });
    
    return { valid: errors.length === 0, errors };
  }

  // Group validation
  static validateGroup(group: any): ValidationResult {
    const errors: string[] = [];
    
    if (!group.name || group.name.trim().length === 0) {
      errors.push('Group name is required');
    } else if (group.name.length > 100) {
      errors.push('Group name must be less than 100 characters');
    }
    
    if (group.description && group.description.length > 1000) {
      errors.push('Group description must be less than 1000 characters');
    }
    
    return { valid: errors.length === 0, errors };
  }

  // File validation
  static validateFile(file: File, allowedTypes: string[], maxSizeMB: number = 5): ValidationResult {
    const errors: string[] = [];
    
    if (!file) {
      errors.push('File is required');
      return { valid: false, errors };
    }
    
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }
    
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${maxSizeMB}MB`);
    }
    
    return { valid: errors.length === 0, errors };
  }

  // ID validation
  static validateId(id: any, fieldName: string = 'ID'): ValidationResult {
    const errors: string[] = [];
    
    const numId = parseInt(id);
    if (isNaN(numId) || numId <= 0) {
      errors.push(`Invalid ${fieldName}`);
    }
    
    return { valid: errors.length === 0, errors };
  }

  // Array validation
  static validateArray(arr: any, fieldName: string, minLength: number = 1): ValidationResult {
    const errors: string[] = [];
    
    if (!Array.isArray(arr)) {
      errors.push(`${fieldName} must be an array`);
    } else if (arr.length < minLength) {
      errors.push(`${fieldName} must contain at least ${minLength} item(s)`);
    }
    
    return { valid: errors.length === 0, errors };
  }

  // Combine multiple validation results
  static combineValidations(...validations: ValidationResult[]): ValidationResult {
    const allErrors = validations.flatMap(v => v.errors);
    return { valid: allErrors.length === 0, errors: allErrors };
  }

  // Create validation error response
  static createValidationErrorResponse(validation: ValidationResult) {
    return ErrorHandler.validationError('Validation failed', validation.errors);
  }
}

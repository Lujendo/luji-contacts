import { Contact } from '../types';

export interface DuplicateMatch {
  contact1: Contact;
  contact2: Contact;
  similarity: number;
  reasons: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface DuplicateGroup {
  contacts: Contact[];
  primaryContact: Contact;
  duplicates: Contact[];
  totalSimilarity: number;
  reasons: string[];
}

/**
 * Smart duplicate detection utility with fuzzy matching and phone normalization
 */
export class DuplicateDetector {
  
  /**
   * Find all potential duplicate contacts
   */
  static findDuplicates(contacts: Contact[]): DuplicateMatch[] {
    const matches: DuplicateMatch[] = [];
    
    for (let i = 0; i < contacts.length; i++) {
      for (let j = i + 1; j < contacts.length; j++) {
        const match = this.compareContacts(contacts[i], contacts[j]);
        if (match.similarity > 0.6) { // 60% similarity threshold
          matches.push(match);
        }
      }
    }
    
    // Sort by similarity score (highest first)
    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Group duplicates together
   */
  static groupDuplicates(contacts: Contact[]): DuplicateGroup[] {
    const matches = this.findDuplicates(contacts);
    const groups: DuplicateGroup[] = [];
    const processed = new Set<number>();

    for (const match of matches) {
      if (processed.has(match.contact1.id) || processed.has(match.contact2.id)) {
        continue;
      }

      // Find all contacts similar to these two
      const groupContacts = [match.contact1, match.contact2];
      const groupReasons = [...match.reasons];
      let totalSimilarity = match.similarity;

      // Mark as processed
      processed.add(match.contact1.id);
      processed.add(match.contact2.id);

      // Look for additional similar contacts
      for (const contact of contacts) {
        if (processed.has(contact.id)) continue;

        const sim1 = this.compareContacts(contact, match.contact1);
        const sim2 = this.compareContacts(contact, match.contact2);
        
        if (sim1.similarity > 0.6 || sim2.similarity > 0.6) {
          groupContacts.push(contact);
          totalSimilarity += Math.max(sim1.similarity, sim2.similarity);
          groupReasons.push(...(sim1.similarity > sim2.similarity ? sim1.reasons : sim2.reasons));
          processed.add(contact.id);
        }
      }

      if (groupContacts.length >= 2) {
        // Choose primary contact (most complete information)
        const primaryContact = this.selectPrimaryContact(groupContacts);
        const duplicates = groupContacts.filter(c => c.id !== primaryContact.id);

        groups.push({
          contacts: groupContacts,
          primaryContact,
          duplicates,
          totalSimilarity: totalSimilarity / groupContacts.length,
          reasons: [...new Set(groupReasons)] // Remove duplicates
        });
      }
    }

    return groups.sort((a, b) => b.totalSimilarity - a.totalSimilarity);
  }

  /**
   * Compare two contacts and return similarity score
   */
  static compareContacts(contact1: Contact, contact2: Contact): DuplicateMatch {
    const reasons: string[] = [];
    let totalScore = 0;
    let maxScore = 0;

    // Name similarity (weight: 40%)
    const nameScore = this.compareNames(contact1, contact2);
    if (nameScore.score > 0) {
      totalScore += nameScore.score * 0.4;
      reasons.push(...nameScore.reasons);
    }
    maxScore += 0.4;

    // Phone similarity (weight: 35%)
    const phoneScore = this.comparePhones(contact1.phone, contact2.phone);
    if (phoneScore.score > 0) {
      totalScore += phoneScore.score * 0.35;
      reasons.push(...phoneScore.reasons);
    }
    maxScore += 0.35;

    // Email similarity (weight: 25%)
    const emailScore = this.compareEmails(contact1.email, contact2.email);
    if (emailScore.score > 0) {
      totalScore += emailScore.score * 0.25;
      reasons.push(...emailScore.reasons);
    }
    maxScore += 0.25;

    const similarity = maxScore > 0 ? totalScore / maxScore : 0;
    
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (similarity >= 0.85) confidence = 'high';
    else if (similarity >= 0.7) confidence = 'medium';

    return {
      contact1,
      contact2,
      similarity,
      reasons,
      confidence
    };
  }

  /**
   * Compare names using fuzzy matching
   */
  private static compareNames(contact1: Contact, contact2: Contact): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;

    const name1 = this.normalizeName(contact1.first_name, contact1.last_name);
    const name2 = this.normalizeName(contact2.first_name, contact2.last_name);

    if (!name1 || !name2) return { score: 0, reasons: [] };

    // Exact match
    if (name1 === name2) {
      score = 1.0;
      reasons.push('Exact name match');
      return { score, reasons };
    }

    // Fuzzy match using Levenshtein distance
    const similarity = this.calculateStringSimilarity(name1, name2);
    if (similarity > 0.8) {
      score = similarity;
      reasons.push(`Similar names (${Math.round(similarity * 100)}% match)`);
    }

    // Check individual name components
    const firstName1 = this.normalizeString(contact1.first_name);
    const lastName1 = this.normalizeString(contact1.last_name);
    const firstName2 = this.normalizeString(contact2.first_name);
    const lastName2 = this.normalizeString(contact2.last_name);

    // First name matches
    if (firstName1 && firstName2 && this.calculateStringSimilarity(firstName1, firstName2) > 0.8) {
      score = Math.max(score, 0.7);
      reasons.push('Similar first names');
    }

    // Last name matches
    if (lastName1 && lastName2 && this.calculateStringSimilarity(lastName1, lastName2) > 0.8) {
      score = Math.max(score, 0.7);
      reasons.push('Similar last names');
    }

    // Name reversal (John Smith vs Smith John)
    const reversed1 = `${lastName1} ${firstName1}`.trim();
    const reversed2 = `${lastName2} ${firstName2}`.trim();
    if (reversed1 && reversed2 && this.calculateStringSimilarity(name1, reversed2) > 0.8) {
      score = Math.max(score, 0.8);
      reasons.push('Names appear reversed');
    }

    return { score, reasons };
  }

  /**
   * Compare phone numbers with international format normalization
   */
  private static comparePhones(phone1?: string, phone2?: string): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    
    if (!phone1 || !phone2) return { score: 0, reasons: [] };

    const normalized1 = this.normalizePhoneNumber(phone1);
    const normalized2 = this.normalizePhoneNumber(phone2);

    if (!normalized1 || !normalized2) return { score: 0, reasons: [] };

    // Exact match after normalization
    if (normalized1 === normalized2) {
      reasons.push('Identical phone numbers');
      return { score: 1.0, reasons };
    }

    // Check if one is a subset of the other (international vs local format)
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      reasons.push('Phone numbers match (different formats)');
      return { score: 0.9, reasons };
    }

    // Check last 7 digits (US local number)
    const last7_1 = normalized1.slice(-7);
    const last7_2 = normalized2.slice(-7);
    if (last7_1.length === 7 && last7_2.length === 7 && last7_1 === last7_2) {
      reasons.push('Same local phone number');
      return { score: 0.8, reasons };
    }

    // Check last 10 digits (US number without country code)
    const last10_1 = normalized1.slice(-10);
    const last10_2 = normalized2.slice(-10);
    if (last10_1.length === 10 && last10_2.length === 10 && last10_1 === last10_2) {
      reasons.push('Same phone number (different country codes)');
      return { score: 0.85, reasons };
    }

    return { score: 0, reasons: [] };
  }

  /**
   * Compare email addresses
   */
  private static compareEmails(email1?: string, email2?: string): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    
    if (!email1 || !email2) return { score: 0, reasons: [] };

    const normalized1 = email1.toLowerCase().trim();
    const normalized2 = email2.toLowerCase().trim();

    // Exact match
    if (normalized1 === normalized2) {
      reasons.push('Identical email addresses');
      return { score: 1.0, reasons };
    }

    // Same domain, similar username
    const [user1, domain1] = normalized1.split('@');
    const [user2, domain2] = normalized2.split('@');

    if (domain1 === domain2) {
      const userSimilarity = this.calculateStringSimilarity(user1, user2);
      if (userSimilarity > 0.8) {
        reasons.push(`Similar email addresses on same domain (${Math.round(userSimilarity * 100)}% match)`);
        return { score: userSimilarity * 0.9, reasons };
      }
    }

    return { score: 0, reasons: [] };
  }

  /**
   * Select the primary contact from a group (most complete information)
   */
  private static selectPrimaryContact(contacts: Contact[]): Contact {
    return contacts.reduce((primary, current) => {
      const primaryScore = this.calculateCompletenessScore(primary);
      const currentScore = this.calculateCompletenessScore(current);
      return currentScore > primaryScore ? current : primary;
    });
  }

  /**
   * Calculate completeness score for a contact
   */
  private static calculateCompletenessScore(contact: Contact): number {
    let score = 0;
    const fields = [
      'first_name', 'last_name', 'email', 'phone', 'company', 'job_title',
      'address_street', 'address_city', 'address_state', 'website', 'notes'
    ];

    fields.forEach(field => {
      if (contact[field as keyof Contact]) score += 1;
    });

    return score;
  }

  /**
   * Normalize name for comparison
   */
  private static normalizeName(firstName?: string, lastName?: string): string {
    const first = this.normalizeString(firstName);
    const last = this.normalizeString(lastName);
    return `${first} ${last}`.trim();
  }

  /**
   * Normalize string for comparison
   */
  private static normalizeString(str?: string): string {
    if (!str) return '';
    return str.toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Normalize phone number for comparison
   */
  private static normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Handle common formats
    if (digits.length === 10) {
      // US number without country code
      return `1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      // US number with country code
      return digits;
    } else if (digits.length > 11) {
      // International number
      return digits;
    }
    
    return digits;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private static calculateStringSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;

    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,     // deletion
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i - 1] + cost // substitution
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len2][len1]) / maxLen;
  }

  /**
   * Find duplicates with specific criteria
   */
  static findDuplicatesByName(contacts: Contact[], threshold: number = 0.8): DuplicateMatch[] {
    const matches: DuplicateMatch[] = [];

    for (let i = 0; i < contacts.length; i++) {
      for (let j = i + 1; j < contacts.length; j++) {
        const nameComparison = this.compareNames(contacts[i], contacts[j]);
        if (nameComparison.score >= threshold) {
          matches.push({
            contact1: contacts[i],
            contact2: contacts[j],
            similarity: nameComparison.score,
            reasons: nameComparison.reasons,
            confidence: nameComparison.score >= 0.9 ? 'high' : nameComparison.score >= 0.8 ? 'medium' : 'low'
          });
        }
      }
    }

    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Find duplicates by phone number
   */
  static findDuplicatesByPhone(contacts: Contact[], threshold: number = 0.8): DuplicateMatch[] {
    const matches: DuplicateMatch[] = [];

    for (let i = 0; i < contacts.length; i++) {
      for (let j = i + 1; j < contacts.length; j++) {
        if (!contacts[i].phone || !contacts[j].phone) continue;

        const phoneComparison = this.comparePhones(contacts[i].phone, contacts[j].phone);
        if (phoneComparison.score >= threshold) {
          matches.push({
            contact1: contacts[i],
            contact2: contacts[j],
            similarity: phoneComparison.score,
            reasons: phoneComparison.reasons,
            confidence: phoneComparison.score >= 0.9 ? 'high' : phoneComparison.score >= 0.8 ? 'medium' : 'low'
          });
        }
      }
    }

    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Find duplicates by email
   */
  static findDuplicatesByEmail(contacts: Contact[], threshold: number = 0.9): DuplicateMatch[] {
    const matches: DuplicateMatch[] = [];

    for (let i = 0; i < contacts.length; i++) {
      for (let j = i + 1; j < contacts.length; j++) {
        if (!contacts[i].email || !contacts[j].email) continue;

        const emailComparison = this.compareEmails(contacts[i].email, contacts[j].email);
        if (emailComparison.score >= threshold) {
          matches.push({
            contact1: contacts[i],
            contact2: contacts[j],
            similarity: emailComparison.score,
            reasons: emailComparison.reasons,
            confidence: emailComparison.score >= 0.95 ? 'high' : 'medium'
          });
        }
      }
    }

    return matches.sort((a, b) => b.similarity - a.similarity);
  }
}

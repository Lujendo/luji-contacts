// vCard Parser Utility
// Supports vCard 2.1, 3.0, and 4.0 formats
// Handles Apple Contacts exported .vcf files

export interface ParsedVCard {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  birthday?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  address_country?: string;
  notes?: string;
  // Additional fields for multiple values
  emails?: string[];
  phones?: string[];
  websites?: string[];
}

export interface VCardParseResult {
  contacts: ParsedVCard[];
  errors: string[];
  totalCards: number;
  successfulCards: number;
}

export class VCardParser {
  private static unfoldLines(content: string): string[] {
    // Unfold lines according to vCard specification
    // Lines that start with space or tab are continuations
    const lines = content.split(/\r?\n/);
    const unfoldedLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Check if next lines are continuations
      while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
        i++;
        line += lines[i].substring(1); // Remove the leading space/tab
      }
      
      if (line.trim()) {
        unfoldedLines.push(line.trim());
      }
    }
    
    return unfoldedLines;
  }

  private static parseProperty(line: string): { name: string; params: Record<string, string>; value: string } {
    // Parse a vCard property line: PROPERTY;PARAM=VALUE:DATA
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) {
      return { name: '', params: {}, value: line };
    }

    const propertyPart = line.substring(0, colonIndex);
    const value = line.substring(colonIndex + 1);

    const semicolonIndex = propertyPart.indexOf(';');
    let name: string;
    let params: Record<string, string> = {};

    if (semicolonIndex === -1) {
      name = propertyPart.toUpperCase();
    } else {
      name = propertyPart.substring(0, semicolonIndex).toUpperCase();
      const paramString = propertyPart.substring(semicolonIndex + 1);
      
      // Parse parameters
      const paramPairs = paramString.split(';');
      for (const pair of paramPairs) {
        const equalIndex = pair.indexOf('=');
        if (equalIndex !== -1) {
          const paramName = pair.substring(0, equalIndex).toLowerCase();
          const paramValue = pair.substring(equalIndex + 1).toLowerCase();
          params[paramName] = paramValue;
        } else {
          // Parameter without value (like PREF)
          params[pair.toLowerCase()] = 'true';
        }
      }
    }

    return { name, params, value };
  }

  private static parseStructuredName(value: string): { first_name?: string; last_name?: string } {
    // Parse N property: Family;Given;Additional;Prefix;Suffix
    const parts = value.split(';');
    return {
      last_name: parts[0] || undefined,
      first_name: parts[1] || undefined
    };
  }

  private static parseAddress(value: string): {
    address_street?: string;
    address_city?: string;
    address_state?: string;
    address_zip?: string;
    address_country?: string;
  } {
    // Parse ADR property: POBox;ExtendedAddress;Street;City;State;PostalCode;Country
    const parts = value.split(';');
    
    // Combine POBox, ExtendedAddress, and Street for street address
    const streetParts = [parts[0], parts[1], parts[2]].filter(p => p && p.trim());
    
    return {
      address_street: streetParts.length > 0 ? streetParts.join(', ').replace(/\\,/g, ',') : undefined,
      address_city: parts[3] || undefined,
      address_state: parts[4] || undefined,
      address_zip: parts[5] || undefined,
      address_country: parts[6] || undefined
    };
  }

  private static extractSocialMedia(url: string): { platform?: string; value?: string } {
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.includes('linkedin.com')) {
      return { platform: 'linkedin', value: url };
    } else if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
      return { platform: 'twitter', value: url };
    } else if (lowerUrl.includes('facebook.com')) {
      return { platform: 'facebook', value: url };
    } else if (lowerUrl.includes('instagram.com')) {
      return { platform: 'instagram', value: url };
    }
    
    return { platform: 'website', value: url };
  }

  private static parseDate(value: string): string | undefined {
    // Parse various date formats and convert to YYYY-MM-DD
    if (!value) return undefined;
    
    // Remove any time components and clean up
    const dateOnly = value.split('T')[0].replace(/[^\d-]/g, '');
    
    // Handle different formats
    if (dateOnly.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateOnly; // Already in correct format
    } else if (dateOnly.match(/^\d{4}\d{2}\d{2}$/)) {
      // YYYYMMDD format
      return `${dateOnly.substring(0, 4)}-${dateOnly.substring(4, 6)}-${dateOnly.substring(6, 8)}`;
    }
    
    return undefined;
  }

  public static parseVCard(content: string): VCardParseResult {
    const result: VCardParseResult = {
      contacts: [],
      errors: [],
      totalCards: 0,
      successfulCards: 0
    };

    try {
      const lines = this.unfoldLines(content);
      let currentCard: ParsedVCard | null = null;
      let inCard = false;

      for (const line of lines) {
        const { name, params, value } = this.parseProperty(line);

        if (name === 'BEGIN' && value.toUpperCase() === 'VCARD') {
          inCard = true;
          currentCard = { emails: [], phones: [], websites: [] };
          result.totalCards++;
        } else if (name === 'END' && value.toUpperCase() === 'VCARD') {
          if (currentCard && inCard) {
            // Set primary values from arrays
            if (currentCard.emails && currentCard.emails.length > 0) {
              currentCard.email = currentCard.emails[0];
            }
            if (currentCard.phones && currentCard.phones.length > 0) {
              currentCard.phone = currentCard.phones[0];
            }
            if (currentCard.websites && currentCard.websites.length > 0) {
              currentCard.website = currentCard.websites[0];
            }

            result.contacts.push(currentCard);
            result.successfulCards++;
          }
          inCard = false;
          currentCard = null;
        } else if (inCard && currentCard) {
          // Parse vCard properties
          switch (name) {
            case 'N':
              const nameData = this.parseStructuredName(value);
              Object.assign(currentCard, nameData);
              break;

            case 'FN':
              // If we don't have first/last name from N, try to parse from FN
              if (!currentCard.first_name && !currentCard.last_name) {
                const nameParts = value.split(' ');
                if (nameParts.length >= 2) {
                  currentCard.first_name = nameParts[0];
                  currentCard.last_name = nameParts.slice(1).join(' ');
                } else {
                  currentCard.first_name = value;
                }
              }
              break;

            case 'EMAIL':
              if (currentCard.emails) {
                currentCard.emails.push(value);
              }
              break;

            case 'TEL':
              if (currentCard.phones) {
                currentCard.phones.push(value);
              }
              break;

            case 'ORG':
              currentCard.company = value.split(';')[0]; // First part is organization
              break;

            case 'TITLE':
              currentCard.job_title = value;
              break;

            case 'ADR':
              const addressData = this.parseAddress(value);
              Object.assign(currentCard, addressData);
              break;

            case 'URL':
              if (currentCard.websites) {
                currentCard.websites.push(value);
              }
              const socialData = this.extractSocialMedia(value);
              if (socialData.platform && socialData.value) {
                (currentCard as any)[socialData.platform] = socialData.value;
              }
              break;

            case 'BDAY':
              currentCard.birthday = this.parseDate(value);
              break;

            case 'NOTE':
              currentCard.notes = value.replace(/\\n/g, '\n').replace(/\\,/g, ',');
              break;

            // Handle item-based properties (Apple Contacts format)
            default:
              if (name.startsWith('ITEM') && name.includes('.URL')) {
                if (currentCard.websites) {
                  currentCard.websites.push(value);
                }
                const socialData = this.extractSocialMedia(value);
                if (socialData.platform && socialData.value) {
                  (currentCard as any)[socialData.platform] = socialData.value;
                }
              } else if (name.startsWith('ITEM') && name.includes('.EMAIL')) {
                if (currentCard.emails) {
                  currentCard.emails.push(value);
                }
              }
              break;
          }
        }
      }

    } catch (error) {
      result.errors.push(`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }
}

// vCard Export Utility
export class VCardExporter {
  public static exportToVCard(contacts: ParsedVCard[]): string {
    const vCards: string[] = [];

    for (const contact of contacts) {
      const vCardLines: string[] = [];

      // Start vCard
      vCardLines.push('BEGIN:VCARD');
      vCardLines.push('VERSION:3.0');

      // Name (N and FN)
      const lastName = contact.last_name || '';
      const firstName = contact.first_name || '';
      vCardLines.push(`N:${lastName};${firstName};;;`);

      const fullName = [firstName, lastName].filter(n => n).join(' ') || 'Unknown';
      vCardLines.push(`FN:${fullName}`);

      // Organization
      if (contact.company) {
        vCardLines.push(`ORG:${contact.company}`);
      }

      // Title
      if (contact.job_title) {
        vCardLines.push(`TITLE:${contact.job_title}`);
      }

      // Emails
      if (contact.emails && contact.emails.length > 0) {
        contact.emails.forEach((email, index) => {
          if (index === 0) {
            vCardLines.push(`EMAIL;type=INTERNET;type=pref:${email}`);
          } else {
            vCardLines.push(`EMAIL;type=INTERNET:${email}`);
          }
        });
      } else if (contact.email) {
        vCardLines.push(`EMAIL;type=INTERNET;type=pref:${contact.email}`);
      }

      // Phones
      if (contact.phones && contact.phones.length > 0) {
        contact.phones.forEach((phone, index) => {
          if (index === 0) {
            vCardLines.push(`TEL;type=CELL;type=VOICE;type=pref:${phone}`);
          } else {
            vCardLines.push(`TEL;type=VOICE:${phone}`);
          }
        });
      } else if (contact.phone) {
        vCardLines.push(`TEL;type=CELL;type=VOICE;type=pref:${contact.phone}`);
      }

      // Address
      if (contact.address_street || contact.address_city || contact.address_state || contact.address_zip || contact.address_country) {
        const addressParts = [
          '', // POBox
          '', // Extended Address
          contact.address_street || '',
          contact.address_city || '',
          contact.address_state || '',
          contact.address_zip || '',
          contact.address_country || ''
        ];
        vCardLines.push(`ADR;type=HOME:${addressParts.join(';')}`);
      }

      // URLs/Websites
      if (contact.websites && contact.websites.length > 0) {
        contact.websites.forEach((website, index) => {
          vCardLines.push(`URL:${website}`);
        });
      } else if (contact.website) {
        vCardLines.push(`URL:${contact.website}`);
      }

      // Social Media
      if (contact.linkedin) {
        vCardLines.push(`URL:${contact.linkedin}`);
      }
      if (contact.twitter) {
        vCardLines.push(`URL:${contact.twitter}`);
      }
      if (contact.facebook) {
        vCardLines.push(`URL:${contact.facebook}`);
      }
      if (contact.instagram) {
        vCardLines.push(`URL:${contact.instagram}`);
      }

      // Birthday
      if (contact.birthday) {
        vCardLines.push(`BDAY:${contact.birthday}`);
      }

      // Notes
      if (contact.notes) {
        const escapedNotes = contact.notes.replace(/\n/g, '\\n').replace(/,/g, '\\,');
        vCardLines.push(`NOTE:${escapedNotes}`);
      }

      // End vCard
      vCardLines.push('END:VCARD');

      vCards.push(vCardLines.join('\r\n'));
    }

    return vCards.join('\r\n\r\n');
  }
}

export default VCardParser;

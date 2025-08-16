import { Contact } from '../types';

export interface MobileActionResult {
  success: boolean;
  message: string;
  action: string;
}

/**
 * Utility functions for mobile device actions like calling, texting, and emailing
 */
export class MobileActions {
  /**
   * Initiate a phone call to the contact
   */
  static call(contact: Contact): MobileActionResult {
    if (!contact.phone) {
      return {
        success: false,
        message: 'No phone number available for this contact',
        action: 'call'
      };
    }

    try {
      // Clean phone number for tel: protocol
      const cleanPhone = contact.phone.replace(/\D/g, '');
      const telUrl = `tel:${cleanPhone}`;
      
      // Open phone dialer
      window.location.href = telUrl;
      
      return {
        success: true,
        message: `Calling ${contact.first_name} ${contact.last_name}`,
        action: 'call'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Unable to initiate call',
        action: 'call'
      };
    }
  }

  /**
   * Send SMS to the contact
   */
  static sms(contact: Contact, message?: string): MobileActionResult {
    if (!contact.phone) {
      return {
        success: false,
        message: 'No phone number available for this contact',
        action: 'sms'
      };
    }

    try {
      // Clean phone number for sms: protocol
      const cleanPhone = contact.phone.replace(/\D/g, '');
      let smsUrl = `sms:${cleanPhone}`;
      
      // Add message body if provided
      if (message) {
        smsUrl += `?body=${encodeURIComponent(message)}`;
      }
      
      // Open SMS app
      window.location.href = smsUrl;
      
      return {
        success: true,
        message: `Opening SMS to ${contact.first_name} ${contact.last_name}`,
        action: 'sms'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Unable to open SMS',
        action: 'sms'
      };
    }
  }

  /**
   * Send email to the contact
   */
  static email(contact: Contact, subject?: string, body?: string): MobileActionResult {
    if (!contact.email) {
      return {
        success: false,
        message: 'No email address available for this contact',
        action: 'email'
      };
    }

    try {
      let mailtoUrl = `mailto:${contact.email}`;
      const params: string[] = [];
      
      if (subject) {
        params.push(`subject=${encodeURIComponent(subject)}`);
      }
      
      if (body) {
        params.push(`body=${encodeURIComponent(body)}`);
      }
      
      if (params.length > 0) {
        mailtoUrl += `?${params.join('&')}`;
      }
      
      // Open email client
      window.location.href = mailtoUrl;
      
      return {
        success: true,
        message: `Opening email to ${contact.first_name} ${contact.last_name}`,
        action: 'email'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Unable to open email client',
        action: 'email'
      };
    }
  }

  /**
   * Share contact information using Web Share API or fallback
   */
  static async share(contact: Contact): Promise<MobileActionResult> {
    const contactText = this.formatContactForSharing(contact);
    
    // Try Web Share API first (mobile browsers)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${contact.first_name} ${contact.last_name}`,
          text: contactText,
        });
        
        return {
          success: true,
          message: 'Contact shared successfully',
          action: 'share'
        };
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name === 'AbortError') {
          return {
            success: false,
            message: 'Share cancelled',
            action: 'share'
          };
        }
      }
    }
    
    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(contactText);
      return {
        success: true,
        message: 'Contact information copied to clipboard',
        action: 'share'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Unable to share contact',
        action: 'share'
      };
    }
  }

  /**
   * Open contact's address in maps app
   */
  static openMap(contact: Contact): MobileActionResult {
    const address = this.formatAddress(contact);
    
    if (!address) {
      return {
        success: false,
        message: 'No address available for this contact',
        action: 'map'
      };
    }

    try {
      // Use geo: protocol for better mobile support
      const encodedAddress = encodeURIComponent(address);
      
      // Try different map protocols based on platform
      const userAgent = navigator.userAgent;
      let mapUrl: string;
      
      if (/iPhone|iPad|iPod/.test(userAgent)) {
        // iOS - prefer Apple Maps
        mapUrl = `maps://maps.apple.com/?q=${encodedAddress}`;
      } else if (/Android/.test(userAgent)) {
        // Android - prefer Google Maps
        mapUrl = `geo:0,0?q=${encodedAddress}`;
      } else {
        // Fallback to Google Maps web
        mapUrl = `https://maps.google.com/maps?q=${encodedAddress}`;
      }
      
      window.location.href = mapUrl;
      
      return {
        success: true,
        message: 'Opening maps',
        action: 'map'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Unable to open maps',
        action: 'map'
      };
    }
  }

  /**
   * Add contact to device contacts (if supported)
   */
  static async addToContacts(contact: Contact): Promise<MobileActionResult> {
    // Generate vCard format
    const vCard = this.generateVCard(contact);
    
    try {
      // Create blob and download link
      const blob = new Blob([vCard], { type: 'text/vcard' });
      const url = URL.createObjectURL(blob);
      
      // Create temporary download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${contact.first_name}_${contact.last_name}.vcf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      return {
        success: true,
        message: 'Contact file downloaded',
        action: 'addToContacts'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Unable to export contact',
        action: 'addToContacts'
      };
    }
  }

  /**
   * Format contact information for sharing
   */
  private static formatContactForSharing(contact: Contact): string {
    const lines: string[] = [];
    
    lines.push(`${contact.first_name} ${contact.last_name}`);
    
    if (contact.phone) {
      lines.push(`Phone: ${contact.phone}`);
    }
    
    if (contact.email) {
      lines.push(`Email: ${contact.email}`);
    }
    
    if (contact.company) {
      lines.push(`Company: ${contact.company}`);
    }
    
    if (contact.job_title) {
      lines.push(`Title: ${contact.job_title}`);
    }
    
    const address = this.formatAddress(contact);
    if (address) {
      lines.push(`Address: ${address}`);
    }
    
    if (contact.website) {
      lines.push(`Website: ${contact.website}`);
    }
    
    return lines.join('\n');
  }

  /**
   * Format contact address
   */
  private static formatAddress(contact: Contact): string {
    const parts = [
      contact.street_address,
      contact.city,
      contact.state,
      contact.zip_code
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  /**
   * Generate vCard format for contact
   */
  private static generateVCard(contact: Contact): string {
    const lines: string[] = [];
    
    lines.push('BEGIN:VCARD');
    lines.push('VERSION:3.0');
    lines.push(`FN:${contact.first_name} ${contact.last_name}`);
    lines.push(`N:${contact.last_name};${contact.first_name};;;`);
    
    if (contact.phone) {
      lines.push(`TEL;TYPE=CELL:${contact.phone}`);
    }
    
    if (contact.email) {
      lines.push(`EMAIL:${contact.email}`);
    }
    
    if (contact.company) {
      lines.push(`ORG:${contact.company}`);
    }
    
    if (contact.job_title) {
      lines.push(`TITLE:${contact.job_title}`);
    }
    
    const address = this.formatAddress(contact);
    if (address) {
      lines.push(`ADR:;;${contact.street_address || ''};${contact.city || ''};${contact.state || ''};${contact.zip_code || ''};`);
    }
    
    if (contact.website) {
      lines.push(`URL:${contact.website}`);
    }
    
    if (contact.birthday) {
      lines.push(`BDAY:${contact.birthday}`);
    }
    
    if (contact.notes) {
      lines.push(`NOTE:${contact.notes}`);
    }
    
    lines.push('END:VCARD');
    
    return lines.join('\r\n');
  }
}

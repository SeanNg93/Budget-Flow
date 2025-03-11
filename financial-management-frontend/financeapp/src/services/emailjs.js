import { init } from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../config/emailjs.config';

// Initialize EmailJS with your Public API key
export const initEmailJS = () => {
  init(EMAILJS_CONFIG.publicKey);
}; 